// Simple test script to verify SimConnect connection
const { open, Protocol } = require('node-simconnect');

async function testConnection() {
  try {
    console.log('Attempting to connect to FSX...');
    const { handle, recvOpen } = await open('Test Connection', Protocol.FSX_SP2);
    
    console.log('Successfully connected!');
    console.log('Simulator:', recvOpen.applicationName);
    console.log('Version:', `${recvOpen.applicationVersionMajor}.${recvOpen.applicationVersionMinor}`);
    console.log('Build:', `${recvOpen.applicationBuildMajor}.${recvOpen.applicationBuildMinor}`);
    
    handle.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Failed to connect:', error.message);
    console.error('Make sure FSX is running and SimConnect is properly installed.');
  }
}

testConnection();