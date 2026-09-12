import React, { useRef, useState } from 'react';
import { ImagePlus, ScanFace, Trash2 } from 'lucide-react';
import { createImageFormation } from '../../math/imageFormation';
import { useSimulationStore } from '../../store/useSimulationStore';

const ImageFormationPanel: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const droneCount = useSimulationStore((state) => state.droneCount);
  const imageFormationName = useSimulationStore((state) => state.imageFormationName);
  const imageFormationPreview = useSimulationStore((state) => state.imageFormationPreview);
  const setImageFormation = useSimulationStore((state) => state.setImageFormation);
  const clearImageFormation = useSimulationStore((state) => state.clearImageFormation);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const formation = await createImageFormation(file);
      setImageFormation(formation.points, file.name, formation.preview, formation.suggestedDroneCount);
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Image processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="pointer-events-auto w-84 rounded-2xl border border-cyan-500/20 bg-zinc-950/75 p-4 shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ScanFace size={14} className="text-cyan-300" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Image show</h2>
        </div>
        {imageFormationName && (
          <button onClick={clearImageFormation} className="text-zinc-500 transition-colors hover:text-red-300" title="Clear image formation">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {imageFormationPreview ? (
        <div className="mb-3 flex gap-3">
          <img src={imageFormationPreview} alt="Uploaded formation preview" className="h-16 w-16 rounded-lg border border-zinc-700 object-cover" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-200">{imageFormationName}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{droneCount} colored dots generated from the subject. Image mode selects the show density automatically.</p>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-[10px] leading-relaxed text-zinc-500">Upload a transparent or high-contrast person image. Processing stays in the browser.</p>
      )}

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void handleFile(file);
        event.target.value = '';
      }} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20 disabled:cursor-wait disabled:opacity-60"
      >
        <ImagePlus size={14} /> {isProcessing ? 'Sampling image...' : imageFormationName ? 'Replace image' : 'Upload person image'}
      </button>
      {error && <p className="mt-2 text-[10px] text-red-300">{error}</p>}
    </section>
  );
};

export default ImageFormationPanel;
