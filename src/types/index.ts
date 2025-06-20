// Score related types
export interface Score {
  id: number | string;
  pilotName: string;
  score: number;
  aircraft: string;
  flightTime: number;
  maxAltitude: number;
  maxSpeed: number;
  landingQuality: string;
  smoothnessScore?: number;
  fuelEfficiency?: number;
  timestamp?: string;
  [key: string]: any;
}

// Flight data types
export interface SimData {
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
  flightTime: number;
  timestamp: number;
}

export interface FlightData {
  altitude?: number;
  airspeed?: number;
  heading?: number;
  verticalSpeed?: number;
  throttle?: number;
  flaps?: number;
  gear?: boolean;
  onGround?: boolean;
  latitude?: number;
  longitude?: number;
  pitch?: number;
  roll?: number;
  yaw?: number;
  engine1RPM?: number;
  engine1Temp?: number;
  fuelQuantity?: number;
  gForce?: number;
  windSpeed?: number;
  windDirection?: number;
  temperature?: number;
  pressure?: number;
  autopilot?: boolean;
  aircraft?: string;
  flightTime?: number;
  timestamp?: number;
}

export interface FlightScoreData {
  flightTime: number;
  maxAltitude: number;
  maxSpeed: number;
  smoothnessScore: number;
  landingQuality: "Perfect" | "Good" | "Hard" | "Crash";
  fuelEfficiency: number;
}

// Settings types
export interface SimConnectionSettings {
  type: string;
  host: string;
  port: number;
  autoConnect: boolean;
}

export interface ControlsSettings {
  throttle: string;
  rudder: string;
  elevator: string;
  aileron: string;
}

export interface Settings {
  simConnection: SimConnectionSettings;
  graphics: string;
  soundVolume: number;
  controls: ControlsSettings;
}

// Scoring types
export interface ScoreGrade {
  grade: string;
  color: string;
}

export interface Achievement {
  name: string;
  icon: string;
  description: string;
}

export interface AchievementCheckData extends FlightScoreData {
  // Additional fields that might be needed for achievement checks
}

