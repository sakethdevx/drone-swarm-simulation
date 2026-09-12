export type FormationType = 'sphere' | 'grid' | 'v-shape' | 'helix';

export type SwarmState = 'IDLE' | 'ASSEMBLING' | 'NAVIGATING' | 'COMPLETED';

export interface Waypoint {
  id: string;
  position: [number, number, number];
}

export interface Obstacle {
  id: string;
  position: [number, number, number];
  radius: number;
  type?: 'sphere' | 'box';
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
  
  // Active State & Pipeline
  currentFormation: FormationType;
  swarmState: SwarmState;
  swarmCenterPosition: [number, number, number];
  swarmCenterVelocity: [number, number, number];
  assemblyError: number;
  
  drones?: never; // Removed: drone positions are tracked in Float32Array buffers in DroneSwarm.tsx
  waypoints: Waypoint[];
  obstacles: Obstacle[];
  selectedObstacleId: string | null;
  
  // Timeline Control
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  
  // Visual & Geofence Bounds
  bounds: [number, number, number]; // [width, height, depth]
  showDebugVisuals: boolean;
  
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
