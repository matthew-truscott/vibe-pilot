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

  connect(callbacks: ChatCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
    
    const wsUrl = `ws://localhost:3001/ws`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
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
        this.callbacks.onDisconnect?.();
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private handleMessage(data: ChatMessage): void {
    switch (data.type) {
      case 'CONNECTED':
        console.log('Connected to chat service:', data.message);
        break;
        
      case 'TOUR_STARTED':
        this.sessionId = data.sessionId || null;
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
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      // Set up one-time listener for tour start response
      const originalOnMessage = this.callbacks.onMessage;
      this.callbacks.onMessage = (data: ChatMessage) => {
        if (data.type === 'TOUR_STARTED') {
          this.sessionId = data.sessionId || null;
          this.callbacks.onMessage = originalOnMessage;
          resolve({
            sessionId: data.sessionId || '',
            message: data.message || ''
          });
        }
        originalOnMessage?.(data);
      };
      
      this.ws.send(JSON.stringify({
        type: 'START_TOUR',
        payload: {
          passengerName,
          tourType
        }
      }));
    });
  }

  sendMessage(message: string, flightData?: FlightData): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    if (!this.sessionId) {
      throw new Error('No active session');
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

  endTour(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.sessionId) {
      this.ws.send(JSON.stringify({
        type: 'END_TOUR'
      }));
    }
  }

  disconnect(): void {
    this.endTour();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export default new ChatService();