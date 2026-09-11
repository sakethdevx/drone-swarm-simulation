import { create } from 'zustand';
import type { SimulationState, DroneState, FormationType, Waypoint, SwarmState, Obstacle } from '../types';

interface SimulationActions {
  setDroneCount: (count: number) => void;
  setFormation: (formation: FormationType) => void;
  setSwarmState: (swarmState: SwarmState) => void;
  setSwarmCenterPosition: (pos: [number, number, number]) => void;
  setSwarmCenterVelocity: (vel: [number, number, number]) => void;
  setAssemblyError: (err: number) => void;
  setWaypoints: (waypoints: Waypoint[]) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  clearWaypoints: () => void;
  addObstacle: (obstacle: Obstacle) => void;
  removeObstacle: (id: string) => void;
  updateObstaclePosition: (id: string, position: [number, number, number]) => void;
  updateObstacleRadius: (id: string, radius: number) => void;
  selectObstacle: (id: string | null) => void;
  clearAllObstacles: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setCurrentTime: (time: number) => void;
  toggleDebugVisuals: () => void;
  setDrones: (drones: DroneState[]) => void;
  updateDronePositions: (_positions: Float32Array) => void;
}

export type SimulationStore = SimulationState & SimulationActions;

const initialDrones = (count: number): DroneState[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50],
    velocity: [0, 0, 0],
    target: [0, 0, 0],
    color: '#3b82f6',
    battery: 1.0,
  }));
};

const defaultObstacles: Obstacle[] = [];

export const useSimulationStore = create<SimulationStore>((set) => ({
  // Initial State
  droneCount: 100,
  maxVelocity: 10.0,
  safeDistance: 2.5,
  formationTransitionSpeed: 1.0,
  currentFormation: 'sphere',
  swarmState: 'IDLE',
  swarmCenterPosition: [0, 20, 0],
  swarmCenterVelocity: [0, 0, 0],
  assemblyError: 99.0,
  
  drones: initialDrones(100),
  waypoints: [
    { id: 'wp-start', position: [0, 20, 0] },
    { id: 'wp-mid', position: [0, 20, 60] },
    { id: 'wp-end', position: [30, 25, 100] }
  ],
  obstacles: defaultObstacles,
  selectedObstacleId: null,
  
  isPlaying: false,
  playbackSpeed: 1.0,
  currentTime: 0,
  bounds: [120, 100, 200],
  showDebugVisuals: true,
  fps: 0,
  activeAlerts: [],

  // Actions
  setDroneCount: (count: number) => set({ droneCount: count, drones: initialDrones(count), swarmState: 'ASSEMBLING' }),
  
  // Rule 1: Changing formation immediately resets swarmState to ASSEMBLING
  setFormation: (formation: FormationType) => set({ currentFormation: formation, swarmState: 'ASSEMBLING' }),
  
  setSwarmState: (swarmState: SwarmState) => set({ swarmState }),
  setSwarmCenterPosition: (pos: [number, number, number]) => set({ swarmCenterPosition: pos }),
  setSwarmCenterVelocity: (vel: [number, number, number]) => set({ swarmCenterVelocity: vel }),
  setAssemblyError: (err: number) => set({ assemblyError: err }),
  
  setWaypoints: (waypoints: Waypoint[]) => set({ waypoints, swarmState: 'ASSEMBLING' }),
  addWaypoint: (waypoint: Waypoint) => set((state) => ({ waypoints: [...state.waypoints, waypoint] })),
  clearWaypoints: () => set({ waypoints: [], swarmState: 'IDLE' }),
  
  addObstacle: (obstacle: Obstacle) => set((state) => ({ obstacles: [...state.obstacles, obstacle] })),
  removeObstacle: (id: string) => set((state) => ({ 
    obstacles: state.obstacles.filter(o => o.id !== id),
    selectedObstacleId: state.selectedObstacleId === id ? null : state.selectedObstacleId
  })),
  updateObstaclePosition: (id, position) => set(state => ({
    obstacles: state.obstacles.map(o => o.id === id ? { ...o, position } : o)
  })),
  updateObstacleRadius: (id, radius) => set(state => ({
    obstacles: state.obstacles.map(o => o.id === id ? { ...o, radius } : o)
  })),
  selectObstacle: (id) => set({ selectedObstacleId: id }),
  clearAllObstacles: () => set({ obstacles: [], selectedObstacleId: null }),
  
  // Toggle Playback: when starting play, transition to ASSEMBLING unless already NAVIGATING
  togglePlayback: () => set((state) => {
    const nextPlaying = !state.isPlaying;
    let nextState = state.swarmState;
    if (nextPlaying && (state.swarmState === 'IDLE' || state.swarmState === 'COMPLETED')) {
      nextState = 'ASSEMBLING';
    }
    return { isPlaying: nextPlaying, swarmState: nextState };
  }),
  
  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),
  
  // Rule 1: Scrubbing timeline resets to ASSEMBLING
  setCurrentTime: (time: number) => set({ currentTime: time, swarmState: 'ASSEMBLING' }),
  
  toggleDebugVisuals: () => set((state) => ({ showDebugVisuals: !state.showDebugVisuals })),
  
  setDrones: (drones: DroneState[]) => set({ drones }),
  updateDronePositions: (_positions: Float32Array) => {},
}));
