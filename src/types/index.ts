export type FormationType = 'sphere' | 'grid' | 'v-shape' | 'helix';

export interface Waypoint {
  id: string;
  position: [number, number, number];
}

export interface DroneState {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  target: [number, number, number];
  color: string;
  battery: number; // 0 to 1
}

export interface SimulationState {
  // Swarm Configuration
  droneCount: number;
  maxVelocity: number;
  safeDistance: number;
  formationTransitionSpeed: number;
  
  // Active State
  currentFormation: FormationType;
  drones: DroneState[];
  waypoints: Waypoint[];
  
  // Timeline Control
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  
  // Geofence / Bounds
  bounds: [number, number, number]; // [width, height, depth]
  
  // Telemetry
  fps: number;
  activeAlerts: string[];
}

export interface TelemetryData {
  fps: number;
  activeDrones: number;
  averageBattery: number;
  collisionRisk: number; // 0 to 1
  averageVelocity: number;
}
