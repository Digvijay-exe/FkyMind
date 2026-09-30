"""
Experiment 5: Connectome Topology Ablation.
Compares:
1. Full FlyWire biological topology + Dale's law weights
2. Binary connectivity (biological graph structure, uniform unweighted synapses)
3. Randomized degree-preserved control (shuffled targets, preserving in/out degree)
Saves results to results/tables/topology_ablation.json.
"""

import os
import sys
import json
import logging
from typing import Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from brain.flymind import FlyMindAgent
from minecraft.environment import FlyMindMinecraftEnv
from training.evaluate import evaluate_agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("flymind.experiments.ablation")


def run_topology_ablation(num_episodes: int = 25, seed: int = 42) -> Dict[str, Any]:
    env = FlyMindMinecraftEnv(mode="mock", seed=seed)

    variants = {
        "FlyWire_Biological": FlyMindAgent(weight_strategy="connectome_weighted", seed=seed),
        "Binary_Topology": FlyMindAgent(weight_strategy="binary", seed=seed),
        "Randomized_Degree_Control": FlyMindAgent(weight_strategy="random_rewired", seed=seed),
    }

    ablation_results = {}
    for variant_name, agent in variants.items():
        logger.info(f"Running ablation for: {variant_name}...")
        metrics = evaluate_agent(agent, env, num_episodes=num_episodes, seed=seed)
        ablation_results[variant_name] = metrics
        logger.info(f"-> {variant_name}: Success Rate = {metrics['success_rate']*100:.1f}%, Firing Rate = {metrics['mean_firing_rate_hz']:.1f} Hz")

    output_path = "results/tables/topology_ablation.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(ablation_results, f, indent=2)

    return ablation_results


if __name__ == "__main__":
    run_topology_ablation(num_episodes=20)
