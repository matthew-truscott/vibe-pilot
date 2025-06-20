import config from "../config/langflow.config";

interface FlightData {
  altitude?: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  aircraft?: string;
  onGround?: boolean;
}

// Removed unused interface - payload is built directly in the method

interface LangflowOutput {
  session_id?: string;
  outputs?: Array<{
    inputs?: any;
    outputs?: Array<{
      results?: {
        message?: {
          text?: string;
          data?: {
            text?: string;
          };
        };
        text?: string;
        result?: string;
      };
      component?: string;
      type?: string;
    }>;
  }>;
  result?: string;
  message?: string;
}

class LangflowService {
  private apiKey: string | undefined;
  private baseUrl: string = "http://localhost:7860";
  private flowId: string = "";

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseURL || "http://localhost:7860";
      this.flowId = config.tourGuideFlowId;

      if (!this.apiKey) {
        console.warn("Langflow API key not configured - using mock mode");
      }

      console.log("Langflow service initialized");
    } catch (error) {
      console.error("Failed to initialize Langflow service:", error);
    }
  }

  async sendTourGuideMessage(
    message: string,
    flightData: FlightData,
    sessionId: string,
    conversationHistory?: Array<{ role: string; content: string }>,
  ): Promise<string> {
    if (!this.flowId) {
      throw new Error("Tour guide flow not configured");
    }

    // If no API key, return mock response
    if (!this.apiKey) {
      return this.getMockResponse(message, flightData);
    }

    try {
      // Build conversation context
      let contextMessage = message;
      if (conversationHistory && conversationHistory.length > 0) {
        const historyText = conversationHistory
          .slice(-6) // Last 6 messages for context
          .map(
            (msg) =>
              `${msg.role === "passenger" ? "Passenger" : "Captain Sarah"}: ${msg.content}`,
          )
          .join("\n");
        contextMessage = `Previous conversation:\n${historyText}\n\nPassenger: ${message}`;
      }

      const payload = {
        input_value: contextMessage,
        output_type: "chat",
        input_type: "chat",
        session_id: sessionId,
        tweaks: {
          flight_context: {
            altitude: flightData.altitude,
            latitude: flightData.latitude,
            longitude: flightData.longitude,
            heading: flightData.heading,
            speed: flightData.speed,
            aircraft: flightData.aircraft,
            onGround: flightData.onGround,
          },
        },
      };

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify(payload),
      };

      const url = `${this.baseUrl}/api/v1/run/${this.flowId}`;
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(
          `Langflow API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as LangflowOutput;
      return this.extractResponseText(data);
    } catch (error) {
      console.error("Error sending message to Langflow:", error);
      // Return fallback response on error
      return this.getMockResponse(message, flightData);
    }
  }

  private extractResponseText(response: LangflowOutput | string): string {
    // Handle different response formats from Langflow
    console.log("Langflow response:", JSON.stringify(response, null, 2));

    if (typeof response === "string") {
      return response;
    }

    // Check for the standard Langflow output structure
    if (response.outputs && response.outputs.length > 0) {
      // Iterate through outputs to find the chat response
      for (const output of response.outputs) {
        if (output.outputs && Array.isArray(output.outputs)) {
          for (const component of output.outputs) {
            // Check various possible locations for the text
            if (component.results?.message?.text) {
              return component.results.message.text;
            }
            if (component.results?.message?.data?.text) {
              return component.results.message.data.text;
            }
            if (component.results?.text) {
              return component.results.text;
            }
            if (component.results?.result) {
              return component.results.result;
            }
          }
        }
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
    console.warn("Could not extract text from Langflow response");
    return "I'm having trouble understanding that. Could you please repeat?";
  }

  private getMockResponse(message: string, flightData: FlightData): string {
    const lowerMessage = message.toLowerCase();

    if (flightData.onGround) {
      if (lowerMessage.includes("ready") || lowerMessage.includes("start")) {
        return "Welcome aboard! I'm Captain Sarah Mitchell, your tour guide today. We're all set for takeoff - just waiting for clearance. It's going to be a beautiful flight!";
      }
      return "We're currently on the ground preparing for our tour. I'll let you know when we're ready for takeoff!";
    }

    if (lowerMessage.includes("altitude") || lowerMessage.includes("high")) {
      return `We're currently cruising at ${Math.round(flightData.altitude || 0)} feet. Perfect altitude for sightseeing!`;
    }

    if (lowerMessage.includes("speed") || lowerMessage.includes("fast")) {
      return `We're flying at ${Math.round(flightData.speed || 0)} knots - a comfortable cruising speed.`;
    }

    if (lowerMessage.includes("scared") || lowerMessage.includes("safe")) {
      return "No need to worry! We're flying in perfect conditions, and safety is always my top priority. Just relax and enjoy the views!";
    }

    // Generic response
    return "That's a great observation! The views from up here really are spectacular, aren't they?";
  }

  // Create a new tour session
  createSession(): string {
    return `tour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export default new LangflowService();
