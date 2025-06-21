#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { SimConnectManager } from "./simconnect-manager.js";

// Create FastMCP server instance
const server = new FastMCP({
  name: "fsx-simconnect",
  version: "1.0.0"
});

// Initialize SimConnect manager
const simConnectManager = new SimConnectManager();
let isSimConnectInitialized = false;

// Auto-connect on startup
(async () => {
  try {
    console.error("Auto-connecting to FSX...");
    await simConnectManager.connect();
    isSimConnectInitialized = true;
    console.error("Successfully auto-connected to FSX");
  } catch (error: any) {
    console.error("Auto-connect failed:", error.message);
    console.error("You can try connecting manually using the 'connect' tool");
  }
})();

// Helper function to ensure connection
async function ensureConnection(): Promise<void> {
  if (!isSimConnectInitialized) {
    console.error("Not connected, attempting to connect...");
    await simConnectManager.connect();
    isSimConnectInitialized = true;
  }
}

// Define tools

// Connection management
server.addTool({
  name: "connect",
  description: "Connect to FSX via SimConnect",
  parameters: z.object({}),
  execute: async () => {
    if (isSimConnectInitialized) {
      return "Already connected to FSX";
    }
    await simConnectManager.connect();
    isSimConnectInitialized = true;
    return "Successfully connected to FSX";
  }
});

server.addTool({
  name: "disconnect",
  description: "Disconnect from FSX",
  parameters: z.object({}),
  execute: async () => {
    await simConnectManager.disconnect();
    isSimConnectInitialized = false;
    return "Disconnected from FSX";
  }
});

// Aircraft state
server.addTool({
  name: "get_aircraft_state",
  description: "Get current aircraft state including position, altitude, speed, heading, etc.",
  parameters: z.object({}),
  execute: async () => {
    await ensureConnection();
    const state = await simConnectManager.getAircraftState();
    return JSON.stringify(state, null, 2);
  }
});

// Flight controls
server.addTool({
  name: "set_throttle",
  description: "Set throttle position (0-100%)",
  parameters: z.object({
    percent: z.number().min(0).max(100).describe("Throttle percentage")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setThrottle(args.percent);
    return `Throttle set to ${args.percent}%`;
  }
});

server.addTool({
  name: "set_elevator",
  description: "Set elevator position (-100 to 100, negative for pitch up)",
  parameters: z.object({
    position: z.number().min(-100).max(100).describe("Elevator position")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setElevator(args.position);
    return `Elevator set to ${args.position}`;
  }
});

server.addTool({
  name: "set_aileron",
  description: "Set aileron position (-100 to 100, negative for left roll)",
  parameters: z.object({
    position: z.number().min(-100).max(100).describe("Aileron position")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAileron(args.position);
    return `Aileron set to ${args.position}`;
  }
});

server.addTool({
  name: "set_rudder",
  description: "Set rudder position (-100 to 100, negative for left yaw)",
  parameters: z.object({
    position: z.number().min(-100).max(100).describe("Rudder position")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setRudder(args.position);
    return `Rudder set to ${args.position}`;
  }
});

server.addTool({
  name: "set_flaps",
  description: "Set flaps position (0-100%)",
  parameters: z.object({
    percent: z.number().min(0).max(100).describe("Flaps percentage")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setFlaps(args.percent);
    return `Flaps set to ${args.percent}%`;
  }
});

server.addTool({
  name: "set_gear",
  description: "Set landing gear position",
  parameters: z.object({
    down: z.boolean().describe("True to lower gear, false to raise")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setGear(args.down);
    return `Landing gear ${args.down ? "lowered" : "raised"}`;
  }
});

// Autopilot controls
server.addTool({
  name: "set_autopilot",
  description: "Enable/disable autopilot",
  parameters: z.object({
    enabled: z.boolean().describe("True to enable autopilot")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilot(args.enabled);
    return `Autopilot ${args.enabled ? "enabled" : "disabled"}`;
  }
});

server.addTool({
  name: "set_autopilot_altitude",
  description: "Set autopilot target altitude",
  parameters: z.object({
    altitude: z.number().describe("Target altitude in feet")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotAltitude(args.altitude);
    return `Autopilot altitude set to ${args.altitude} feet`;
  }
});

server.addTool({
  name: "set_autopilot_heading",
  description: "Set autopilot target heading",
  parameters: z.object({
    heading: z.number().min(0).max(360).describe("Target heading in degrees")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotHeading(args.heading);
    return `Autopilot heading set to ${args.heading}°`;
  }
});

server.addTool({
  name: "set_autopilot_airspeed",
  description: "Set autopilot target airspeed",
  parameters: z.object({
    airspeed: z.number().describe("Target airspeed in knots")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotAirspeed(args.airspeed);
    return `Autopilot airspeed set to ${args.airspeed} knots`;
  }
});

// Autopilot mode controls
server.addTool({
  name: "set_autopilot_altitude_hold",
  description: "Enable/disable autopilot altitude hold mode",
  parameters: z.object({
    enabled: z.boolean().describe("True to enable altitude hold")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotAltitudeHold(args.enabled);
    return `Autopilot altitude hold ${args.enabled ? "enabled" : "disabled"}`;
  }
});

server.addTool({
  name: "set_autopilot_heading_hold",
  description: "Enable/disable autopilot heading hold mode",
  parameters: z.object({
    enabled: z.boolean().describe("True to enable heading hold")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotHeadingHold(args.enabled);
    return `Autopilot heading hold ${args.enabled ? "enabled" : "disabled"}`;
  }
});

server.addTool({
  name: "set_autopilot_airspeed_hold",
  description: "Enable/disable autopilot airspeed hold mode",
  parameters: z.object({
    enabled: z.boolean().describe("True to enable airspeed hold")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotAirspeedHold(args.enabled);
    return `Autopilot airspeed hold ${args.enabled ? "enabled" : "disabled"}`;
  }
});

server.addTool({
  name: "set_autopilot_vertical_speed_hold",
  description: "Enable/disable autopilot vertical speed hold mode",
  parameters: z.object({
    enabled: z.boolean().describe("True to enable vertical speed hold")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotVerticalSpeedHold(args.enabled);
    return `Autopilot vertical speed hold ${args.enabled ? "enabled" : "disabled"}`;
  }
});

server.addTool({
  name: "set_autopilot_vertical_speed",
  description: "Set autopilot target vertical speed",
  parameters: z.object({
    fpm: z.number().describe("Target vertical speed in feet per minute")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotVerticalSpeed(args.fpm);
    return `Autopilot vertical speed set to ${args.fpm} fpm`;
  }
});

server.addTool({
  name: "set_flight_director",
  description: "Enable/disable flight director",
  parameters: z.object({
    enabled: z.boolean().describe("True to enable flight director")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setFlightDirector(args.enabled);
    return `Flight director ${args.enabled ? "enabled" : "disabled"}`;
  }
});

server.addTool({
  name: "set_autopilot_approach_hold",
  description: "Enable/disable autopilot approach hold mode",
  parameters: z.object({
    enabled: z.boolean().describe("True to enable approach hold")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotApproachHold(args.enabled);
    return `Autopilot approach hold ${args.enabled ? "enabled" : "disabled"}`;
  }
});

server.addTool({
  name: "set_autopilot_nav1_hold",
  description: "Enable/disable autopilot NAV1 hold mode",
  parameters: z.object({
    enabled: z.boolean().describe("True to enable NAV1 hold")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutopilotNav1Hold(args.enabled);
    return `Autopilot NAV1 hold ${args.enabled ? "enabled" : "disabled"}`;
  }
});

server.addTool({
  name: "set_autothrottle",
  description: "Enable/disable autothrottle",
  parameters: z.object({
    enabled: z.boolean().describe("True to enable autothrottle")
  }),
  execute: async (args) => {
    await ensureConnection();
    await simConnectManager.setAutothrottle(args.enabled);
    return `Autothrottle ${args.enabled ? "enabled" : "disabled"}`;
  }
});

// Navigation
server.addTool({
  name: "get_nearby_airports",
  description: "Get list of nearby airports",
  parameters: z.object({
    radius: z.number().default(50).describe("Search radius in nautical miles")
  }),
  execute: async (args) => {
    await ensureConnection();
    const airports = await simConnectManager.getNearbyAirports(args.radius);
    return JSON.stringify(airports, null, 2);
  }
});

// Weather
server.addTool({
  name: "get_weather",
  description: "Get current weather conditions at aircraft location",
  parameters: z.object({}),
  execute: async () => {
    await ensureConnection();
    const weather = await simConnectManager.getWeather();
    return JSON.stringify(weather, null, 2);
  }
});

// Start the server
async function main() {
  console.error("FSX SimConnect MCP Server (FastMCP) starting...");
  
  const transportType = process.argv[2] || "stdio";
  const port = parseInt(process.argv[3] || "3000");

  if (transportType === "http") {
    console.error(`Starting HTTP server on port ${port}...`);
    
    server.start({
      transportType: "httpStream",
      httpStream: {
        port: port,
        endpoint: "/mcp"
      }
    });
    
    console.error(`Server listening on :: (all interfaces) port ${port}`);
    console.error(`MCP endpoint: http://0.0.0.0:${port}/mcp`);
    console.error(`Also accessible via: http://localhost:${port}/mcp or http://<your-ip>:${port}/mcp`);
    console.error(`Note: mcp-proxy binds to '::' which includes both IPv4 and IPv6 interfaces`);
  } else {
    console.error("Starting stdio server...");
    server.start({
      transportType: "stdio"
    });
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});