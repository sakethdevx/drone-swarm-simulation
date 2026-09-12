import React, { useEffect, useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Activity, Battery, Cpu, Gauge, Mountain, Route, Target } from 'lucide-react';

const TelemetryOverlay: React.FC = () => {
  // Individual selectors prevent this component from re-rendering on every physics tick
  const droneCount = useSimulationStore((s) => s.droneCount);
  const waypoints = useSimulationStore((s) => s.waypoints);
  const currentFormation = useSimulationStore((s) => s.currentFormation);
  const assemblyError = useSimulationStore((s) => s.assemblyError);
  const swarmState = useSimulationStore((s) => s.swarmState);
  const swarmCenterPosition = useSimulationStore((s) => s.swarmCenterPosition);
  const swarmCenterVelocity = useSimulationStore((s) => s.swarmCenterVelocity);
  const currentTime = useSimulationStore((s) => s.currentTime);
  const obstacles = useSimulationStore((s) => s.obstacles);
  const telemetryHistory = useSimulationStore((s) => s.telemetryHistory);
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

  const speed = Math.sqrt(
    swarmCenterVelocity[0] ** 2 +
    swarmCenterVelocity[1] ** 2 +
    swarmCenterVelocity[2] ** 2,
  );

  return (
    <div className="relative flex flex-col gap-4 pointer-events-auto">
      {/* Primary Telemetry Card */}
      <div className="bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 p-4 rounded-2xl w-64 shadow-2xl">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center">
          <Activity size={14} className="mr-2 text-emerald-400" /> Live Telemetry
        </h2>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
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

          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 mb-1">Cruise Speed</span>
            <div className="flex items-center text-zinc-100 font-mono text-sm font-bold">
              <Gauge size={14} className="mr-1.5 text-cyan-400" />
              {speed.toFixed(1)} m/s
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 mb-1">Altitude</span>
            <div className="flex items-center text-zinc-100 font-mono text-sm font-bold">
              <Mountain size={14} className="mr-1.5 text-violet-400" />
              {swarmCenterPosition[1].toFixed(1)} m
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 mb-1">Route Progress</span>
            <div className="flex items-center text-zinc-100 font-mono text-sm font-bold">
              <Route size={14} className="mr-1.5 text-blue-400" />
              {Math.round(currentTime * 100)}%
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 mb-1">Threats</span>
            <div className="flex items-center text-zinc-100 font-mono text-sm font-bold">
              <Target size={14} className={`mr-1.5 ${obstacles.length > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
              {obstacles.length} obstacle{obstacles.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 p-4 rounded-2xl w-64 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Flight trends</span>
          <span className="font-mono text-[10px] text-zinc-600">{telemetryHistory.length} samples</span>
        </div>
        <div className="space-y-3">
          <TrendRow label="Speed" color="bg-cyan-400" values={telemetryHistory.map((sample) => sample.speed)} suffix=" m/s" />
          <TrendRow label="Formation error" color="bg-amber-400" values={telemetryHistory.map((sample) => sample.assemblyError)} suffix=" m" />
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

interface TrendRowProps {
  label: string;
  color: string;
  values: number[];
  suffix: string;
}

const TrendRow: React.FC<TrendRowProps> = ({ label, color, values, suffix }) => {
  const latest = values[values.length - 1] ?? 0;
  const maximum = Math.max(...values, 1);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-500">
        <span>{label}</span>
        <span className="font-mono text-zinc-300">{latest.toFixed(1)}{suffix}</span>
      </div>
      <div className="flex h-8 items-end gap-px rounded-md bg-zinc-900/80 px-1 py-1">
        {values.length === 0 ? (
          <span className="px-1 text-[9px] text-zinc-700">Waiting for flight data</span>
        ) : values.map((value, index) => (
          <span key={`${value}-${index}`} className={`min-w-[2px] flex-1 rounded-sm ${color} opacity-80`} style={{ height: `${Math.max(8, (value / maximum) * 100)}%` }} />
        ))}
      </div>
    </div>
  );
};

export default TelemetryOverlay;
