import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';

export const SwarmPathNavigator: React.FC = () => {
  const {
    waypoints,
    isPlaying,
    swarmState,
    setSwarmState,
    setSwarmCenterPosition,
    setSwarmCenterVelocity,
    playbackSpeed,
    maxVelocity,
  } = useSimulationStore();

  const progressRef = useRef(0);

  // Build Catmull-Rom Spline from Waypoints
  const { curve, pathLength } = useMemo(() => {
    if (waypoints.length < 2) {
      // Default fallback path
      const points = [
        new THREE.Vector3(0, 20, 0),
        new THREE.Vector3(0, 20, 60),
        new THREE.Vector3(30, 25, 100),
      ];
      const c = new THREE.CatmullRomCurve3(points);
      return { curve: c, pathLength: c.getLength() };
    }

    const points = waypoints.map((wp) => new THREE.Vector3(...wp.position));
    const c = new THREE.CatmullRomCurve3(points);
    return { curve: c, pathLength: c.getLength() };
  }, [waypoints]);

  // Reset progress on waypoint or formation change
  useEffect(() => {
    progressRef.current = 0;
    if (curve) {
      const startPt = curve.getPointAt(0);
      setSwarmCenterPosition([startPt.x, startPt.y, startPt.z]);
      setSwarmCenterVelocity([0, 0, 0]);
    }
  }, [waypoints, curve, setSwarmCenterPosition, setSwarmCenterVelocity]);

  useFrame((_state, delta) => {
    if (!curve || pathLength <= 0) return;

    if (swarmState === 'ASSEMBLING') {
      // Swarm Center holds static position at current progress point
      const t = progressRef.current;
      const pt = curve.getPointAt(t);
      setSwarmCenterPosition([pt.x, pt.y, pt.z]);
      setSwarmCenterVelocity([0, 0, 0]);

      // Check assembly error (read from store or computed by DroneSwarm)
      const currentError = useSimulationStore.getState().assemblyError;
      if (isPlaying && currentError < 0.8) {
        setSwarmState('NAVIGATING');
      }
    } else if (swarmState === 'NAVIGATING') {
      if (!isPlaying) return;

      // Advance progress along curve
      const cruiseSpeed = maxVelocity * 0.4 * playbackSpeed; // Cruise at ~40% max speed
      const dtProgress = (cruiseSpeed * delta) / pathLength;
      
      progressRef.current = Math.min(1.0, progressRef.current + dtProgress);
      const t = progressRef.current;

      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();

      const vx = tangent.x * cruiseSpeed;
      const vy = tangent.y * cruiseSpeed;
      const vz = tangent.z * cruiseSpeed;

      setSwarmCenterPosition([pt.x, pt.y, pt.z]);
      setSwarmCenterVelocity([vx, vy, vz]);

      // Reached destination
      if (t >= 1.0) {
        setSwarmState('COMPLETED');
        useSimulationStore.setState({ isPlaying: false });
      }
    }
  });

  return null;
};

export default SwarmPathNavigator;
