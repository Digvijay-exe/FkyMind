import React, { useRef, useEffect } from 'react';
import { SimulationState, ActionIndex } from '../types';
import { Target, Footprints, ShieldAlert, Award, Play, Pause, RotateCcw, StepForward, Terminal, Copy } from 'lucide-react';

interface MinecraftMonitorTabProps {
  simState: SimulationState;
  isRunning: boolean;
  toggleRunning: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  actionProbs?: number[];
  actionName?: string;
  selectedModel: string;
}

const ACTION_CONFIG = [
  { name: 'NO_OP', icon: '🪵', label: 'Idle' },
  { name: 'MOVE_FORWARD', icon: '🧭', label: 'Forward' },
  { name: 'MOVE_BACKWARD', icon: '🪶', label: 'Back' },
  { name: 'TURN_LEFT', icon: '🏹', label: 'Turn L' },
  { name: 'TURN_RIGHT', icon: '🏹', label: 'Turn R' },
  { name: 'JUMP', icon: '🟢', label: 'Jump' },
  { name: 'ATTACK', icon: '⚔️', label: 'Attack' },
  { name: 'INTERACT', icon: '📦', label: 'Use' },
];

export const MinecraftMonitorTab: React.FC<MinecraftMonitorTabProps> = ({
  simState,
  isRunning,
  toggleRunning,
  stepSimulation,
  resetSimulation,
  actionProbs = [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125],
  actionName = 'NO_OP',
  selectedModel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Minecraft Voxel Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / simState.worldSize[0];
    const scaleZ = height / simState.worldSize[1];

    // Background: Minecraft Grass Terrain
    ctx.fillStyle = '#476e27';
    ctx.fillRect(0, 0, width, height);

    // Subtle voxel grass grid
    const blockPixelSize = scaleX;
    for (let x = 0; x < simState.worldSize[0]; x++) {
      for (let z = 0; z < simState.worldSize[1]; z++) {
        const isAlternate = (x + z) % 2 === 0;
        ctx.fillStyle = isAlternate ? '#4c752a' : '#436925';
        ctx.fillRect(x * scaleX, z * scaleZ, scaleX, scaleZ);

        // Tiny pixel grass tufts
        if ((x * 13 + z * 7) % 5 === 0) {
          ctx.fillStyle = '#5c8f33';
          ctx.fillRect(x * scaleX + 4, z * scaleZ + 4, 3, 3);
          ctx.fillStyle = '#39571f';
          ctx.fillRect(x * scaleX + 8, z * scaleZ + 10, 3, 3);
        }
      }
    }

    // Grid lines for blocks
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= simState.worldSize[0]; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scaleX, 0);
      ctx.lineTo(x * scaleX, height);
      ctx.stroke();
    }
    for (let z = 0; z <= simState.worldSize[1]; z++) {
      ctx.beginPath();
      ctx.moveTo(0, z * scaleZ);
      ctx.lineTo(width, z * scaleZ);
      ctx.stroke();
    }

    // Draw Obstacles: Cobblestone / Stone Bricks
    simState.obstacles.forEach((box) => {
      const bx = box.minX * scaleX;
      const bz = box.minZ * scaleZ;
      const bw = (box.maxX - box.minX) * scaleX;
      const bh = (box.maxZ - box.minZ) * scaleZ;

      // Base cobblestone gray
      ctx.fillStyle = '#686868';
      ctx.fillRect(bx, bz, bw, bh);

      // Cobblestone border
      ctx.strokeStyle = '#2b2b2b';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, bz, bw, bh);

      // Cobblestone noise texture
      ctx.fillStyle = '#828282';
      ctx.fillRect(bx + 3, bz + 3, bw * 0.4, bh * 0.3);
      ctx.fillRect(bx + bw * 0.5, bz + bh * 0.5, bw * 0.4, bh * 0.4);

      ctx.fillStyle = '#454545';
      ctx.fillRect(bx + bw * 0.45, bz + 4, bw * 0.45, bh * 0.35);
      ctx.fillRect(bx + 4, bz + bh * 0.45, bw * 0.35, bh * 0.45);
    });

    // Draw Target: Minecraft Beacon Block with Sky Beam
    const tx = simState.targetX * scaleX;
    const tz = simState.targetZ * scaleZ;

    // Glowing sky beam halo
    const glowGrad = ctx.createRadialGradient(tx, tz, 2, tx, tz, 32);
    glowGrad.addColorStop(0, 'rgba(85, 255, 255, 0.7)');
    glowGrad.addColorStop(0.5, 'rgba(85, 255, 85, 0.3)');
    glowGrad.addColorStop(1, 'rgba(85, 255, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(tx, tz, 32, 0, Math.PI * 2);
    ctx.fill();

    // Beacon Obsidian base
    ctx.fillStyle = '#100c1c';
    ctx.fillRect(tx - 12, tz - 12, 24, 24);
    ctx.strokeStyle = '#382b59';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx - 12, tz - 12, 24, 24);

    // Glass / Diamond inner core
    ctx.fillStyle = '#55ffff';
    ctx.fillRect(tx - 7, tz - 7, 14, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tx - 4, tz - 4, 8, 8);

    // Target Label in Minecraft Font
    ctx.fillStyle = '#ffff55';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('BEACON', tx - 28, tz - 16);

    // Draw Raycast lines from Steve (Redstone particles)
    const px = simState.playerX * scaleX;
    const pz = simState.playerZ * scaleZ;
    const angles = [0.0, -45.0, 45.0];
    const rayDistances = [simState.raycasts.front, simState.raycasts.left, simState.raycasts.right];

    angles.forEach((ang, idx) => {
      const dist = rayDistances[idx];
      const rad = ((simState.playerYaw + ang) * Math.PI) / 180;
      const ex = (simState.playerX + Math.cos(rad) * dist) * scaleX;
      const ez = (simState.playerZ + Math.sin(rad) * dist) * scaleZ;

      ctx.beginPath();
      ctx.moveTo(px, pz);
      ctx.lineTo(ex, ez);
      ctx.strokeStyle = dist < 3.0 ? '#ff3333' : '#55ffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Particle dot at end
      ctx.fillStyle = dist < 3.0 ? '#ff0000' : '#00ffff';
      ctx.fillRect(ex - 3, ez - 3, 6, 6);
    });

    // Draw Player Steve Avatar
    const yawRad = (simState.playerYaw * Math.PI) / 180;

    // View cone
    ctx.fillStyle = 'rgba(85, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.arc(px, pz, 48, yawRad - Math.PI / 4, yawRad + Math.PI / 4);
    ctx.closePath();
    ctx.fill();

    // Save context for player rotation
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(yawRad + Math.PI / 2); // face forward

    // Steve Body: Blue Shirt (#00aaaa) & Arms
    ctx.fillStyle = '#00aaaa';
    ctx.fillRect(-8, -4, 16, 12);
    ctx.strokeStyle = '#006666';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -4, 16, 12);

    // Steve Head: Skin tone (#c68c53), Hair (#4a3319)
    ctx.fillStyle = '#c68c53';
    ctx.fillRect(-6, -14, 12, 12);
    ctx.fillStyle = '#4a3319';
    ctx.fillRect(-6, -14, 12, 4); // Hair
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -8, 3, 2);
    ctx.fillRect(1, -8, 3, 2);
    ctx.fillStyle = '#2b3bb3'; // Blue pupils
    ctx.fillRect(-3, -8, 2, 2);
    ctx.fillRect(2, -8, 2, 2);

    ctx.restore();

    // Damage flash if collided
    if (simState.collided) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
      ctx.fillRect(0, 0, width, height);
    }
  }, [simState]);

  // Compute hearts (20 max = 10 hearts)
  const fullHearts = Math.max(0, Math.floor(simState.playerHealth / 2));
  const hasHalfHeart = simState.playerHealth % 2 !== 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
      {/* 2D/3D Navigation Stage */}
      <div className="lg:col-span-8 space-y-4">
        {/* Stage Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-[#ffffff] mc-shadow">
              SUPERFLAT WORLD ARENA (32×32)
            </span>
            <span className="font-pixel text-[10px] text-[#ffaa00]">
              SEED: {42}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-pixel text-[10px] text-[#55ffff] mc-slot px-2.5 py-1 bg-[#141210]">
              AGENT: {selectedModel.toUpperCase()}
            </span>
            {simState.success && (
              <span className="font-pixel text-[10px] text-[#55ff55] bg-[#004400] border-2 border-[#55ff55] px-2.5 py-1 animate-pulse">
                ★ TARGET REACHED!
              </span>
            )}
          </div>
        </div>

        {/* Canvas Voxel Stage with authentic Minecraft Beveled Frame */}
        <div className="mc-panel-deepslate p-3 relative shadow-2xl">
          <canvas
            ref={canvasRef}
            width={640}
            height={500}
            className="w-full h-auto aspect-[640/500] block border-2 border-[#000000] cursor-crosshair"
          />

          {/* Floating In-Game HUD: Top Left (Coordinates & Target) */}
          <div className="absolute top-5 left-5 mc-slot bg-[#121110]/90 p-3 font-pixel text-[10px] space-y-1.5 pointer-events-none border-2 border-[#333333]">
            <div className="text-[#ffff55] mc-shadow-gold border-b border-[#333333] pb-1">
              F3 DEBUG TELEMETRY
            </div>
            <div className="text-[#e0e0e0]">XYZ: {simState.playerX.toFixed(1)} / 64.0 / {simState.playerZ.toFixed(1)}</div>
            <div className="text-[#e0e0e0]">Facing: {simState.playerYaw.toFixed(1)}°</div>
            <div className="text-[#55ffff]">Target Dist: {simState.distToTarget.toFixed(2)}m</div>
            <div className="text-[#ffaa00]">Angle Err: {simState.angleToTarget.toFixed(1)}°</div>
          </div>

          {/* Floating In-Game HUD: Bottom Right (Raycast Sensors) */}
          <div className="absolute bottom-5 right-5 mc-slot bg-[#121110]/90 p-3 font-pixel text-[10px] space-y-1 pointer-events-none text-right border-2 border-[#333333]">
            <div className="text-[#ff5555] mc-shadow-red border-b border-[#333333] pb-1">
              REDSTONE RAYCASTS
            </div>
            <div className="text-[#55ffff]">Front: {simState.raycasts.front.toFixed(1)}m</div>
            <div className="text-[#aaaaaa]">Left:  {simState.raycasts.left.toFixed(1)}m</div>
            <div className="text-[#aaaaaa]">Right: {simState.raycasts.right.toFixed(1)}m</div>
          </div>
        </div>

        {/* In-Game Player Status HUD: Hearts, Experience Bar, Drumsticks */}
        <div className="mc-panel p-3.5 space-y-2">
          {/* Top row: Hearts & Hunger */}
          <div className="flex items-center justify-between px-1">
            {/* 10 Health Hearts */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-base leading-none select-none ${
                    i < fullHearts
                      ? 'text-[#ff2222] drop-shadow-[0_0_2px_#ff0000]'
                      : i === fullHearts && hasHalfHeart
                      ? 'text-[#ff7777]'
                      : 'text-[#444444]'
                  }`}
                  title={`Health: ${simState.playerHealth.toFixed(0)}/20`}
                >
                  ♥
                </span>
              ))}
            </div>

            {/* Step Counter */}
            <div className="font-pixel text-[11px] text-[#ffff55] mc-shadow-gold">
              TICK {simState.stepCount} / 250
            </div>

            {/* 10 Hunger drumsticks */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="text-sm leading-none select-none text-[#c48c46]">
                  🍗
                </span>
              ))}
            </div>
          </div>

          {/* Experience Bar with Level 45 in Center */}
          <div className="relative flex items-center justify-center">
            <div className="mc-xp-bar w-full">
              <div
                className="mc-xp-fill transition-all duration-150"
                style={{ width: `${Math.min(100, Math.max(5, (simState.stepCount / 250) * 100))}%` }}
              />
            </div>
            <div className="absolute font-pixel text-xs text-[#55ff55] mc-shadow-green font-bold">
              45
            </div>
          </div>
        </div>

        {/* Quick Simulation Control Panel */}
        <div className="mc-panel p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleRunning}
              className={`mc-button px-4 py-2 font-pixel text-xs flex items-center gap-2 ${
                isRunning ? 'mc-button-red' : 'mc-button-green'
              }`}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isRunning ? 'PAUSE AGENT' : 'START AGENT'}</span>
            </button>

            <button
              onClick={stepSimulation}
              disabled={isRunning}
              className="mc-button px-3 py-2 font-pixel text-[10px] flex items-center gap-1.5"
            >
              <StepForward className="h-3.5 w-3.5" />
              <span>STEP TICK</span>
            </button>

            <button
              onClick={resetSimulation}
              className="mc-button px-3 py-2 font-pixel text-[10px] flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>NEW ARENA</span>
            </button>
          </div>

          <div className="font-pixel text-[10px] text-[#aaaaaa]">
            DECISION: <span className="text-[#55ffff] font-bold">{actionName}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Minecraft Hotbar & Policy Readout */}
      <div className="lg:col-span-4 space-y-4">
        {/* Performance Scorecard */}
        <div className="mc-panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b-2 border-[#1c1a18] pb-2">
            <span className="font-pixel text-xs text-[#ffff55] mc-shadow-gold">
              SCOREBOARD
            </span>
            <Award className="h-4 w-4 text-[#ffaa00]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="mc-slot p-2.5 bg-[#171614]">
              <div className="font-pixel text-[9px] text-[#888888]">Total Score</div>
              <div className={`font-pixel text-sm mt-1 ${simState.totalReward >= 0 ? 'text-[#55ff55]' : 'text-[#ff5555]'}`}>
                {simState.totalReward.toFixed(1)}
              </div>
            </div>
            <div className="mc-slot p-2.5 bg-[#171614]">
              <div className="font-pixel text-[9px] text-[#888888]">Step Reward</div>
              <div className={`font-pixel text-sm mt-1 ${simState.lastReward >= 0 ? 'text-[#55ff55]' : 'text-[#ff5555]'}`}>
                {simState.lastReward.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Authentic Minecraft Action Hotbar */}
        <div className="mc-panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b-2 border-[#1c1a18] pb-2">
            <span className="font-pixel text-xs text-[#55ffff] mc-shadow-aqua">
              INVENTORY HOTBAR (ACTIONS)
            </span>
            <Footprints className="h-4 w-4 text-[#55ffff]" />
          </div>

          <div className="space-y-2">
            {ACTION_CONFIG.map((item, idx) => {
              const prob = actionProbs[idx] || 0.0;
              const isSelected = simState.lastAction === idx;
              const stackCount = Math.round(prob * 64);

              return (
                <div
                  key={item.name}
                  className={`mc-slot p-2 flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[#2a3825] border-2 border-[#55ff55] shadow-[0_0_6px_#55ff55]'
                      : 'bg-[#151413] border border-[#2b2926]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Hotbar item icon */}
                    <div className="h-7 w-7 mc-slot bg-[#1e1c1a] flex items-center justify-center text-sm">
                      {item.icon}
                    </div>
                    <div>
                      <div className={`font-pixel text-[10px] ${isSelected ? 'text-[#ffff55] mc-shadow-gold' : 'text-[#cccccc]'}`}>
                        {idx + 1}. {item.label}
                      </div>
                      <div className="font-mono text-[10px] text-[#777777]">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-pixel text-[10px] text-[#55ff55] mc-shadow-green">
                      {stackCount > 0 ? `x${stackCount}` : '—'}
                    </div>
                    <div className="font-mono text-[9px] text-[#888888]">
                      {(prob * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Minecraft Multiplayer / LAN Integration Guide */}
        <div className="mc-panel p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] text-[#ffaa00] mc-shadow-gold uppercase">
              CONNECT TO REAL MINECRAFT
            </span>
            <Terminal className="h-4 w-4 text-[#ffaa00]" />
          </div>

          <p className="text-xs text-[#a8a095] leading-relaxed">
            Open your Minecraft Java game to LAN (or install Fabric Mod), then run:
          </p>

          <div className="mc-slot p-2 bg-[#0c0b0a] font-mono text-[11px] text-[#55ff55] overflow-x-auto select-all">
            node minecraft/bot_bridge.js
          </div>
          <div className="mc-slot p-2 bg-[#0c0b0a] font-mono text-[11px] text-[#55ffff] overflow-x-auto select-all">
            python3 play.py
          </div>
        </div>
      </div>
    </div>
  );
};
