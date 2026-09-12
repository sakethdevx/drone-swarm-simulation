import { create } from 'zustand';
import type { SimulationState, FormationType, Waypoint, SwarmState, Obstacle, TelemetrySample, ScenarioDefinition, SavedMission, ImageFormationPoint } from '../types';

const MISSIONS_STORAGE_KEY = 'drone-simulation-missions';

const readSavedMissions = (): SavedMission[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(MISSIONS_STORAGE_KEY);
    return saved ? JSON.parse(saved) as SavedMission[] : [];
  } catch {
    return [];
  }
};

const persistSavedMissions = (missions: SavedMission[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missions));
  }
};

interface SimulationActions {
  setDroneCount: (count: number) => void;
  setFormation: (formation: FormationType) => void;
  loadScenario: (scenario: ScenarioDefinition) => void;
  saveMission: (name: string) => void;
  loadMission: (id: string) => void;
  deleteMission: (id: string) => void;
  setImageFormation: (points: ImageFormationPoint[], name: string, preview: string, droneCount: number) => void;
  clearImageFormation: () => void;
  setSwarmState: (swarmState: SwarmState) => void;
  setSwarmCenterPosition: (pos: [number, number, number]) => void;
  setSwarmCenterVelocity: (vel: [number, number, number]) => void;
  setAssemblyError: (err: number) => void;
  setMaxVelocity: (velocity: number) => void;
  setSafeDistance: (distance: number) => void;
  resetMission: () => void;
  setWaypoints: (waypoints: Waypoint[]) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  removeWaypoint: (id: string) => void;
  moveWaypoint: (id: string, direction: 'up' | 'down') => void;
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
  recordTelemetrySample: (sample: TelemetrySample) => void;
  toggleDebugVisuals: () => void;
  toggleTrails: () => void;
  toggleVelocityVectors: () => void;
  toggleCameraFollow: () => void;
}

export type SimulationStore = SimulationState & SimulationActions;

export const useSimulationStore = create<SimulationStore>((set) => ({
  // Initial State
  droneCount: 100,
  maxVelocity: 10.0,
  safeDistance: 2.5,
  formationTransitionSpeed: 1.0,
  currentFormation: 'sphere',
  currentScenario: 'open-sky',
  currentMissionName: null,
  savedMissions: readSavedMissions(),
  imageFormationPoints: [],
  imageFormationName: null,
  imageFormationPreview: null,
  swarmState: 'IDLE',
  swarmCenterPosition: [0, 20, 0],
  swarmCenterVelocity: [0, 0, 0],
  assemblyError: 99.0,
  
  waypoints: [
    { id: 'wp-start', position: [0, 20, 0] },
    { id: 'wp-mid', position: [0, 20, 60] },
    { id: 'wp-end', position: [30, 25, 100] }
  ],
  obstacles: [],
  selectedObstacleId: null,
  
  isPlaying: false,
  playbackSpeed: 1.0,
  currentTime: 0,
  telemetryHistory: [],
  bounds: [120, 100, 200],
  showDebugVisuals: true,
  showTrails: true,
  showVelocityVectors: false,
  cameraFollow: false,

  // Actions
  // Pause playback when count changes so drones can re-assemble in the new formation.
  setDroneCount: (count: number) => set({ droneCount: count, swarmState: 'ASSEMBLING', isPlaying: false }),
  
  // Rule 1: Changing formation immediately resets swarmState to ASSEMBLING
  setFormation: (formation: FormationType) => set({ currentFormation: formation, swarmState: 'ASSEMBLING' }),
  loadScenario: (scenario) => set({
    currentScenario: scenario.id,
    droneCount: scenario.droneCount,
    currentFormation: scenario.formation,
    waypoints: scenario.waypoints,
    obstacles: scenario.obstacles,
    bounds: scenario.bounds,
    selectedObstacleId: null,
    swarmState: 'ASSEMBLING',
    isPlaying: false,
    currentTime: 0,
    telemetryHistory: [],
    assemblyError: 99.0,
    swarmCenterPosition: scenario.waypoints[0]?.position ?? [0, 20, 0],
    swarmCenterVelocity: [0, 0, 0],
  }),
  saveMission: (name) => set((state) => {
    const trimmedName = name.trim();
    if (!trimmedName) return state;

    const mission: SavedMission = {
      id: crypto.randomUUID(),
      name: trimmedName,
      createdAt: Date.now(),
      droneCount: state.droneCount,
      formation: state.currentFormation,
      imageFormationPoints: state.imageFormationPoints,
      imageFormationName: state.imageFormationName,
      imageFormationPreview: state.imageFormationPreview,
      maxVelocity: state.maxVelocity,
      safeDistance: state.safeDistance,
      waypoints: state.waypoints,
      obstacles: state.obstacles,
      bounds: state.bounds,
    };
    const savedMissions = [...state.savedMissions, mission];
    persistSavedMissions(savedMissions);
    return { savedMissions, currentMissionName: trimmedName };
  }),
  loadMission: (id) => set((state) => {
    const mission = state.savedMissions.find((saved) => saved.id === id);
    if (!mission) return state;
    return {
      currentMissionName: mission.name,
      currentScenario: 'custom',
      droneCount: mission.droneCount,
      currentFormation: mission.formation,
      imageFormationPoints: mission.imageFormationPoints,
      imageFormationName: mission.imageFormationName,
      imageFormationPreview: mission.imageFormationPreview,
      maxVelocity: mission.maxVelocity,
      safeDistance: mission.safeDistance,
      waypoints: mission.waypoints,
      obstacles: mission.obstacles,
      bounds: mission.bounds,
      selectedObstacleId: null,
      swarmState: 'ASSEMBLING',
      isPlaying: false,
      currentTime: 0,
      telemetryHistory: [],
      assemblyError: 99.0,
      swarmCenterPosition: mission.waypoints[0]?.position ?? [0, 20, 0],
      swarmCenterVelocity: [0, 0, 0],
    };
  }),
  deleteMission: (id) => set((state) => {
    const savedMissions = state.savedMissions.filter((mission) => mission.id !== id);
    persistSavedMissions(savedMissions);
    return { savedMissions };
  }),
  setImageFormation: (points, name, preview, droneCount) => set({
    imageFormationPoints: points,
    imageFormationName: name,
    imageFormationPreview: preview,
    droneCount,
    currentFormation: 'image',
    swarmState: 'ASSEMBLING',
  }),
  clearImageFormation: () => set({
    imageFormationPoints: [],
    imageFormationName: null,
    imageFormationPreview: null,
    currentFormation: 'sphere',
    swarmState: 'ASSEMBLING',
  }),
  
  setSwarmState: (swarmState: SwarmState) => set({ swarmState }),
  setSwarmCenterPosition: (pos: [number, number, number]) => set({ swarmCenterPosition: pos }),
  setSwarmCenterVelocity: (vel: [number, number, number]) => set({ swarmCenterVelocity: vel }),
  setAssemblyError: (err: number) => set({ assemblyError: err }),
    setMaxVelocity: (velocity: number) => set({ maxVelocity: Math.max(1, Math.min(30, velocity)) }),
    setSafeDistance: (distance: number) => set({ safeDistance: Math.max(1, Math.min(10, distance)) }),
    resetMission: () => set((state) => ({
      swarmState: 'IDLE',
      isPlaying: false,
      currentTime: 0,
      assemblyError: 99.0,
      swarmCenterPosition: state.waypoints[0]?.position ?? [0, 20, 0],
      swarmCenterVelocity: [0, 0, 0],
    })),
  
  setWaypoints: (waypoints: Waypoint[]) => set({ waypoints, swarmState: 'ASSEMBLING' }),
  addWaypoint: (waypoint: Waypoint) => set((state) => ({ waypoints: [...state.waypoints, waypoint], swarmState: 'ASSEMBLING' })),
  updateWaypoint: (id, updates) => set((state) => ({
    waypoints: state.waypoints.map((waypoint) => waypoint.id === id
      ? { ...waypoint, ...updates }
      : waypoint),
    swarmState: 'ASSEMBLING',
  })),
  removeWaypoint: (id) => set((state) => ({
    waypoints: state.waypoints.filter((waypoint) => waypoint.id !== id),
    swarmState: 'ASSEMBLING',
  })),
  moveWaypoint: (id, direction) => set((state) => {
    const index = state.waypoints.findIndex((waypoint) => waypoint.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= state.waypoints.length) {
      return state;
    }

    const waypoints = [...state.waypoints];
    [waypoints[index], waypoints[targetIndex]] = [waypoints[targetIndex], waypoints[index]];
    return { waypoints, swarmState: 'ASSEMBLING' };
  }),
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
  
  // Note: currentTime is stored for future timeline scrubbing UI. The path navigator
  // uses an internal progressRef — wiring currentTime to it is a future enhancement.
  setCurrentTime: (time: number) => set({ currentTime: time }),
  recordTelemetrySample: (sample) => set((state) => ({
    telemetryHistory: [...state.telemetryHistory.slice(-59), sample],
  })),
  
  toggleDebugVisuals: () => set((state) => ({ showDebugVisuals: !state.showDebugVisuals })),
  toggleTrails: () => set((state) => ({ showTrails: !state.showTrails })),
  toggleVelocityVectors: () => set((state) => ({ showVelocityVectors: !state.showVelocityVectors })),
  toggleCameraFollow: () => set((state) => ({ cameraFollow: !state.cameraFollow })),
}));
