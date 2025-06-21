import langflowService from "./langflowClient";

interface FlightData {
  altitude: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  aircraft?: string;
  onGround: boolean;
}

interface Message {
  role: "passenger" | "pilot";
  content: string;
  timestamp: Date;
  flightData: FlightData;
}

interface Session {
  sessionId: string;
  passengerName: string;
  tourType: string;
  startTime: Date;
  messages: Message[];
  flightData: FlightData | null;
}

interface StartTourResult {
  sessionId: string;
  welcomeMessage: string;
}

class PilotAgentService {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map();
  }

  // Start a new tour session
  async startTour(
    passengerName: string = "Guest",
    tourType: string = "scenic",
  ): Promise<StartTourResult> {
    console.log(`\n🎫 [PilotAgent] Starting new tour`);
    console.log(`[PilotAgent] Passenger: ${passengerName}, Type: ${tourType}`);
    
    const sessionId = langflowService.createSession();
    console.log(`[PilotAgent] Created sessionId: ${sessionId}`);

    const session: Session = {
      sessionId,
      passengerName,
      tourType,
      startTime: new Date(),
      messages: [],
      flightData: null,
    };

    this.sessions.set(sessionId, session);
    console.log(`[PilotAgent] Session stored. Total active sessions: ${this.sessions.size}`);

    // Return a simple welcome message without triggering AI
    const welcomeMessage =
      "Welcome aboard! I'm Captain Sarah Mitchell, your tour guide today. Feel free to ask me anything about our flight!";

    return {
      sessionId,
      welcomeMessage,
    };
  }

  // Send a message from passenger to pilot
  async sendMessage(
    sessionId: string,
    message: string,
    flightData: FlightData,
  ): Promise<string> {
    console.log(`\n📩 [PilotAgent] Processing message for session: ${sessionId}`);
    console.log(`[PilotAgent] Message: "${message}"`);
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`[PilotAgent] ❌ Invalid session: ${sessionId}`);
      console.error(`[PilotAgent] Active sessions:`, Array.from(this.sessions.keys()));
      throw new Error("Invalid session");
    }

    // Update flight data
    session.flightData = flightData;

    // Store passenger message
    session.messages.push({
      role: "passenger",
      content: message,
      timestamp: new Date(),
      flightData: { ...flightData },
    });

    try {
      // Get conversation history for context
      const conversationHistory = session.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      console.log(`[PilotAgent] Conversation history length: ${conversationHistory.length}`);

      // Get pilot response from Langflow
      console.log(`[PilotAgent] 🤖 Calling Langflow service...`);
      const startTime = Date.now();
      
      const pilotResponse = await langflowService.sendTourGuideMessage(
        message,
        flightData,
        sessionId,
        conversationHistory,
      );
      
      const responseTime = Date.now() - startTime;
      console.log(`[PilotAgent] ✅ Langflow responded in ${responseTime}ms`);
      console.log(`[PilotAgent] Response preview: "${pilotResponse.substring(0, 100)}..."`);

      // Store pilot response
      session.messages.push({
        role: "pilot",
        content: pilotResponse,
        timestamp: new Date(),
        flightData: { ...flightData },
      });

      return pilotResponse;
    } catch (error) {
      console.error(`[PilotAgent] ❌ Error getting pilot response:`, error);
      console.error(`[PilotAgent] Error details:`, error instanceof Error ? error.stack : error);

      // Fallback response
      console.log(`[PilotAgent] 🆘 Using fallback response`);
      const fallbackResponse = this.getFallbackResponse(message, flightData);
      console.log(`[PilotAgent] Fallback response: "${fallbackResponse}"`);

      session.messages.push({
        role: "pilot",
        content: fallbackResponse,
        timestamp: new Date(),
        flightData: { ...flightData },
      });

      return fallbackResponse;
    }
  }

  // Get conversation history
  getHistory(sessionId: string): Message[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    return session.messages;
  }

  // Update flight data without sending a message
  updateFlightData(sessionId: string, flightData: FlightData): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.flightData = flightData;
    }
  }

  // End tour session
  endTour(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Fallback responses when Langflow is unavailable
  private getFallbackResponse(message: string, flightData: FlightData): string {
    const lowerMessage = message.toLowerCase();

    if (flightData.onGround) {
      if (lowerMessage.includes("ready") || lowerMessage.includes("start")) {
        return "We're all set for takeoff! Just waiting for clearance from the tower. It's going to be a beautiful flight today!";
      }
      return "We're currently on the ground preparing for our tour. I'll let you know when we're ready for takeoff!";
    }

    if (lowerMessage.includes("altitude") || lowerMessage.includes("high")) {
      return `We're currently cruising at ${Math.round(flightData.altitude)} feet. Perfect altitude for sightseeing!`;
    }

    if (lowerMessage.includes("speed") || lowerMessage.includes("fast")) {
      return `We're flying at ${Math.round(flightData.speed || 0)} knots - a comfortable cruising speed for our ${flightData.aircraft || "aircraft"}.`;
    }

    if (lowerMessage.includes("scared") || lowerMessage.includes("safe")) {
      return "No need to worry! We're flying in perfect conditions, and safety is always my top priority. Just relax and enjoy the views!";
    }

    if (lowerMessage.includes("land") || lowerMessage.includes("long")) {
      return "We've got about 20 more minutes of scenic flying before we head back. Still plenty to see!";
    }

    // Generic response
    return "That's a great observation! The views from up here really are spectacular, aren't they?";
  }
}

export default new PilotAgentService();
