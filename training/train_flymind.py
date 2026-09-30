"""
Training pipeline for FlyMind agent using Policy Gradient / PPO dynamics.
Trains readout policy biases and value heads while preserving the biological FlyWire recurrent topology.
"""

import os
import sys
import json
import logging
import argparse
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from brain.flymind import FlyMindAgent
from minecraft.environment import FlyMindMinecraftEnv
from training.evaluate import evaluate_agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("flymind.train")


def train_flymind(
    episodes: int = 50,
    learning_rate: float = 0.01,
    gamma: float = 0.99,
    output_path: str = "results/processed/flymind_training.json",
    seed: int = 42,
) -> Dict[str, Any]:
    """
    Trains FlyMind agent in Minecraft navigation environment.
    """
    env = FlyMindMinecraftEnv(mode="mock", seed=seed)
    agent = FlyMindAgent(seed=seed)

    history = {
        "model": "FlyMind_Connectome_SNN",
        "episodes": [],
        "rewards": [],
        "success_rates": [],
        "steps": [],
        "firing_rates": [],
    }

    recent_rewards: List[float] = []

    for ep in range(episodes):
        obs, _ = env.reset(seed=seed + ep)
        agent.reset()

        ep_transitions = []
        total_reward = 0.0
        step_count = 0
        done = False

        while not done and step_count < 250:
            action, val_est, telemetry = agent.act(obs)
            next_obs, reward, terminated, truncated, info = env.step(action)
            ep_transitions.append((obs, action, reward, val_est, telemetry))
            total_reward += reward
            step_count += 1
            obs = next_obs
            done = terminated or truncated

        recent_rewards.append(total_reward)

        # Policy gradient update on readout biases
        discounted_return = 0.0
        returns = []
        for _, _, r, _, _ in reversed(ep_transitions):
            discounted_return = r + gamma * discounted_return
            returns.insert(0, discounted_return)

        # Update action biases based on advantage
        mean_return = sum(returns) / max(1, len(returns))
        for idx, (s, a, r, v, tel) in enumerate(ep_transitions):
            adv = returns[idx] - v
            # Slight gradient step on chosen action
            agent.action_biases[a] += learning_rate * adv * 0.01
            # Clamp biases to prevent explosion
            agent.action_biases[a] = max(-3.0, min(3.0, agent.action_biases[a]))

        success = total_reward > 50.0 or info.get("success", False)
        history["episodes"].append(ep + 1)
        history["rewards"].append(round(total_reward, 2))
        history["success_rates"].append(1.0 if success else 0.0)
        history["steps"].append(step_count)
        history["firing_rates"].append(round(telemetry.get("mean_firing_rate_hz", 0.0), 2))

        if (ep + 1) % 10 == 0 or ep == episodes - 1:
            avg_rew = sum(recent_rewards[-10:]) / len(recent_rewards[-10:])
            logger.info(f"Episode {ep+1}/{episodes} | Avg Reward: {avg_rew:.2f} | Last Steps: {step_count}")

    # Final evaluation
    eval_results = evaluate_agent(agent, env, num_episodes=15, seed=seed + 999)
    history["final_evaluation"] = eval_results

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    logger.info(f"Training completed. Results written to {output_path}")
    return history


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train FlyMind agent")
    parser.add_argument("--episodes", type=int, default=30)
    parser.add_argument("--lr", type=float, default=0.01)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=str, default="results/processed/flymind_training.json")
    args = parser.parse_args()

    train_flymind(episodes=args.episodes, learning_rate=args.lr, seed=args.seed, output_path=args.output)
