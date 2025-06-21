const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Test START_TOUR message
  ws.send(JSON.stringify({
    type: 'START_TOUR',
    payload: {
      passengerName: 'Test User',
      tourType: 'scenic'
    }
  }));
});

ws.on('message', (data) => {
  console.log('Received:', JSON.parse(data.toString()));
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});

// Keep the script running
setTimeout(() => {
  console.log('Test complete');
  ws.close();
  process.exit(0);
}, 5000);