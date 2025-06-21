// Test script to verify SimConnect controls
const { SimConnectManager } = require('./dist/simconnect-manager.js');

async function testControls() {
  const manager = new SimConnectManager();
  
  try {
    console.log('Connecting to FSX...');
    await manager.connect();
    
    // Wait for initial data
    console.log('Waiting for aircraft state...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get initial state
    const state = await manager.getAircraftState();
    console.log('Initial state:');
    console.log(`  Position: ${state.latitude.toFixed(6)}, ${state.longitude.toFixed(6)}`);
    console.log(`  Altitude: ${state.altitude.toFixed(0)} ft`);
    console.log(`  Throttle: ${state.throttle.toFixed(1)}%`);
    
    // Test throttle
    console.log('\nTesting throttle...');
    await manager.setThrottle(50);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newState = await manager.getAircraftState();
    console.log(`  New throttle: ${newState.throttle.toFixed(1)}%`);
    
    // Test nearby airports
    console.log('\nTesting nearby airports...');
    const airports = await manager.getNearbyAirports(50);
    console.log(`Found ${airports.length} airports:`);
    airports.forEach(apt => {
      console.log(`  ${apt.icao} - ${apt.name}: ${apt.distance.toFixed(1)} nm, bearing ${apt.bearing.toFixed(0)}°`);
    });
    
    console.log('\nDisconnecting...');
    await manager.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testControls();