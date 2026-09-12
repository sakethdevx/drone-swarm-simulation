import React from 'react';
import { ArrowDown, ArrowUp, MapPin, Trash2 } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

const WaypointMissionPanel: React.FC = () => {
  const waypoints = useSimulationStore((state) => state.waypoints);
  const updateWaypoint = useSimulationStore((state) => state.updateWaypoint);
  const removeWaypoint = useSimulationStore((state) => state.removeWaypoint);
  const moveWaypoint = useSimulationStore((state) => state.moveWaypoint);

  return (
    <section className="pointer-events-auto flex w-84 flex-col gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-950/70 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-amber-300" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Mission route</h2>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">{waypoints.length} points</span>
      </div>

      {waypoints.length === 0 ? (
        <p className="text-xs leading-relaxed text-zinc-500">Shift-click the flight area to add the first waypoint.</p>
      ) : (
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
          {waypoints.map((waypoint, index) => (
            <div key={waypoint.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <input
                  value={waypoint.label ?? `Waypoint ${index + 1}`}
                  onChange={(event) => updateWaypoint(waypoint.id, { label: event.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-zinc-200 outline-none placeholder:text-zinc-600"
                  aria-label={`Waypoint ${index + 1} name`}
                />
                <span className="font-mono text-[10px] text-amber-300">WP {String(index + 1).padStart(2, '0')}</span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <label className="text-[10px] text-zinc-500">
                  Altitude
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={waypoint.position[1]}
                      onChange={(event) => updateWaypoint(waypoint.id, {
                        position: [waypoint.position[0], Number(event.target.value), waypoint.position[2]],
                      })}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:border-cyan-500"
                    />
                    <span className="font-mono text-[10px] text-zinc-600">m</span>
                  </div>
                </label>

                <div className="flex items-center gap-1 self-end">
                  <button
                    onClick={() => moveWaypoint(waypoint.id, 'up')}
                    disabled={index === 0}
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move waypoint earlier"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => moveWaypoint(waypoint.id, 'down')}
                    disabled={index === waypoints.length - 1}
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move waypoint later"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => removeWaypoint(waypoint.id)}
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-500/20 hover:text-red-300"
                    title="Delete waypoint"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default WaypointMissionPanel;