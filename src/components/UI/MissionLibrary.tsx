import React, { useState } from 'react';
import { Download, FolderOpen, Save, Trash2 } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

const MissionLibrary: React.FC = () => {
  const [missionName, setMissionName] = useState('');
  const savedMissions = useSimulationStore((state) => state.savedMissions);
  const currentMissionName = useSimulationStore((state) => state.currentMissionName);
  const saveMission = useSimulationStore((state) => state.saveMission);
  const loadMission = useSimulationStore((state) => state.loadMission);
  const deleteMission = useSimulationStore((state) => state.deleteMission);

  const handleSave = () => {
    saveMission(missionName || currentMissionName || `Mission ${savedMissions.length + 1}`);
    setMissionName('');
  };

  return (
    <section className="pointer-events-auto w-84 rounded-2xl border border-emerald-500/20 bg-zinc-950/75 p-4 shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2 border-b border-zinc-800/80 pb-3">
        <FolderOpen size={14} className="text-emerald-300" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Mission library</h2>
      </div>
      <div className="flex gap-2">
        <input
          value={missionName}
          onChange={(event) => setMissionName(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') handleSave(); }}
          placeholder="Mission name"
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500"
          aria-label="Mission name"
        />
        <button
          onClick={handleSave}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-emerald-200 transition-colors hover:bg-emerald-500/20"
          title="Save current mission"
        >
          <Save size={14} />
        </button>
      </div>
      {savedMissions.length === 0 ? (
        <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">Save a route, formation, obstacles, and flight settings for later.</p>
      ) : (
        <div className="mt-3 flex max-h-36 flex-col gap-2 overflow-y-auto">
          {savedMissions.map((mission) => (
            <div key={mission.id} className={`flex items-center gap-2 rounded-lg border p-2 ${currentMissionName === mission.name ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900/60'}`}>
              <button onClick={() => loadMission(mission.id)} className="min-w-0 flex-1 text-left" title={`Load ${mission.name}`}>
                <span className="block truncate text-xs font-medium text-zinc-200">{mission.name}</span>
                <span className="font-mono text-[10px] text-zinc-500">{mission.droneCount} UAV · {mission.waypoints.length} points</span>
              </button>
              <button onClick={() => loadMission(mission.id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-emerald-300" title="Load mission">
                <Download size={13} />
              </button>
              <button onClick={() => deleteMission(mission.id)} className="rounded p-1.5 text-zinc-500 hover:bg-red-500/20 hover:text-red-300" title="Delete mission">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MissionLibrary;
