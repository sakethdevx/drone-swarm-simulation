import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Grid } from '@react-three/drei';
import DroneSwarm from './DroneSwarm';
import WaypointEditor from '../Planner/WaypointEditor';
import { useSimulationStore } from '../../store/useSimulationStore';

const CanvasEnvironment: React.FC = () => {
  const { bounds } = useSimulationStore();

  return (
    <div className="absolute inset-0 z-0 bg-zinc-950">
      <Canvas camera={{ position: [0, 40, 80], fov: 60 }}>
        {/* Environment & Lighting */}
        <color attach="background" args={['#09090b']} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow />
        <pointLight position={[-50, 50, -50]} intensity={0.5} />
        
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.1} />
        
        {/* Floor Grid */}
        <Grid
          infiniteGrid
          fadeDistance={200}
          sectionColor="#27272a"
          cellColor="#18181b"
          sectionSize={10}
          cellSize={2}
          position={[0, -0.1, 0]}
        />

        {/* Bounds Visualizer (Geofence) */}
        <mesh position={[0, bounds[1]/2, 0]}>
          <boxGeometry args={[bounds[0], bounds[1], bounds[2]]} />
          <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.05} />
        </mesh>

        {/* Swarm & Interaction */}
        <DroneSwarm />
        <WaypointEditor />

        {/* Controls */}
        <OrbitControls 
          makeDefault 
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minDistance={10} 
          maxDistance={300}
        />
      </Canvas>
    </div>
  );
};

export default CanvasEnvironment;
