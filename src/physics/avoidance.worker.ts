import { SpatialHashGrid } from './spatialHash';

export type ObstacleData = {
  position: [number, number, number];
  radius: number;
};

// Input message type from main thread
export type WorkerInput = {
  positions: Float32Array;
  velocities: Float32Array;
  targets: Float32Array;
  swarmCenterVelocity: [number, number, number];
  obstacles: ObstacleData[];
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

const grid = new SpatialHashGrid(5.0);

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { 
    positions, 
    velocities, 
    targets, 
    swarmCenterVelocity = [0, 0, 0],
    obstacles = [], 
    count, 
    dt, 
    maxVelocity, 
    safeDistance 
  } = e.data;
  
  // Rebuild spatial hash grid
  grid.clear();
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    grid.insert(i, positions[idx], positions[idx + 1], positions[idx + 2]);
  }

  // Force Weights
  const W_SAFETY = 3.0; // Prioritized high repulsion safety weight
  const W_TARGET = 1.2;  // Target attraction weight

  const [scVx, scVy, scVz] = swarmCenterVelocity;

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

    // 1. Repulsion forces (Micro Avoidance)
    let repX = 0, repY = 0, repZ = 0;

    // Neighbor Drones Repulsion
    const neighbors = grid.getNearby(px, py, pz, safeDistance * 2.0);
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
        const force = (safeDistance - dist) / dist;
        repX += (dx / dist) * force;
        repY += (dy / dist) * force;
        repZ += (dz / dist) * force;
      }
    }

    // Static 3D Obstacle Repulsion
    for (let o = 0; o < obstacles.length; o++) {
      const obs = obstacles[o];
      const ox = obs.position[0];
      const oy = obs.position[1];
      const oz = obs.position[2];
      const effectiveRadius = obs.radius + safeDistance * 1.2;

      const dx = px - ox;
      const dy = py - oy;
      const dz = pz - oz;
      const distSq = dx*dx + dy*dy + dz*dz;

      if (distSq > 0 && distSq < effectiveRadius * effectiveRadius) {
        const dist = Math.sqrt(distSq);
        const force = ((effectiveRadius - dist) / dist) * 15.0; // Strong obstacle repulsion
        repX += (dx / dist) * force;
        repY += (dy / dist) * force;
        repZ += (dz / dist) * force;
      }
    }

    // 2. Desired Target Seeking + Swarm Center Velocity Feedforward (Rule 2)
    const seekX = tx - px;
    const seekY = ty - py;
    const seekZ = tz - pz;
    const seekDist = Math.sqrt(seekX*seekX + seekY*seekY + seekZ*seekZ);
    
    let targetVx = 0;
    let targetVy = 0;
    let targetVz = 0;

    if (seekDist > 0.01) {
      // Speed proportional to distance, capped at maxVelocity
      const targetSpeed = Math.min(seekDist * 2.0, maxVelocity);
      targetVx = (seekX / seekDist) * targetSpeed;
      targetVy = (seekY / seekDist) * targetSpeed;
      targetVz = (seekZ / seekDist) * targetSpeed;
    }

    // Feedforward: Add swarm center's velocity so drones move cohesively without lag (Rule 2)
    const desiredVx = targetVx * W_TARGET + scVx;
    const desiredVy = targetVy * W_TARGET + scVy;
    const desiredVz = targetVz * W_TARGET + scVz;

    // Combine Desired Velocity with Safety Repulsion
    let newVx = desiredVx + repX * W_SAFETY;
    let newVy = desiredVy + repY * W_SAFETY;
    let newVz = desiredVz + repZ * W_SAFETY;

    // Smooth inertia / damping towards target velocity
    const lerpFactor = Math.min(dt * 8.0, 1.0);
    newVx = vx + (newVx - vx) * lerpFactor;
    newVy = vy + (newVy - vy) * lerpFactor;
    newVz = vz + (newVz - vz) * lerpFactor;

    // Clamp final velocity to maxVelocity limit
    const finalSpeed = Math.sqrt(newVx*newVx + newVy*newVy + newVz*newVz);
    if (finalSpeed > maxVelocity) {
      newVx = (newVx / finalSpeed) * maxVelocity;
      newVy = (newVy / finalSpeed) * maxVelocity;
      newVz = (newVz / finalSpeed) * maxVelocity;
    }

    // Update position
    positions[idx] = px + newVx * dt;
    positions[idx + 1] = py + newVy * dt;
    positions[idx + 2] = pz + newVz * dt;

    // Write back velocity
    velocities[idx] = newVx;
    velocities[idx + 1] = newVy;
    velocities[idx + 2] = newVz;
  }

  // Transfer the typed array buffers back with zero-copy — avoids structured clone overhead
  const workerScope = self as unknown as {
    postMessage(message: WorkerOutput, transfer: Transferable[]): void;
  };
  workerScope.postMessage({ positions, velocities }, [
    positions.buffer as ArrayBuffer,
    velocities.buffer as ArrayBuffer,
  ]);
};
