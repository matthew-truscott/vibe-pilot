# Vibe Pilot - AI-Powered Flight Sim Tour Guide

A flight simulator launcher with integrated AI tour guide that provides real-time commentary during scenic flights.

## Quick Start

### Prerequisites
- Node.js 16+
- Langflow instance (local or cloud)
- Flight simulator with FSUIPC/SimConnect (optional - has mock mode)

### Installation

1. **Clone and install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

2. **Configure Langflow connection**
```bash
cd backend
cp .env.example .env
# Edit .env with your Langflow credentials
```

3. **Start both servers**
```bash
# Terminal 1 - Backend (port 3001)
cd backend
npm start

# Terminal 2 - Frontend (port 5173)
npm run dev
```

4. **Open http://localhost:5173**

## Features

- 🎮 Game-like flight sim launcher interface
- 💬 Real-time chat with AI tour guide pilot
- ✈️ Live flight instruments and telemetry
- 🏆 Flight scoring and leaderboard
- 📍 Context-aware commentary based on location/altitude
- 🎯 Mock flight mode for testing without sim

## Project Structure

```
vibe-pilot/
├── src/               # React frontend
├── backend/           # Node.js API + WebSocket server
├── public/            # Static assets
└── DEVELOPER_NOTES.md # Detailed technical documentation
```

## For Developers

See [DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md) for comprehensive technical documentation.

## Configuration

### Langflow Setup
Your Langflow flow should include:
- Chat Input component
- Chat Output component  
- System prompt for tour guide personality
- Access to flight_context variables

### Environment Variables
```env
LANGFLOW_API_KEY=your_key
LANGFLOW_BASE_URL=http://localhost:7860
TOUR_GUIDE_FLOW_ID=your_flow_id
```

## License

MIT