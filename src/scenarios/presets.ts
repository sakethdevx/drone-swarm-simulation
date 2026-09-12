import type { ScenarioDefinition } from '../types';

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'open-sky',
    name: 'Open sky',
    summary: 'Clean formation rehearsal with a long cruise route.',
    droneCount: 100,
    formation: 'sphere',
    waypoints: [
      { id: 'open-start', label: 'Launch pad', position: [0, 20, 0] },
      { id: 'open-mid', label: 'Cruise gate', position: [0, 24, 60] },
      { id: 'open-end', label: 'Show mark', position: [30, 28, 110] },
    ],
    obstacles: [],
    bounds: [140, 110, 240],
  },
  {
    id: 'urban-corridor',
    name: 'Urban corridor',
    summary: 'Ring formation route through a dense obstacle corridor.',
    droneCount: 80,
    formation: 'ring',
    waypoints: [
      { id: 'urban-start', label: 'Staging area', position: [-50, 24, -20] },
      { id: 'urban-mid', label: 'Central avenue', position: [0, 30, 55] },
      { id: 'urban-end', label: 'Rooftop mark', position: [45, 34, 120] },
    ],
    obstacles: [
      { id: 'urban-1', position: [-20, 18, 25], radius: 10, type: 'box' },
      { id: 'urban-2', position: [25, 24, 65], radius: 12, type: 'box' },
      { id: 'urban-3', position: [-30, 20, 95], radius: 9, type: 'sphere' },
    ],
    bounds: [150, 120, 260],
  },
  {
    id: 'mountain-pass',
    name: 'Mountain pass',
    summary: 'Diamond formation with high-altitude clearance challenges.',
    droneCount: 120,
    formation: 'diamond',
    waypoints: [
      { id: 'mountain-start', label: 'Valley entry', position: [-60, 35, 0] },
      { id: 'mountain-mid', label: 'Pass ascent', position: [0, 65, 75] },
      { id: 'mountain-end', label: 'Summit mark', position: [55, 48, 145] },
    ],
    obstacles: [
      { id: 'mountain-1', position: [-25, 42, 45], radius: 18, type: 'sphere' },
      { id: 'mountain-2', position: [30, 52, 105], radius: 16, type: 'sphere' },
    ],
    bounds: [180, 150, 300],
  },
];