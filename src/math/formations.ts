import type { FormationType } from '../types';

type Vector3 = [number, number, number];

export const generateFormation = (type: FormationType, count: number, center: Vector3 = [0, 0, 0]): Vector3[] => {
  switch (type) {
    case 'sphere':
      return generateSphere(count, center);
    case 'grid':
      return generateGrid(count, center);
    case 'v-shape':
      return generateVShape(count, center);
    case 'helix':
      return generateHelix(count, center);
    default:
      return generateSphere(count, center);
  }
};

export const rotateVectorHeading = (offset: Vector3, heading: Vector3): Vector3 => {
  const hLengthSq = heading[0] * heading[0] + heading[2] * heading[2];
  if (hLengthSq < 0.0001) {
    return offset;
  }
  
  // Angle relative to default forward [0, 0, 1]
  const angle = Math.atan2(heading[0], heading[2]);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const [ox, oy, oz] = offset;
  return [
    ox * cos + oz * sin,
    oy,
    -ox * sin + oz * cos,
  ];
};

const generateSphere = (count: number, center: Vector3): Vector3[] => {
  const points: Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle in radians

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2; // y goes from 1 to -1
    const radius = Math.sqrt(Math.max(0, 1 - y * y));

    const theta = phi * i;

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    const scale = Math.max(8, Math.pow(count, 0.4) * 2.5);
    
    points.push([
      center[0] + x * scale,
      center[1] + y * scale,
      center[2] + z * scale,
    ]);
  }
  return points;
};

const generateGrid = (count: number, center: Vector3): Vector3[] => {
  const points: Vector3[] = [];
  const size = Math.ceil(Math.pow(count, 1/3)); // Cube root for 3D grid
  const spacing = 3.5;
  
  const offset = (size - 1) * spacing / 2.0;

  // Labeled break exits all three loops as soon as count is reached,
  // avoiding wasted iterations through the rest of the grid.
  outer: for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        if (points.length >= count) break outer;
        points.push([
          center[0] + (x * spacing) - offset,
          center[1] + (y * spacing) - offset,
          center[2] + (z * spacing) - offset,
        ]);
      }
    }
  }
  return points;
};

const generateVShape = (count: number, center: Vector3): Vector3[] => {
  const points: Vector3[] = [];
  const spacing = 3.0;
  const angle = Math.PI / 6; // 30 degrees half-angle
  
  // Leader at front
  points.push([center[0], center[1], center[2] + 5]);
  
  let added = 1;
  let row = 1;
  
  while (added < count) {
    // Left wing — deterministic Y offset alternating by row (no Math.random)
    if (added < count) {
      const yOffset = (row % 2 === 0) ? 0.3 : -0.3;
      points.push([
        center[0] - Math.sin(angle) * row * spacing,
        center[1] + yOffset,
        center[2] + 5 - Math.cos(angle) * row * spacing,
      ]);
      added++;
    }
    // Right wing
    if (added < count) {
      const yOffset = (row % 2 === 0) ? -0.3 : 0.3;
      points.push([
        center[0] + Math.sin(angle) * row * spacing,
        center[1] + yOffset,
        center[2] + 5 - Math.cos(angle) * row * spacing,
      ]);
      added++;
    }
    
    // Add inner filling if count is large
    if (row > 2) {
      for (let i = 1; i < row; i++) {
        if (added >= count) break;
        points.push([
          center[0] - Math.sin(angle) * (row - i) * spacing + Math.sin(angle) * i * spacing,
          center[1] - i * 1.0,
          center[2] + 5 - Math.cos(angle) * row * spacing,
        ]);
        added++;
      }
    }
    
    row++;
  }
  return points;
};

const generateHelix = (count: number, center: Vector3): Vector3[] => {
  const points: Vector3[] = [];
  const radius = 12.0;
  const height = 30.0;
  const turns = 3;
  
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const angle = t * Math.PI * 2 * turns;
    
    points.push([
      center[0] + Math.cos(angle) * radius,
      center[1] - height / 2 + t * height,
      center[2] + Math.sin(angle) * radius,
    ]);
  }
  return points;
};

// Greedy nearest neighbor assignment to minimize crossing paths.
// Uses a Uint8Array used-set instead of splice() to avoid O(n³) complexity.
// Complexity: O(n²) — acceptable for n ≤ 500.
export const matchTargetsGreedy = (currentPos: Float32Array, targets: Vector3[]): Vector3[] => {
  const count = targets.length;
  const matchedTargets: Vector3[] = new Array(count);
  const used = new Uint8Array(count); // 0 = available, 1 = taken
  
  for (let i = 0; i < count; i++) {
    const px = currentPos[i * 3];
    const py = currentPos[i * 3 + 1];
    const pz = currentPos[i * 3 + 2];
    
    let minDist = Infinity;
    let bestIdx = -1;
    
    for (let j = 0; j < count; j++) {
      if (used[j]) continue;
      const t = targets[j];
      const dx = px - t[0];
      const dy = py - t[1];
      const dz = pz - t[2];
      const distSq = dx*dx + dy*dy + dz*dz;
      
      if (distSq < minDist) {
        minDist = distSq;
        bestIdx = j;
      }
    }
    
    if (bestIdx !== -1) {
      matchedTargets[i] = targets[bestIdx];
      used[bestIdx] = 1;
    } else {
      matchedTargets[i] = [px, py, pz];
    }
  }
  
  return matchedTargets;
};
