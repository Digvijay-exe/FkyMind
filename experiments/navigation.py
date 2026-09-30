"""
Experiment: Multi-Model Navigation Comparison.
Evaluates:
1. Random Agent
2. Conventional ANN
3. Generic SNN
4. FlyMind (FlyWire Connectome SNN)
Saves comparison metrics to results/tables/model_comparison.json.
"""

import os
import sys
import json
import logging
from typing import Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from baselines.random_agent import RandomAgent
from baselines.ann import ANNAgent
from baselines.generic_snn import GenericSNNAgent
from brain.flymind import FlyMindAgent
from minecraft.environment import FlyMindMinecraftEnv
from training.evaluate import evaluate_agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("flymind.experiments.navigation")


def run_navigation_comparison(num_episodes: int = 25, seed: int = 42) -> Dict[str, Any]:
    env = FlyMindMinecraftEnv(mode="mock", seed=seed)

    models = {
        "Random_Baseline": RandomAgent(seed=seed),
        "ANN_Baseline": ANNAgent(seed=seed),
        "Generic_SNN": GenericSNNAgent(seed=seed),
        "FlyMind_Connectome": FlyMindAgent(seed=seed),
    }

    comparison_results = {}
    for name, agent in models.items():
        logger.info(f"Evaluating {name} across {num_episodes} episodes...")
        eval_metrics = evaluate_agent(agent, env, num_episodes=num_episodes, seed=seed)
        comparison_results[name] = eval_metrics
        logger.info(f"-> {name}: Success Rate = {eval_metrics['success_rate']*100:.1f}%, Mean Reward = {eval_metrics['mean_reward']:.2f}")

    output_path = "results/tables/model_comparison.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(comparison_results, f, indent=2)

    logger.info(f"Model comparison saved to {output_path}")
    return comparison_results


if __name__ == "__main__":
    run_navigation_comparison(num_episodes=20)
