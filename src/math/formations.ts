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

const generateSphere = (count: number, center: Vector3): Vector3[] => {
  const points: Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle in radians

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
    const radius = Math.sqrt(1 - y * y); // radius at y

    const theta = phi * i; // golden angle increment

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    // Scale sphere radius based on count to give enough space
    const scale = Math.max(10, Math.pow(count, 0.4) * 3);
    
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
  const spacing = 4.0;
  
  const offset = (size - 1) * spacing / 2.0;

  let added = 0;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        if (added >= count) break;
        points.push([
          center[0] + (x * spacing) - offset,
          center[1] + (y * spacing) - offset,
          center[2] + (z * spacing) - offset,
        ]);
        added++;
      }
    }
  }
  return points;
};

const generateVShape = (count: number, center: Vector3): Vector3[] => {
  const points: Vector3[] = [];
  const spacing = 3.0;
  const angle = Math.PI / 6; // 30 degrees half-angle
  
  // Leader
  points.push([center[0], center[1], center[2] + 10]);
  
  let added = 1;
  let row = 1;
  
  while (added < count) {
    // Left wing
    if (added < count) {
      points.push([
        center[0] - Math.sin(angle) * row * spacing,
        center[1] + (Math.random() - 0.5), // slight height variation
        center[2] + 10 - Math.cos(angle) * row * spacing,
      ]);
      added++;
    }
    // Right wing
    if (added < count) {
      points.push([
        center[0] + Math.sin(angle) * row * spacing,
        center[1] + (Math.random() - 0.5),
        center[2] + 10 - Math.cos(angle) * row * spacing,
      ]);
      added++;
    }
    
    // Add inner filling if we have lots of drones
    if (row > 2) {
        for(let i = 1; i < row; i++) {
           if (added >= count) break;
           points.push([
             center[0] - Math.sin(angle) * (row-i) * spacing + Math.sin(angle)*i*spacing,
             center[1] - i * 1.5,
             center[2] + 10 - Math.cos(angle) * row * spacing,
           ])
           added++;
        }
    }
    
    row++;
  }
  return points;
};

const generateHelix = (count: number, center: Vector3): Vector3[] => {
  const points: Vector3[] = [];
  const radius = 15.0;
  const height = 40.0;
  const turns = 3;
  
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const angle = t * Math.PI * 2 * turns;
    
    points.push([
      center[0] + Math.cos(angle) * radius,
      center[1] - height/2 + t * height,
      center[2] + Math.sin(angle) * radius,
    ]);
  }
  return points;
};

// Greedy nearest neighbor assignment to minimize crossing paths
export const matchTargetsGreedy = (currentPos: Float32Array, targets: Vector3[]): Vector3[] => {
  const count = targets.length;
  const matchedTargets: Vector3[] = new Array(count);
  const availableTargets = [...targets];
  
  for (let i = 0; i < count; i++) {
    const px = currentPos[i * 3];
    const py = currentPos[i * 3 + 1];
    const pz = currentPos[i * 3 + 2];
    
    let minDist = Infinity;
    let bestIdx = -1;
    
    for (let j = 0; j < availableTargets.length; j++) {
      const t = availableTargets[j];
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
      matchedTargets[i] = availableTargets[bestIdx];
      availableTargets.splice(bestIdx, 1);
    } else {
      matchedTargets[i] = [px, py, pz]; // fallback
    }
  }
  
  return matchedTargets;
};
