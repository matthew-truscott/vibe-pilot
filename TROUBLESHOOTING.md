# Troubleshooting Guide

## Quick Fixes for Common Issues

### Frontend Issues

#### "Chat not appearing on flight page"

```bash
# Check console for WebSocket errors
# Verify backend is running on port 3001
# Check browser dev tools Network tab for WS connection
```

#### "No flight data showing"

```javascript
// In browser console:
// Check if sim is connected
const simConnected = document.querySelector(".status-dot.connected");
// If not, the mock data should still work
```

#### "Blank page / React errors"

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend Issues

#### "Cannot connect to Langflow"

```bash
# Verify .env file exists and has correct values
cat backend/.env

# Test Langflow is accessible
curl http://localhost:7860/health  # or your Langflow URL

# Check error logs
# The backend will show specific Langflow connection errors
```

#### "WebSocket refuses connections"

```bash
# Check if port 3001 is already in use
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Try different port in .env
PORT=3002
```

#### "Module not found errors"

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Langflow Issues

#### "Agent responses are empty"

1. Verify flow has Chat Input and Chat Output components
2. Check the connection between components
3. Test flow directly in Langflow UI with sample data
4. Verify API key has proper permissions

#### "Flight context not working"

```javascript
// The backend sends context like this:
tweaks: {
  flight_context: {
    altitude: 2500,
    latitude: 37.7749,
    // ... etc
  }
}

// Make sure your prompt template uses {flight_context[altitude]} format
```

### Quick Test Commands

#### Test Backend Health

```bash
curl http://localhost:3001/api/health
```

#### Test WebSocket Connection

```javascript
// In browser console
const ws = new WebSocket("ws://localhost:3001/ws");
ws.onmessage = (e) => console.log("Received:", e.data);
ws.onopen = () => ws.send(JSON.stringify({ type: "START_TOUR", payload: {} }));
```

#### Test Langflow Directly

```bash
# Replace with your values
curl -X POST http://localhost:7860/api/v1/run/{flow-id} \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input_value": "Hello"}'
```

### Development Tips

#### Enable Debug Logging

```javascript
// In backend/server.js, add:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// In frontend, add to chatService.js:
console.log("WebSocket message:", data);
```

#### Mock Mode Testing

- The app works without real flight sim
- Uses `mockSimData.js` for testing
- Great for UI development

#### Browser Extensions

- React Developer Tools - inspect component state
- Network tab - monitor WebSocket frames
- Console - check for errors

### Emergency Fixes

#### "Everything is broken"

```bash
# Full reset
git stash  # Save any changes
git checkout main
git pull

# Reinstall everything
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install

# Copy env file
cd backend
cp .env.example .env
# Edit with your values

# Start fresh
npm start  # in backend/
npm run dev  # in root
```

#### Still Having Issues?

1. Check Node.js version (16+ required)
2. Try incognito/private browser window
3. Disable browser extensions
4. Check firewall/antivirus blocking ports
5. Review DEVELOPER_NOTES.md for architecture details

