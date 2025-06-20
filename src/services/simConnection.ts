import { useState, useEffect, useCallback } from 'react';
import { getSettings } from '../utils/storage';
import { generateMockFlightData } from './mockSimData';
import { SimData } from '../types';

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
      
      this.updateInterval = setInterval(() => {
        this.simData = generateMockFlightData();
        this.notify();
      }, 100);
      
      this.notify();
    } catch (error) {
      console.error('Failed to connect to sim:', error);
      this.connecting = false;
      this.connected = false;
      this.notify();
    }
  }

  disconnect(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.connected = false;
    this.connecting = false;
    this.simData = null;
    this.notify();
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSimData(): SimData | null {
    return this.simData;
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