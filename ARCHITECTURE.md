# System Architecture

## Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Flight Sim    │────▶│  React Frontend │◀────│     Backend     │
│ (FSUIPC/Mock)   │     │   (Port 5173)   │ WS  │   (Port 3001)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          │ HTTPS
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │                 │
                                                 │    Langflow     │
                                                 │   (AI Agent)    │
                                                 │                 │
                                                 └─────────────────┘
```

## Data Flow

### 1. Flight Data Flow
```
Flight Sim ──(telemetry)──▶ simConnection.js ──(state)──▶ React Components
                                    │
                                    └──(mock data)──▶ Development Mode
```

### 2. Chat Message Flow
```
User Input ──▶ PassengerChat ──▶ WebSocket ──▶ Backend
                                                  │
                                                  ├─ Add Flight Context
                                                  ├─ Session Management
                                                  └─ Send to Langflow
                                                          │
                                                          ▼
                                                    AI Processing
                                                          │
                                                          ▼
WebSocket ◀── PassengerChat ◀── WebSocket ◀── Pilot Response
```

## Component Relationships

### Frontend Components
```
App.jsx
├── SimStatus (global connection indicator)
├── Navigation (bottom nav bar)
└── Routes
    ├── HomePage
    │   ├── Stats Display
    │   ├── Top Scores Preview
    │   └── Quick Actions
    ├── FlightPage
    │   ├── Flight Instruments
    │   ├── Flight Stats
    │   └── PassengerChat
    │       ├── Message List
    │       ├── Quick Questions
    │       └── Input Field
    ├── ScoresPage
    │   ├── Filters/Sort
    │   └── Score Cards
    └── SettingsPage
        ├── Connection Config
        ├── Graphics Settings
        └── Control Bindings
```

### Backend Services
```
server.js
├── Express Middleware
│   ├── CORS
│   ├── JSON Parser
│   └── Error Handler
├── REST Routes (/api/chat)
│   ├── POST /start
│   ├── POST /message
│   ├── GET /history/:sessionId
│   └── POST /end
└── WebSocket Server
    └── chatHandler.js
        ├── Connection Manager
        ├── Message Router
        └── Session Store

Services:
├── langflowClient.js
│   ├── API Configuration
│   ├── Flow Execution
│   └── Response Parser
└── pilotAgent.js
    ├── Session Management
    ├── Context Enrichment
    └── Fallback Responses
```

## State Management

### Frontend State
```javascript
// Global State (via Context/Service)
- simConnection: { connected, simData }
- chatService: { wsConnection, sessionId }

// Component State
- HomePage: { topScores }
- FlightPage: { flightStats, isFlightActive, showChat }
- PassengerChat: { messages, isTyping }
- ScoresPage: { scores, filters }
- SettingsPage: { settings }
```

### Backend State
```javascript
// In-Memory Stores
- Active Sessions: Map<sessionId, sessionData>
- WebSocket Connections: Map<sessionId, ws>

// Session Data Structure
{
  sessionId: string,
  passengerName: string,
  tourType: string,
  startTime: Date,
  messages: Array<Message>,
  flightData: FlightData
}
```

## Message Protocol

### WebSocket Message Types

#### Client → Server
```javascript
// Start Tour
{ type: 'START_TOUR', payload: { passengerName, tourType } }

// Send Message
{ type: 'PASSENGER_MESSAGE', payload: { message, flightData } }

// Update Flight Data
{ type: 'UPDATE_FLIGHT_DATA', payload: { flightData } }

// End Tour
{ type: 'END_TOUR' }
```

#### Server → Client
```javascript
// Connection Established
{ type: 'CONNECTED', message: string }

// Tour Started
{ type: 'TOUR_STARTED', sessionId: string, message: string }

// Message Acknowledged
{ type: 'MESSAGE_RECEIVED', timestamp: string }

// Pilot Response
{ type: 'PILOT_MESSAGE', message: string, timestamp: string }

// Flight Update
{ type: 'FLIGHT_UPDATE', flightData: object }

// Error
{ type: 'ERROR', message: string }
```

## Security Considerations

### API Key Protection
```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Browser    │   ❌  │  Langflow    │   ✅  │   Backend    │
│              │───────│   API Key    │───────│   Server     │
└──────────────┘       └──────────────┘       └──────────────┘
        │                                              │
        └──────────────── WebSocket ──────────────────┘
                     (No API Key Exposed)
```

### Data Validation
- Flight data sanitization
- Message length limits
- Session timeout handling
- Rate limiting (TODO)

## Deployment Architecture

### Development
```
- Frontend: Vite Dev Server (HMR enabled)
- Backend: Node.js with nodemon (auto-restart)
- Langflow: Local instance or cloud sandbox
```

### Production (Recommended)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel/   │     │   Heroku/   │     │  Langflow   │
│   Netlify   │────▶│    AWS      │────▶│   Cloud     │
│  (Frontend) │     │  (Backend)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │
       └────── CDN ─────────┘
```

## Performance Optimizations

### Frontend
- Lazy load chat component
- Throttle flight data updates
- Message virtualization for long chats
- WebSocket reconnection backoff

### Backend
- Connection pooling for Langflow
- Message queuing for high load
- Session cleanup after inactivity
- Response caching for common questions

## Future Scalability

### Horizontal Scaling
```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Backend #1       Backend #2       Backend #3
        │                │                │
        └────────────────┼────────────────┘
                         │
                   Redis (Session Store)
```

### Multi-Region
- CDN for static assets
- Regional Langflow deployments
- GeoDNS for API routing
- Cross-region session sync