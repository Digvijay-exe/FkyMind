#!/usr/bin/env python3
"""
FlyMind: Real-time Autonomous Minecraft Gameplay Integration.
Connects the Drosophila connectome Spiking Neural Network (SNN) brain to Minecraft.

Usage:
  # Mode 1: Connect to running Minecraft (Fabric mod or bot bridge on port 8085)
  python3 play.py

  # Mode 2: Custom server IP, port, and goal coordinates
  python3 play.py --host 127.0.0.1 --port 8085 --target-x 100 --target-z 200

  # Mode 3: Built-in local mock environment (if Minecraft isn't running yet)
  python3 play.py --mode mock
"""

import os
import sys
import time
import socket
import argparse
import math
from typing import Dict, Any, List, Optional

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from brain.flymind import FlyMindAgent
from brain.decoder import ACTION_NAMES
from minecraft.protocol import encode_action_packet, decode_observation_packet
from minecraft.observations import observation_packet_to_vector
from minecraft.actions import discrete_to_action_dict
from minecraft.environment import FlyMindMinecraftEnv


def draw_hud(
    tick: int,
    pos: Dict[str, float],
    yaw: float,
    health: float,
    target_dist: float,
    target_angle: float,
    raycasts: Dict[str, float],
    action_name: str,
    action_probs: List[float],
    firing_rate: float,
    active_neurons: List[int],
    total_reward: float,
    step_reward: float,
):
    """Renders a real-time ASCII telemetry dashboard in the terminal."""
    # Terminal ANSI clear line / move cursor
    sys.stdout.write("\033[H\033[J")  # Clear screen

    hud = []
    hud.append("╔════════════════════════════════════════════════════════════════════════════╗")
    hud.append("║           FLYMIND: AUTONOMOUS DROSOPHILA CONNECTOME MINECRAFT AGENT        ║")
    hud.append("║                   Brain: FlyWire v783 Sparse LIF Recurrent SNN             ║")
    hud.append("╠════════════════════════════════════════════════════════════════════════════╣")
    hud.append(f"║  Tick: {tick:<6} | Health: {health:<4.1f}/20.0 | Cumulative Reward: {total_reward:>7.2f} pts       ║")
    hud.append(f"║  Position: X={pos.get('x', 0):>6.1f} Y={pos.get('y', 64):>5.1f} Z={pos.get('z', 0):>6.1f} | Yaw: {yaw:>5.1f}°                    ║")
    hud.append("╠════════════════════════════════════════════════════════════════════════════╣")
    hud.append("║  NAVIGATION TELEMETRY:                                                     ║")
    hud.append(f"║    Target Distance: {target_dist:>6.2f} blocks  |  Target Angle: {target_angle:>5.1f}°            ║")

    front = raycasts.get("front", 12.0)
    left = raycasts.get("left", 12.0)
    right = raycasts.get("right", 12.0)
    hud.append(f"║    Obstacle Sensors : Front={front:>4.1f}m  Left={left:>4.1f}m  Right={right:>4.1f}m             ║")

    hud.append("╠════════════════════════════════════════════════════════════════════════════╣")
    hud.append("║  SNN CONNECTOME BRAIN ACTIVITY:                                            ║")
    hud.append(f"║    Mean Firing Rate: {firing_rate:>5.1f} Hz  |  Active Spikes: {len(active_neurons):<2} neurons                ║")

    # Neuropil breakdown indicator
    has_epg = any(8 <= n <= 15 for n in active_neurons)
    has_fb = any(22 <= n <= 24 for n in active_neurons)
    has_pfl = any(25 <= n <= 28 for n in active_neurons)
    has_mb = any(29 <= n <= 36 for n in active_neurons)

    circuit_str = (
        f"[EPG Compass: {'●' if has_epg else '○'}]  "
        f"[FB Goal Vector: {'●' if has_fb else '○'}]  "
        f"[PFL3 Steering: {'●' if has_pfl else '○'}]  "
        f"[Mushroom Body: {'●' if has_mb else '○'}]"
    )
    hud.append(f"║    Circuits: {circuit_str:<58} ║")

    hud.append("╠════════════════════════════════════════════════════════════════════════════╣")
    hud.append(f"║  ACTIVE MINECRAFT ACTION: \033[1;36m{action_name:<16}\033[0m (Reward: {step_reward:>+5.2f})                 ║")

    # Mini action probability bar
    bar_str = ""
    for idx, name in enumerate(ACTION_NAMES):
        p = action_probs[idx] if idx < len(action_probs) else 0.0
        bar_len = int(round(p * 8))
        symbol = "█" * bar_len + "░" * (8 - bar_len)
        short_name = name.replace("MOVE_", "").replace("TURN_", "")[:5]
        bar_str += f"{short_name}:{symbol} "
    hud.append(f"║  {bar_str[:74]:<74} ║")

    hud.append("╚════════════════════════════════════════════════════════════════════════════╝")
    hud.append("  [Press Ctrl+C to disconnect FlyMind from Minecraft]")

    print("\n".join(hud), flush=True)


def run_minecraft_brain(
    host: str = "127.0.0.1",
    port: int = 8085,
    mode: str = "auto",
    target_coords: Optional[List[float]] = None,
    tick_delay: float = 0.05,
    max_steps: int = 10000,
):
    print("=" * 70)
    print("  Initializing FlyMind Brain for Autonomous Minecraft Gameplay")
    print("=" * 70)
    print(f"Connecting to Minecraft target bridge at {host}:{port} (Mode: {mode})...")

    # Initialize FlyWire-derived LIF Agent
    agent = FlyMindAgent(seed=42)
    print(f"✓ Loaded Drosophila Connectome Subgraph ({agent.n_neurons} neurons, {len(agent.graph.edges)} signed synapses)")
    print("✓ Initialized Leaky Integrate-and-Fire biophysics (tau=20ms, V_th=-50mV)")
    print("✓ Initialized Central Complex PFL3 goal-directed steering circuit")

    sock = None
    using_mock = (mode == "mock")

    if mode in ("auto", "fabric", "bot"):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3.0)
            sock.connect((host, port))
            sock.settimeout(5.0)
            print(f"\n\033[1;32m✓ CONNECTED TO MINECRAFT on {host}:{port}!\033[0m")
            print("The fruit fly connectome brain is now taking control of the player!\n")
            time.sleep(1.0)
        except Exception as e:
            if mode == "fabric" or mode == "bot":
                print(f"\n\033[1;31m✕ Could not connect to Minecraft on {host}:{port}: {e}\033[0m")
                print("\nPlease ensure either:")
                print("  1. The Minecraft Fabric Mod is loaded in your Minecraft 1.20.4 client.")
                print("     (See MINECRAFT_SETUP.md for mod installation instructions)")
                print("  2. OR run the Node.js bot bridge: 'node minecraft/bot_bridge.js'")
                print("     (Connects to ANY standard Minecraft server or LAN game)")
                print("\nTo test without Minecraft, run:")
                print("  python3 play.py --mode mock\n")
                sys.exit(1)
            else:
                print(f"\n\033[1;33m! Minecraft not detected on {host}:{port}. Falling back to internal mock simulator.\033[0m")
                print("  (To connect to real Minecraft, start Minecraft Fabric mod or run 'node minecraft/bot_bridge.js')\n")
                time.sleep(1.5)
                using_mock = True

    if using_mock:
        env = FlyMindMinecraftEnv(mode="mock", seed=42)
        obs, _ = env.reset()
        cum_reward = 0.0

        for step in range(max_steps):
            action, val_est, telemetry = agent.act(obs)
            obs, reward, terminated, truncated, info = env.step(action)
            cum_reward += reward

            raw = info.get("raw", {})
            draw_hud(
                tick=step,
                pos=raw.get("position", {"x": 4.0, "y": 64.0, "z": 4.0}),
                yaw=raw.get("yaw", 0.0),
                health=raw.get("health", 20.0),
                target_dist=raw.get("target", {}).get("distance", 20.0),
                target_angle=raw.get("target", {}).get("angle", 0.0),
                raycasts=raw.get("raycast", {"front": 12.0, "left": 12.0, "right": 12.0}),
                action_name=telemetry.get("action_name", ACTION_NAMES[action]),
                action_probs=telemetry.get("actionProbs", telemetry.get("action_probs", [0.125] * 8)),
                firing_rate=telemetry.get("mean_firing_rate_hz", 0.0),
                active_neurons=telemetry.get("active_neurons", []),
                total_reward=cum_reward,
                step_reward=reward,
            )

            if terminated or truncated:
                time.sleep(1.0)
                obs, _ = env.reset()
                agent.reset()
                cum_reward = 0.0

            time.sleep(tick_delay)
    else:
        # REAL MINECRAFT RUNNER LOOP
        buffer = ""
        cum_reward = 0.0
        step = 0

        # Send initial neutral action to handshake
        initial_action = encode_action_packet({"forward": False, "back": False, "left": False, "right": False, "jump": False, "attack": False, "interact": False})
        sock.sendall(initial_action.encode("utf-8"))

        try:
            while step < max_steps:
                # Read observation line from Minecraft
                while "\n" not in buffer:
                    chunk = sock.recv(1024).decode("utf-8")
                    if not chunk:
                        raise ConnectionResetError("Minecraft connection closed.")
                    buffer += chunk

                line, buffer = buffer.split("\n", 1)
                if not line.strip():
                    continue

                raw_obs = decode_observation_packet(line)

                # Override target if user specified custom coordinates
                if target_coords:
                    px = raw_obs["position"]["x"]
                    pz = raw_obs["position"]["z"]
                    tx, tz = target_coords[0], target_coords[1]
                    dx = tx - px
                    dz = tz - pz
                    dist = math.sqrt(dx * dx + dz * dz)
                    target_yaw = math.degrees(math.atan2(dz, dx))
                    angle = (target_yaw - raw_obs["yaw"] + 180.0) % 360.0 - 180.0
                    raw_obs["target"]["distance"] = round(dist, 2)
                    raw_obs["target"]["angle"] = round(angle, 1)

                obs_vec = observation_packet_to_vector(raw_obs)

                # Run brain!
                action, val_est, telemetry = agent.act(obs_vec)

                # Send command packet to Minecraft
                action_dict = discrete_to_action_dict(action)
                cmd_packet = encode_action_packet(action_dict)
                sock.sendall(cmd_packet.encode("utf-8"))

                # Reward estimation
                step_reward = -0.05
                target_dist = raw_obs.get("target", {}).get("distance", 10.0)
                if target_dist < 2.0:
                    step_reward += 100.0
                cum_reward += step_reward
                step += 1

                draw_hud(
                    tick=step,
                    pos=raw_obs.get("position", {"x": 0.0, "y": 64.0, "z": 0.0}),
                    yaw=raw_obs.get("yaw", 0.0),
                    health=raw_obs.get("health", 20.0),
                    target_dist=target_dist,
                    target_angle=raw_obs.get("target", {}).get("angle", 0.0),
                    raycasts=raw_obs.get("raycast", {"front": 12.0, "left": 12.0, "right": 12.0}),
                    action_name=telemetry.get("action_name", ACTION_NAMES[action]),
                    action_probs=telemetry.get("action_probs", [0.125] * 8),
                    firing_rate=telemetry.get("mean_firing_rate_hz", 0.0),
                    active_neurons=telemetry.get("active_neurons", []),
                    total_reward=cum_reward,
                    step_reward=step_reward,
                )

                time.sleep(tick_delay)

        except KeyboardInterrupt:
            print("\n[!] FlyMind disconnected by user.")
        finally:
            if sock:
                try:
                    # Halt all movement before disconnecting
                    stop_pkt = encode_action_packet({"forward": False, "back": False, "left": False, "right": False, "jump": False, "attack": False, "interact": False})
                    sock.sendall(stop_pkt.encode("utf-8"))
                    sock.close()
                except Exception:
                    pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run FlyMind brain autonomously in Minecraft")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Minecraft bridge host")
    parser.add_argument("--port", type=int, default=8085, help="Minecraft bridge TCP port")
    parser.add_argument("--mode", type=str, default="auto", choices=["auto", "fabric", "bot", "mock"], help="Connection mode")
    parser.add_argument("--target-x", type=float, default=None, help="Custom target X coordinate in Minecraft")
    parser.add_argument("--target-z", type=float, default=None, help="Custom target Z coordinate in Minecraft")
    parser.add_argument("--delay", type=float, default=0.06, help="Tick delay in seconds (~16-20 Hz)")
    args = parser.parse_args()

    target = [args.target_x, args.target_z] if args.target_x is not None and args.target_z is not None else None
    run_minecraft_brain(
        host=args.host,
        port=args.port,
        mode=args.mode,
        target_coords=target,
        tick_delay=args.delay,
    )
