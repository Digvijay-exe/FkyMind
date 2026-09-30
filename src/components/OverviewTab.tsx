import React from 'react';
import { ConnectomeData, SimulationState } from '../types';
import { Compass, Zap, Target, Eye, BookOpen, Award, Shield, Sparkles } from 'lucide-react';

interface OverviewTabProps {
  connectome: ConnectomeData;
  simState: SimulationState;
  onExploreBrain: () => void;
  onLaunchMinecraft: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  connectome,
  simState,
  onExploreBrain,
  onLaunchMinecraft,
}) => {
  return (
    <div className="space-y-6 py-2">
      {/* Minecraft Hero Advancement Banner */}
      <div className="mc-panel p-5 sm:p-7 relative overflow-hidden">
        {/* Subtle stone texture highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#5c5750]/40" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-3">
            {/* Minecraft Advancement Tag */}
            <div className="inline-flex items-center gap-2 bg-[#2d1e02] border-2 border-[#b38430] px-3 py-1 shadow-md">
              <Award className="h-4 w-4 text-[#ffff55]" />
              <span className="font-pixel text-[10px] text-[#ffff55] mc-shadow-gold uppercase tracking-wider">
                Advancement Made! Fruit Fly Brain in Minecraft
              </span>
            </div>

            <h1 className="font-pixel text-xl sm:text-2xl text-[#ffffff] mc-shadow leading-snug">
              FLYMIND: CONNECTOME-POWERED AUTONOMOUS AGENT
            </h1>

            <p className="text-sm text-[#c8c0b5] leading-relaxed">
              We extract the biological wiring of the <em>Drosophila melanogaster</em> FlyWire connectome
              (139,255 whole-brain neurons) into a sparse recurrent Spiking Neural Network (SNN) that learns
              to explore, orient, and conquer coordinates in Minecraft.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onLaunchMinecraft}
                className="mc-button mc-button-green px-4 py-2 font-pixel text-xs flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                <span>OPEN WORLD MONITOR</span>
              </button>
              <button
                onClick={onExploreBrain}
                className="mc-button mc-button-diamond px-4 py-2 font-pixel text-xs flex items-center gap-2"
              >
                <Zap className="h-4 w-4 text-[#55ffff]" />
                <span>INSPECT CONNECTOME (3D)</span>
              </button>
            </div>
          </div>

          {/* Right Image / Graphic Card */}
          <div className="lg:col-span-5">
            <div className="mc-slot p-1.5 relative group">
              <img
                src="/src/assets/images/minecraft_connectome_hero_1790733939117.jpg"
                alt="Minecraft terrain with glowing redstone and neural connectome network"
                className="w-full h-auto aspect-video object-cover border border-[#2a2825] shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-[#111111]/85 border border-[#333333] px-2.5 py-1.5 backdrop-blur-sm flex items-center justify-between">
                <span className="font-pixel text-[9px] text-[#ffff55] mc-shadow-gold">
                  WORLD SEED: FLYWIRE-v783
                </span>
                <span className="font-pixel text-[9px] text-[#55ff55]">
                  45 NEURONS ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Experience Bar Strip */}
        <div className="mt-6 pt-5 border-t-2 border-[#1c1a18] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="mc-slot p-2.5 bg-[#171614]">
            <div className="font-pixel text-[9px] text-[#888888] uppercase">Dataset Source</div>
            <div className="font-pixel text-xs text-[#ffffff] mc-shadow mt-1">FlyWire v783</div>
            <div className="text-[11px] text-[#888888] mt-0.5">Whole-brain Nature 2024</div>
          </div>
          <div className="mc-slot p-2.5 bg-[#171614]">
            <div className="font-pixel text-[9px] text-[#55ffff] uppercase">Active Subgraph</div>
            <div className="font-pixel text-xs text-[#55ffff] mc-shadow-aqua mt-1">
              {connectome.neurons.length} Neurons
            </div>
            <div className="text-[11px] text-[#888888] mt-0.5">43 signed synapses</div>
          </div>
          <div className="mc-slot p-2.5 bg-[#171614]">
            <div className="font-pixel text-[9px] text-[#ffaa00] uppercase">Neuron Model</div>
            <div className="font-pixel text-xs text-[#ffaa00] mc-shadow-gold mt-1">Leaky I&F</div>
            <div className="text-[11px] text-[#888888] mt-0.5">τ=20ms · V_th=-50mV</div>
          </div>
          <div className="mc-slot p-2.5 bg-[#171614]">
            <div className="font-pixel text-[9px] text-[#ff5555] uppercase">Synaptic Polarity</div>
            <div className="font-pixel text-xs text-[#55ff55] mc-shadow-green mt-1">Dale's Law</div>
            <div className="text-[11px] text-[#888888] mt-0.5">ACh(+) · GABA(-) · Glu(-)</div>
          </div>
        </div>
      </div>

      {/* Minecraft Item Quest / Sensorimotor Flow */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-pixel text-sm text-[#ffffff] mc-shadow flex items-center gap-2">
            <span>[1] SENSORIMOTOR NEURAL PIPELINE</span>
          </h2>
          <span className="font-pixel text-[10px] text-[#888888]">AUTONOMOUS CLOSED-LOOP</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Sensory Eye */}
          <div className="mc-panel p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[#55ffff]">
              <div className="h-6 w-6 bg-[#002222] border-2 border-[#55ffff] flex items-center justify-center font-pixel text-xs">
                👁
              </div>
              <span className="font-pixel text-[11px] text-[#55ffff] mc-shadow-aqua uppercase">
                1. Sensory Input
              </span>
            </div>
            <h3 className="font-pixel text-xs text-[#ffffff] mc-shadow">
              Raycasts & Compass Vectors
            </h3>
            <p className="text-xs text-[#a8a095] leading-relaxed">
              14 environmental channels (obstacle distance raycasts, relative angle to target, velocity, health)
              are converted into Poisson spike trains delivered to visual projection neurons (LC11, LPLC2).
            </p>
          </div>

          {/* Card 2: Central Complex */}
          <div className="mc-panel p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[#ffaa00]">
              <div className="h-6 w-6 bg-[#221800] border-2 border-[#ffaa00] flex items-center justify-center font-pixel text-xs">
                🧭
              </div>
              <span className="font-pixel text-[11px] text-[#ffaa00] mc-shadow-gold uppercase">
                2. Connectome CX
              </span>
            </div>
            <h3 className="font-pixel text-xs text-[#ffffff] mc-shadow">
              Ring Attractor Compass
            </h3>
            <p className="text-xs text-[#a8a095] leading-relaxed">
              EPG heading neurons maintain an internal compass bump. Fan-Shaped Body (FB) subtracts heading
              from target to generate error signals. PFL3 steering neurons drive bilateral turning commands.
            </p>
          </div>

          {/* Card 3: Motor Output */}
          <div className="mc-panel p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[#55ff55]">
              <div className="h-6 w-6 bg-[#002200] border-2 border-[#55ff55] flex items-center justify-center font-pixel text-xs">
                ⚔
              </div>
              <span className="font-pixel text-[11px] text-[#55ff55] mc-shadow-green uppercase">
                3. Minecraft Actions
              </span>
            </div>
            <h3 className="font-pixel text-xs text-[#ffffff] mc-shadow">
              Descending Motor Readout
            </h3>
            <p className="text-xs text-[#a8a095] leading-relaxed">
              Spikes arriving at descending motor neurons (DN) trigger discrete actions: FORWARD, TURN_LEFT,
              TURN_RIGHT, JUMP, ATTACK, or NO_OP sent via LAN bot or Fabric TCP mod to Minecraft.
            </p>
          </div>
        </div>
      </div>

      {/* Research Hypotheses & Goals */}
      <div className="mc-panel p-5 space-y-3">
        <h2 className="font-pixel text-xs text-[#ffff55] mc-shadow-gold uppercase tracking-wider">
          [2] SCIENTIFIC RESEARCH QUESTIONS & BENCHMARKS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#c8c0b5]">
          <div className="mc-slot p-3.5 bg-[#171614] space-y-1.5">
            <div className="font-pixel text-[11px] text-[#ffffff] mc-shadow flex items-center gap-2">
              <span className="text-[#55ffff]">Q1:</span> Biological Inductive Bias
            </div>
            <p className="leading-relaxed text-[#9a9287]">
              Does the evolved graph topology of the fruit fly brain endow a spiking neural network with
              innate navigation and obstacle avoidance capabilities prior to intensive weight updates?
            </p>
          </div>

          <div className="mc-slot p-3.5 bg-[#171614] space-y-1.5">
            <div className="font-pixel text-[11px] text-[#ffffff] mc-shadow flex items-center gap-2">
              <span className="text-[#ffaa00]">Q2:</span> Biological vs Artificial Baselines
            </div>
            <p className="leading-relaxed text-[#9a9287]">
              How does FlyMind compare to a conventional MLP ANN and generic feedforward SNN in sample efficiency,
              firing rate sparsity, parameter compactness, and noise tolerance?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
