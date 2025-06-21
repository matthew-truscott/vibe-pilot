import { FlightData } from '../types';

interface ChatMessage {
  type: string;
  message?: string;
  timestamp?: string;
  sessionId?: string;
  flightData?: FlightData;
}

interface ChatCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (data: ChatMessage) => void;
  onFlightInfo?: (data: any) => void;
}

interface StartTourResponse {
  sessionId: string;
  message: string;
}

class ChatService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private callbacks: ChatCallbacks = {
    onConnect: undefined,
    onDisconnect: undefined,
    onMessage: undefined
  };
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;
  private isStartingTour: boolean = false;

  connect(callbacks: ChatCallbacks): void {
    // Prevent multiple simultaneous connections
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('Connection already in progress, skipping');
      return;
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Already connected, updating callbacks and calling onConnect');
      this.callbacks = { ...this.callbacks, ...callbacks };
      callbacks.onConnect?.();
      return;
    }
    
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.isConnecting = true;
    this.shouldReconnect = true;
    
    const wsUrl = `ws://localhost:3001`;
    
    try {
      console.log('Creating WebSocket connection to:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.callbacks.onConnect?.();
      };
      
      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.callbacks.onDisconnect?.();
        if (this.shouldReconnect) {
          this.attemptReconnect();
        }
      };
      
      this.ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        console.log('Make sure the backend is running on port 3001');
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      // Call onConnect anyway to enable the UI
      setTimeout(() => {
        this.callbacks.onConnect?.();
      }, 100);
    }
  }

  private handleMessage(data: ChatMessage): void {
    switch (data.type) {
      case 'CONNECTED':
        console.log('Connected to chat service:', data.message);
        break;
        
      case 'TOUR_STARTED':
        this.sessionId = data.sessionId || null;
        // Send as PILOT_MESSAGE for display
        this.callbacks.onMessage?.({
          type: 'PILOT_MESSAGE',
          message: data.message,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'PILOT_MESSAGE':
      case 'MESSAGE_RECEIVED':
      case 'FLIGHT_UPDATE':
        this.callbacks.onMessage?.(data);
        break;
        
      case 'FLIGHT_INFO_UPDATE':
        this.callbacks.onFlightInfo?.(data);
        break;
        
      case 'ERROR':
        console.error('Chat service error:', data.message);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`Attempting to reconnect in ${delay}ms...`);
    
    setTimeout(() => {
      this.connect(this.callbacks);
    }, delay);
  }

  async startTour(passengerName: string = 'Guest', tourType: string = 'scenic'): Promise<StartTourResponse> {
    // Prevent multiple tour starts
    if (this.sessionId) {
      console.log('Tour already started with sessionId:', this.sessionId);
      return { sessionId: this.sessionId, message: 'Tour already in progress' };
    }
    
    // Prevent concurrent tour starts
    if (this.isStartingTour) {
      console.log('Tour start already in progress, waiting...');
      // Wait a bit and return existing session if available
      await new Promise(resolve => setTimeout(resolve, 100));
      if (this.sessionId) {
        return { sessionId: this.sessionId, message: 'Tour already in progress' };
      }
    }
    
    this.isStartingTour = true;

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.isStartingTour = false;
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      // Set up one-time listener for tour start response
      const originalOnMessage = this.callbacks.onMessage;
      const timeoutId = setTimeout(() => {
        this.isStartingTour = false;
        this.callbacks.onMessage = originalOnMessage;
        reject(new Error('Tour start timeout'));
      }, 5000);
      
      this.callbacks.onMessage = (data: ChatMessage) => {
        if (data.type === 'TOUR_STARTED') {
          clearTimeout(timeoutId);
          this.sessionId = data.sessionId || null;
          this.callbacks.onMessage = originalOnMessage;
          this.isStartingTour = false;
          resolve({
            sessionId: data.sessionId || '',
            message: data.message || ''
          });
        }
        originalOnMessage?.(data);
      };
      
      const message = {
        type: 'START_TOUR',
        payload: {
          passengerName,
          tourType
        }
      };
      console.log('Sending START_TOUR message:', message);
      this.ws.send(JSON.stringify(message));
    });
  }

  sendMessage(message: string, flightData?: FlightData): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    if (!this.sessionId) {
      console.warn('No active session - message will be sent after tour starts');
      return;
    }
    
    this.ws.send(JSON.stringify({
      type: 'PASSENGER_MESSAGE',
      payload: {
        message,
        flightData
      }
    }));
  }

  updateFlightData(flightData: FlightData): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.sessionId) {
      return;
    }
    
    this.ws.send(JSON.stringify({
      type: 'UPDATE_FLIGHT_DATA',
      payload: {
        flightData
      }
    }));
  }

  requestFlightInfo(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected - cannot request flight info');
      return;
    }
    
    if (!this.sessionId) {
      console.warn('No active session - cannot request flight info');
      return;
    }
    
    this.ws.send(JSON.stringify({
      type: 'REQUEST_FLIGHT_INFO'
    }));
  }

  endTour(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.sessionId) {
      this.ws.send(JSON.stringify({
        type: 'END_TOUR'
      }));
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.endTour();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Export singleton instance
export default new ChatService();