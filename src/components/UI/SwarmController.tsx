import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { FormationType, SwarmState } from '../../types';
import { Play, Pause, Square, FastForward, Eye, EyeOff, ShieldAlert, Plus, Trash2, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const formations: { value: FormationType; label: string }[] = [
  { value: 'sphere', label: 'Sphere' },
  { value: 'grid', label: 'Matrix Grid' },
  { value: 'v-shape', label: 'Dynamic V-Shape' },
  { value: 'helix', label: 'Double Helix' },
];

const stateBadges: Record<SwarmState, { label: string; color: string }> = {
  IDLE: { label: 'IDLE', color: 'bg-zinc-800 text-zinc-400' },
  ASSEMBLING: { label: 'ASSEMBLING', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  NAVIGATING: { label: 'NAVIGATING', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' },
  COMPLETED: { label: 'COMPLETED', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
};

const SwarmController: React.FC = () => {
  const { 
    droneCount, setDroneCount, 
    currentFormation, setFormation,
    swarmState,
    isPlaying, togglePlayback,
    playbackSpeed, setPlaybackSpeed,
    clearWaypoints,
    showDebugVisuals, toggleDebugVisuals,
    obstacles, addObstacle, clearAllObstacles,
    selectedObstacleId, updateObstacleRadius, removeObstacle
  } = useSimulationStore();
  
  const selectedObstacle = obstacles.find(o => o.id === selectedObstacleId);

  const handleAddObstacle = () => {
    addObstacle({ 
      id: uuidv4(), 
      position: [0, 20, 0], 
      radius: 6.0,
      type: 'sphere'
    });
  };

  return (
    <div className="bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 p-5 rounded-2xl w-84 shadow-2xl flex flex-col gap-5 pointer-events-auto">
      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Mission Controller</h2>
        <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full ${stateBadges[swarmState].color}`}>
          {stateBadges[swarmState].label}
        </span>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2 bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-800/50">
        <button 
          onClick={togglePlayback}
          className={`flex-1 flex justify-center items-center py-2.5 rounded-lg font-medium transition-all ${
            isPlaying 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Start Simulation'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button 
          onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 5 : 1)}
          className="flex-1 flex justify-center items-center py-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
          title="Playback Speed"
        >
          <FastForward size={14} className="mr-1.5"/> {playbackSpeed}x
        </button>
        <button 
          onClick={clearWaypoints}
          className="flex-1 flex justify-center items-center py-2.5 rounded-lg bg-zinc-800/60 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 transition-colors"
          title="Reset Waypoints"
        >
          <Square size={16} />
        </button>
      </div>

      {/* Formation Selector */}
      <div>
        <label className="text-xs text-zinc-400 mb-2 block font-medium">Formation Pattern</label>
        <div className="grid grid-cols-2 gap-2">
          {formations.map((f) => (
            <button
              key={f.value}
              onClick={() => setFormation(f.value)}
              className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                currentFormation === f.value 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                  : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Swarm Size Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-zinc-400 font-medium">Swarm Count</label>
          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{droneCount}</span>
        </div>
        <input 
          type="range" 
          min="10" 
          max="500" 
          step="10"
          value={droneCount}
          onChange={(e) => setDroneCount(parseInt(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Debug Visuals Toggle */}
      <div className="pt-2 border-t border-zinc-800/80">
        <button
          onClick={toggleDebugVisuals}
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
            showDebugVisuals 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
          }`}
        >
          {showDebugVisuals ? <Eye size={14} /> : <EyeOff size={14} />}
          {showDebugVisuals ? 'Debug Visuals: On' : 'Debug Visuals: Off'}
        </button>
      </div>

      {/* Obstacle Management Toolbar */}
      <div className="pt-2 border-t border-zinc-800/80">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-zinc-400 font-medium">Obstacles ({obstacles.length})</label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddObstacle}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors"
          >
            <Plus size={14} /> Add Obstacle
          </button>
          
          <button
            onClick={clearAllObstacles}
            disabled={obstacles.length === 0}
            className={`flex items-center justify-center py-2 px-3 rounded-xl transition-colors ${
              obstacles.length > 0 
                ? 'bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-400' 
                : 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
            }`}
            title="Clear All Obstacles"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Selected Obstacle Inspector */}
      {selectedObstacle && (
        <div className="bg-zinc-900/80 border border-zinc-700/50 p-3 rounded-xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
              <ShieldAlert size={14} className="text-red-400"/> Selected Obstacle
            </span>
            <button 
              onClick={() => removeObstacle(selectedObstacle.id)}
              className="text-zinc-500 hover:text-red-400 transition-colors"
              title="Delete Obstacle"
            >
              <Trash2 size={14} />
            </button>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-zinc-400">Radius</label>
              <span className="text-[10px] font-mono text-zinc-300">{selectedObstacle.radius.toFixed(1)}m</span>
            </div>
            <input 
              type="range" 
              min="2.0" 
              max="20.0" 
              step="0.5"
              value={selectedObstacle.radius}
              onChange={(e) => updateObstacleRadius(selectedObstacle.id, parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SwarmController;
