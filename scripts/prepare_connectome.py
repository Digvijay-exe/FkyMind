#!/usr/bin/env python3
"""
CLI script to prepare and preprocess Drosophila FlyWire connectome data.
Generates graph statistics, computes sparse connectivity, and validates integrity.
"""

import sys
import os
import argparse
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from connectome.download import load_dataset
from connectome.validate import validate_file
from connectome.graph import ConnectomeGraph
from connectome.statistics import generate_statistics_report


def main():
    parser = argparse.ArgumentParser(description="Prepare FlyWire connectome dataset for FlyMind.")
    parser.add_argument("--data-path", type=str, default=None, help="Path to raw connectome JSON/data file")
    parser.add_argument("--output-stats", type=str, default="results/connectome_statistics.json", help="Path to save stats")
    parser.add_argument("--strategy", type=str, default="connectome_weighted", choices=["connectome_weighted", "binary", "random_rewired"])
    args = parser.parse_args()

    print("=== FlyMind Connectome Preprocessing Pipeline ===")
    data = load_dataset(args.data_path)
    print(f"Loaded dataset: {data.get('dataset_metadata', {}).get('source')} ({data.get('dataset_metadata', {}).get('version')})")
    print(f"Total neurons: {len(data.get('neurons', []))}")
    print(f"Total synapses: {len(data.get('synapses', []))}")

    stats = generate_statistics_report(args.data_path, output_path=args.output_stats)
    print("\nGraph Topology Statistics:")
    print(f"  Neurons: {stats['num_neurons']}")
    print(f"  Edges: {stats['num_edges']}")
    print(f"  Density: {stats['density']:.6f}")
    print(f"  Mean in-degree: {stats['mean_in_degree']}")
    print(f"  Mean out-degree: {stats['mean_out_degree']}")
    print(f"\nStatistics written to: {args.output_stats}")


if __name__ == "__main__":
    main()
