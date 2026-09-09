import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';
import { generateFormation, matchTargetsGreedy } from '../../math/formations';

// Web worker singleton
const worker = new Worker(new URL('../../physics/avoidance.worker.ts', import.meta.url), { type: 'module' });

const DroneSwarm: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const droneCount = useSimulationStore((state) => state.droneCount);
  const currentFormation = useSimulationStore((state) => state.currentFormation);
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const maxVelocity = useSimulationStore((state) => state.maxVelocity);
  const safeDistance = useSimulationStore((state) => state.safeDistance);
  
  // High-performance buffers
  const { positions, velocities, targets } = useMemo(() => {
    return {
      positions: new Float32Array(droneCount * 3),
      velocities: new Float32Array(droneCount * 3),
      targets: new Float32Array(droneCount * 3),
    };
  }, [droneCount]);

  // Handle formation changes
  useEffect(() => {
    const rawTargets = generateFormation(currentFormation, droneCount, [0, 20, 0]);
    // Match current positions to new targets to minimize crossing
    const matched = matchTargetsGreedy(positions, rawTargets);
    
    for (let i = 0; i < droneCount; i++) {
      targets[i * 3] = matched[i][0];
      targets[i * 3 + 1] = matched[i][1];
      targets[i * 3 + 2] = matched[i][2];
    }
  }, [currentFormation, droneCount, positions, targets]);

  // Initialize random positions on mount
  useEffect(() => {
    for (let i = 0; i < droneCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 50;
      if (i % 3 === 1) positions[i] += 20; // y-offset
    }
  }, [droneCount, positions]);

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
    // 1. Send data to worker if playing and worker is free
    if (isPlaying && !isWorkerBusy.current) {
      isWorkerBusy.current = true;
      worker.postMessage({
        positions: Array.from(positions), // In real scenario, use SharedArrayBuffer if cross-origin isolated
        velocities: Array.from(velocities),
        targets: Array.from(targets),
        count: droneCount,
        dt: Math.min(delta, 0.1), // Cap delta
        maxVelocity,
        safeDistance
      });
    }

    // 2. Update InstancedMesh matrix
    if (meshRef.current) {
      for (let i = 0; i < droneCount; i++) {
        const idx = i * 3;
        dummy.position.set(positions[idx], positions[idx + 1], positions[idx + 2]);
        
        // Face movement direction (velocity)
        const vx = velocities[idx];
        const vy = velocities[idx + 1];
        const vz = velocities[idx + 2];
        const speedSq = vx*vx + vy*vy + vz*vz;
        
        if (speedSq > 0.1) {
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
      <meshStandardMaterial color="#3b82f6" emissive="#1e3a8a" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
    </instancedMesh>
  );
};

export default DroneSwarm;
