# Quick Start Commands

## First Time Setup (2 minutes)

```bash
# 1. Install everything
npm install && cd backend && npm install && cd ..

# 2. Configure backend (REQUIRED)
cd backend
cp .env.example .env
# Edit .env with your Langflow credentials
cd ..
```

## Start Development (2 terminals needed)

### Terminal 1 - Backend

```bash
npm run backend
# or
cd backend && npm start
```

Should see: `Backend server running on port 3001`

### Terminal 2 - Frontend

```bash
npm run dev
```

Should see: `➜  Local:   http://localhost:5173/`

## Verify Everything Works

1. Open http://localhost:5173
2. Click "START FLIGHT" or go to Settings
3. Connect to simulator (mock mode auto-connects)
4. Go to Flight page
5. Chat panel should appear on the right
6. Type a message to test the pilot responds

## Common Commands

```bash
# See all npm scripts
npm run

# Backend only
cd backend && npm start

# Frontend only
npm run dev

# Build for production
npm run build

# Run production preview
npm run preview
```

## File Locations

- **Frontend code**: `/src/components/`
- **Backend code**: `/backend/`
- **Langflow config**: `/backend/.env`
- **Mock flight data**: `/src/services/mockSimData.js`
- **Chat UI**: `/src/components/PassengerChat.jsx`

## Stop Everything

- Frontend: `Ctrl+C` in frontend terminal
- Backend: `Ctrl+C` in backend terminal

## Reset Everything

```bash
rm -rf node_modules backend/node_modules
npm install && cd backend && npm install
```

That's it! 🚀

