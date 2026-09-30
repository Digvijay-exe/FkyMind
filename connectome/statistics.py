"""
Graph statistics and topology analysis for connectome datasets.
Generates metrics for scientific reporting and comparison.
"""

from typing import Dict, Any, List
import json
import os
from connectome.graph import ConnectomeGraph
from connectome.download import load_dataset


def generate_statistics_report(data_path: str = None, output_path: str = "results/connectome_statistics.json") -> Dict[str, Any]:
    """
    Computes graph statistics and writes out a JSON report.
    """
    data = load_dataset(data_path)
    graph = ConnectomeGraph(data, weight_strategy="connectome_weighted")
    stats = graph.compute_statistics()

    stats["dataset_source"] = data.get("dataset_metadata", {}).get("source", "FlyWire")
    stats["dataset_version"] = data.get("dataset_metadata", {}).get("version", "v783")
    stats["cell_types_count"] = len(set(n.get("cell_type", "") for n in data.get("neurons", [])))
    stats["neuropils_count"] = len(set(n.get("neuropil", "") for n in data.get("neurons", [])))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    return stats


if __name__ == "__main__":
    report = generate_statistics_report()
    print("Connectome statistics generated:", json.dumps(report, indent=2))
