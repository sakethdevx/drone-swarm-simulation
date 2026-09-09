import React, { useRef } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { Line } from '@react-three/drei';

const WaypointEditor: React.FC = () => {
  const waypoints = useSimulationStore((state) => state.waypoints);
  const addWaypoint = useSimulationStore((state) => state.addWaypoint);
  
  // Invisible plane for raycasting
  const planeRef = useRef<THREE.Mesh>(null);

  const handlePointerDown = (e: any) => {
    // Only place waypoint if Shift is held
    if (e.shiftKey) {
      e.stopPropagation();
      const point = e.point;
      addWaypoint({
        id: uuidv4(),
        position: [point.x, point.y + 2, point.z] // Place slightly above surface
      });
    }
  };

  return (
    <group>
      {/* Raycast Target Plane (y=0) */}
      <mesh 
        ref={planeRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial />
      </mesh>

      {/* Render Waypoints */}
      {waypoints.map((wp, index) => (
        <group key={wp.id} position={wp.position}>
          {/* Waypoint Marker */}
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.8} />
          </mesh>
          
          {/* Line connecting to previous waypoint */}
          {index > 0 && (
            <Line
              points={[waypoints[index - 1].position, wp.position]}
              color="#facc15"
              lineWidth={2}
              dashed={true}
              transparent
              opacity={0.5}
            />
          )}
        </group>
      ))}
    </group>
  );
};

export default WaypointEditor;
