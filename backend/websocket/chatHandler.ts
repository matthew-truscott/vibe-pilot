import { WebSocketServer, WebSocket } from "ws";
import pilotAgent from "../services/pilotAgent";
import langflowClient from "../services/langflowClient";

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
  | { type: "END_TOUR" }
  | { type: "REQUEST_FLIGHT_INFO" };

const activeConnections = new Map<string, WebSocket>();
const flightInfoIntervals = new Map<string, NodeJS.Timeout>();

export function setupWebSocketHandlers(wss: WebSocketServer): void {
  let connectionCount = 0;
  
  wss.on("connection", (ws: WebSocket) => {
    connectionCount++;
    const connectionId = `conn_${Date.now()}_${connectionCount}`;
    console.log(`\n🔌 [${connectionId}] New WebSocket connection established`);
    console.log(`[${connectionId}] WebSocket readyState:`, ws.readyState);
    console.log(`[${connectionId}] Total active connections:`, wss.clients.size);

    let sessionId: string | null = null;

    ws.on("message", async (data: Buffer) => {
      try {
        const rawData = data.toString();
        console.log(`\n📨 [${connectionId}] Raw WebSocket data received:`, rawData.substring(0, 200) + (rawData.length > 200 ? '...' : ''));
        const message = JSON.parse(rawData) as MessageType;
        console.log(`[${connectionId}] Parsed message type: ${message.type}`);
        console.log(`[${connectionId}] Message payload:`, JSON.stringify('payload' in message ? message.payload : 'No payload', null, 2));

        switch (message.type) {
          case "START_TOUR":
            console.log(`\n🚁 [${connectionId}] START_TOUR received`);
            console.log(`[${connectionId}] Current sessionId before start:`, sessionId);
            const { passengerName, tourType } = message.payload;
            console.log(`[${connectionId}] Tour details - Passenger: ${passengerName}, Type: ${tourType}`);
            
            const result = await pilotAgent.startTour(passengerName, tourType);
            sessionId = result.sessionId;
            console.log(`[${connectionId}] ✅ Tour started with sessionId:`, sessionId);

            // Store connection
            activeConnections.set(sessionId, ws);

            // Send welcome message
            console.log(`[${connectionId}] Welcome message:`, result.welcomeMessage);
            const tourStartedMessage = {
              type: "TOUR_STARTED",
              sessionId,
              message: result.welcomeMessage,
            };
            console.log(`[${connectionId}] 📤 Sending TOUR_STARTED response`);
            ws.send(JSON.stringify(tourStartedMessage));
            console.log(`[${connectionId}] ✅ TOUR_STARTED sent successfully`);
            break;

          case "PASSENGER_MESSAGE":
            console.log(`\n💬 [${connectionId}] PASSENGER_MESSAGE received`);
            console.log(`[${connectionId}] SessionId:`, sessionId);
            
            if (!sessionId) {
              console.error(`[${connectionId}] ❌ No active session!`);
              ws.send(
                JSON.stringify({
                  type: "ERROR",
                  message: "No active session",
                }),
              );
              return;
            }

            const { message: passengerMessage, flightData } = message.payload;
            console.log(`[${connectionId}] Passenger message:`, passengerMessage);
            console.log(`[${connectionId}] Flight data:`, JSON.stringify(flightData, null, 2));

            // Send acknowledgment immediately
            console.log(`[${connectionId}] 📤 Sending MESSAGE_RECEIVED acknowledgment`);
            ws.send(
              JSON.stringify({
                type: "MESSAGE_RECEIVED",
                timestamp: new Date().toISOString(),
              }),
            );

            // Get pilot response
            console.log(`[${connectionId}] 🤖 Getting AI response from pilot agent...`);
            const startTime = Date.now();
            
            const pilotResponse = await pilotAgent.sendMessage(
              sessionId,
              passengerMessage,
              flightData,
            );
            
            const responseTime = Date.now() - startTime;
            console.log(`[${connectionId}] ✅ Pilot response received in ${responseTime}ms:`, pilotResponse.substring(0, 100) + '...');

            // Send pilot response
            console.log(`[${connectionId}] 📤 Sending PILOT_MESSAGE to client`);
            ws.send(
              JSON.stringify({
                type: "PILOT_MESSAGE",
                message: pilotResponse,
                timestamp: new Date().toISOString(),
              }),
            );
            console.log(`[${connectionId}] ✅ PILOT_MESSAGE sent successfully`);
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

              // Stop flight info polling
              const interval = flightInfoIntervals.get(sessionId);
              if (interval) {
                clearInterval(interval);
                flightInfoIntervals.delete(sessionId);
              }

              ws.send(
                JSON.stringify({
                  type: "TOUR_ENDED",
                  message: "Thanks for flying with us today!",
                }),
              );
            }
            break;

          case "REQUEST_FLIGHT_INFO":
            // Start or restart flight info polling
            if (!sessionId) {
              ws.send(
                JSON.stringify({
                  type: "ERROR",
                  message: "No active session for flight info",
                }),
              );
              return;
            }

            // Clear existing interval if any
            const existingInterval = flightInfoIntervals.get(sessionId);
            if (existingInterval) {
              clearInterval(existingInterval);
            }

            // Start polling flight info every second
            const pollFlightInfo = async () => {
              try {
                const flightData = await langflowClient.getFlightInfo();

                // Send flight info update
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: "FLIGHT_INFO_UPDATE",
                      data: flightData,
                      source:
                        flightData.aircraft === "Unknown Aircraft"
                          ? "mock"
                          : "real",
                      timestamp: Date.now(),
                    }),
                  );
                }
              } catch (error) {
                console.error("Error polling flight info:", error);
                // Continue polling even on error - the service will fall back to mock data
              }
            };

            // Start immediate poll
            pollFlightInfo();

            // Set up interval for subsequent polls
            const interval = setInterval(pollFlightInfo, 1000);
            flightInfoIntervals.set(sessionId, interval);

            console.log(
              `Started flight info polling for session: ${sessionId}`,
            );
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
        console.error(`[${connectionId}] ❌ WebSocket message error:`, error);
        console.error(`[${connectionId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
        ws.send(
          JSON.stringify({
            type: "ERROR",
            message: "Failed to process message",
          }),
        );
      }
    });

    ws.on("close", () => {
      console.log(`\n🔌 [${connectionId}] WebSocket connection closed`);
      console.log(`[${connectionId}] SessionId at close:`, sessionId);
      console.log(`[${connectionId}] Remaining connections:`, wss.clients.size - 1);
      
      if (sessionId) {
        activeConnections.delete(sessionId);

        // Clean up flight info polling
        const interval = flightInfoIntervals.get(sessionId);
        if (interval) {
          clearInterval(interval);
          flightInfoIntervals.delete(sessionId);
          console.log(`Stopped flight info polling for session: ${sessionId}`);
        }
      }
    });

    ws.on("error", (error: Error) => {
      console.error(`\n❌ [${connectionId}] WebSocket error:`, error.message);
      console.error(`[${connectionId}] Error details:`, error);
    });

    // Send initial connection confirmation
    console.log(`[${connectionId}] 📤 Sending initial CONNECTED message`);
    ws.send(
      JSON.stringify({
        type: "CONNECTED",
        message: "Connected to tour guide service",
      }),
    );
    console.log(`[${connectionId}] ✅ Initial connection setup complete`);
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
