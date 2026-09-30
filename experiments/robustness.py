"""
Experiment 7: Sensor Noise Robustness.
Evaluates agent performance degradation under Gaussian sensory noise injection.
"""

import os
import sys
import json
import logging
import random
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from brain.flymind import FlyMindAgent
from baselines.ann import ANNAgent
from baselines.generic_snn import GenericSNNAgent
from minecraft.environment import FlyMindMinecraftEnv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("flymind.experiments.robustness")


def run_noise_robustness(noise_levels: List[float] = [0.0, 0.1, 0.25, 0.5], num_episodes: int = 5, seed: int = 42) -> Dict[str, Any]:
    env = FlyMindMinecraftEnv(mode="mock", seed=seed)
    models = {
        "FlyMind": FlyMindAgent(seed=seed),
        "Generic_SNN": GenericSNNAgent(seed=seed),
        "ANN": ANNAgent(seed=seed),
    }

    results = {name: {} for name in models}
    rng = random.Random(seed)

    for noise_std in noise_levels:
        logger.info(f"Testing sensory noise sigma={noise_std}...")
        for name, agent in models.items():
            successes = 0
            rewards = []
            for ep in range(num_episodes):
                obs, _ = env.reset(seed=seed + ep)
                agent.reset()
                tot_rew = 0.0
                done = False
                while not done:
                    # Inject sensor noise
                    noisy_obs = [max(0.0, min(1.0, o + rng.gauss(0.0, noise_std))) for o in obs]
                    action, _, _ = agent.act(noisy_obs)
                    obs, reward, terminated, truncated, info = env.step(action)
                    tot_rew += reward
                    done = terminated or truncated

                if info.get("success", False):
                    successes += 1
                rewards.append(tot_rew)

            rate = successes / float(num_episodes)
            mean_r = sum(rewards) / float(num_episodes)
            results[name][f"noise_{noise_std}"] = {
                "success_rate": round(rate, 3),
                "mean_reward": round(mean_r, 2),
            }

    output_path = "results/tables/noise_robustness.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return results


if __name__ == "__main__":
    run_noise_robustness()
