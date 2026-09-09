import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { FormationType } from '../../types';
import { Play, Pause, Square, FastForward } from 'lucide-react';

const formations: { value: FormationType; label: string }[] = [
  { value: 'sphere', label: 'Sphere' },
  { value: 'grid', label: 'Matrix Grid' },
  { value: 'v-shape', label: 'Dynamic V-Shape' },
  { value: 'helix', label: 'Double Helix' },
];

const SwarmController: React.FC = () => {
  const { 
    droneCount, setDroneCount, 
    currentFormation, setFormation,
    isPlaying, togglePlayback,
    playbackSpeed, setPlaybackSpeed,
    clearWaypoints
  } = useSimulationStore();

  return (
    <div className="bg-zinc-950/60 backdrop-blur-md border border-zinc-800/50 p-4 rounded-2xl w-80 shadow-2xl flex flex-col gap-6 pointer-events-auto">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4">Mission Controls</h2>
        
        {/* Playback */}
        <div className="flex items-center gap-2 mb-6 bg-zinc-900/50 p-1 rounded-xl">
          <button 
            onClick={togglePlayback}
            className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-colors ${isPlaying ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-zinc-800 text-zinc-400'}`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button 
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 5 : 1)}
            className="flex-1 flex justify-center items-center py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <FastForward size={18} className="mr-2"/> {playbackSpeed}x
          </button>
          <button 
            onClick={clearWaypoints}
            className="flex-1 flex justify-center items-center py-2 rounded-lg hover:bg-zinc-800 text-red-400 transition-colors"
            title="Clear Waypoints"
          >
            <Square size={18} />
          </button>
        </div>

        {/* Formation Selection */}
        <div className="mb-4">
          <label className="text-xs text-zinc-400 mb-2 block">Formation Pattern</label>
          <div className="grid grid-cols-2 gap-2">
            {formations.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormation(f.value)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                  currentFormation === f.value 
                    ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Swarm Size */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-zinc-400">Swarm Count</label>
            <span className="text-xs font-mono text-blue-400">{droneCount}</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="1000" 
            step="10"
            value={droneCount}
            onChange={(e) => setDroneCount(parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default SwarmController;
