// Backend version of flight goal service

interface ConversationMessage {
  role: string;
  content: string;
  timestamp?: Date;
}

class FlightGoalService {
  private webhookUrl =
    "http://192.168.58.243:7860/api/v1/webhook/9df5c83e-fa0d-47aa-9891-8b4c3079cc83";

  async sendConversationUpdate(
    conversation: ConversationMessage[],
    latestPilotMessage: string,
    tourType?: string,
  ): Promise<boolean> {
    try {
      // Get destination from settings or use tourType
      const destination = tourType || "athens";

      const masterContext =
        `MASTER CONTEXT: Tour destination is ${destination.charAt(0).toUpperCase() + destination.slice(1).replace(/-/g, " ")}. ` +
        `Monitor pilot messages for ALL flight operation decisions:\n` +
        `\n` +
        `TAKEOFF OPERATIONS:\n` +
        `- Engine start: "starting engines", "engines on", "power up"\n` +
        `- Ready state: "ready for takeoff", "let's begin", "cleared for takeoff", "let's go flying"\n` +
        `- Throttle: "full throttle", "increasing power", "throttle up"\n` +
        `\n` +
        `NAVIGATION & COURSE:\n` +
        `- Direction changes: "heading towards", "turning to", "let's go to", "flying to", "head over to"\n` +
        `- Path adjustments: "adjust our flight path", "change course", "alter our route", "we'll fly over"\n` +
        `- Altitude changes: "climbing to", "descending to", "let's go higher", "dropping altitude"\n` +
        `- Speed changes: "speeding up", "slowing down", "reducing speed", "increasing airspeed"\n` +
        `\n` +
        `AIRCRAFT SYSTEMS:\n` +
        `- Landing gear: "gear up", "gear down", "retracting landing gear", "extending gear"\n` +
        `- Flaps: "flaps down", "extending flaps", "retracting flaps", "setting flaps"\n` +
        `- Lights: "landing lights on", "beacon on", "nav lights", "strobe on"\n` +
        `- Autopilot: "engaging autopilot", "autopilot on", "switching to manual"\n` +
        `\n` +
        `APPROACH & LANDING:\n` +
        `- Approach: "beginning approach", "on final approach", "turning base", "entering pattern"\n` +
        `- Landing prep: "prepare for landing", "configuring for landing", "landing checklist"\n` +
        `- Descent: "starting descent", "descending", "beginning our descent"\n` +
        `- Airport: "returning to airport", "heading back", "approaching the field"\n` +
        `\n` +
        `EMERGENCY/SPECIAL:\n` +
        `- Go-around: "going around", "aborting landing", "missed approach"\n` +
        `- Emergency: "declaring emergency", "mayday", "pan-pan"\n` +
        `\n` +
        `Act on ANY pilot flight operation decision. Latest pilot message: "${latestPilotMessage}"\n\n`;

      // Format conversation as plain text
      const conversationText = conversation
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      const fullText = masterContext + conversationText;

      // Log less frequently for resends
      const isResend = conversation.some(
        (msg) => msg.content === latestPilotMessage && msg.role === "pilot",
      );
      if (!isResend || Math.random() < 0.1) {
        // Log every ~10th resend
        console.log(`[FlightGoal] 🎯 Sending conversation update to webhook`);
        console.log(`[FlightGoal] Destination: ${destination}`);
        console.log(
          `[FlightGoal] Conversation length: ${conversation.length} messages`,
        );
        console.log(
          `[FlightGoal] Latest pilot message: "${latestPilotMessage.substring(0, 100)}..."`,
        );
      }

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: fullText,
      });

      if (!response.ok) {
        console.error(
          `[FlightGoal] ❌ Failed to send update: ${response.status}`,
        );
        const errorText = await response.text();
        console.error(`[FlightGoal] Error response:`, errorText);
        return false;
      }

      console.log(`[FlightGoal] ✅ Conversation update sent successfully`);
      return true;
    } catch (error) {
      console.error(`[FlightGoal] ❌ Error sending update:`, error);
      return false;
    }
  }
}

export default new FlightGoalService();

