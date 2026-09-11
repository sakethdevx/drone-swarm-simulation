import React, { useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { Obstacle } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Individual obstacle mesh.
// onClick is stripped from the selected obstacle so gizmo handles get all
// pointer events without competing with the mesh's hit-test.
// ─────────────────────────────────────────────────────────────────────────────
interface ObstacleMeshProps {
  obstacle: Obstacle;
  isSelected: boolean;
  meshRef: React.RefObject<THREE.Mesh | null>;
}

const ObstacleMesh: React.FC<ObstacleMeshProps> = ({ obstacle, isSelected, meshRef }) => {
  const selectObstacle = useSimulationStore((state) => state.selectObstacle);

  return (
    <mesh
      ref={meshRef}
      position={obstacle.position}
      // Disable click handler while selected — gizmo handles own pointer capture.
      onClick={
        isSelected
          ? undefined
          : (e) => {
              e.stopPropagation();
              selectObstacle(obstacle.id);
            }
      }
    >
      {obstacle.type === 'box' ? (
        <boxGeometry args={[obstacle.radius * 2, obstacle.radius * 2, obstacle.radius * 2]} />
      ) : (
        <sphereGeometry args={[obstacle.radius, 32, 32]} />
      )}
      <meshStandardMaterial
        color={isSelected ? '#f87171' : '#ef4444'}
        transparent
        opacity={0.8}
      />
      {/* Wireframe safety-radius shell */}
      <mesh>
        {obstacle.type === 'box' ? (
          <boxGeometry args={[obstacle.radius * 2, obstacle.radius * 2, obstacle.radius * 2]} />
        ) : (
          <sphereGeometry args={[obstacle.radius, 16, 16]} />
        )}
        <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.18} />
      </mesh>
    </mesh>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main manager
// - Renders all obstacle meshes with stable, id-keyed refs.
// - Attaches ONE TransformControls gizmo imperatively to the selected mesh via
//   a ref callback. This means the gizmo component never re-mounts mid-drag
//   even when the Zustand store updates, eliminating the flicker.
// - Position is synced to the store only on drag-end (dragging-changed = false)
//   to prevent state-thrash-induced re-renders during live movement.
// ─────────────────────────────────────────────────────────────────────────────
const ObstacleManager: React.FC = () => {
  const obstacles = useSimulationStore((state) => state.obstacles);
  const selectedObstacleId = useSimulationStore((state) => state.selectedObstacleId);
  const updateObstaclePosition = useSimulationStore((state) => state.updateObstaclePosition);

  // Grab OrbitControls from drei's makeDefault context
  const orbitControls = useThree((state) => (state as any).controls);

  // Stable map of obstacle id → mesh ref (survives re-renders)
  const meshRefs = useRef<Map<string, React.RefObject<THREE.Mesh | null>>>(new Map());
  const getMeshRef = (id: string) => {
    if (!meshRefs.current.has(id)) {
      meshRefs.current.set(id, React.createRef<THREE.Mesh | null>());
    }
    return meshRefs.current.get(id)!;
  };

  // Purge refs for obstacles that have been removed
  const activeIds = new Set(obstacles.map((o) => o.id));
  meshRefs.current.forEach((_, id) => {
    if (!activeIds.has(id)) meshRefs.current.delete(id);
  });

  const selectedMeshRef = selectedObstacleId ? getMeshRef(selectedObstacleId) : null;

  return (
    <group>
      {/* ── Obstacle meshes ─────────────────────────────────────────────── */}
      {obstacles.map((obs) => (
        <ObstacleMesh
          key={obs.id}
          obstacle={obs}
          isSelected={selectedObstacleId === obs.id}
          meshRef={getMeshRef(obs.id)}
        />
      ))}

      {/* ── Single gizmo imperatively attached to the selected mesh ─────── */}
      {selectedObstacleId && selectedMeshRef && (
        <TransformControls
          ref={(tc: any) => {
            if (!tc || !selectedMeshRef.current) return;

            // Imperatively attach — gizmo doesn't wrap mesh in JSX, so React
            // never re-mounts it when the parent re-renders from store updates.
            tc.attach(selectedMeshRef.current);

            // Register dragging-changed once; guard against double-registration
            // by storing the listener on the instance.
            if (tc.__onDragging) {
              tc.removeEventListener('dragging-changed', tc.__onDragging);
            }

            const onDraggingChanged = (event: any) => {
              // Disable orbit while actively dragging a gizmo axis/plane
              if (orbitControls) orbitControls.enabled = !event.value;

              // Sync final position to store only when the drag ends.
              // This is the key fix: avoids flooding Zustand on every mousemove
              // tick which caused continuous re-renders and gizmo flicker.
              if (!event.value && selectedMeshRef.current) {
                const { x, y, z } = selectedMeshRef.current.position;
                updateObstaclePosition(selectedObstacleId, [x, y, z]);
              }
            };

            tc.__onDragging = onDraggingChanged;
            tc.addEventListener('dragging-changed', onDraggingChanged);
          }}
          mode="translate"
        />
      )}
    </group>
  );
};

export default ObstacleManager;
