# Vibe Pilot Developer Notes

## Project Overview
This is a flight simulator launcher with an integrated AI tour guide system. The project consists of:
1. **React Frontend** - Flight sim launcher with game-like UI
2. **Node.js Backend** - Handles Langflow AI integration for tour guide functionality
3. **Langflow Integration** - Connects to external Langflow instance for AI agent responses

## Architecture

### Frontend (React + Vite)
```
src/
├── components/
│   ├── HomePage.jsx          # Main launcher screen
│   ├── FlightPage.jsx        # Flight instruments + passenger chat
│   ├── ScoresPage.jsx        # Flight history/leaderboard
│   ├── SettingsPage.jsx      # Sim connection settings
│   ├── PassengerChat.jsx     # Chat interface with AI pilot
│   ├── Navigation.jsx        # Bottom navigation bar
│   └── SimStatus.jsx         # Connection status indicator
├── services/
│   ├── simConnection.js      # Mock flight sim data service
│   ├── mockSimData.js        # Generates realistic flight data
│   ├── chatService.js        # WebSocket client for pilot chat
│   └── scoring.js            # Flight performance scoring
└── utils/
    └── storage.js            # LocalStorage helpers
```

### Backend (Node.js + Express)
```
backend/
├── server.js                 # Express + WebSocket server
├── config/
│   └── langflow.config.js    # Langflow API configuration
├── services/
│   ├── langflowClient.js     # Langflow API wrapper
│   └── pilotAgent.js         # Tour guide conversation manager
├── routes/
│   └── chat.js               # REST API endpoints
└── websocket/
    └── chatHandler.js        # WebSocket message handlers
```

## Key Concepts

### 1. Tour Guide Experience
The user is a passenger in a 2-seater aircraft with an AI pilot/tour guide. The pilot:
- Provides commentary based on location, altitude, and flight phase
- Responds to passenger questions
- Has personality and aviation knowledge
- Receives real-time flight data with each message

### 2. Flight Sim Integration
- The flight sim runs separately (FSUIPC/SimConnect)
- Flight data is already being fed to the React app via `simConnection.js`
- Currently using **mock data** for development
- Real sim data will include: altitude, speed, position, heading, aircraft type

### 3. Langflow Integration
The backend connects to Langflow to power the AI tour guide:

```javascript
// Message flow:
1. Passenger sends message via WebSocket
2. Backend adds flight context to message
3. Langflow agent processes with full context
4. Response streams back to passenger
```

**Important**: Langflow API keys must NEVER be exposed to frontend!

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install

# Create .env file with your Langflow credentials:
cp .env.example .env
# Edit .env with actual values:
# - LANGFLOW_API_KEY
# - LANGFLOW_BASE_URL or LANGFLOW_ID (for cloud)
# - TOUR_GUIDE_FLOW_ID

npm start  # Runs on port 3001
```

### 2. Frontend Setup
```bash
npm install
npm run dev  # Runs on port 5173
```

### 3. Langflow Configuration
Your Langflow flow needs:
- **Chat Input** component (receives passenger messages)
- **Chat Output** component (sends pilot responses)
- Access to flight context via tweaks/variables
- Prompt engineering for tour guide personality

Example prompt structure:
```
You are Captain Mike, a friendly tour guide pilot. 
Current flight data: {flight_context}
Passenger message: {input_value}
Provide engaging, location-aware commentary...
```

## Current State & What's Working

### ✅ Completed
1. **Full backend infrastructure** for Langflow integration
2. **WebSocket real-time chat** with reconnection logic
3. **PassengerChat UI** with typing indicators, quick questions
4. **Session management** - conversations persist during flight
5. **Flight context integration** - each message includes sim data
6. **Fallback responses** when Langflow is unavailable
7. **Mobile responsive** chat interface

### 🚧 Needs Implementation
1. **Langflow Flow Creation** - The actual tour guide agent in Langflow
2. **Real SimConnect/FSUIPC data** - Currently using mock data
3. **Location-based POI system** - Landmark database for commentary
4. **Audio/TTS integration** - Voice communication option
5. **Multiple pilot personalities** - Different tour guide styles

## Code Patterns & Conventions

### WebSocket Communication
Messages follow this structure:
```javascript
// From Frontend to Backend
{
  type: 'PASSENGER_MESSAGE',
  payload: {
    message: "What's that building?",
    flightData: { altitude: 2500, ... }
  }
}

// From Backend to Frontend
{
  type: 'PILOT_MESSAGE',
  message: "That's the Golden Gate Bridge...",
  timestamp: "2024-01-20T..."
}
```

### Flight Data Structure
```javascript
{
  altitude: 2500,        // feet
  airspeed: 150,         // knots
  heading: 270,          // degrees
  verticalSpeed: 0,      // fpm
  latitude: 47.4502,
  longitude: -122.3088,
  onGround: false,
  aircraft: "Cessna 172"
}
```

### Error Handling
- WebSocket auto-reconnects up to 5 times
- Fallback responses for common questions
- Graceful degradation if backend unavailable

## Testing & Development

### Mock Mode
The app works without real flight sim connection:
1. `mockSimData.js` generates realistic flight data
2. Test the chat without Langflow using fallback responses
3. Sim connection status shown in top-right

### Debug WebSocket
Open browser console:
```javascript
// Check connection status
chatService.isConnected()

// Manual message send
chatService.sendMessage("Test message", { altitude: 1000 })
```

## Deployment Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use proper secrets management in production
   - Different Langflow endpoints for dev/prod

2. **CORS Configuration**
   - Currently allows all origins in development
   - Restrict to specific domains in production

3. **WebSocket Scaling**
   - Current implementation is single-server
   - Consider Redis for multi-server deployment

4. **Security**
   - Langflow API keys stay on backend only
   - Add rate limiting for chat messages
   - Validate all flight data inputs

## Next Developer Tasks

### High Priority
1. Create the Langflow tour guide flow with proper prompts
2. Test with real FSUIPC/SimConnect data
3. Build POI database for major landmarks
4. Add more pilot personality options

### Medium Priority
1. Implement voice synthesis for pilot responses
2. Add flight recording/playback with commentary
3. Create tutorial mode for new passengers
4. Build admin panel for managing tours

### Nice to Have
1. Multiple language support
2. Weather-aware commentary
3. Emergency scenario handling
4. Integration with real ATC audio

## Common Issues & Solutions

### "WebSocket won't connect"
- Check backend is running on port 3001
- Verify no CORS issues in browser console
- Ensure `.env` file exists with valid config

### "Langflow responses are generic"
- Pass more flight context in tweaks
- Improve prompt engineering in flow
- Check flight data is being sent correctly

### "Chat messages delayed"
- Check Langflow API response times
- Consider caching common responses
- Implement streaming responses

## Contact & Resources

- Langflow Docs: https://docs.langflow.org/
- React Router: Used for navigation between pages
- WebSocket docs: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

Remember: The goal is to create an immersive passenger experience where the AI pilot provides contextual, engaging commentary throughout the scenic flight!