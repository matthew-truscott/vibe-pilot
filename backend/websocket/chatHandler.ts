import { WebSocketServer, WebSocket } from "ws";
import pilotAgent from "../services/pilotAgent";

interface FlightData {
  altitude: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  aircraft?: string;
  onGround: boolean;
}

interface StartTourPayload {
  passengerName: string;
  tourType: string;
}

interface PassengerMessagePayload {
  message: string;
  flightData: FlightData;
}

interface UpdateFlightDataPayload {
  flightData: FlightData;
}

type MessageType =
  | { type: "START_TOUR"; payload: StartTourPayload }
  | { type: "PASSENGER_MESSAGE"; payload: PassengerMessagePayload }
  | { type: "UPDATE_FLIGHT_DATA"; payload: UpdateFlightDataPayload }
  | { type: "END_TOUR" };

const activeConnections = new Map<string, WebSocket>();

export function setupWebSocketHandlers(wss: WebSocketServer): void {
  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established");
    console.log("WebSocket readyState:", ws.readyState);

    let sessionId: string | null = null;

    ws.on("message", async (data: Buffer) => {
      try {
        console.log("Raw WebSocket data received:", data.toString());
        const message = JSON.parse(data.toString()) as MessageType;
        console.log("Parsed WebSocket message:", message.type, message);

        switch (message.type) {
          case "START_TOUR":
            // Start a new tour
            console.log("Starting tour for:", message.payload);
            const { passengerName, tourType } = message.payload;
            const result = await pilotAgent.startTour(passengerName, tourType);
            sessionId = result.sessionId;
            console.log("Tour started with sessionId:", sessionId);

            // Store connection
            activeConnections.set(sessionId, ws);

            // Send welcome message
            console.log("Sending welcome message:", result.welcomeMessage);
            const tourStartedMessage = {
              type: "TOUR_STARTED",
              sessionId,
              message: result.welcomeMessage,
            };
            console.log("Sending TOUR_STARTED message:", tourStartedMessage);
            ws.send(JSON.stringify(tourStartedMessage));
            break;

          case "PASSENGER_MESSAGE":
            // Handle passenger message
            if (!sessionId) {
              ws.send(
                JSON.stringify({
                  type: "ERROR",
                  message: "No active session",
                }),
              );
              return;
            }

            const { message: passengerMessage, flightData } = message.payload;

            // Send acknowledgment immediately
            ws.send(
              JSON.stringify({
                type: "MESSAGE_RECEIVED",
                timestamp: new Date().toISOString(),
              }),
            );

            // Get pilot response
            const pilotResponse = await pilotAgent.sendMessage(
              sessionId,
              passengerMessage,
              flightData,
            );

            // Send pilot response
            ws.send(
              JSON.stringify({
                type: "PILOT_MESSAGE",
                message: pilotResponse,
                timestamp: new Date().toISOString(),
              }),
            );
            break;

          case "UPDATE_FLIGHT_DATA":
            // Update flight data without message
            if (sessionId) {
              pilotAgent.updateFlightData(
                sessionId,
                message.payload.flightData,
              );
            }
            break;

          case "END_TOUR":
            // End the tour
            if (sessionId) {
              pilotAgent.endTour(sessionId);
              activeConnections.delete(sessionId);

              ws.send(
                JSON.stringify({
                  type: "TOUR_ENDED",
                  message: "Thanks for flying with us today!",
                }),
              );
            }
            break;

          default:
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message: "Unknown message type",
              }),
            );
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(
          JSON.stringify({
            type: "ERROR",
            message: "Failed to process message",
          }),
        );
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
      if (sessionId) {
        activeConnections.delete(sessionId);
      }
    });

    ws.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
    });

    // Send initial connection confirmation
    console.log("Sending CONNECTED message to client");
    ws.send(
      JSON.stringify({
        type: "CONNECTED",
        message: "Connected to tour guide service",
      }),
    );
  });
}

// Broadcast flight update to specific session
export function broadcastFlightUpdate(
  sessionId: string,
  flightData: FlightData,
): void {
  const ws = activeConnections.get(sessionId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "FLIGHT_UPDATE",
        flightData,
      }),
    );
  }
}

