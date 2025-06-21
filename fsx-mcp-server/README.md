# FSX SimConnect MCP Server

An MCP (Model Context Protocol) server that connects to Microsoft Flight Simulator X through SimConnect, exposing flight controls and aircraft state information for AI agents.

## Features

- **Aircraft State Monitoring**: Real-time data including position, altitude, speed, heading, and more
- **Flight Controls**: Throttle, elevator, aileron, rudder, flaps, and landing gear
- **Autopilot Functions**: Enable/disable autopilot, set altitude, heading, and airspeed
- **Navigation**: Get nearby airports with distance and bearing
- **Weather Information**: Current weather conditions at aircraft location

## Prerequisites

- Microsoft Flight Simulator X with SimConnect installed
- Node.js 18+ 
- npm or yarn

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the Server

The server supports two modes: **stdio** (default) and **http**.

#### Stdio Mode (for Claude Desktop)

```bash
npm start
# or
npm run dev
```

#### HTTP Mode (for remote access)

```bash
npm start:http
# or
npm run dev:http
# or with custom port
node dist/index.js http 8080
```

### Connecting with Claude Desktop

For stdio mode with FastMCP, add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "fsx-simconnect": {
      "command": "node",
      "args": ["/path/to/fsx-mcp-server/dist/fastmcp-server.js"]
    }
  }
}
```

Or use the legacy implementation:
```json
{
  "mcpServers": {
    "fsx-simconnect": {
      "command": "node",
      "args": ["/path/to/fsx-mcp-server/dist/index.js"]
    }
  }
}
```

### Remote Access via HTTP

When running in HTTP mode with FastMCP, the server listens on all interfaces (::) on port 3000 (or custom port) and accepts HTTP stream connections.

```bash
npm start:http
# or with custom port
node dist/fastmcp-server.js http 8080
```

The server is accessible from:
- `http://localhost:3000/mcp` (local machine)
- `http://0.0.0.0:3000/mcp` (all IPv4 interfaces)
- `http://<your-ip>:3000/mcp` (from other devices on your network)

**Note**: The underlying mcp-proxy binds to '::' which listens on all available network interfaces (both IPv4 and IPv6).

## Available Tools

### Connection Management

- **connect**: Connect to FSX via SimConnect
- **disconnect**: Disconnect from FSX

### Aircraft State

- **get_aircraft_state**: Returns comprehensive aircraft state including:
  - Position (latitude, longitude, altitude)
  - Attitude (heading, pitch, bank)
  - Speed (airspeed, ground speed, vertical speed)
  - Control surfaces positions
  - Engine and fuel status
  - Warnings (stall, overspeed)

### Flight Controls

- **set_throttle**: Set throttle (0-100%)
- **set_elevator**: Set elevator position (-100 to 100)
- **set_aileron**: Set aileron position (-100 to 100)
- **set_rudder**: Set rudder position (-100 to 100)
- **set_flaps**: Set flaps (0-100%)
- **set_gear**: Raise/lower landing gear

### Autopilot

- **set_autopilot**: Enable/disable autopilot
- **set_autopilot_altitude**: Set target altitude
- **set_autopilot_heading**: Set target heading
- **set_autopilot_airspeed**: Set target airspeed

### Navigation & Weather

- **get_nearby_airports**: Get airports within specified radius
- **get_weather**: Get current weather conditions

## Example Usage in Claude

```
Connect to FSX and get aircraft state:
- Use the "connect" tool
- Use the "get_aircraft_state" tool

Set up for landing:
- Use "set_throttle" with 30%
- Use "set_flaps" with 50%
- Use "set_gear" with down=true
- Use "get_nearby_airports" with radius=20

Enable autopilot for cruise:
- Use "set_autopilot" with enabled=true
- Use "set_autopilot_altitude" with altitude=35000
- Use "set_autopilot_heading" with heading=270
- Use "set_autopilot_airspeed" with airspeed=450
```

## Integration with Langflow

To connect this MCP server with Langflow:

1. Ensure the MCP server is running
2. In Langflow, create a custom component that communicates with the MCP server
3. Use the MCP protocol to send tool requests and receive responses
4. Build flows that utilize the flight control and monitoring capabilities

## Troubleshooting

- **Connection Failed**: Ensure FSX is running and SimConnect is properly installed
- **No Data**: Wait a few seconds after connecting for data to start flowing
- **Controls Not Responding**: Check that the aircraft is not paused in FSX

## License

ISC