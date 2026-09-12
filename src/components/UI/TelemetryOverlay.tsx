import React, { useEffect, useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Activity, Battery, Cpu, Target } from 'lucide-react';

const TelemetryOverlay: React.FC = () => {
  // Individual selectors prevent this component from re-rendering on every physics tick
  const droneCount = useSimulationStore((s) => s.droneCount);
  const waypoints = useSimulationStore((s) => s.waypoints);
  const currentFormation = useSimulationStore((s) => s.currentFormation);
  const assemblyError = useSimulationStore((s) => s.assemblyError);
  const swarmState = useSimulationStore((s) => s.swarmState);
  const [fps, setFps] = useState(0);

  // Simple FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    measureFPS();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="absolute top-6 right-6 flex flex-col gap-4 pointer-events-auto">
      {/* Primary Telemetry Card */}
      <div className="bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 p-4 rounded-2xl w-64 shadow-2xl">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center">
          <Activity size={14} className="mr-2 text-emerald-400" /> Live Telemetry
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 mb-1">FPS</span>
            <div className="flex items-center text-zinc-100 font-mono text-lg font-bold">
              <Cpu size={14} className={`mr-1.5 ${fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-red-400'}`} />
              {fps}
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 mb-1">Active Swarm</span>
            <span className="text-zinc-100 font-mono text-lg font-bold">{droneCount}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 mb-1">Assembly Error</span>
            <div className="flex items-center text-zinc-100 font-mono text-sm font-bold">
              <Target size={14} className={`mr-1.5 ${assemblyError < 0.8 ? 'text-emerald-400' : 'text-amber-400'}`} />
              {assemblyError > 90 ? 'N/A' : `${assemblyError.toFixed(2)}m`}
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 mb-1">Avg Battery</span>
            <div className="flex items-center text-zinc-100 font-mono text-lg font-bold">
              <Battery size={14} className="mr-1.5 text-zinc-500" />
              <span className="text-zinc-500 text-sm">N/A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Status Card */}
      <div className="bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 p-4 rounded-2xl w-64 shadow-2xl">
         <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400">Current Task</span>
            <span className="text-xs font-bold text-blue-400 uppercase">{currentFormation}</span>
         </div>
         <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400">Pipeline State</span>
            <span className="text-xs font-mono font-bold text-zinc-200">{swarmState}</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-400">Waypoints</span>
            <span className="text-xs font-mono text-zinc-100 font-semibold">{waypoints.length} Placed</span>
         </div>
         {waypoints.length === 0 && (
           <p className="text-[10px] text-zinc-500 mt-2 italic">Shift + Click floor to place waypoints</p>
         )}
      </div>
    </div>
  );
};

export default TelemetryOverlay;
