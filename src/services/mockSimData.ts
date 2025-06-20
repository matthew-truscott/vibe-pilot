interface FlightData {
  altitude: number;
  airspeed: number;
  heading: number;
  verticalSpeed: number;
  throttle: number;
  flaps: number;
  gear: boolean;
  onGround: boolean;
  latitude: number;
  longitude: number;
  pitch: number;
  roll: number;
  yaw: number;
  engine1RPM: number;
  engine1Temp: number;
  fuelQuantity: number;
  gForce: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  pressure: number;
  autopilot: boolean;
  aircraft: string;
}

interface ExtendedFlightData extends FlightData {
  flightTime: number;
  timestamp: number;
}

let flightStartTime: number | null = null;
let lastUpdate: number = Date.now();
let flightData: FlightData = {
  altitude: 2000,
  airspeed: 150,
  heading: 270,
  verticalSpeed: 0,
  throttle: 75,
  flaps: 0,
  gear: false,
  onGround: false,
  latitude: 47.4502,
  longitude: -122.3088,
  pitch: 0,
  roll: 0,
  yaw: 0,
  engine1RPM: 2400,
  engine1Temp: 180,
  fuelQuantity: 85,
  gForce: 1.0,
  windSpeed: 15,
  windDirection: 225,
  temperature: 15,
  pressure: 29.92,
  autopilot: false,
  aircraft: "Cessna 172",
};

export const generateMockFlightData = (): ExtendedFlightData => {
  const now = Date.now();
  const deltaTime = (now - lastUpdate) / 1000;
  lastUpdate = now;

  if (!flightStartTime) {
    flightStartTime = now;
  }

  const flightTime = Math.floor((now - flightStartTime) / 1000);

  if (flightData.onGround) {
    flightData.airspeed = Math.max(0, flightData.airspeed - deltaTime * 5);
    flightData.altitude = 0;
    flightData.verticalSpeed = 0;
  } else {
    flightData.altitude += (flightData.verticalSpeed * deltaTime) / 60;
    flightData.altitude = Math.max(0, Math.min(45000, flightData.altitude));

    if (flightData.altitude < 100) {
      flightData.onGround = true;
      flightData.gear = true;
    }
  }

  flightData.heading += (Math.random() - 0.5) * 2;
  flightData.heading = (flightData.heading + 360) % 360;

  flightData.pitch = Math.sin(now / 3000) * 2 + (Math.random() - 0.5) * 0.5;
  flightData.roll = Math.sin(now / 5000) * 5 + (Math.random() - 0.5);

  flightData.airspeed += (Math.random() - 0.5) * 2;
  flightData.airspeed = Math.max(0, Math.min(350, flightData.airspeed));

  flightData.verticalSpeed += (Math.random() - 0.5) * 100;
  flightData.verticalSpeed = Math.max(
    -2000,
    Math.min(2000, flightData.verticalSpeed),
  );

  flightData.latitude +=
    (Math.sin((flightData.heading * Math.PI) / 180) *
      flightData.airspeed *
      deltaTime) /
    3600000;
  flightData.longitude +=
    (Math.cos((flightData.heading * Math.PI) / 180) *
      flightData.airspeed *
      deltaTime) /
    3600000;

  flightData.gForce =
    1 +
    Math.abs(flightData.verticalSpeed) / 10000 +
    Math.abs(flightData.roll) / 100;

  flightData.engine1RPM =
    2200 + flightData.throttle * 4 + (Math.random() - 0.5) * 50;
  flightData.engine1Temp =
    150 + flightData.throttle * 0.5 + (Math.random() - 0.5) * 5;

  flightData.fuelQuantity = Math.max(
    0,
    flightData.fuelQuantity - deltaTime * 0.01,
  );

  return {
    ...flightData,
    flightTime,
    timestamp: now,
  };
};

export const resetFlightData = (): void => {
  flightStartTime = Date.now();
  lastUpdate = Date.now();
  flightData = {
    altitude: 2000,
    airspeed: 150,
    heading: 270,
    verticalSpeed: 0,
    throttle: 75,
    flaps: 0,
    gear: false,
    onGround: false,
    latitude: 47.4502,
    longitude: -122.3088,
    pitch: 0,
    roll: 0,
    yaw: 0,
    engine1RPM: 2400,
    engine1Temp: 180,
    fuelQuantity: 85,
    gForce: 1.0,
    windSpeed: 15,
    windDirection: 225,
    temperature: 15,
    pressure: 29.92,
    autopilot: false,
    aircraft: "Cessna 172",
  };
};

export const landAircraft = (): FlightData => {
  flightData.altitude = 0;
  flightData.verticalSpeed = -50;
  flightData.onGround = true;
  flightData.gear = true;
  return flightData;
};

