import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';

const CameraFollow: React.FC = () => {
  const cameraFollow = useSimulationStore((state) => state.cameraFollow);
  const swarmCenterPosition = useSimulationStore((state) => state.swarmCenterPosition);
  const { camera } = useThree();
  const controls = useThree((state) => (state as any).controls);
  const desiredTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!cameraFollow) return;
    desiredTarget.current.set(...swarmCenterPosition);
    camera.position.set(
      swarmCenterPosition[0] + 34,
      swarmCenterPosition[1] + 22,
      swarmCenterPosition[2] + 42,
    );
  }, [cameraFollow, camera]);

  useFrame(() => {
    if (!cameraFollow) return;
    desiredTarget.current.set(...swarmCenterPosition);
    camera.position.lerp(
      new THREE.Vector3(
        swarmCenterPosition[0] + 34,
        swarmCenterPosition[1] + 22,
        swarmCenterPosition[2] + 42,
      ),
      0.06,
    );
    camera.lookAt(desiredTarget.current);
    if (controls) {
      controls.target.lerp(desiredTarget.current, 0.08);
      controls.update();
    }
  });

  return null;
};

export default CameraFollow;