"""
Training script for Baseline A: Conventional Artificial Neural Network (ANN).
"""

import os
import sys
import json
import logging
import argparse
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from baselines.ann import ANNAgent
from minecraft.environment import FlyMindMinecraftEnv
from training.evaluate import evaluate_agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("flymind.train.ann")


def train_ann(
    episodes: int = 50,
    learning_rate: float = 0.01,
    gamma: float = 0.99,
    output_path: str = "results/processed/ann_training.json",
    seed: int = 42,
) -> Dict[str, Any]:
    env = FlyMindMinecraftEnv(mode="mock", seed=seed)
    agent = ANNAgent(seed=seed)

    history = {
        "model": "ANN_MLP_Baseline",
        "episodes": [],
        "rewards": [],
        "success_rates": [],
        "steps": [],
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
            action, val_est, tel = agent.act(obs)
            next_obs, reward, terminated, truncated, info = env.step(action)
            ep_transitions.append((obs, action, reward, val_est))
            total_reward += reward
            step_count += 1
            obs = next_obs
            done = terminated or truncated

        recent_rewards.append(total_reward)

        # Policy gradient update on output biases
        discounted_return = 0.0
        returns = []
        for _, _, r, _ in reversed(ep_transitions):
            discounted_return = r + gamma * discounted_return
            returns.insert(0, discounted_return)

        for idx, (s, a, r, v) in enumerate(ep_transitions):
            adv = returns[idx] - v
            agent.b_policy[a] += learning_rate * adv * 0.01
            agent.b_policy[a] = max(-3.0, min(3.0, agent.b_policy[a]))

        success = total_reward > 50.0 or info.get("success", False)
        history["episodes"].append(ep + 1)
        history["rewards"].append(round(total_reward, 2))
        history["success_rates"].append(1.0 if success else 0.0)
        history["steps"].append(step_count)

        if (ep + 1) % 10 == 0 or ep == episodes - 1:
            avg_rew = sum(recent_rewards[-10:]) / len(recent_rewards[-10:])
            logger.info(f"ANN Episode {ep+1}/{episodes} | Avg Reward: {avg_rew:.2f}")

    eval_results = evaluate_agent(agent, env, num_episodes=15, seed=seed + 999)
    history["final_evaluation"] = eval_results

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    return history


if __name__ == "__main__":
    train_ann()
