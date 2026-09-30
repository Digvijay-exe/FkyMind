import React, { useState } from 'react';
import { Play, Download, Sliders } from 'lucide-react';
import { ClientMinecraftSimulator } from '../simulation/minecraftSimulator';
import { ClientLIFEngine } from '../simulation/lifEngine';
import { DROSOPHILA_CONNECTOME } from '../data/mockConnectome';
import { ModelType, TopologyType } from '../types';

export const ExperimentLabTab: React.FC = () => {
  const [modelType, setModelType] = useState<ModelType>('flymind');
  const [topologyType, setTopologyType] = useState<TopologyType>('connectome_weighted');
  const [noiseLevel, setNoiseLevel] = useState<number>(0.0);
  const [numObstacles, setNumObstacles] = useState<number>(10);
  const [episodesToRun, setEpisodesToRun] = useState<number>(10);

  const [isRunningExperiment, setIsRunningExperiment] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [completedEpisodes, setCompletedEpisodes] = useState<number>(0);
  const [resultsLog, setResultsLog] = useState<any[]>([]);

  const handleRunBatch = async () => {
    setIsRunningExperiment(true);
    setProgressPercent(0);
    setCompletedEpisodes(0);

    const log: any[] = [];
    const sim = new ClientMinecraftSimulator(32, 32, numObstacles, 42);
    const engine = new ClientLIFEngine(DROSOPHILA_CONNECTOME, topologyType);

    for (let ep = 0; ep < episodesToRun; ep++) {
      const epSeed = 100 + ep * 17;
      sim.reset(epSeed, numObstacles);
      engine.reset();

      let epReward = 0;
      let steps = 0;
      let done = false;
      let collisions = 0;

      while (!done && steps < 250) {
        const obs = sim.getObservationVector(noiseLevel);
        const { action } = engine.processObservation(obs, 6);
        const state = sim.step(action);

        epReward += state.lastReward;
        steps++;
        if (state.collided) collisions++;
        done = state.terminated || state.truncated;
      }

      log.push({
        episode: ep + 1,
        success: sim.distToTarget() <= 1.6,
        reward: Math.round(epReward * 100) / 100,
        steps,
        collisions,
      });

      setCompletedEpisodes(ep + 1);
      setProgressPercent(Math.round(((ep + 1) / episodesToRun) * 100));

      await new Promise(r => setTimeout(r, 20));
    }

    setResultsLog(log);
    setIsRunningExperiment(false);
  };

  const successCount = resultsLog.filter(r => r.success).length;
  const successRate = resultsLog.length > 0 ? (successCount / resultsLog.length) * 100 : 0;
  const meanReward = resultsLog.length > 0 ? resultsLog.reduce((a, b) => a + b.reward, 0) / resultsLog.length : 0;
  const meanSteps = resultsLog.length > 0 ? resultsLog.reduce((a, b) => a + b.steps, 0) / resultsLog.length : 0;

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      config: { modelType, topologyType, noiseLevel, numObstacles, episodesToRun },
      summary: { successRate, meanReward, meanSteps },
      log: resultsLog,
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `flymind_experiment_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 py-2">
      <div className="border-b-2 border-[#1c1a18] pb-4">
        <h2 className="font-pixel text-sm text-[#ffffff] mc-shadow">
          [5] REDSTONE EXPERIMENTATION LAB
        </h2>
        <p className="text-xs text-[#888888] mt-1">
          Execute controlled multi-episode batches in real time to assess network dynamics, sensory noise tolerance, and topology ablations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 mc-panel p-5 space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#1c1a18] pb-2 font-pixel text-xs text-[#ffff55] mc-shadow-gold">
            <Sliders className="h-4 w-4 text-[#ffaa00]" />
            <span>TRIAL PARAMETERS (LEVERS)</span>
          </div>

          {/* Model Type */}
          <div className="space-y-1">
            <label className="font-pixel text-[10px] text-[#cccccc]">MODEL ARCHITECTURE:</label>
            <select
              value={modelType}
              onChange={e => setModelType(e.target.value as ModelType)}
              className="w-full mc-slot bg-[#141210] p-2 font-pixel text-[10px] text-[#55ffff]"
            >
              <option value="flymind">FlyMind (FlyWire Connectome SNN)</option>
              <option value="generic_snn">Generic Feedforward SNN</option>
              <option value="ann">Conventional ANN (MLP)</option>
              <option value="random">Random Agent Baseline</option>
            </select>
          </div>

          {/* Topology Strategy (if FlyMind) */}
          {modelType === 'flymind' && (
            <div className="space-y-1">
              <label className="font-pixel text-[10px] text-[#cccccc]">CONNECTOME STRATEGY:</label>
              <select
                value={topologyType}
                onChange={e => setTopologyType(e.target.value as TopologyType)}
                className="w-full mc-slot bg-[#141210] p-2 font-pixel text-[10px] text-[#ffaa00]"
              >
                <option value="connectome_weighted">Strategy A: Connectome-Weighted + Dale Law</option>
                <option value="binary">Strategy B: Binary Topology</option>
                <option value="random_rewired">Strategy C: Randomized Degree Control</option>
              </select>
            </div>
          )}

          {/* Sensory Noise Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-pixel text-[10px]">
              <span className="text-[#cccccc]">SENSORY NOISE σ:</span>
              <span className="text-[#55ffff] tabular-nums">{noiseLevel.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.5"
              step="0.05"
              value={noiseLevel}
              onChange={e => setNoiseLevel(Number(e.target.value))}
              className="w-full accent-[#55ffff] bg-[#1a1918] rounded h-2"
            />
            <div className="flex justify-between font-pixel text-[8px] text-[#777777]">
              <span>0.0 (Clean)</span>
              <span>0.25 (Mid)</span>
              <span>0.50 (Storm)</span>
            </div>
          </div>

          {/* Obstacle Density */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-pixel text-[10px]">
              <span className="text-[#cccccc]">OBSTACLES:</span>
              <span className="text-[#ffff55] tabular-nums">{numObstacles} blocks</span>
            </div>
            <input
              type="range"
              min="4"
              max="20"
              step="2"
              value={numObstacles}
              onChange={e => setNumObstacles(Number(e.target.value))}
              className="w-full accent-[#ffff55] bg-[#1a1918] rounded h-2"
            />
          </div>

          {/* Batch Episodes */}
          <div className="space-y-1">
            <label className="font-pixel text-[10px] text-[#cccccc]">BATCH RUN EPISODES:</label>
            <input
              type="number"
              min="5"
              max="50"
              value={episodesToRun}
              onChange={e => setEpisodesToRun(Number(e.target.value))}
              className="w-full mc-slot bg-[#141210] p-2 font-pixel text-[10px] text-white"
            />
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunBatch}
            disabled={isRunningExperiment}
            className="mc-button mc-button-green w-full py-3 font-pixel text-xs flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            <span>{isRunningExperiment ? `SIMULATING (${completedEpisodes}/${episodesToRun})...` : 'EXECUTE EXPERIMENT BATCH'}</span>
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Progress Bar */}
          {isRunningExperiment && (
            <div className="mc-panel p-4 space-y-2">
              <div className="flex items-center justify-between font-pixel text-[10px]">
                <span className="text-[#55ffff]">PROCESSING SIMULATION TICKS...</span>
                <span className="text-[#ffff55]">{progressPercent}%</span>
              </div>
              <div className="mc-xp-bar w-full">
                <div className="mc-xp-fill transition-all duration-75" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="mc-panel p-3.5 text-center">
              <div className="font-pixel text-[9px] text-[#888888]">SUCCESS RATE</div>
              <div className="font-pixel text-lg text-[#55ff55] mt-1 tabular-nums">
                {resultsLog.length > 0 ? `${successRate.toFixed(1)}%` : '—'}
              </div>
              <div className="text-[10px] text-[#888888] mt-0.5">
                {resultsLog.length > 0 ? `${successCount} / ${resultsLog.length}` : 'Pending'}
              </div>
            </div>

            <div className="mc-panel p-3.5 text-center">
              <div className="font-pixel text-[9px] text-[#888888]">MEAN SCORE</div>
              <div className={`font-pixel text-lg mt-1 tabular-nums ${meanReward >= 0 ? 'text-[#ffff55]' : 'text-[#ff5555]'}`}>
                {resultsLog.length > 0 ? meanReward.toFixed(1) : '—'}
              </div>
              <div className="text-[10px] text-[#888888] mt-0.5">Points / Ep</div>
            </div>

            <div className="mc-panel p-3.5 text-center">
              <div className="font-pixel text-[9px] text-[#888888]">TICKS TO GOAL</div>
              <div className="font-pixel text-lg text-[#55ffff] mt-1 tabular-nums">
                {resultsLog.length > 0 ? meanSteps.toFixed(1) : '—'}
              </div>
              <div className="text-[10px] text-[#888888] mt-0.5">Max: 250</div>
            </div>
          </div>

          {/* Minecraft Chat / Event Log */}
          <div className="mc-panel p-4 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-[#1c1a18] pb-2">
              <span className="font-pixel text-[10px] text-[#ffff55] mc-shadow-gold">
                CHAT / SIMULATION LOGS
              </span>
              {resultsLog.length > 0 && (
                <button
                  onClick={downloadJson}
                  className="mc-button px-2.5 py-1 font-pixel text-[9px] flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5 text-[#55ffff]" />
                  <span>EXPORT JSON</span>
                </button>
              )}
            </div>

            {resultsLog.length === 0 ? (
              <div className="py-8 text-center font-pixel text-[10px] text-[#666666]">
                &lt;FlyMind&gt; Adjust levers and press EXECUTE to begin trial run.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-[#1e1c1a] font-pixel text-[10px]">
                {resultsLog.map(r => (
                  <div key={r.episode} className="py-2 flex items-center justify-between">
                    <span className="text-[#888888]">[EPISODE {r.episode}]</span>
                    <span className={r.success ? 'text-[#55ff55]' : 'text-[#ff5555]'}>
                      {r.success ? '★ BEACON REACHED' : '✕ TIMEOUT'}
                    </span>
                    <span className="text-[#ffff55] tabular-nums">{r.reward} pts</span>
                    <span className="text-[#55ffff] tabular-nums">{r.steps} ticks</span>
                    <span className="text-[#ff5555] tabular-nums">{r.collisions} col</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
