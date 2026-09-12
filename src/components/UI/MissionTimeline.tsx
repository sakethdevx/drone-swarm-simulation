import React from 'react';
import { RotateCcw, Route, Timer } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

const MissionTimeline: React.FC = () => {
  const currentTime = useSimulationStore((state) => state.currentTime);
  const swarmState = useSimulationStore((state) => state.swarmState);
  const waypoints = useSimulationStore((state) => state.waypoints);
  const resetMission = useSimulationStore((state) => state.resetMission);

  const progress = Math.round(currentTime * 100);

  return (
    <div className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-zinc-800/70 bg-zinc-950/80 p-4 shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Route size={15} className="text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Mission timeline</span>
          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
            {swarmState}
          </span>
        </div>
        <button
          onClick={resetMission}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          title="Reset mission"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-[width] duration-300" style={{ width: `${progress}%` }} />
        {waypoints.map((waypoint, index) => {
          const position = waypoints.length <= 1 ? 0 : (index / (waypoints.length - 1)) * 100;
          return <span key={waypoint.id} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950 bg-amber-300" style={{ left: `${position}%` }} />;
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span className="flex items-center gap-1"><Timer size={12} /> {progress}% complete</span>
        <span>{waypoints.length} mission points</span>
      </div>
    </div>
  );
};

export default MissionTimeline;