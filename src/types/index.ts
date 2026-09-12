export type FormationType = 'sphere' | 'grid' | 'helix' | 'line' | 'ring' | 'diamond' | 'image';

export type SwarmState = 'IDLE' | 'ASSEMBLING' | 'NAVIGATING' | 'COMPLETED';

export interface Waypoint {
  id: string;
  position: [number, number, number];
  label?: string;
  speed?: number;
  holdTime?: number;
}

export interface Obstacle {
  id: string;
  position: [number, number, number];
  radius: number;
  type?: 'sphere' | 'box';
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  summary: string;
  droneCount: number;
  formation: FormationType;
  waypoints: Waypoint[];
  obstacles: Obstacle[];
  bounds: [number, number, number];
}

export interface SavedMission {
  id: string;
  name: string;
  createdAt: number;
  droneCount: number;
  formation: FormationType;
  imageFormationPoints: [number, number, number][];
  imageFormationName: string | null;
  imageFormationPreview: string | null;
  maxVelocity: number;
  safeDistance: number;
  waypoints: Waypoint[];
  obstacles: Obstacle[];
  bounds: [number, number, number];
}

export interface DroneState {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  target: [number, number, number];
  color: string;
  battery: number; // 0 to 1
}

export interface TelemetrySample {
  timestamp: number;
  assemblyError: number;
  speed: number;
  altitude: number;
  progress: number;
}

export interface SimulationState {
  // Swarm Configuration
  droneCount: number;
  maxVelocity: number;
  safeDistance: number;
  formationTransitionSpeed: number;
  
  // Active State & Pipeline
  currentFormation: FormationType;
  currentScenario: string;
  currentMissionName: string | null;
  savedMissions: SavedMission[];
  imageFormationPoints: [number, number, number][];
  imageFormationName: string | null;
  imageFormationPreview: string | null;
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
  telemetryHistory: TelemetrySample[];
  
  // Visual & Geofence Bounds
  bounds: [number, number, number]; // [width, height, depth]
  showDebugVisuals: boolean;
  showTrails: boolean;
  showVelocityVectors: boolean;
  cameraFollow: boolean;
}

export interface TelemetryData {
  fps: number;
  activeDrones: number;
  averageBattery: number;
  collisionRisk: number; // 0 to 1
  averageVelocity: number;
}
