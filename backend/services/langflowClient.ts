import config from "../config/langflow.config";

interface FlightData {
  altitude?: number;
  altitudeAGL?: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  airspeed?: number;
  groundSpeed?: number;
  verticalSpeed?: number;
  pitch?: number;
  bank?: number;
  throttle?: number;
  gear?: boolean;
  flaps?: number;
  fuelPercentage?: number;
  engineRPM?: number;
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
      messages?: Array<{
        message?: string;
        sender?: string;
        sender_name?: string;
        session_id?: string;
        type?: string;
      }>;
      component?: string;
      type?: string;
      component_display_name?: string;
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

      console.log(`[Langflow] Service initializing...`);
      console.log(`[Langflow] Base URL: ${this.baseUrl}`);
      console.log(`[Langflow] Tour Guide Flow ID: ${this.flowId || 'Not configured'}`);
      console.log(`[Langflow] Flight Info Flow ID: ${config.flightInfoFlowId || 'Not configured'}`);
      console.log(`[Langflow] API Key: ${this.apiKey ? 'Configured' : 'Not configured - will try without auth'}`);
      
      console.log(`[Langflow] ✅ Service initialized`);
    } catch (error) {
      console.error("[Langflow] Failed to initialize service:", error);
    }
  }

  async sendTourGuideMessage(
    message: string,
    flightData: FlightData,
    sessionId: string,
    conversationHistory?: Array<{ role: string; content: string }>,
  ): Promise<string> {
    console.log(`\n🌐 [Langflow] sendTourGuideMessage called`);
    console.log(`[Langflow] SessionId: ${sessionId}`);
    console.log(`[Langflow] Message: "${message}"`);
    
    if (!this.flowId) {
      console.error(`[Langflow] ❌ Tour guide flow not configured`);
      console.log(`[Langflow] 🆘 Using mock response due to missing flow ID`);
      return this.getMockResponse(message, flightData);
    }

    // Always try the API first, even without API key
    console.log(`[Langflow] Attempting to connect to Langflow API...`);

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
            altitude: flightData.altitude || 0,
            latitude: flightData.latitude || 0,
            longitude: flightData.longitude || 0,
            heading: flightData.heading || 0,
            speed: flightData.speed || flightData.airspeed || 0,
            aircraft: flightData.aircraft || "Unknown",
            onGround: flightData.onGround || false,
          },
        },
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Only add API key if configured
      if (this.apiKey) {
        headers["x-api-key"] = this.apiKey;
      }
      
      const options = {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      };

      const url = `${this.baseUrl}/api/v1/run/${this.flowId}`;
      console.log(`[Langflow] 📡 Sending request to: ${url}`);
      console.log(`[Langflow] Payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Langflow API error response:", errorText);
        throw new Error(
          `Langflow API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as LangflowOutput;
      console.log("Tour guide response:", JSON.stringify(data, null, 2));
      const extractedText = this.extractResponseText(data);
      console.log("Extracted response text:", extractedText);
      return extractedText;
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
            // Check for messages array (new structure)
            if (
              component.messages &&
              Array.isArray(component.messages) &&
              component.messages.length > 0
            ) {
              const message = component.messages[0];
              if (message.message) {
                return message.message;
              }
            }

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
    const sessionId = `tour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[Langflow] 🆕 Created new session: ${sessionId}`);
    return sessionId;
  }

  // Get flight information from Langflow
  async getFlightInfo(): Promise<FlightData> {
    const flowId = config.flightInfoFlowId;

    console.log(`[Langflow] Getting flight info...`);
    
    if (!flowId) {
      console.log(`[Langflow] ⚠️ Flight info flow not configured`);
      console.log(`[Langflow] 🆘 Using mock flight data`);
      return this.getMockFlightInfo();
    }

    // Always try the API first, even without API key
    console.log(`[Langflow] Attempting to fetch real flight data...`);

    try {
      const payload = {
        input_value: "",
        output_type: "chat",
        input_type: "chat",
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Only add API key if configured
      if (this.apiKey) {
        headers["x-api-key"] = this.apiKey;
      }
      
      const options = {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      };

      const url = `${this.baseUrl}/api/v1/run/${flowId}`;
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(
          `Langflow API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as LangflowOutput;
      console.log(
        "Flight info response structure:",
        JSON.stringify(data, null, 2),
      );

      // Look for the flight data in the expected format
      try {
        // Check if data has the outputs structure with messages array
        if (data.outputs && data.outputs.length > 0) {
          const output = data.outputs[0];
          if (output.outputs && output.outputs.length > 0) {
            const component = output.outputs[0];

            // Check for messages array structure (as shown in the example)
            if (
              component.messages &&
              Array.isArray(component.messages) &&
              component.messages.length > 0
            ) {
              const message = component.messages[0];
              if (message.message) {
                //console.log(
                //  "Extracted flight data string from messages array:",
                //  message.message,
                //);
                const flightInfo = JSON.parse(message.message);
                // console.log("Parsed flight info:", flightInfo);
                return this.validateFlightData(flightInfo);
              }
            }

            // Fallback to results.message structure
            if (component.results && component.results.message) {
              let flightDataStr: string;
              if (typeof component.results.message === "string") {
                flightDataStr = component.results.message;
              } else if (component.results.message.text) {
                flightDataStr = component.results.message.text;
              } else {
                // Skip if we can't extract a string
                throw new Error(
                  "Cannot extract flight data string from results.message",
                );
              }
              console.log(
                "Extracted flight data string from results:",
                flightDataStr,
              );
              const flightInfo = JSON.parse(flightDataStr);
              console.log("Parsed flight info:", flightInfo);
              return this.validateFlightData(flightInfo);
            }
          }
        }

        // Fallback to generic extraction if structure is different
        const responseText = this.extractResponseText(data);
        const flightInfo = JSON.parse(responseText);
        return this.validateFlightData(flightInfo);
      } catch (parseError) {
        console.error(`[Langflow] ❌ Failed to parse flight info:`, parseError);
        console.log(`[Langflow] 🆘 Using mock flight data`);
        return this.getMockFlightInfo();
      }
    } catch (error) {
      console.error(`[Langflow] ❌ Error getting flight info:`, error);
      console.log(`[Langflow] 🆘 Using mock flight data`);
      return this.getMockFlightInfo();
    }
  }

  private validateFlightData(data: any): FlightData {
    // Map all available fields from the flight data
    return {
      altitude: Number(data.altitude) || 0,
      altitudeAGL: Number(data.altitudeAGL) || 0,
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
      heading: Number(data.heading) || 0,
      airspeed: Number(data.airspeed) || 0,
      groundSpeed: Number(data.groundSpeed) || 0,
      speed: Number(data.groundSpeed || data.airspeed) || 0, // Use groundSpeed as primary speed
      verticalSpeed: Number(data.verticalSpeed) || 0,
      pitch: Number(data.pitch) || 0,
      bank: Number(data.bank) || 0, // bank is roll in our system
      throttle: Number(data.throttle) || 0,
      gear: Boolean(data.gear),
      flaps: Number(data.flaps) || 0,
      fuelPercentage: data.fuel ? Number(data.fuel.percentage) || 85 : 85,
      engineRPM: data.engine ? Number(data.engine.rpm) || 0 : 0,
      aircraft: data.aircraft || "Cessna 172", // Default aircraft type
      onGround: Boolean(data.onGround),
    };
  }

  private getMockFlightInfo(): FlightData {
    // Return realistic mock flight data with all fields
    const altitude = 15000 + Math.random() * 5000;
    const airspeed = 250 + Math.random() * 50;

    return {
      altitude: altitude,
      altitudeAGL: altitude - 308, // Simulate ground elevation
      latitude: 47.4502 + (Math.random() - 0.5) * 0.1,
      longitude: -122.3088 + (Math.random() - 0.5) * 0.1,
      heading: Math.random() * 360,
      airspeed: airspeed,
      groundSpeed: airspeed + (Math.random() - 0.5) * 20, // Wind effect
      speed: airspeed,
      verticalSpeed: (Math.random() - 0.5) * 1000,
      pitch: (Math.random() - 0.5) * 10,
      bank: (Math.random() - 0.5) * 30,
      throttle: 75 + Math.random() * 20,
      gear: false,
      flaps: 0,
      fuelPercentage: 85 + Math.random() * 10,
      engineRPM: 2200 + Math.random() * 400,
      aircraft: "Boeing 737",
      onGround: false,
    };
  }
}

// Export singleton instance
export default new LangflowService();
