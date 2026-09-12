import React from 'react';
import { Globe2 } from 'lucide-react';
import { SCENARIOS } from '../../scenarios/presets';
import { useSimulationStore } from '../../store/useSimulationStore';

const ScenarioPanel: React.FC = () => {
  const currentScenario = useSimulationStore((state) => state.currentScenario);
  const loadScenario = useSimulationStore((state) => state.loadScenario);

  return (
    <section className="pointer-events-auto w-84 rounded-2xl border border-violet-500/20 bg-zinc-950/75 p-4 shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2 border-b border-zinc-800/80 pb-3">
        <Globe2 size={14} className="text-violet-300" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Training scenarios</h2>
      </div>
      <div className="flex flex-col gap-2">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => loadScenario(scenario)}
            className={`flex items-start justify-between gap-3 rounded-xl border p-2.5 text-left transition-colors ${
              currentScenario === scenario.id
                ? 'border-violet-400/40 bg-violet-500/15'
                : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/80'
            }`}
          >
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-zinc-200">{scenario.name}</span>
              <span className="mt-1 block text-[10px] leading-relaxed text-zinc-500">{scenario.summary}</span>
            </span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-500">{scenario.droneCount} UAV</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ScenarioPanel;