import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { MinecraftMonitorTab } from './components/MinecraftMonitorTab';
import { ConnectomeBrainTab } from './components/ConnectomeBrainTab';
import { LearningCurvesTab } from './components/LearningCurvesTab';
import { ModelComparisonTab } from './components/ModelComparisonTab';
import { ExperimentLabTab } from './components/ExperimentLabTab';
import { ResearchNotesTab } from './components/ResearchNotesTab';
import { ClientMinecraftSimulator } from './simulation/minecraftSimulator';
import { ClientLIFEngine } from './simulation/lifEngine';
import { DROSOPHILA_CONNECTOME } from './data/mockConnectome';
import { ModelType, SimulationState, ActionIndex } from './types';

const ACTION_NAMES = [
  'NO_OP',
  'MOVE_FORWARD',
  'MOVE_BACKWARD',
  'TURN_LEFT',
  'TURN_RIGHT',
  'JUMP',
  'ATTACK',
  'INTERACT',
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedModel, setSelectedModel] = useState<ModelType>('flymind');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(30);

  // Core engines
  const simRef = useRef<ClientMinecraftSimulator>(new ClientMinecraftSimulator(32, 32, 10, 42));
  const lifEngineRef = useRef<ClientLIFEngine>(new ClientLIFEngine(DROSOPHILA_CONNECTOME, 'connectome_weighted'));

  const [simState, setSimState] = useState<SimulationState>(() => simRef.current.getState());
  const [activeSpikingNeurons, setActiveSpikingNeurons] = useState<number[]>([]);
  const [neuronVoltages, setNeuronVoltages] = useState<number[]>([]);
  const [firingRateHz, setFiringRateHz] = useState<number>(0.0);
  const [actionProbs, setActionProbs] = useState<number[]>([0.1, 0.4, 0.05, 0.15, 0.15, 0.1, 0.02, 0.03]);
  const [currentActionName, setCurrentActionName] = useState<string>('NO_OP');

  // Update engine when model changes
  useEffect(() => {
    if (selectedModel === 'flymind') {
      lifEngineRef.current = new ClientLIFEngine(DROSOPHILA_CONNECTOME, 'connectome_weighted');
    } else if (selectedModel === 'generic_snn') {
      lifEngineRef.current = new ClientLIFEngine(DROSOPHILA_CONNECTOME, 'random_rewired');
    }
  }, [selectedModel]);

  // Execute single simulation step
  const executeStep = () => {
    const sim = simRef.current;
    const lif = lifEngineRef.current;

    const obs = sim.getObservationVector();
    let chosenAction: ActionIndex = 0;
    let probs: number[] = [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125];
    let spikes: number[] = [];
    let firingRate = 0.0;
    let voltages: number[] = [];

    if (selectedModel === 'flymind' || selectedModel === 'generic_snn') {
      const result = lif.processObservation(obs, 6);
      chosenAction = result.action;
      probs = result.actionProbs;
      spikes = result.activeSpikes;
      firingRate = result.firingRateHz;
      voltages = result.voltageSnapshot;
    } else if (selectedModel === 'ann') {
      // Heuristic goal-directed MLP emulation
      const angle = sim.angleToTarget();
      const dist = sim.distToTarget();
      if (Math.abs(angle) < 25) {
        chosenAction = 1; // FORWARD
        probs = [0.05, 0.70, 0.05, 0.08, 0.08, 0.04, 0.0, 0.0];
      } else if (angle < 0) {
        chosenAction = 3; // LEFT
        probs = [0.05, 0.15, 0.05, 0.65, 0.05, 0.05, 0.0, 0.0];
      } else {
        chosenAction = 4; // RIGHT
        probs = [0.05, 0.15, 0.05, 0.05, 0.65, 0.05, 0.0, 0.0];
      }
      firingRate = 0.0;
    } else {
      // Random
      chosenAction = Math.floor(Math.random() * 8) as ActionIndex;
      probs = [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125];
      firingRate = 0.0;
    }

    const nextState = sim.step(chosenAction);
    setSimState({ ...nextState });
    setActiveSpikingNeurons(spikes);
    setFiringRateHz(firingRate);
    if (voltages.length > 0) setNeuronVoltages(voltages);
    setActionProbs(probs);
    setCurrentActionName(ACTION_NAMES[chosenAction]);

    if (nextState.terminated || nextState.truncated) {
      // Auto reset on success or limit
      setTimeout(() => {
        const resetState = sim.reset(Math.floor(Math.random() * 1000));
        setSimState({ ...resetState });
      }, 800);
    }
  };

  // Continuous run loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      executeStep();
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [isRunning, fps, selectedModel]);

  const handleReset = () => {
    setIsRunning(false);
    const resetState = simRef.current.reset(Math.floor(Math.random() * 1000));
    lifEngineRef.current.reset();
    setSimState({ ...resetState });
    setActiveSpikingNeurons([]);
    setNeuronVoltages([]);
    setFiringRateHz(0.0);
  };

  return (
    <div className="min-h-screen bg-[#121110] text-[#e0e0e0] flex flex-col font-sans selection:bg-[#55ff55]/30 selection:text-[#55ffff]">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isRunning={isRunning}
        toggleRunning={() => setIsRunning(r => !r)}
        stepSimulation={executeStep}
        resetSimulation={handleReset}
        fps={fps}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4">
        {activeTab === 'overview' && (
          <OverviewTab
            connectome={DROSOPHILA_CONNECTOME}
            simState={simState}
            onExploreBrain={() => setActiveTab('brain')}
            onLaunchMinecraft={() => setActiveTab('minecraft')}
          />
        )}

        {activeTab === 'minecraft' && (
          <MinecraftMonitorTab
            simState={simState}
            isRunning={isRunning}
            toggleRunning={() => setIsRunning(r => !r)}
            stepSimulation={executeStep}
            resetSimulation={handleReset}
            actionProbs={actionProbs}
            actionName={currentActionName}
            selectedModel={selectedModel}
          />
        )}

        {activeTab === 'brain' && (
          <ConnectomeBrainTab
            connectome={DROSOPHILA_CONNECTOME}
            activeSpikingNeurons={activeSpikingNeurons}
            neuronVoltages={neuronVoltages}
            firingRateHz={firingRateHz}
          />
        )}

        {activeTab === 'curves' && <LearningCurvesTab />}

        {activeTab === 'comparison' && <ModelComparisonTab />}

        {activeTab === 'lab' && <ExperimentLabTab />}

        {activeTab === 'notes' && <ResearchNotesTab />}
      </main>

      {/* Minecraft Bedrock Footer */}
      <footer className="border-t-4 border-[#0c0b0a] bg-[#171614] py-5 px-3 sm:px-6 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-pixel text-[#888888]">
          <div className="flex items-center gap-2">
            <span className="text-[#ffff55] mc-shadow-gold">FLYMIND</span>
            <span>·</span>
            <span>DROSOPHILA CONNECTOME IN MINECRAFT JAVA EDITION</span>
          </div>

          <div className="flex items-center gap-3 text-[#55ffff]">
            <span>FLYWIRE v783 (NATURE 2024)</span>
            <span>·</span>
            <span className="text-[#55ff55]">MINECRAFT 1.20.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
