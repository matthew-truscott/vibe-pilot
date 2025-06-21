// Example SSE client for testing the FSX MCP Server
// This demonstrates how to connect to the SSE endpoint

const EventSource = require('eventsource');
const fetch = require('node-fetch');

// Server configuration
const SERVER_URL = 'http://localhost:3000';
const SSE_ENDPOINT = `${SERVER_URL}/sse`;
const MESSAGE_ENDPOINT = `${SERVER_URL}/messages`;

// Create SSE connection
const eventSource = new EventSource(SSE_ENDPOINT);

// Extract session ID from the connection (you may need to implement this based on server response)
let sessionId = null;

eventSource.onopen = () => {
  console.log('SSE connection established');
};

eventSource.onmessage = (event) => {
  console.log('Received message:', event.data);
  
  // Parse the message to extract session ID if provided
  try {
    const data = JSON.parse(event.data);
    if (data.sessionId) {
      sessionId = data.sessionId;
      console.log('Session ID:', sessionId);
    }
  } catch (e) {
    // Not JSON, just log the raw message
  }
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};

// Example function to send a message to the server
async function sendMessage(method, params = {}) {
  if (!sessionId) {
    console.error('No session ID available yet');
    return;
  }

  try {
    const response = await fetch(`${MESSAGE_ENDPOINT}?sessionId=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Response:', result);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Example usage: Call tools after connection is established
setTimeout(async () => {
  // List available tools
  await sendMessage('tools/list');

  // Connect to FSX
  await sendMessage('tools/call', {
    name: 'connect',
    arguments: {},
  });

  // Get aircraft state
  await sendMessage('tools/call', {
    name: 'get_aircraft_state',
    arguments: {},
  });
}, 2000);

// Clean up on exit
process.on('SIGINT', () => {
  console.log('Closing SSE connection...');
  eventSource.close();
  process.exit();
});