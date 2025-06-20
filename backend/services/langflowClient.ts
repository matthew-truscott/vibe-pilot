import { LangflowClient } from 'langflow-chat';
import config from '../config/langflow.config';

interface FlightData {
  altitude?: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  aircraft?: string;
  onGround?: boolean;
}

interface LangflowInput {
  input_value: string;
  flow_id: string;
  session_id: string;
  tweaks: {
    flight_context: FlightData;
  };
}

interface LangflowOutput {
  outputs?: Array<{
    outputs?: Array<{
      type?: string;
      results?: {
        message?: {
          text: string;
        };
      };
    }>;
  }>;
  result?: string;
  message?: string;
}

class LangflowService {
  private client: LangflowClient | null = null;
  private tourGuideFlow: any = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const clientConfig = config.getClientConfig();
      this.client = new LangflowClient(clientConfig);
      
      if (config.tourGuideFlowId) {
        this.tourGuideFlow = this.client.flow(config.tourGuideFlowId);
      }
      
      console.log('Langflow client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Langflow client:', error);
    }
  }

  async sendTourGuideMessage(message: string, flightData: FlightData, sessionId: string): Promise<string> {
    if (!this.tourGuideFlow) {
      throw new Error('Tour guide flow not configured');
    }

    try {
      // Prepare the input for Langflow
      const input: LangflowInput = {
        input_value: message,
        flow_id: config.tourGuideFlowId,
        session_id: sessionId,
        tweaks: {
          // Pass flight context as tweaks/variables
          flight_context: {
            altitude: flightData.altitude,
            latitude: flightData.latitude,
            longitude: flightData.longitude,
            heading: flightData.heading,
            speed: flightData.speed,
            aircraft: flightData.aircraft,
            onGround: flightData.onGround
          }
        }
      };

      // Run the flow
      const response = await this.tourGuideFlow.run(input);
      
      // Extract the response text
      // The response structure may vary based on your Langflow setup
      return this.extractResponseText(response);
    } catch (error) {
      console.error('Error sending message to Langflow:', error);
      throw error;
    }
  }

  private extractResponseText(response: LangflowOutput | string): string {
    // Handle different response formats from Langflow
    // This may need adjustment based on your specific flow output
    
    if (typeof response === 'string') {
      return response;
    }
    
    if (response.outputs && response.outputs.length > 0) {
      // Look for chat output
      const chatOutput = response.outputs.find(output => 
        output.outputs && output.outputs.some(o => o.type === 'chat')
      );
      
      if (chatOutput && chatOutput.outputs && chatOutput.outputs[0]?.results?.message?.text) {
        return chatOutput.outputs[0].results.message.text;
      }
    }
    
    // Fallback for different response structures
    if (response.result) {
      return response.result;
    }
    
    if (response.message) {
      return response.message;
    }
    
    // If we can't extract a proper response, return a fallback
    console.warn('Unexpected response format from Langflow:', response);
    return "I'm having trouble understanding that. Could you please repeat?";
  }

  // Create a new tour session
  createSession(): string {
    return `tour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export default new LangflowService();