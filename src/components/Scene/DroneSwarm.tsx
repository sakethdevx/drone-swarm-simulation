import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';
import { generateFormation, matchTargetsGreedy, rotateVectorHeading } from '../../math/formations';
import type { ObstacleData } from '../../physics/avoidance.worker';

// Web worker singleton
const worker = new Worker(new URL('../../physics/avoidance.worker.ts', import.meta.url), { type: 'module' });

const DroneSwarm: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const droneCount = useSimulationStore((state) => state.droneCount);
  const currentFormation = useSimulationStore((state) => state.currentFormation);
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const maxVelocity = useSimulationStore((state) => state.maxVelocity);
  const safeDistance = useSimulationStore((state) => state.safeDistance);
  const swarmCenterPosition = useSimulationStore((state) => state.swarmCenterPosition);
  const swarmCenterVelocity = useSimulationStore((state) => state.swarmCenterVelocity);
  // obstacles is read directly from store in useFrame to avoid stale closures
  const setAssemblyError = useSimulationStore((state) => state.setAssemblyError);
  
  const buffersRef = useRef({
    positions: new Float32Array(0),
    velocities: new Float32Array(0),
    targets: new Float32Array(0),
    rawOffsets: new Float32Array(0),
    prevCount: 0
  });

  // High-performance buffers
  const { positions, velocities, targets, rawOffsets } = useMemo(() => {
    const prev = buffersRef.current;
    
    const newPositions = new Float32Array(droneCount * 3);
    const newVelocities = new Float32Array(droneCount * 3);
    const newTargets = new Float32Array(droneCount * 3);
    const newRawOffsets = new Float32Array(droneCount * 3);
    
    // Copy existing data for surviving drones
    const copyCount = Math.min(prev.prevCount, droneCount);
    if (copyCount > 0) {
      newPositions.set(prev.positions.subarray(0, copyCount * 3));
      newVelocities.set(prev.velocities.subarray(0, copyCount * 3));
      newTargets.set(prev.targets.subarray(0, copyCount * 3));
      newRawOffsets.set(prev.rawOffsets.subarray(0, copyCount * 3));
    }
    
    // Randomize only for newly added drones
    const center = useSimulationStore.getState().swarmCenterPosition;
    for (let i = copyCount; i < droneCount; i++) {
      newPositions[i * 3] = center[0] + (Math.random() - 0.5) * 40;
      newPositions[i * 3 + 1] = center[1] + (Math.random() - 0.5) * 20;
      newPositions[i * 3 + 2] = center[2] + (Math.random() - 0.5) * 40;
    }

    buffersRef.current = {
      positions: newPositions,
      velocities: newVelocities,
      targets: newTargets,
      rawOffsets: newRawOffsets,
      prevCount: droneCount
    };
    
    return buffersRef.current;
  }, [droneCount]);

  // Handle formation changes: compute local relative offset vectors O_i
  useEffect(() => {
    const relativeTargets = generateFormation(currentFormation, droneCount, [0, 0, 0]);
    // Match current positions to new targets to minimize path crossing
    const matched = matchTargetsGreedy(positions, relativeTargets);
    
    for (let i = 0; i < droneCount; i++) {
      rawOffsets[i * 3] = matched[i][0];
      rawOffsets[i * 3 + 1] = matched[i][1];
      rawOffsets[i * 3 + 2] = matched[i][2];
    }
  }, [currentFormation, droneCount, positions, rawOffsets]);

  // Removed the global randomization useEffect here to prevent teleporting existing drones.

  // Handle Web Worker messages
  const isWorkerBusy = useRef(false);
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const { positions: newPositions, velocities: newVelocities } = e.data;
      if (newPositions.length === positions.length) {
        positions.set(newPositions);
        velocities.set(newVelocities);
      }
      isWorkerBusy.current = false;
    };
    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [positions, velocities]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Frame loop for physics trigger and rendering
  useFrame((_state, delta) => {
    // 1. Update dynamic target world positions: Target_i(t) = SwarmCenter(t) + R(theta) * O_i
    let maxErrorSq = 0;

    for (let i = 0; i < droneCount; i++) {
      const idx = i * 3;
      const ox = rawOffsets[idx];
      const oy = rawOffsets[idx + 1];
      const oz = rawOffsets[idx + 2];

      const [rx, ry, rz] = rotateVectorHeading([ox, oy, oz], swarmCenterVelocity);

      const targetX = swarmCenterPosition[0] + rx;
      const targetY = swarmCenterPosition[1] + ry;
      const targetZ = swarmCenterPosition[2] + rz;

      targets[idx] = targetX;
      targets[idx + 1] = targetY;
      targets[idx + 2] = targetZ;

      // Compute assembly error: max distance to target slot
      const px = positions[idx];
      const py = positions[idx + 1];
      const pz = positions[idx + 2];

      const dx = px - targetX;
      const dy = py - targetY;
      const dz = pz - targetZ;
      const errSq = dx * dx + dy * dy + dz * dz;
      if (errSq > maxErrorSq) {
        maxErrorSq = errSq;
      }
    }

    // Only publish assembly error when the swarm is active.
    // Avoids 60 unnecessary Zustand writes/second when the simulation is paused/idle.
    const swarmStateNow = useSimulationStore.getState().swarmState;
    if (swarmStateNow === 'ASSEMBLING' || swarmStateNow === 'NAVIGATING') {
      setAssemblyError(Math.sqrt(maxErrorSq));
    }

    // 2. Send data to worker if worker is free and simulation active
    if (!isWorkerBusy.current && (isPlaying || useSimulationStore.getState().swarmState === 'ASSEMBLING')) {
      isWorkerBusy.current = true;

      const currentObstacles = useSimulationStore.getState().obstacles;
      const obstaclePayload: ObstacleData[] = currentObstacles.map(o => ({
        position: o.position,
        radius: o.radius
      }));

      // Use .slice() to create Float32Array copies, then transfer ownership (zero-copy)
      // instead of Array.from() which converts to slow JS number arrays.
      const posCopy = positions.slice();
      const velCopy = velocities.slice();
      const tgtCopy = targets.slice();

      worker.postMessage({
        positions: posCopy,
        velocities: velCopy,
        targets: tgtCopy,
        swarmCenterVelocity,
        obstacles: obstaclePayload,
        count: droneCount,
        dt: Math.min(delta, 0.1),
        maxVelocity,
        safeDistance
      }, [posCopy.buffer, velCopy.buffer, tgtCopy.buffer]);
    }

    // 3. Update InstancedMesh matrix
    if (meshRef.current) {
      for (let i = 0; i < droneCount; i++) {
        const idx = i * 3;
        dummy.position.set(positions[idx], positions[idx + 1], positions[idx + 2]);
        
        // Orient drone facing velocity
        const vx = velocities[idx];
        const vy = velocities[idx + 1];
        const vz = velocities[idx + 2];
        const speedSq = vx*vx + vy*vy + vz*vz;
        
        if (speedSq > 0.05) {
          // Bug fix: was using positions[idx] (X) for all three components
          const targetRot = new THREE.Vector3(
            positions[idx]     + vx,
            positions[idx + 1] + vy,
            positions[idx + 2] + vz
          );
          dummy.lookAt(targetRot);
        }
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, droneCount]} castShadow receiveShadow>
      <boxGeometry args={[0.8, 0.2, 0.8]} />
      <meshStandardMaterial color="#3b82f6" emissive="#1e3a8a" emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
    </instancedMesh>
  );
};

export default DroneSwarm;
