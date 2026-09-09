import { SpatialHashGrid } from './spatialHash';

// Input message type from main thread
export type WorkerInput = {
  positions: Float32Array;
  velocities: Float32Array;
  targets: Float32Array;
  count: number;
  dt: number;
  maxVelocity: number;
  safeDistance: number;
};

// Output message type to main thread
export type WorkerOutput = {
  positions: Float32Array;
  velocities: Float32Array;
};

const grid = new SpatialHashGrid(5.0); // Cell size of 5 units

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { positions, velocities, targets, count, dt, maxVelocity, safeDistance } = e.data;
  
  // Rebuild spatial hash grid
  grid.clear();
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    grid.insert(i, positions[idx], positions[idx + 1], positions[idx + 2]);
  }

  // Boids weights
  const W_SEPARATION = 1.5;
  const W_COHESION = 0.1;
  const W_ALIGNMENT = 0.1;
  const W_TARGET = 1.0;

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    
    // Current state
    const px = positions[idx];
    const py = positions[idx + 1];
    const pz = positions[idx + 2];
    
    const vx = velocities[idx];
    const vy = velocities[idx + 1];
    const vz = velocities[idx + 2];
    
    const tx = targets[idx];
    const ty = targets[idx + 1];
    const tz = targets[idx + 2];

    // Get neighbors
    const neighbors = grid.getNearby(px, py, pz, safeDistance * 2.0);
    
    let sepX = 0, sepY = 0, sepZ = 0;
    let cohX = 0, cohY = 0, cohZ = 0;
    let aliX = 0, aliY = 0, aliZ = 0;
    let neighborCount = 0;

    for (const n of neighbors) {
      if (n === i) continue;
      const nIdx = n * 3;
      const nx = positions[nIdx];
      const ny = positions[nIdx + 1];
      const nz = positions[nIdx + 2];
      
      const dx = px - nx;
      const dy = py - ny;
      const dz = pz - nz;
      const distSq = dx*dx + dy*dy + dz*dz;
      
      if (distSq > 0 && distSq < safeDistance * safeDistance) {
        const dist = Math.sqrt(distSq);
        // Separation
        sepX += (dx / dist) / dist;
        sepY += (dy / dist) / dist;
        sepZ += (dz / dist) / dist;
        
        // Cohesion (accumulate center of mass)
        cohX += nx;
        cohY += ny;
        cohZ += nz;
        
        // Alignment
        aliX += velocities[nIdx];
        aliY += velocities[nIdx + 1];
        aliZ += velocities[nIdx + 2];
        
        neighborCount++;
      }
    }

    if (neighborCount > 0) {
      // Cohesion
      cohX = (cohX / neighborCount) - px;
      cohY = (cohY / neighborCount) - py;
      cohZ = (cohZ / neighborCount) - pz;
      
      // Alignment
      aliX = (aliX / neighborCount) - vx;
      aliY = (aliY / neighborCount) - vy;
      aliZ = (aliZ / neighborCount) - vz;
    }

    // Target seeking
    const tgtX = tx - px;
    const tgtY = ty - py;
    const tgtZ = tz - pz;
    
    // Apply forces to velocity
    let dvx = (sepX * W_SEPARATION) + (cohX * W_COHESION) + (aliX * W_ALIGNMENT) + (tgtX * W_TARGET);
    let dvy = (sepY * W_SEPARATION) + (cohY * W_COHESION) + (aliY * W_ALIGNMENT) + (tgtY * W_TARGET);
    let dvz = (sepZ * W_SEPARATION) + (cohZ * W_COHESION) + (aliZ * W_ALIGNMENT) + (tgtZ * W_TARGET);
    
    // Update velocity
    let newVx = vx + dvx * dt;
    let newVy = vy + dvy * dt;
    let newVz = vz + dvz * dt;
    
    // Clamp velocity
    const speed = Math.sqrt(newVx*newVx + newVy*newVy + newVz*newVz);
    if (speed > maxVelocity) {
      newVx = (newVx / speed) * maxVelocity;
      newVy = (newVy / speed) * maxVelocity;
      newVz = (newVz / speed) * maxVelocity;
    }

    // Apply damping (friction)
    const damping = 0.98;
    newVx *= damping;
    newVy *= damping;
    newVz *= damping;

    // Update positions
    positions[idx] = px + newVx * dt;
    positions[idx + 1] = py + newVy * dt;
    positions[idx + 2] = pz + newVz * dt;

    // Write back velocities
    velocities[idx] = newVx;
    velocities[idx + 1] = newVy;
    velocities[idx + 2] = newVz;
  }

  // Send the updated buffers back
  self.postMessage({ positions, velocities } as WorkerOutput);
};
