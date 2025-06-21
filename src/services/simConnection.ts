import { useState, useEffect, useCallback } from 'react';
import { getSettings } from '../utils/storage';
import { generateMockFlightData, initializeFromState } from './mockSimData';
import { SimData, FlightInfoUpdate } from '../types';
import chatService from './chatService';

interface SimConnectionState {
  connected: boolean;
  connecting: boolean;
  simData: SimData | null;
}

type SimConnectionListener = (state: SimConnectionState) => void;

let connectionInstance: SimConnection | null = null;

class SimConnection {
  private connected: boolean = false;
  private connecting: boolean = false;
  private listeners: Set<SimConnectionListener> = new Set();
  private simData: SimData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private dataSource: 'mock' | 'real' = 'mock';
  private lastRealDataTimestamp: number = 0;
  private realDataTimeout: NodeJS.Timeout | null = null;
  private smoothTransitionActive: boolean = false;

  subscribe(listener: SimConnectionListener): () => void {
    this.listeners.add(listener);
    listener({
      connected: this.connected,
      connecting: this.connecting,
      simData: this.simData
    });
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => {
      listener({
        connected: this.connected,
        connecting: this.connecting,
        simData: this.simData
      });
    });
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) return;

    this.connecting = true;
    this.notify();

    try {
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      
      this.connected = true;
      this.connecting = false;
      
      // Set up WebSocket flight info listener
      chatService.connect({
        onFlightInfo: (data: FlightInfoUpdate) => {
          this.handleFlightInfoUpdate(data);
        }
      });
      
      // Request flight info updates if we have a session
      if (chatService.getSessionId()) {
        chatService.requestFlightInfo();
      }
      
      // Start mock data generation as fallback
      this.updateInterval = setInterval(() => {
        // Only generate mock data if we haven't received real data recently
        if (Date.now() - this.lastRealDataTimestamp > 3000) {
          if (this.dataSource === 'real') {
            // Transition from real to mock
            this.transitionToMockData();
          }
          this.simData = generateMockFlightData();
          this.dataSource = 'mock';
          this.notify();
        }
      }, 100);
      
      this.notify();
    } catch (error) {
      console.error('Failed to connect to sim:', error);
      this.connecting = false;
      this.connected = false;
      this.notify();
    }
  }

  private handleFlightInfoUpdate(update: FlightInfoUpdate): void {
    this.lastRealDataTimestamp = Date.now();
    
    // Convert flight info to SimData format - map all available fields
    const data = update.data as any; // Access all fields from the update
    const newSimData: Partial<SimData> = {
      altitude: data.altitude || 0,
      latitude: data.latitude || this.simData?.latitude || 0,
      longitude: data.longitude || this.simData?.longitude || 0,
      heading: data.heading || this.simData?.heading || 0,
      airspeed: data.airspeed || data.speed || this.simData?.airspeed || 0,
      verticalSpeed: data.verticalSpeed || this.simData?.verticalSpeed || 0,
      pitch: data.pitch || this.simData?.pitch || 0,
      roll: data.bank || this.simData?.roll || 0, // bank is roll
      throttle: (data.throttle || 0) * 100, // Convert 0-1 to 0-100
      gear: data.gear !== undefined ? data.gear : this.simData?.gear || false,
      flaps: data.flaps || this.simData?.flaps || 0,
      engine1RPM: data.engineRPM || this.simData?.engine1RPM || 0,
      fuelQuantity: data.fuelPercentage || this.simData?.fuelQuantity || 85,
      aircraft: data.aircraft || this.simData?.aircraft || "Unknown",
      onGround: data.onGround,
      // Calculate derived values
      gForce: this.simData?.gForce || 1.0,
      flightTime: this.simData?.flightTime || 0
    };
    
    if (this.dataSource === 'mock' && update.source === 'real') {
      // Transitioning from mock to real data
      this.transitionToRealData(newSimData);
    } else if (update.source === 'real') {
      // Continue with real data
      this.simData = {
        ...this.simData!,
        ...newSimData,
        timestamp: Date.now()
      };
      this.dataSource = 'real';
      this.notify();
    }
  }

  private transitionToRealData(realData: Partial<SimData>): void {
    if (!this.simData) return;
    
    const startData = { ...this.simData };
    const targetData = { ...this.simData, ...realData };
    const transitionDuration = 2000; // 2 seconds
    const startTime = Date.now();
    
    this.smoothTransitionActive = true;
    
    const smoothTransition = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      const easeProgress = this.easeInOutCubic(progress);
      
      // Interpolate numeric values
      this.simData = {
        ...this.simData!,
        altitude: this.lerp(startData.altitude, targetData.altitude, easeProgress),
        airspeed: this.lerp(startData.airspeed, targetData.airspeed, easeProgress),
        heading: this.lerpAngle(startData.heading, targetData.heading, easeProgress),
        latitude: this.lerp(startData.latitude, targetData.latitude, easeProgress),
        longitude: this.lerp(startData.longitude, targetData.longitude, easeProgress),
        verticalSpeed: this.lerp(startData.verticalSpeed || 0, targetData.verticalSpeed || 0, easeProgress),
        pitch: this.lerp(startData.pitch || 0, targetData.pitch || 0, easeProgress),
        roll: this.lerp(startData.roll || 0, targetData.roll || 0, easeProgress),
        throttle: this.lerp(startData.throttle || 0, targetData.throttle || 0, easeProgress),
        flaps: this.lerp(startData.flaps || 0, targetData.flaps || 0, easeProgress),
        engine1RPM: this.lerp(startData.engine1RPM || 0, targetData.engine1RPM || 0, easeProgress),
        fuelQuantity: this.lerp(startData.fuelQuantity || 0, targetData.fuelQuantity || 0, easeProgress),
        aircraft: targetData.aircraft,
        gear: targetData.gear,
        onGround: targetData.onGround,
        timestamp: Date.now()
      };
      
      this.notify();
      
      if (progress < 1) {
        requestAnimationFrame(smoothTransition);
      } else {
        this.smoothTransitionActive = false;
        this.dataSource = 'real';
      }
    };
    
    smoothTransition();
  }

  private transitionToMockData(): void {
    if (!this.simData) return;
    
    // Initialize mock data with last known real values
    initializeFromState({
      altitude: this.simData.altitude,
      airspeed: this.simData.airspeed,
      heading: this.simData.heading,
      latitude: this.simData.latitude,
      longitude: this.simData.longitude,
      verticalSpeed: this.simData.verticalSpeed || 0,
      onGround: this.simData.onGround,
      aircraft: this.simData.aircraft
    });
    
    console.log('Transitioned to mock data due to connection loss');
  }

  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  private lerpAngle(start: number, end: number, progress: number): number {
    // Handle angle wrapping for smooth heading transitions
    let diff = end - start;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return (start + diff * progress + 360) % 360;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  disconnect(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.realDataTimeout) {
      clearTimeout(this.realDataTimeout);
      this.realDataTimeout = null;
    }
    
    this.connected = false;
    this.connecting = false;
    this.simData = null;
    this.dataSource = 'mock';
    this.notify();
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSimData(): SimData | null {
    return this.simData;
  }

  getDataSource(): 'mock' | 'real' {
    return this.dataSource;
  }

  // Request flight info when a new session starts
  requestFlightInfo(): void {
    if (this.connected && chatService.getSessionId()) {
      chatService.requestFlightInfo();
    }
  }
}

export const getSimConnection = (): SimConnection => {
  if (!connectionInstance) {
    connectionInstance = new SimConnection();
  }
  return connectionInstance;
};

interface UseSimConnectionReturn extends SimConnectionState {
  connect: () => void;
  disconnect: () => void;
}

export const useSimConnection = (): UseSimConnectionReturn => {
  const [state, setState] = useState<SimConnectionState>({
    connected: false,
    connecting: false,
    simData: null
  });

  useEffect(() => {
    const connection = getSimConnection();
    const unsubscribe = connection.subscribe(setState);
    
    const settings = getSettings();
    if (settings.simConnection.autoConnect) {
      connection.connect();
    }
    
    return unsubscribe;
  }, []);

  const connect = useCallback(() => {
    getSimConnection().connect();
  }, []);

  const disconnect = useCallback(() => {
    getSimConnection().disconnect();
  }, []);

  return {
    ...state,
    connect,
    disconnect
  };
};