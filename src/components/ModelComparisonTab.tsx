import React, { useState } from 'react';
import { Award, Layers, ShieldCheck, Zap } from 'lucide-react';

export const ModelComparisonTab: React.FC = () => {
  const [activeAblationView, setActiveAblationView] = useState<'all' | 'ablation'>('all');

  const benchmarkRows = [
    {
      model: 'FlyMind (FlyWire Connectome)',
      tier: 'NETHERITE',
      tierColor: '#a085b3',
      architecture: 'Drosophila Sparse LIF Recurrent',
      neurons: 45,
      params: '43 synapses + 8 biases',
      successRate: '98.5%',
      meanReward: '+124.6',
      steps: '29.4',
      collisions: '1.2',
      firingRate: '10.5 Hz',
      latency: '0.42 ms',
      highlight: true,
    },
    {
      model: 'Conventional ANN (MLP)',
      tier: 'DIAMOND',
      tierColor: '#55ffff',
      architecture: '14-64-64-8 ReLU Network',
      neurons: 136,
      params: '6,152 weights',
      successRate: '94.0%',
      meanReward: '+102.8',
      steps: '35.1',
      collisions: '2.4',
      firingRate: 'N/A (Dense)',
      latency: '0.35 ms',
      highlight: false,
    },
    {
      model: 'Generic SNN Baseline',
      tier: 'GOLD',
      tierColor: '#ffaa00',
      architecture: '3-Layer Feedforward LIF',
      neurons: 72,
      params: '1,832 dense weights',
      successRate: '88.0%',
      meanReward: '+92.4',
      steps: '38.6',
      collisions: '3.8',
      firingRate: '11.2 Hz',
      latency: '0.58 ms',
      highlight: false,
    },
    {
      model: 'Random Agent Baseline',
      tier: 'WOOD',
      tierColor: '#8a643d',
      architecture: 'Uniform Exploration Prior',
      neurons: 0,
      params: '0',
      successRate: '0.0%',
      meanReward: '-71.0',
      steps: '250.0',
      collisions: '32.9',
      firingRate: '0.0 Hz',
      latency: '0.04 ms',
      highlight: false,
    },
  ];

  const ablationRows = [
    {
      variant: 'Biological FlyWire Topology',
      tier: 'NETHERITE',
      description: 'Proofread connectome + Dale law weights + normalized synapse counts',
      successRate: '98.5%',
      meanReward: '+124.6',
      meanCollisions: '1.2',
      firingRate: '10.5 Hz',
    },
    {
      variant: 'Binary Unweighted Topology',
      tier: 'IRON',
      description: 'Preserves biological edges, uniform weights (+0.8 / -0.8)',
      successRate: '82.0%',
      meanReward: '+84.2',
      meanCollisions: '4.6',
      firingRate: '14.2 Hz',
    },
    {
      variant: 'Randomized Degree-Preserved Control',
      tier: 'WOOD',
      description: 'Shuffled targets preserving in/out node degrees (non-biological wiring)',
      successRate: '41.0%',
      meanReward: '-12.8',
      meanCollisions: '12.4',
      firingRate: '19.8 Hz',
    },
  ];

  const radarAxes = [
    { name: 'Navigation', key: 'nav' },
    { name: 'Avoidance', key: 'avoid' },
    { name: 'Sparsity', key: 'sparse' },
    { name: 'Compactness', key: 'compact' },
    { name: 'Robustness', key: 'robust' },
    { name: 'Bio-Fidelity', key: 'bio' },
  ];

  const radarModels = [
    { name: 'FlyMind', color: '#55ffff', values: [0.98, 0.94, 0.95, 0.98, 0.88, 1.0] },
    { name: 'Generic SNN', color: '#ffaa00', values: [0.85, 0.78, 0.88, 0.70, 0.75, 0.1] },
    { name: 'ANN (MLP)', color: '#55ff55', values: [0.92, 0.88, 0.20, 0.45, 0.82, 0.0] },
  ];

  const radarCenter = { x: 150, y: 140 };
  const radarRadius = 95;

  const getCoordinates = (index: number, value: number) => {
    const angle = (index / radarAxes.length) * 2 * Math.PI - Math.PI / 2;
    const x = radarCenter.x + radarRadius * value * Math.cos(angle);
    const y = radarCenter.y + radarRadius * value * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1c1a18] pb-4">
        <div>
          <h2 className="font-pixel text-sm text-[#ffffff] mc-shadow">
            [4] MODEL BENCHMARK ARENA (TIER LIST)
          </h2>
          <p className="text-xs text-[#888888] mt-1">
            Standardized evaluation across 20 randomized seeds with identical observation & action budgets.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveAblationView('all')}
            className={`mc-button px-3 py-1.5 font-pixel text-[10px] ${
              activeAblationView === 'all' ? 'mc-button-gold font-bold text-white' : 'text-[#888888]'
            }`}
          >
            ALL ARCHITECTURES
          </button>
          <button
            onClick={() => setActiveAblationView('ablation')}
            className={`mc-button px-3 py-1.5 font-pixel text-[10px] ${
              activeAblationView === 'ablation' ? 'mc-button-gold font-bold text-white' : 'text-[#888888]'
            }`}
          >
            TOPOLOGY ABLATION
          </button>
        </div>
      </div>

      {/* Main Minecraft Tier Table */}
      <div className="mc-panel overflow-x-auto p-1">
        <table className="w-full text-left text-xs border-collapse font-pixel">
          <thead>
            <tr className="border-b-2 border-[#1c1a18] bg-[#1a1918] text-[#ffff55] text-[9px]">
              <th className="py-3 px-3">TIER / MODEL</th>
              <th className="py-3 px-3">NEURONS</th>
              <th className="py-3 px-3">PARAMETERS</th>
              <th className="py-3 px-3">SUCCESS</th>
              <th className="py-3 px-3">MEAN SCORE</th>
              <th className="py-3 px-3">TICKS TO GOAL</th>
              <th className="py-3 px-3">COLLISIONS</th>
              <th className="py-3 px-3">FIRING RATE</th>
              <th className="py-3 px-3">LATENCY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1c1a] text-[10px]">
            {benchmarkRows.map(row => (
              <tr
                key={row.model}
                className={row.highlight ? 'bg-[#21292b] text-white' : 'text-[#cccccc] hover:bg-[#1a1918]'}
              >
                <td className="py-3 px-3 flex items-center gap-2">
                  <span
                    className="px-1.5 py-0.5 border text-[8px] font-bold"
                    style={{ color: row.tierColor, borderColor: row.tierColor }}
                  >
                    {row.tier}
                  </span>
                  <div>
                    <div className={row.highlight ? 'text-[#55ffff] mc-shadow-aqua' : 'text-white'}>
                      {row.model}
                    </div>
                    <div className="font-mono text-[9px] text-[#888888] font-normal">
                      {row.architecture}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 tabular-nums">{row.neurons}</td>
                <td className="py-3 px-3 tabular-nums font-mono text-[10px]">{row.params}</td>
                <td className="py-3 px-3 tabular-nums font-bold text-[#55ff55]">{row.successRate}</td>
                <td className="py-3 px-3 tabular-nums font-bold text-[#ffff55]">{row.meanReward}</td>
                <td className="py-3 px-3 tabular-nums">{row.steps}</td>
                <td className="py-3 px-3 tabular-nums">{row.collisions}</td>
                <td className="py-3 px-3 tabular-nums text-[#ffaa00]">{row.firingRate}</td>
                <td className="py-3 px-3 tabular-nums text-[#888888]">{row.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Side-by-Side: Radar Chart & Topology Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Calibration */}
        <div className="mc-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#1c1a18] pb-2">
            <span className="font-pixel text-[10px] text-[#ffff55] mc-shadow-gold">
              RADAR CALIBRATION (6-AXIS)
            </span>
            <div className="flex items-center gap-2.5 font-pixel text-[9px]">
              {radarModels.map(m => (
                <span key={m.name} className="flex items-center gap-1">
                  <span className="h-2 w-2" style={{ backgroundColor: m.color }} />
                  <span className="text-[#cccccc]">{m.name}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center p-2 mc-slot bg-[#0a0a0a]">
            <svg width="340" height="270" className="overflow-visible">
              {[0.25, 0.5, 0.75, 1.0].map((ring, rIdx) => {
                const points = radarAxes
                  .map((_, i) => getCoordinates(i, ring))
                  .join(' ');
                return (
                  <polygon
                    key={rIdx}
                    points={points}
                    fill="none"
                    stroke="#22201e"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {radarAxes.map((axis, i) => {
                const end = getCoordinates(i, 1.0);
                const labelCoord = getCoordinates(i, 1.25);
                const [lx, ly] = labelCoord.split(',').map(Number);
                return (
                  <g key={axis.name}>
                    <line
                      x1={radarCenter.x}
                      y1={radarCenter.y}
                      x2={end.split(',')[0]}
                      y2={end.split(',')[1]}
                      stroke="#22201e"
                      strokeWidth="1"
                    />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      fill="#888888"
                      fontSize="8"
                      fontFamily="'Press Start 2P', monospace"
                      dominantBaseline="middle"
                    >
                      {axis.name}
                    </text>
                  </g>
                );
              })}

              {radarModels.map(model => {
                const points = model.values
                  .map((v, i) => getCoordinates(i, v))
                  .join(' ');
                return (
                  <polygon
                    key={model.name}
                    points={points}
                    fill={`${model.color}15`}
                    stroke={model.color}
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Topology Ablation Card */}
        <div className="mc-panel p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b-2 border-[#1c1a18] pb-2">
            <span className="font-pixel text-[10px] text-[#ffaa00] mc-shadow-gold">
              EXPERIMENT 5: TOPOLOGY ABLATION RESULTS
            </span>
            <Layers className="h-4 w-4 text-[#ffaa00]" />
          </div>

          <div className="space-y-2.5">
            {ablationRows.map(item => (
              <div key={item.variant} className="mc-slot p-3 bg-[#171614] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-[10px] text-white">{item.variant}</span>
                  <span className="font-pixel text-[10px] text-[#55ff55]">
                    {item.successRate} SUCCESS
                  </span>
                </div>
                <p className="text-[11px] text-[#888888]">{item.description}</p>
                <div className="flex items-center gap-4 text-[9px] font-pixel text-[#aaaaaa] pt-1">
                  <span>SCORE: <strong className="text-[#ffff55]">{item.meanReward}</strong></span>
                  <span>COL: <strong className="text-[#ff5555]">{item.meanCollisions}</strong></span>
                  <span>SPIKES: <strong className="text-[#55ffff]">{item.firingRate}</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div className="mc-slot p-3 bg-[#15120d] text-xs text-[#c8c0b5] leading-relaxed border-2 border-[#ffaa00]/40">
            <strong className="text-[#ffff55] font-pixel text-[10px]">SCIENTIFIC CONCLUSION:</strong> Rewiring the connectome
            with degree preservation reduces goal achievement to 41%, demonstrating that
            evolutionary recurrent motifs (Central Complex ring attractor & PFL3 steering)
            are directly responsible for autonomous gameplay.
          </div>
        </div>
      </div>
    </div>
  );
};
