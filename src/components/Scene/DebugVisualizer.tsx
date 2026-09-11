import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useSimulationStore } from '../../store/useSimulationStore';

export const DebugVisualizer: React.FC = () => {
  const { showDebugVisuals, swarmCenterPosition, waypoints } = useSimulationStore();

  const curvePoints = useMemo(() => {
    if (waypoints.length < 2) {
      const points = [
        new THREE.Vector3(0, 20, 0),
        new THREE.Vector3(0, 20, 60),
        new THREE.Vector3(30, 25, 100),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      return curve.getPoints(50).map(p => [p.x, p.y, p.z] as [number, number, number]);
    }

    const points = waypoints.map((wp) => new THREE.Vector3(...wp.position));
    const curve = new THREE.CatmullRomCurve3(points);
    return curve.getPoints(50).map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, [waypoints]);

  if (!showDebugVisuals) return null;

  return (
    <group>
      {/* 1. Virtual Swarm Center Marker */}
      <group position={swarmCenterPosition}>
        <mesh>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={1.0} wireframe />
        </mesh>
        <pointLight color="#06b6d4" intensity={3} distance={15} />
      </group>

      {/* 2. Planned Route Spline Curve */}
      {curvePoints.length > 1 && (
        <Line
          points={curvePoints}
          color="#38bdf8"
          lineWidth={3}
          transparent
          opacity={0.7}
        />
      )}
    </group>
  );
};

export default DebugVisualizer;
