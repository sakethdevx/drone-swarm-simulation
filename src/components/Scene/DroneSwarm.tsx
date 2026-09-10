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
  const obstacles = useSimulationStore((state) => state.obstacles);
  const setAssemblyError = useSimulationStore((state) => state.setAssemblyError);
  
  // High-performance buffers
  const { positions, velocities, targets, rawOffsets } = useMemo(() => {
    return {
      positions: new Float32Array(droneCount * 3),
      velocities: new Float32Array(droneCount * 3),
      targets: new Float32Array(droneCount * 3),
      rawOffsets: new Float32Array(droneCount * 3),
    };
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

  // Initialize random positions around initial swarmCenterPosition
  useEffect(() => {
    for (let i = 0; i < droneCount; i++) {
      positions[i * 3] = swarmCenterPosition[0] + (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = swarmCenterPosition[1] + (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = swarmCenterPosition[2] + (Math.random() - 0.5) * 40;
    }
  }, [droneCount]);

  // Handle Web Worker messages
  const isWorkerBusy = useRef(false);
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const { positions: newPositions, velocities: newVelocities } = e.data;
      positions.set(newPositions);
      velocities.set(newVelocities);
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

    setAssemblyError(Math.sqrt(maxErrorSq));

    // 2. Send data to worker if worker is free and simulation active
    if (!isWorkerBusy.current && (isPlaying || useSimulationStore.getState().swarmState === 'ASSEMBLING')) {
      isWorkerBusy.current = true;

      const obstaclePayload: ObstacleData[] = obstacles.map(o => ({
        position: o.position,
        radius: o.radius
      }));

      worker.postMessage({
        positions: Array.from(positions),
        velocities: Array.from(velocities),
        targets: Array.from(targets),
        swarmCenterVelocity,
        obstacles: obstaclePayload,
        count: droneCount,
        dt: Math.min(delta, 0.1),
        maxVelocity,
        safeDistance
      });
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
          const targetRot = new THREE.Vector3(positions[idx] + vx, positions[idx] + vy, positions[idx] + vz);
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
