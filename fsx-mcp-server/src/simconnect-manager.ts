import { 
  open, 
  Protocol, 
  SimConnectDataType, 
  SimConnectConstants, 
  SimConnectPeriod,
  RawBuffer
} from "node-simconnect";

interface AircraftState {
  latitude: number;
  longitude: number;
  altitude: number;
  altitudeAGL: number;
  heading: number;
  pitch: number;
  bank: number;
  airspeed: number;
  groundSpeed: number;
  verticalSpeed: number;
  throttle: number;
  elevator: number;
  aileron: number;
  rudder: number;
  flaps: number;
  gear: boolean;
  autopilot: {
    enabled: boolean;
    altitude: number;
    heading: number;
    airspeed: number;
    // Autopilot modes
    altitudeHold: boolean;
    headingHold: boolean;
    airspeedHold: boolean;
    verticalSpeedHold: boolean;
    flightDirector: boolean;
    approach: boolean;
    backcourse: boolean;
    nav1Hold: boolean;
    autothrottle: boolean;
    glideslope: boolean;
    verticalSpeed: number;  // Target vertical speed in fpm
  };
  fuel: {
    totalQuantity: number;
    totalCapacity: number;
    percentage: number;
  };
  engine: {
    rpm: number;
    running: boolean;
  };
  onGround: boolean;
  stallWarning: boolean;
  overspeedWarning: boolean;
}

interface WeatherData {
  visibility: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  pressure: number;
  precipitation: string;
}

interface Airport {
  icao: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  distance: number;
  bearing: number;
}

enum DATA_DEFINE_ID {
  AIRCRAFT_STATE = 0,
  WEATHER = 1,
  FACILITY_AIRPORT = 2,
}

enum DATA_REQUEST_ID {
  AIRCRAFT_STATE = 0,
  WEATHER = 1,
  FACILITY_AIRPORT = 2,
  AIRPORT_LIST = 3,
}

enum EVENT_ID {
  THROTTLE_SET = 0,
  ELEVATOR_SET = 1,
  AILERON_SET = 2,
  RUDDER_SET = 3,
  FLAPS_SET = 4,
  GEAR_TOGGLE = 5,
  AP_MASTER = 6,
  AP_ALT_VAR_SET_ENGLISH = 7,
  AP_HDG_VAR_SET = 8,
  AP_SPD_VAR_SET = 9,
  HEADING_BUG_SET = 10,
  // Autopilot mode controls
  AP_ALT_HOLD = 11,
  AP_HDG_HOLD = 12,
  AP_AIRSPEED_HOLD = 13,
  AP_VS_HOLD = 14,
  AP_VS_VAR_SET_ENGLISH = 15,
  TOGGLE_FLIGHT_DIRECTOR = 16,
  AP_APR_HOLD = 17,
  AP_BC_HOLD = 18,
  AP_NAV1_HOLD = 19,
  AUTO_THROTTLE_ARM = 20,
  AP_PANEL_ALTITUDE_HOLD = 21,
  AP_PANEL_HEADING_HOLD = 22,
  AP_PANEL_SPEED_HOLD = 23,
  AP_PANEL_VS_HOLD = 24,
}

enum GROUP_ID {
  GROUP_0 = 0,
}

enum FACILITY_LIST_TYPE {
  AIRPORT = 0,
  WAYPOINT = 1,
  NDB = 2,
  VOR = 3,
}

export class SimConnectManager {
  private handle: any = null;
  private isConnected: boolean = false;
  private aircraftState: AircraftState | null = null;
  private airportListResolver: ((airports: Airport[]) => void) | null = null;
  private pendingAirports: Airport[] = [];

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.error("Already connected to FSX");
      return;
    }

    try {
      const { handle, recvOpen } = await open("FSX MCP Server", Protocol.FSX_SP2);
      this.handle = handle;
      this.isConnected = true;
      console.error(`Connected to ${recvOpen.applicationName}`);
      console.error(`SimConnect version: ${recvOpen.simConnectVersionMajor}.${recvOpen.simConnectVersionMinor}`);

      this.setupDataDefinitions();
      this.setupEvents();
      this.startDataPolling();
      
      // Give it a moment to start receiving data
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error("Connection error details:", error);
      throw new Error(`Failed to connect to FSX: ${error.message || error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    if (this.handle) {
      this.handle.close();
      this.handle = null;
    }
    this.isConnected = false;
    this.aircraftState = null;
    console.error("Disconnected from FSX");
  }

  private setupDataDefinitions(): void {
    console.error("Setting up data definitions...");
    try {
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "PLANE LATITUDE",
      "degrees",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "PLANE LONGITUDE",
      "degrees",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "PLANE ALTITUDE",
      "feet",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "PLANE ALT ABOVE GROUND",
      "feet",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "PLANE HEADING DEGREES TRUE",
      "degrees",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "PLANE PITCH DEGREES",
      "degrees",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "PLANE BANK DEGREES",
      "degrees",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AIRSPEED INDICATED",
      "knots",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "GROUND VELOCITY",
      "knots",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "VERTICAL SPEED",
      "feet per minute",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "GENERAL ENG THROTTLE LEVER POSITION:1",
      "percent",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "ELEVATOR POSITION",
      "position",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AILERON POSITION",
      "position",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "RUDDER POSITION",
      "position",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "FLAPS HANDLE PERCENT",
      "percent",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "GEAR HANDLE POSITION",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT MASTER",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT ALTITUDE LOCK VAR",
      "feet",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT HEADING LOCK DIR",
      "degrees",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT AIRSPEED HOLD VAR",
      "knots",
      SimConnectDataType.FLOAT64
    );
    // Autopilot mode states
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT ALTITUDE LOCK",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT HEADING LOCK",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT AIRSPEED HOLD",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT VERTICAL HOLD",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT FLIGHT DIRECTOR ACTIVE",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT APPROACH HOLD",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT BACKCOURSE HOLD",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT NAV1 LOCK",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT THROTTLE ARM",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT GLIDESLOPE HOLD",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "AUTOPILOT VERTICAL HOLD VAR",
      "feet/minute",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "FUEL TOTAL QUANTITY",
      "gallons",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "FUEL TOTAL CAPACITY",
      "gallons",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "GENERAL ENG RPM:1",
      "rpm",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "ENG COMBUSTION:1",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "SIM ON GROUND",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "STALL WARNING",
      "bool",
      SimConnectDataType.INT32
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      "OVERSPEED WARNING",
      "bool",
      SimConnectDataType.INT32
    );

    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.WEATHER,
      "AMBIENT VISIBILITY",
      "meters",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.WEATHER,
      "AMBIENT WIND VELOCITY",
      "knots",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.WEATHER,
      "AMBIENT WIND DIRECTION",
      "degrees",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.WEATHER,
      "AMBIENT TEMPERATURE",
      "celsius",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.WEATHER,
      "AMBIENT PRESSURE",
      "inches of mercury",
      SimConnectDataType.FLOAT64
    );
    this.handle.addToDataDefinition(
      DATA_DEFINE_ID.WEATHER,
      "AMBIENT PRECIP STATE",
      "mask",
      SimConnectDataType.INT32
    );
    
    console.error("Data definitions setup complete");
    } catch (error) {
      console.error("Error setting up data definitions:", error);
      throw error;
    }
  }

  private setupEvents(): void {
    console.error("Setting up events...");
    // Map all events to group 0 with priority 1
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.THROTTLE_SET, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.ELEVATOR_SET, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AILERON_SET, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.RUDDER_SET, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.FLAPS_SET, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.GEAR_TOGGLE, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_MASTER, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_ALT_VAR_SET_ENGLISH, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_HDG_VAR_SET, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_SPD_VAR_SET, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.HEADING_BUG_SET, false);
    // Autopilot mode events
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_ALT_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_HDG_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_AIRSPEED_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_VS_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_VS_VAR_SET_ENGLISH, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.TOGGLE_FLIGHT_DIRECTOR, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_APR_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_BC_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_NAV1_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AUTO_THROTTLE_ARM, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_PANEL_ALTITUDE_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_PANEL_HEADING_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_PANEL_SPEED_HOLD, false);
    this.handle.addClientEventToNotificationGroup(GROUP_ID.GROUP_0, EVENT_ID.AP_PANEL_VS_HOLD, false);
    
    // Set group priority
    this.handle.setNotificationGroupPriority(GROUP_ID.GROUP_0, 1);
    
    // Map events to sim events
    this.handle.mapClientEventToSimEvent(EVENT_ID.THROTTLE_SET, "THROTTLE_SET");
    this.handle.mapClientEventToSimEvent(EVENT_ID.ELEVATOR_SET, "ELEVATOR_SET");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AILERON_SET, "AILERON_SET");
    this.handle.mapClientEventToSimEvent(EVENT_ID.RUDDER_SET, "RUDDER_SET");
    this.handle.mapClientEventToSimEvent(EVENT_ID.FLAPS_SET, "FLAPS_SET");
    this.handle.mapClientEventToSimEvent(EVENT_ID.GEAR_TOGGLE, "GEAR_TOGGLE");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_MASTER, "AP_MASTER");
    this.handle.mapClientEventToSimEvent(
      EVENT_ID.AP_ALT_VAR_SET_ENGLISH,
      "AP_ALT_VAR_SET_ENGLISH"
    );
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_HDG_VAR_SET, "AP_HDG_VAR_SET");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_SPD_VAR_SET, "AP_SPD_VAR_SET");
    this.handle.mapClientEventToSimEvent(EVENT_ID.HEADING_BUG_SET, "HEADING_BUG_SET");
    // Map autopilot mode events
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_ALT_HOLD, "AP_ALT_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_HDG_HOLD, "AP_HDG_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_AIRSPEED_HOLD, "AP_AIRSPEED_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_VS_HOLD, "AP_VS_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_VS_VAR_SET_ENGLISH, "AP_VS_VAR_SET_ENGLISH");
    this.handle.mapClientEventToSimEvent(EVENT_ID.TOGGLE_FLIGHT_DIRECTOR, "TOGGLE_FLIGHT_DIRECTOR");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_APR_HOLD, "AP_APR_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_BC_HOLD, "AP_BC_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_NAV1_HOLD, "AP_NAV1_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AUTO_THROTTLE_ARM, "AUTO_THROTTLE_ARM");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_PANEL_ALTITUDE_HOLD, "AP_PANEL_ALTITUDE_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_PANEL_HEADING_HOLD, "AP_PANEL_HEADING_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_PANEL_SPEED_HOLD, "AP_PANEL_SPEED_HOLD");
    this.handle.mapClientEventToSimEvent(EVENT_ID.AP_PANEL_VS_HOLD, "AP_PANEL_VS_HOLD");

    // Add error handler
    this.handle.on("error", (error: any) => {
      console.error("SimConnect error:", error);
    });
    
    // Handle various facility-related events
    
    // Standard airport list event
    this.handle.on("airportList", (data: any) => {
      console.error("Received airportList event:", data);
      this.processAirportData(data);
    });
    
    // Alternative event names that might be used
    this.handle.on("facilityAirport", (data: any) => {
      console.error("Received facilityAirport event:", data);
      this.processAirportData(data);
    });
    
    // Subscribe to facilities event
    this.handle.on("subscribedToFacility", (data: any) => {
      console.error("Subscribed to facility:", data);
    });
    
    // Facility data event
    this.handle.on("facilityData", (data: any) => {
      console.error("Received facilityData event:", data);
    });
    
    // Event ID based handler
    this.handle.on("event", (data: any) => {
      if (data.clientEventId === DATA_REQUEST_ID.AIRPORT_LIST) {
        console.error("Received event for airport list:", data);
      }
    });
    
    this.handle.on("simObjectData", (recvSimObjectData: any) => {
      console.error("Received simObjectData event, requestID:", recvSimObjectData.requestID);
      if (recvSimObjectData.requestID === DATA_REQUEST_ID.AIRCRAFT_STATE) {
        console.error("Processing aircraft state data...");
        const data = recvSimObjectData.data as RawBuffer;
        
        // Read data in the order it was defined
        const latitude = data.readFloat64();
        const longitude = data.readFloat64();
        const altitude = data.readFloat64();
        const altitudeAGL = data.readFloat64();
        const heading = data.readFloat64();
        const pitch = data.readFloat64();
        const bank = data.readFloat64();
        const airspeed = data.readFloat64();
        const groundSpeed = data.readFloat64();
        const verticalSpeed = data.readFloat64();
        const throttle = data.readFloat64();
        const elevator = data.readFloat64() * 100;  // Convert from -1 to 1 range to -100 to 100
        const aileron = data.readFloat64() * 100;   // Convert from -1 to 1 range to -100 to 100
        const rudder = data.readFloat64() * 100;    // Convert from -1 to 1 range to -100 to 100
        const flaps = data.readFloat64();
        const gear = data.readInt32();
        const autopilotEnabled = data.readInt32();
        const autopilotAltitude = data.readFloat64();
        const autopilotHeading = data.readFloat64();
        const autopilotAirspeed = data.readFloat64();
        // Read autopilot mode states
        const altitudeHold = data.readInt32();
        const headingHold = data.readInt32();
        const airspeedHold = data.readInt32();
        const verticalSpeedHold = data.readInt32();
        const flightDirector = data.readInt32();
        const approachHold = data.readInt32();
        const backcourseHold = data.readInt32();
        const nav1Hold = data.readInt32();
        const autothrottle = data.readInt32();
        const glideslope = data.readInt32();
        const verticalSpeedTarget = data.readFloat64();
        const fuelQuantity = data.readFloat64();
        const fuelCapacity = data.readFloat64();
        const engineRPM = data.readFloat64();
        const engineRunning = data.readInt32();
        const onGround = data.readInt32();
        const stallWarning = data.readInt32();
        const overspeedWarning = data.readInt32();
        
        this.aircraftState = {
          latitude,
          longitude,
          altitude,
          altitudeAGL,
          heading,
          pitch,
          bank,
          airspeed,
          groundSpeed,
          verticalSpeed,
          throttle,
          elevator,
          aileron,
          rudder,
          flaps,
          gear: gear === 1,
          autopilot: {
            enabled: autopilotEnabled === 1,
            altitude: autopilotAltitude,
            heading: autopilotHeading,
            airspeed: autopilotAirspeed,
            // Autopilot modes
            altitudeHold: altitudeHold === 1,
            headingHold: headingHold === 1,
            airspeedHold: airspeedHold === 1,
            verticalSpeedHold: verticalSpeedHold === 1,
            flightDirector: flightDirector === 1,
            approach: approachHold === 1,
            backcourse: backcourseHold === 1,
            nav1Hold: nav1Hold === 1,
            autothrottle: autothrottle === 1,
            glideslope: glideslope === 1,
            verticalSpeed: verticalSpeedTarget,
          },
          fuel: {
            totalQuantity: fuelQuantity,
            totalCapacity: fuelCapacity,
            percentage: (fuelQuantity / fuelCapacity) * 100,
          },
          engine: {
            rpm: engineRPM,
            running: engineRunning === 1,
          },
          onGround: onGround === 1,
          stallWarning: stallWarning === 1,
          overspeedWarning: overspeedWarning === 1,
        };
        console.error("Aircraft state updated:", {
          lat: this.aircraftState.latitude.toFixed(6),
          lon: this.aircraftState.longitude.toFixed(6),
          alt: this.aircraftState.altitude.toFixed(0)
        });
      }
    });
  }

  private startDataPolling(): void {
    console.error("Starting data polling...");
    this.handle.requestDataOnSimObject(
      DATA_REQUEST_ID.AIRCRAFT_STATE,
      DATA_DEFINE_ID.AIRCRAFT_STATE,
      SimConnectConstants.OBJECT_ID_USER,
      SimConnectPeriod.VISUAL_FRAME
    );
    console.error("Initial data request sent");

    setInterval(() => {
      if (this.isConnected) {
        this.handle.requestDataOnSimObject(
          DATA_REQUEST_ID.AIRCRAFT_STATE,
          DATA_DEFINE_ID.AIRCRAFT_STATE,
          SimConnectConstants.OBJECT_ID_USER,
          SimConnectPeriod.VISUAL_FRAME
        );
      }
    }, 100);
  }

  async getAircraftState(): Promise<AircraftState> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    if (!this.aircraftState) {
      console.error("Aircraft state not available yet, waiting...");
      // Wait up to 5 seconds for initial data
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.aircraftState) {
          break;
        }
      }
      if (!this.aircraftState) {
        throw new Error("Aircraft state not available after waiting 5 seconds");
      }
    }
    return this.aircraftState;
  }

  async setThrottle(percent: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    // For FSX, we need to set the throttle position directly as a percentage
    console.error(`Setting throttle to ${percent}%`);
    try {
      // Set throttle using SimConnect variable
      await this.setSimVariable("GENERAL ENG THROTTLE LEVER POSITION:1", "percent", percent);
      if (this.aircraftState) {
        this.aircraftState.throttle = percent;
      }
    } catch (error) {
      console.error("Failed to set throttle:", error);
      throw error;
    }
  }

  async setElevator(position: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    // Elevator position: -100 to 100 maps to -1 to 1
    const normalizedPosition = position / 100;
    console.error(`Setting elevator to ${position} (normalized: ${normalizedPosition})`);
    try {
      await this.setSimVariable("ELEVATOR POSITION", "position", normalizedPosition);
      if (this.aircraftState) {
        this.aircraftState.elevator = position;  // Store original percentage value
      }
    } catch (error) {
      console.error("Failed to set elevator:", error);
      throw error;
    }
  }

  async setAileron(position: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    // Aileron position: -100 to 100 maps to -1 to 1
    const normalizedPosition = position / 100;
    console.error(`Setting aileron to ${position} (normalized: ${normalizedPosition})`);
    try {
      await this.setSimVariable("AILERON POSITION", "position", normalizedPosition);
      if (this.aircraftState) {
        this.aircraftState.aileron = position;  // Store original percentage value
      }
    } catch (error) {
      console.error("Failed to set aileron:", error);
      throw error;
    }
  }

  async setRudder(position: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    // Rudder position: -100 to 100 maps to -1 to 1
    const normalizedPosition = position / 100;
    console.error(`Setting rudder to ${position} (normalized: ${normalizedPosition})`);
    try {
      await this.setSimVariable("RUDDER POSITION", "position", normalizedPosition);
      if (this.aircraftState) {
        this.aircraftState.rudder = position;  // Store original percentage value
      }
    } catch (error) {
      console.error("Failed to set rudder:", error);
      throw error;
    }
  }

  async setFlaps(percent: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    console.error(`Setting flaps to ${percent}%`);
    try {
      await this.setSimVariable("FLAPS HANDLE PERCENT", "percent", percent);
      if (this.aircraftState) {
        this.aircraftState.flaps = percent;
      }
    } catch (error) {
      console.error("Failed to set flaps:", error);
      throw error;
    }
  }

  async setGear(down: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    const currentState = this.aircraftState?.gear || false;
    if (currentState !== down) {
      console.error(`Toggling gear (current: ${currentState}, target: ${down})`);
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.GEAR_TOGGLE,
        0,
        GROUP_ID.GROUP_0,
        0
      );
    }
  }

  async setAutopilot(enabled: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    
    // Check current state to avoid unnecessary toggles
    const currentState = this.aircraftState?.autopilot?.enabled || false;
    
    if (currentState !== enabled) {
      console.error(`Toggling autopilot from ${currentState} to ${enabled}`);
      // AP_MASTER is a toggle event, doesn't take a value
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.AP_MASTER,
        0,  // No value needed for toggle
        GROUP_ID.GROUP_0,
        0
      );
    } else {
      console.error(`Autopilot already ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  async setAutopilotAltitude(altitude: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    console.error(`Setting autopilot altitude to ${altitude} feet`);
    this.handle.transmitClientEvent(
      SimConnectConstants.OBJECT_ID_USER,
      EVENT_ID.AP_ALT_VAR_SET_ENGLISH,
      Math.round(altitude),
      GROUP_ID.GROUP_0,
      0
    );
  }

  async setAutopilotHeading(heading: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    console.error(`Setting autopilot heading to ${heading} degrees`);
    // Use HEADING_BUG_SET which is the standard event for setting the heading bug
    this.handle.transmitClientEvent(
      SimConnectConstants.OBJECT_ID_USER,
      EVENT_ID.HEADING_BUG_SET,
      Math.round(heading),
      GROUP_ID.GROUP_0,
      0
    );
  }

  async setAutopilotAirspeed(airspeed: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    console.error(`Setting autopilot airspeed to ${airspeed} knots`);
    this.handle.transmitClientEvent(
      SimConnectConstants.OBJECT_ID_USER,
      EVENT_ID.AP_SPD_VAR_SET,
      Math.round(airspeed),
      GROUP_ID.GROUP_0,
      0
    );
  }

  // Autopilot mode control methods
  async setAutopilotAltitudeHold(enabled: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    const currentState = this.aircraftState?.autopilot?.altitudeHold || false;
    if (currentState !== enabled) {
      console.error(`Toggling altitude hold from ${currentState} to ${enabled}`);
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.AP_ALT_HOLD,
        0,
        GROUP_ID.GROUP_0,
        0
      );
    }
  }

  async setAutopilotHeadingHold(enabled: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    const currentState = this.aircraftState?.autopilot?.headingHold || false;
    if (currentState !== enabled) {
      console.error(`Toggling heading hold from ${currentState} to ${enabled}`);
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.AP_HDG_HOLD,
        0,
        GROUP_ID.GROUP_0,
        0
      );
    }
  }

  async setAutopilotAirspeedHold(enabled: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    const currentState = this.aircraftState?.autopilot?.airspeedHold || false;
    if (currentState !== enabled) {
      console.error(`Toggling airspeed hold from ${currentState} to ${enabled}`);
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.AP_AIRSPEED_HOLD,
        0,
        GROUP_ID.GROUP_0,
        0
      );
    }
  }

  async setAutopilotVerticalSpeedHold(enabled: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    const currentState = this.aircraftState?.autopilot?.verticalSpeedHold || false;
    if (currentState !== enabled) {
      console.error(`Toggling vertical speed hold from ${currentState} to ${enabled}`);
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.AP_VS_HOLD,
        0,
        GROUP_ID.GROUP_0,
        0
      );
    }
  }

  async setAutopilotVerticalSpeed(fpm: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    console.error(`Setting autopilot vertical speed to ${fpm} fpm`);
    this.handle.transmitClientEvent(
      SimConnectConstants.OBJECT_ID_USER,
      EVENT_ID.AP_VS_VAR_SET_ENGLISH,
      Math.round(fpm),
      GROUP_ID.GROUP_0,
      0
    );
  }

  async setFlightDirector(enabled: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    const currentState = this.aircraftState?.autopilot?.flightDirector || false;
    if (currentState !== enabled) {
      console.error(`Toggling flight director from ${currentState} to ${enabled}`);
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.TOGGLE_FLIGHT_DIRECTOR,
        0,
        GROUP_ID.GROUP_0,
        0
      );
    }
  }

  async setAutopilotApproachHold(enabled: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    const currentState = this.aircraftState?.autopilot?.approach || false;
    if (currentState !== enabled) {
      console.error(`Toggling approach hold from ${currentState} to ${enabled}`);
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.AP_APR_HOLD,
        0,
        GROUP_ID.GROUP_0,
        0
      );
    }
  }

  async setAutopilotNav1Hold(enabled: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    const currentState = this.aircraftState?.autopilot?.nav1Hold || false;
    if (currentState !== enabled) {
      console.error(`Toggling NAV1 hold from ${currentState} to ${enabled}`);
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.AP_NAV1_HOLD,
        0,
        GROUP_ID.GROUP_0,
        0
      );
    }
  }

  async setAutothrottle(enabled: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    const currentState = this.aircraftState?.autopilot?.autothrottle || false;
    if (currentState !== enabled) {
      console.error(`Toggling autothrottle from ${currentState} to ${enabled}`);
      this.handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        EVENT_ID.AUTO_THROTTLE_ARM,
        0,
        GROUP_ID.GROUP_0,
        0
      );
    }
  }

  async getNearbyAirports(radius: number): Promise<Airport[]> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }
    
    // Wait for aircraft state if not available
    if (!this.aircraftState) {
      console.error("Aircraft state not available, waiting...");
      await this.getAircraftState(); // This will wait for state
    }

    // First, try to use RequestFacilitiesList if available
    try {
      console.error("Attempting to request facilities list from SimConnect...");
      
      return new Promise((resolve) => {
        this.pendingAirports = [];
        this.airportListResolver = resolve;
        
        // Try different methods to get airports
        let methodTried = false;
        
        // Method 1: Try requestFacilitiesList
        if (this.handle.requestFacilitiesList) {
          try {
            console.error("Trying requestFacilitiesList...");
            this.handle.requestFacilitiesList(
              FACILITY_LIST_TYPE.AIRPORT,
              DATA_REQUEST_ID.AIRPORT_LIST
            );
            methodTried = true;
          } catch (error) {
            console.error("requestFacilitiesList failed:", error);
          }
        }
        
        // Method 2: Try subscribeToFacilities
        if (!methodTried && this.handle.subscribeToFacilities) {
          try {
            console.error("Trying subscribeToFacilities...");
            this.handle.subscribeToFacilities(
              FACILITY_LIST_TYPE.AIRPORT
            );
            methodTried = true;
          } catch (error) {
            console.error("subscribeToFacilities failed:", error);
          }
        }
        
        if (methodTried) {
          // Set timeout for facility response
          setTimeout(() => {
            if (this.airportListResolver) {
              console.error("Facility request timed out, using fallback airports");
              const fallback = this.getFallbackAirports(radius);
              this.airportListResolver = null;
              resolve(fallback);
            }
          }, 3000);
        } else {
          console.error("No facility methods available, using fallback airports");
          const fallback = this.getFallbackAirports(radius);
          resolve(fallback);
        }
      });
    } catch (error) {
      console.error("Error requesting facilities:", error);
      return this.getFallbackAirports(radius);
    }
  }
  
  private getFallbackAirports(radius: number): Airport[] {
    // Fallback to hardcoded list if facility API is not available
    const airports = [
      { icao: "KSEA", name: "Seattle-Tacoma International", latitude: 47.449, longitude: -122.309, altitude: 433 },
      { icao: "KBFI", name: "Boeing Field", latitude: 47.530, longitude: -122.302, altitude: 21 },
      { icao: "KPAE", name: "Paine Field", latitude: 47.906, longitude: -122.282, altitude: 606 },
      { icao: "KRNT", name: "Renton Municipal", latitude: 47.493, longitude: -122.216, altitude: 32 },
      { icao: "KSHN", name: "Sanderson Field", latitude: 47.234, longitude: -122.938, altitude: 270 },
      { icao: "KLAX", name: "Los Angeles International", latitude: 33.942, longitude: -118.408, altitude: 125 },
      { icao: "KJFK", name: "John F Kennedy International", latitude: 40.640, longitude: -73.779, altitude: 13 },
      { icao: "KORD", name: "Chicago O'Hare International", latitude: 41.978, longitude: -87.905, altitude: 680 },
      { icao: "KATL", name: "Hartsfield-Jackson Atlanta International", latitude: 33.636, longitude: -84.428, altitude: 1026 },
      { icao: "KDEN", name: "Denver International", latitude: 39.862, longitude: -104.673, altitude: 5431 },
      { icao: "KDFW", name: "Dallas/Fort Worth International", latitude: 32.897, longitude: -97.038, altitude: 607 },
      { icao: "KLAS", name: "Las Vegas McCarran International", latitude: 36.080, longitude: -115.152, altitude: 2181 },
      { icao: "KMIA", name: "Miami International", latitude: 25.793, longitude: -80.291, altitude: 8 },
      { icao: "KPHX", name: "Phoenix Sky Harbor International", latitude: 33.434, longitude: -112.012, altitude: 1135 },
      { icao: "KSFO", name: "San Francisco International", latitude: 37.619, longitude: -122.375, altitude: 13 },
    ];

    const currentLat = this.aircraftState!.latitude;
    const currentLon = this.aircraftState!.longitude;
    
    console.error(`Current position: ${currentLat}, ${currentLon}`);
    console.error(`Searching for airports within ${radius} nm`);

    const airportsWithDistance = airports
      .map(airport => {
        const distance = this.calculateDistance(
          currentLat,
          currentLon,
          airport.latitude,
          airport.longitude
        );
        const bearing = this.calculateBearing(
          currentLat,
          currentLon,
          airport.latitude,
          airport.longitude
        );
        return { ...airport, distance, bearing };
      })
      .filter(airport => airport.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
      
    console.error(`Found ${airportsWithDistance.length} airports within ${radius} nm`);
    
    return airportsWithDistance;
  }
  
  private calculateAirportDistances(): void {
    if (!this.aircraftState) {
      console.error("Cannot calculate distances - no aircraft state");
      return;
    }
    
    const currentLat = this.aircraftState.latitude;
    const currentLon = this.aircraftState.longitude;
    
    this.pendingAirports = this.pendingAirports.map(airport => {
      const distance = this.calculateDistance(
        currentLat,
        currentLon,
        airport.latitude,
        airport.longitude
      );
      const bearing = this.calculateBearing(
        currentLat,
        currentLon,
        airport.latitude,
        airport.longitude
      );
      return { ...airport, distance, bearing };
    }).sort((a, b) => a.distance - b.distance);
    
    console.error(`Calculated distances for ${this.pendingAirports.length} airports`);
  }

  async getWeather(): Promise<WeatherData> {
    if (!this.isConnected) {
      throw new Error("Not connected to FSX");
    }

    return new Promise((resolve) => {
      const handler = (recvSimObjectData: any) => {
        if (recvSimObjectData.requestID === DATA_REQUEST_ID.WEATHER) {
          const data = recvSimObjectData.data as RawBuffer;
          
          const visibility = data.readFloat64();
          const windSpeed = data.readFloat64();
          const windDirection = data.readFloat64();
          const temperature = data.readFloat64();
          const pressure = data.readFloat64();
          const precipState = data.readInt32();
          
          let precipitation = "None";
          if (precipState & 2) precipitation = "Rain";
          if (precipState & 4) precipitation = "Snow";

          resolve({
            visibility: visibility * 0.000621371,
            windSpeed,
            windDirection,
            temperature,
            pressure,
            precipitation,
          });
          this.handle.off("simObjectData", handler);
        }
      };

      this.handle.on("simObjectData", handler);
      this.handle.requestDataOnSimObject(
        DATA_REQUEST_ID.WEATHER,
        DATA_DEFINE_ID.WEATHER,
        SimConnectConstants.OBJECT_ID_USER,
        SimConnectPeriod.ONCE
      );
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRad(lat2));
    const x =
      Math.cos(this.toRad(lat1)) * Math.sin(this.toRad(lat2)) -
      Math.sin(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.cos(dLon);
    const bearing = this.toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private toDeg(radians: number): number {
    return (radians * 180) / Math.PI;
  }
  
  private processAirportData(data: any): void {
    try {
      console.error("Processing airport data:", JSON.stringify(data));
      
      // Handle different data formats
      const airport: Airport = {
        icao: data.Icao || data.icao || data.ICAO || "UNKN",
        name: data.Name || data.name || "Unknown Airport",
        latitude: data.Latitude || data.latitude || data.lat || 0,
        longitude: data.Longitude || data.longitude || data.lon || 0,
        altitude: data.Altitude || data.altitude || data.alt || 0,
        distance: 0,
        bearing: 0
      };
      
      // Only add if we have valid coordinates
      if (airport.latitude !== 0 || airport.longitude !== 0) {
        this.pendingAirports.push(airport);
        console.error(`Added airport: ${airport.icao} at ${airport.latitude}, ${airport.longitude}`);
      }
      
      // Check various completion indicators
      const isLast = (data.dwEntryNumber === data.dwOutOf - 1) ||
                     (data.entryNumber === data.outOf - 1) ||
                     (data.index === data.total - 1);
                     
      if (isLast || this.pendingAirports.length >= 10) {
        console.error(`Processing ${this.pendingAirports.length} airports`);
        if (this.airportListResolver) {
          this.calculateAirportDistances();
          const filtered = this.pendingAirports.filter(apt => 
            apt.latitude !== 0 || apt.longitude !== 0
          );
          this.airportListResolver(filtered);
          this.airportListResolver = null;
          this.pendingAirports = [];
        }
      }
    } catch (error) {
      console.error("Error processing airport data:", error);
    }
  }
  
  private async setSimVariable(name: string, unit: string, value: number): Promise<void> {
    try {
      console.error(`Setting SimVar: ${name} = ${value} ${unit}`);
      
      // For node-simconnect, we need to use the correct event mapping
      // Let's use the transmitClientEvent with the proper event IDs
      switch (name) {
        case "GENERAL ENG THROTTLE LEVER POSITION:1":
          // Throttle uses 0-16383 range
          const throttleValue = Math.round((value / 100) * 16383);
          this.handle.transmitClientEvent(
            SimConnectConstants.OBJECT_ID_USER,
            EVENT_ID.THROTTLE_SET,
            throttleValue,
            GROUP_ID.GROUP_0,
            0
          );
          break;
          
        case "ELEVATOR POSITION":
          // Elevator uses -16383 to 16383
          const elevatorValue = Math.round(value * 16383);
          this.handle.transmitClientEvent(
            SimConnectConstants.OBJECT_ID_USER,
            EVENT_ID.ELEVATOR_SET,
            elevatorValue,
            GROUP_ID.GROUP_0,
            0
          );
          break;
          
        case "AILERON POSITION":
          // Aileron uses -16383 to 16383
          const aileronValue = Math.round(value * 16383);
          this.handle.transmitClientEvent(
            SimConnectConstants.OBJECT_ID_USER,
            EVENT_ID.AILERON_SET,
            aileronValue,
            GROUP_ID.GROUP_0,
            0
          );
          break;
          
        case "RUDDER POSITION":
          // Rudder uses -16383 to 16383
          const rudderValue = Math.round(value * 16383);
          this.handle.transmitClientEvent(
            SimConnectConstants.OBJECT_ID_USER,
            EVENT_ID.RUDDER_SET,
            rudderValue,
            GROUP_ID.GROUP_0,
            0
          );
          break;
          
        case "FLAPS HANDLE PERCENT":
          // Flaps use 0-16383
          const flapsValue = Math.round((value / 100) * 16383);
          this.handle.transmitClientEvent(
            SimConnectConstants.OBJECT_ID_USER,
            EVENT_ID.FLAPS_SET,
            flapsValue,
            GROUP_ID.GROUP_0,
            0
          );
          break;
          
        default:
          console.error(`Unknown SimVar: ${name}`);
          throw new Error(`Cannot set SimVar: ${name}`);
      }
    } catch (error) {
      console.error("setSimVariable error:", error);
      throw error;
    }
  }
}