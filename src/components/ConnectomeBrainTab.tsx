import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ConnectomeData } from '../types';
import { Zap, RefreshCw, Compass, Eye, Sparkles } from 'lucide-react';

interface ConnectomeBrainTabProps {
  connectome: ConnectomeData;
  activeSpikingNeurons: number[];
  neuronVoltages: number[];
  firingRateHz: number;
}

export const ConnectomeBrainTab: React.FC<ConnectomeBrainTabProps> = ({
  connectome,
  activeSpikingNeurons,
  neuronVoltages,
  firingRateHz,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0.4);
  const [pitchAngle, setPitchAngle] = useState(0.2);
  const [selectedNeuronIdx, setSelectedNeuronIdx] = useState<number>(8); // Default EPG_01
  const [voltageHistory, setVoltageHistory] = useState<number[]>([]);
  const [rasterHistory, setRasterHistory] = useState<Array<number[]>>([]);

  // Minecraft Ore & Block Transmitter Palette
  const txColors: Record<string, { fill: string; stroke: string; label: string; block: string }> = {
    ACH: { fill: '#55ffff', stroke: '#00aaaa', label: 'Diamond / Lapis (ACh Excitatory)', block: '💎' },
    GABA: { fill: '#ff5555', stroke: '#aa0000', label: 'Redstone (GABA Inhibitory)', block: '🔴' },
    GLUT: { fill: '#ffaa00', stroke: '#aa5500', label: 'Glowstone (GluCl Inhibitory)', block: '🟡' },
    DOPAMINE: { fill: '#aa00aa', stroke: '#550055', label: 'Amethyst (Dopamine Modulator)', block: '🟣' },
    UNKNOWN: { fill: '#aaaaaa', stroke: '#555555', label: 'Stone', block: '⚪' },
  };

  useEffect(() => {
    if (neuronVoltages.length > 0 && selectedNeuronIdx < neuronVoltages.length) {
      setVoltageHistory(prev => {
        const next = [...prev, neuronVoltages[selectedNeuronIdx]];
        if (next.length > 80) next.shift();
        return next;
      });
    }

    setRasterHistory(prev => {
      const next = [...prev, [...activeSpikingNeurons]];
      if (next.length > 40) next.shift();
      return next;
    });
  }, [neuronVoltages, activeSpikingNeurons, selectedNeuronIdx]);

  const normalizedNeurons = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    connectome.neurons.forEach(n => {
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      minZ = Math.min(minZ, n.z); maxZ = Math.max(maxZ, n.z);
    });

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const spanZ = maxZ - minZ || 1;

    return connectome.neurons.map(n => ({
      ...n,
      nx: ((n.x - minX) / spanX - 0.5) * 2,
      ny: ((n.y - minY) / spanY - 0.5) * 2,
      nz: ((n.z - minZ) / spanZ - 0.5) * 2,
    }));
  }, [connectome]);

  const idToIdx = useMemo(() => {
    const map = new Map<string, number>();
    connectome.neurons.forEach((n, i) => map.set(n.id, i));
    return map;
  }, [connectome]);

  // Render 3D Connectome Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Obsidian Nether / End Sky Background
    ctx.fillStyle = '#100c14';
    ctx.fillRect(0, 0, w, h);

    // Subtle end gateway grid
    ctx.strokeStyle = 'rgba(85, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.38;

    const cosR = Math.cos(rotationAngle);
    const sinR = Math.sin(rotationAngle);
    const cosP = Math.cos(pitchAngle);
    const sinP = Math.sin(pitchAngle);

    const projected = normalizedNeurons.map((n, idx) => {
      const x1 = n.nx * cosR - n.nz * sinR;
      const z1 = n.nx * sinR + n.nz * cosR;

      const y2 = n.ny * cosP - z1 * sinP;
      const z2 = n.ny * sinP + z1 * cosP;

      const fov = 3.0;
      const depth = fov / (fov + z2 * 0.8);
      const px = cx + x1 * scale * depth;
      const py = cy + y2 * scale * depth;

      return {
        px,
        py,
        depth,
        z: z2,
        neuron: n,
        idx,
        isSpiking: activeSpikingNeurons.includes(idx),
      };
    });

    projected.sort((a, b) => a.z - b.z);

    // Draw Synapses (Redstone & Lapis wire lines)
    connectome.synapses.forEach(s => {
      const srcIdx = idToIdx.get(s.source);
      const tgtIdx = idToIdx.get(s.target);
      if (srcIdx === undefined || tgtIdx === undefined) return;

      const pSrc = projected.find(p => p.idx === srcIdx);
      const pTgt = projected.find(p => p.idx === tgtIdx);
      if (!pSrc || !pTgt) return;

      const tx = pSrc.neuron.neurotransmitter;
      const isSrcSpiking = activeSpikingNeurons.includes(srcIdx);

      ctx.beginPath();
      ctx.moveTo(pSrc.px, pSrc.py);
      ctx.lineTo(pTgt.px, pTgt.py);

      if (isSrcSpiking) {
        ctx.strokeStyle = '#ffff55'; // Bright Gold Redstone Pulse
        ctx.lineWidth = 2.5;
      } else {
        ctx.strokeStyle = tx === 'GABA'
          ? 'rgba(255, 85, 85, 0.25)'
          : tx === 'GLUT'
          ? 'rgba(255, 170, 0, 0.25)'
          : 'rgba(85, 255, 255, 0.22)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    });

    // Draw Neurons as Isometric Voxel Blocks or Spheres
    projected.forEach(p => {
      const isSelected = p.idx === selectedNeuronIdx;
      const baseR = isSelected ? 8 : p.isSpiking ? 7 : 4;
      const r = baseR * p.depth;

      // Glow when spiking
      if (p.isSpiking) {
        const glow = ctx.createRadialGradient(p.px, p.py, 1, p.px, p.py, r * 3);
        glow.addColorStop(0, 'rgba(255, 255, 85, 0.9)');
        glow.addColorStop(1, 'rgba(255, 255, 85, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.px, p.py, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Voxel Block (square with 3D bevel)
      const bColor = txColors[p.neuron.neurotransmitter] || txColors.UNKNOWN;
      const bSize = r * 1.8;

      ctx.fillStyle = p.isSpiking ? '#ffffff' : bColor.fill;
      ctx.fillRect(p.px - bSize / 2, p.py - bSize / 2, bSize, bSize);

      ctx.strokeStyle = isSelected ? '#ffffff' : bColor.stroke;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(p.px - bSize / 2, p.py - bSize / 2, bSize, bSize);

      // Label for selected or prominent compass neurons
      if (isSelected || (p.neuron.cell_type === 'EPG' && p.idx % 2 === 0) || p.neuron.cell_type.includes('PFL3')) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText(p.neuron.name, p.px + bSize + 2, p.py + 4);
      }
    });
  }, [normalizedNeurons, rotationAngle, pitchAngle, activeSpikingNeurons, selectedNeuronIdx, connectome.synapses, idToIdx]);

  const selectedNeuron = connectome.neurons[selectedNeuronIdx] || connectome.neurons[0];
  const selectedTxInfo = txColors[selectedNeuron.neurotransmitter] || txColors.UNKNOWN;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
      {/* 3D Brain Stage */}
      <div className="lg:col-span-8 space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-[#ffffff] mc-shadow">
              CONNECTOME NEURAL VOXEL CHAMBER (3D)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-pixel">
            <span className="flex items-center gap-1 text-[#55ffff]">
              <span>💎</span>
              <span>ACh (Excit)</span>
            </span>
            <span className="flex items-center gap-1 text-[#ff5555]">
              <span>🔴</span>
              <span>GABA (Inhib)</span>
            </span>
          </div>
        </div>

        {/* 3D Canvas with Crying Obsidian / Nether Portal border */}
        <div className="mc-panel-deepslate p-3 relative shadow-2xl">
          <canvas
            ref={canvasRef}
            width={640}
            height={460}
            className="w-full h-auto aspect-[640/460] block border-2 border-[#1f172b]"
          />

          {/* Camera controls */}
          <div className="absolute bottom-5 left-5 flex items-center gap-2">
            <button
              onClick={() => setRotationAngle(r => r - 0.2)}
              className="mc-button px-2.5 py-1.5 font-pixel text-[9px]"
              title="Rotate Camera Left"
            >
              ⟲ ROT L
            </button>
            <button
              onClick={() => setRotationAngle(r => r + 0.2)}
              className="mc-button px-2.5 py-1.5 font-pixel text-[9px]"
              title="Rotate Camera Right"
            >
              ⟳ ROT R
            </button>
            <button
              onClick={() => { setRotationAngle(0.4); setPitchAngle(0.2); }}
              className="mc-button p-1.5"
              title="Reset 3D View"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#ffff55]" />
            </button>
          </div>

          {/* HUD Firing Rate */}
          <div className="absolute top-5 right-5 mc-slot bg-[#121110]/90 p-3 font-pixel text-[10px] space-y-1 text-right pointer-events-none border-2 border-[#333333]">
            <div className="text-[#ffff55] mc-shadow-gold">FIRING RATE</div>
            <div className="text-[#55ff55] text-base font-bold tabular-nums">
              {firingRateHz.toFixed(1)} <span className="text-[9px] text-[#aaaaaa]">Hz</span>
            </div>
            <div className="text-[#55ffff] text-[9px]">
              SPIKES: {activeSpikingNeurons.length} / {connectome.neurons.length}
            </div>
          </div>
        </div>

        {/* Redstone Circuit Spike Raster Strip */}
        <div className="mc-panel p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] text-[#ff5555] mc-shadow-red uppercase">
              REDSTONE SPIKE RASTER (RECENT TIME TICKS)
            </span>
            <span className="font-pixel text-[9px] text-[#888888]">
              {rasterHistory.length} TICKS
            </span>
          </div>

          <div className="h-20 w-full mc-slot bg-[#0a0a0a] p-1.5 flex items-end gap-1 overflow-hidden">
            {rasterHistory.map((spikes, tIdx) => (
              <div key={tIdx} className="flex-1 h-full flex flex-col justify-end gap-0.5">
                {spikes.map(neuronIdx => (
                  <div
                    key={neuronIdx}
                    className="w-full h-1 bg-[#ff3333] shadow-[0_0_4px_#ff0000]"
                    title={`Neuron ${neuronIdx} emitted action potential`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Biophysics Inspector & Oscillogram */}
      <div className="lg:col-span-4 space-y-4">
        {/* Enchanting / Anvil Neuron Inspector */}
        <div className="mc-panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b-2 border-[#1c1a18] pb-2">
            <span className="font-pixel text-xs text-[#ffff55] mc-shadow-gold">
              NEURON INSPECTOR
            </span>
            <Sparkles className="h-4 w-4 text-[#ffff55]" />
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="font-pixel text-[10px] text-[#aaaaaa] block mb-1">
                SELECT RECORDED UNIT:
              </label>
              <select
                value={selectedNeuronIdx}
                onChange={e => setSelectedNeuronIdx(Number(e.target.value))}
                className="w-full mc-slot bg-[#141210] p-2 font-pixel text-[10px] text-[#55ffff] focus:outline-none"
              >
                {connectome.neurons.map((n, idx) => (
                  <option key={n.id} value={idx}>
                    [{idx}] {n.name} ({n.cell_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 font-pixel text-[10px]">
              <div className="mc-slot p-2 bg-[#171614]">
                <div className="text-[#888888] text-[9px]">TYPE</div>
                <div className="text-white mt-0.5 truncate">{selectedNeuron.cell_type}</div>
              </div>
              <div className="mc-slot p-2 bg-[#171614]">
                <div className="text-[#888888] text-[9px]">TRANSMITTER</div>
                <div className="text-[#55ffff] mt-0.5 truncate">{selectedNeuron.neurotransmitter}</div>
              </div>
              <div className="mc-slot p-2 bg-[#171614] col-span-2">
                <div className="text-[#888888] text-[9px]">CIRCUIT ROLE</div>
                <div className="text-[#e0e0e0] mt-0.5 truncate">{selectedNeuron.role}</div>
              </div>
            </div>
          </div>

          {/* Redstone Wire Oscillogram (Membrane Potential) */}
          <div className="space-y-2 pt-2 border-t-2 border-[#1c1a18]">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[10px] text-[#ff5555] mc-shadow-red">
                V(t) MEMBRANE TRACE
              </span>
              <span className="font-pixel text-[10px] text-[#ffff55] tabular-nums">
                {voltageHistory.length > 0 ? voltageHistory[voltageHistory.length - 1].toFixed(1) : '-65.0'} mV
              </span>
            </div>

            <div className="h-28 w-full mc-slot bg-[#0a0a0a] p-2 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
                {/* Threshold line (-50mV) */}
                <line x1="0" y1="20" x2="100" y2="20" stroke="#ff5555" strokeWidth="1" strokeDasharray="3 3" />
                {/* Resting potential line (-65mV) */}
                <line x1="0" y1="45" x2="100" y2="45" stroke="#444444" strokeWidth="1" strokeDasharray="3 3" />

                {/* Voltage waveform */}
                {voltageHistory.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#55ff55"
                    strokeWidth="1.8"
                    points={voltageHistory
                      .map((v, i) => {
                        const x = (i / (voltageHistory.length - 1)) * 100;
                        const y = 55 - ((v - (-70)) / 20) * 35;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                )}
              </svg>

              <div className="absolute top-1 left-2 font-pixel text-[8px] text-[#ff5555]">V_th (-50 mV)</div>
              <div className="absolute bottom-1 left-2 font-pixel text-[8px] text-[#777777]">V_rest (-65 mV)</div>
            </div>
          </div>
        </div>

        {/* Anatomical Regions / Neuropils Breakdown */}
        <div className="mc-panel p-4 space-y-2.5">
          <span className="font-pixel text-[10px] text-[#ffff55] mc-shadow-gold uppercase block border-b-2 border-[#1c1a18] pb-1.5">
            ANATOMICAL NEUROPIL DIVISIONS
          </span>
          <div className="space-y-1.5 font-pixel text-[10px]">
            <div className="flex items-center justify-between text-[#cccccc]">
              <span>Ellipsoid Body (EB)</span>
              <span className="text-[#55ffff]">8 EPG</span>
            </div>
            <div className="flex items-center justify-between text-[#cccccc]">
              <span>Protocerebral Bridge (PB)</span>
              <span className="text-[#55ffff]">4 PEN/Delta7</span>
            </div>
            <div className="flex items-center justify-between text-[#cccccc]">
              <span>Fan-Shaped Body (FB)</span>
              <span className="text-[#ffaa00]">3 FB4/FB5</span>
            </div>
            <div className="flex items-center justify-between text-[#cccccc]">
              <span>Lateral Accessory (LAL)</span>
              <span className="text-[#55ff55]">4 PFL3/PFL2</span>
            </div>
            <div className="flex items-center justify-between text-[#cccccc]">
              <span>Mushroom Body (MB)</span>
              <span className="text-[#aa00aa]">8 KC/MBON</span>
            </div>
            <div className="flex items-center justify-between text-[#cccccc]">
              <span>Descending Tract (DN)</span>
              <span className="text-[#ff5555]">8 Motor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
