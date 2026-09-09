import { create } from 'zustand';
import type { SimulationState, DroneState, FormationType, Waypoint } from '../types';

interface SimulationActions {
  setDroneCount: (count: number) => void;
  setFormation: (formation: FormationType) => void;
  setWaypoints: (waypoints: Waypoint[]) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  clearWaypoints: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setDrones: (drones: DroneState[]) => void;
  updateDronePositions: (_positions: Float32Array) => void; // for high perf worker updates
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

export const useSimulationStore = create<SimulationStore>((set) => ({
  // Initial State
  droneCount: 100,
  maxVelocity: 10.0,
  safeDistance: 2.0,
  formationTransitionSpeed: 1.0,
  currentFormation: 'sphere',
  drones: initialDrones(100),
  waypoints: [],
  isPlaying: false,
  playbackSpeed: 1.0,
  currentTime: 0,
  bounds: [100, 100, 100],
  fps: 0,
  activeAlerts: [],

  // Actions
  setDroneCount: (count: number) => set({ droneCount: count, drones: initialDrones(count) }),
  setFormation: (formation: FormationType) => set({ currentFormation: formation }),
  setWaypoints: (waypoints: Waypoint[]) => set({ waypoints }),
  addWaypoint: (waypoint: Waypoint) => set((state) => ({ waypoints: [...state.waypoints, waypoint] })),
  clearWaypoints: () => set({ waypoints: [] }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),
  setDrones: (drones: DroneState[]) => set({ drones }),
  updateDronePositions: (_positions: Float32Array) => {
    // This action might be optimized later or handled differently to avoid React re-renders on 60fps
    // E.g., we might just pass a ref to the InstancedMesh for true high-perf
  },
}));
