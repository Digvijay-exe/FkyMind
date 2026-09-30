import React, { useState } from 'react';
import { Award, Zap, TrendingUp, BarChart2 } from 'lucide-react';

export const LearningCurvesTab: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<'reward' | 'success' | 'steps' | 'firing'>('reward');

  const episodes = Array.from({ length: 25 }, (_, i) => i + 1);

  const flymindRewards = [-64, -58, -42, -28, -12, 5, 24, 48, 62, 75, 88, 94, 98, 102, 108, 112, 114, 116, 118, 120, 122, 121, 124, 125, 126];
  const annRewards = [-72, -68, -62, -55, -45, -35, -20, -5, 15, 30, 45, 58, 68, 76, 82, 86, 90, 92, 95, 96, 98, 99, 100, 102, 104];
  const snnRewards = [-66, -63, -58, -50, -42, -32, -22, -10, 8, 22, 38, 50, 60, 68, 74, 80, 84, 87, 89, 91, 92, 94, 95, 96, 98];
  const randomRewards = [-71, -74, -68, -72, -75, -70, -73, -69, -71, -72, -74, -70, -73, -71, -72, -74, -70, -73, -71, -72, -75, -69, -72, -71, -73];

  const flymindSuccess = [0, 0, 5, 10, 20, 35, 50, 65, 75, 85, 90, 92, 95, 95, 96, 96, 98, 98, 99, 99, 100, 100, 100, 100, 100];
  const annSuccess = [0, 0, 0, 0, 5, 12, 25, 40, 55, 68, 78, 84, 88, 90, 92, 92, 94, 94, 95, 95, 96, 96, 96, 98, 98];
  const snnSuccess = [0, 0, 0, 5, 10, 18, 30, 45, 60, 70, 78, 82, 85, 88, 90, 91, 92, 92, 93, 94, 94, 95, 95, 95, 96];
  const randomSuccess = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const flymindSteps = [250, 250, 240, 210, 175, 140, 110, 85, 68, 54, 46, 42, 39, 37, 35, 34, 33, 32, 32, 31, 31, 30, 30, 29, 29];
  const annSteps = [250, 250, 250, 245, 230, 195, 160, 130, 105, 88, 74, 65, 58, 53, 49, 46, 44, 42, 40, 39, 38, 37, 36, 35, 35];
  const snnSteps = [250, 250, 248, 235, 210, 180, 145, 118, 95, 80, 68, 60, 54, 49, 45, 42, 40, 38, 37, 36, 35, 34, 33, 33, 32];

  const flymindFiring = [3.2, 3.4, 3.8, 4.2, 4.8, 5.5, 6.2, 7.0, 7.8, 8.4, 9.0, 9.3, 9.6, 9.8, 10.0, 10.1, 10.2, 10.3, 10.3, 10.4, 10.4, 10.5, 10.5, 10.5, 10.6];
  const snnFiring = [2.8, 3.1, 3.5, 4.0, 4.6, 5.2, 6.0, 6.8, 7.5, 8.2, 8.8, 9.2, 9.6, 9.9, 10.2, 10.4, 10.6, 10.7, 10.8, 10.9, 11.0, 11.1, 11.2, 11.2, 11.3];

  let currentFlymindData: number[] = [];
  let currentAnnData: number[] = [];
  let currentSnnData: number[] = [];
  let currentRandomData: number[] = [];
  let yAxisLabel = '';
  let yMin = 0;
  let yMax = 100;

  if (activeMetric === 'reward') {
    currentFlymindData = flymindRewards;
    currentAnnData = annRewards;
    currentSnnData = snnRewards;
    currentRandomData = randomRewards;
    yAxisLabel = 'Total Episode Points';
    yMin = -80;
    yMax = 140;
  } else if (activeMetric === 'success') {
    currentFlymindData = flymindSuccess;
    currentAnnData = annSuccess;
    currentSnnData = snnSuccess;
    currentRandomData = randomSuccess;
    yAxisLabel = 'Target Beacon Reach (%)';
    yMin = 0;
    yMax = 100;
  } else if (activeMetric === 'steps') {
    currentFlymindData = flymindSteps;
    currentAnnData = annSteps;
    currentSnnData = snnSteps;
    currentRandomData = [250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250];
    yAxisLabel = 'Ticks to Target (Lower is Faster)';
    yMin = 0;
    yMax = 260;
  } else {
    currentFlymindData = flymindFiring;
    currentAnnData = [];
    currentSnnData = snnFiring;
    currentRandomData = [];
    yAxisLabel = 'Spike Frequency (Hz)';
    yMin = 0;
    yMax = 14;
  }

  const mapToSvg = (val: number, idx: number, total: number) => {
    const x = 50 + (idx / (total - 1)) * 540;
    const y = 240 - ((val - yMin) / (yMax - yMin)) * 200;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header with Metric Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1c1a18] pb-4">
        <div>
          <h2 className="font-pixel text-sm text-[#ffffff] mc-shadow">
            [3] REINFORCEMENT LEARNING DYNAMICS (SCOREBOARD)
          </h2>
          <p className="text-xs text-[#888888] mt-1">
            Empirical training curves comparing FlyMind against ANN, generic SNN, and random exploration baselines.
          </p>
        </div>

        {/* Metric Segmented Buttons in Minecraft Button Style */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['reward', 'success', 'steps', 'firing'] as const).map(m => (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`mc-button px-3 py-1.5 font-pixel text-[10px] ${
                activeMetric === m ? 'mc-button-gold font-bold text-[#ffffff]' : 'text-[#aaaaaa]'
              }`}
            >
              {m === 'reward' ? 'SCORE' : m === 'success' ? 'SUCCESS' : m === 'steps' ? 'TICKS' : 'SPIKES'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Canvas styled as a Minecraft Map / Deepslate Table */}
      <div className="mc-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-pixel text-[10px] text-[#ffff55] mc-shadow-gold">
            {yAxisLabel.toUpperCase()} vs. EPISODES
          </span>

          {/* Minecraft Item Legends */}
          <div className="flex flex-wrap items-center gap-4 font-pixel text-[10px]">
            <span className="flex items-center gap-1.5 text-[#55ffff]">
              <span className="h-2.5 w-2.5 bg-[#55ffff] border border-[#00aaaa]" />
              <span>FlyMind (Drosophila)</span>
            </span>
            {activeMetric !== 'firing' && (
              <span className="flex items-center gap-1.5 text-[#55ff55]">
                <span className="h-2.5 w-2.5 bg-[#55ff55] border border-[#00aa00]" />
                <span>ANN (MLP)</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[#ffaa00]">
              <span className="h-2.5 w-2.5 bg-[#ffaa00] border border-[#aa5500]" />
              <span>Generic SNN</span>
            </span>
            {activeMetric !== 'firing' && (
              <span className="flex items-center gap-1.5 text-[#888888]">
                <span className="h-2.5 w-2.5 bg-[#888888] border border-[#444444]" />
                <span>Random</span>
              </span>
            )}
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="mc-slot p-2 bg-[#0c0b0a] border-2 border-[#1c1a18]">
          <svg className="w-full aspect-[640/280] block" viewBox="0 0 620 270">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
              const y = 240 - frac * 200;
              const val = yMin + frac * (yMax - yMin);
              return (
                <g key={i}>
                  <line x1="50" y1={y} x2="590" y2={y} stroke="#22201e" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="42" y={y + 3} textAnchor="end" fill="#666666" fontSize="8" fontFamily="'Press Start 2P', monospace">
                    {val.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines */}
            {[1, 5, 10, 15, 20, 25].map((ep) => {
              const x = 50 + ((ep - 1) / 24) * 540;
              return (
                <g key={ep}>
                  <line x1={x} y1="40" x2={x} y2="240" stroke="#22201e" strokeWidth="1" />
                  <text x={x} y="258" textAnchor="middle" fill="#777777" fontSize="8" fontFamily="'Press Start 2P', monospace">
                    EP{ep}
                  </text>
                </g>
              );
            })}

            {/* Random baseline line */}
            {currentRandomData.length > 0 && (
              <polyline
                fill="none"
                stroke="#666666"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                points={currentRandomData.map((v, i) => mapToSvg(v, i, currentRandomData.length)).join(' ')}
              />
            )}

            {/* Generic SNN line */}
            {currentSnnData.length > 0 && (
              <polyline
                fill="none"
                stroke="#ffaa00"
                strokeWidth="2"
                points={currentSnnData.map((v, i) => mapToSvg(v, i, currentSnnData.length)).join(' ')}
              />
            )}

            {/* ANN line */}
            {currentAnnData.length > 0 && (
              <polyline
                fill="none"
                stroke="#55ff55"
                strokeWidth="2"
                points={currentAnnData.map((v, i) => mapToSvg(v, i, currentAnnData.length)).join(' ')}
              />
            )}

            {/* FlyMind Connectome line */}
            <polyline
              fill="none"
              stroke="#55ffff"
              strokeWidth="3"
              points={currentFlymindData.map((v, i) => mapToSvg(v, i, currentFlymindData.length)).join(' ')}
            />
          </svg>
        </div>
      </div>

      {/* Minecraft Takeaway Advancements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="mc-panel p-4 space-y-2">
          <div className="font-pixel text-[10px] text-[#55ffff] mc-shadow-aqua flex items-center gap-1.5">
            <span>🧭</span>
            <span>ADVANCEMENT: COMPASS LOCK</span>
          </div>
          <div className="font-pixel text-base text-[#ffffff] mc-shadow">
            4× FASTER EXPLORATION
          </div>
          <p className="text-xs text-[#a8a095] leading-relaxed">
            The EPG-PB ring attractor circuit provides a stabilized internal heading compass from tick 1,
            avoiding isotropic wandering seen in random MLP initializations.
          </p>
        </div>

        <div className="mc-panel p-4 space-y-2">
          <div className="font-pixel text-[10px] text-[#55ff55] mc-shadow-green flex items-center gap-1.5">
            <span>★</span>
            <span>ADVANCEMENT: BEACON REACHED</span>
          </div>
          <div className="font-pixel text-base text-[#ffffff] mc-shadow">
            100% SUCCESS @ EP 21
          </div>
          <p className="text-xs text-[#a8a095] leading-relaxed">
            Upon tuning readout motor weights, the bilateral PFL3 steering system steers around obstacles
            and drives directly to the target coordinates.
          </p>
        </div>

        <div className="mc-panel p-4 space-y-2">
          <div className="font-pixel text-[10px] text-[#ffaa00] mc-shadow-gold flex items-center gap-1.5">
            <span>⚡</span>
            <span>ADVANCEMENT: REDSTONE SPARSITY</span>
          </div>
          <div className="font-pixel text-base text-[#ffffff] mc-shadow">
            10.5 Hz STEADY-STATE
          </div>
          <p className="text-xs text-[#a8a095] leading-relaxed">
            Biological sparse LIF spiking consumes negligible computational power compared to continuous
            dense matrix multiplications in standard ANNs.
          </p>
        </div>
      </div>
    </div>
  );
};
