"""
Graph construction and weight initialization for Drosophila connectome SNN.
Implements:
- Strategy A: Connectome-weighted (normalized biological synapse counts + Dale's law)
- Strategy B: Binary connectivity (topology only)
- Strategy C: Randomized degree-preserving control
"""

from typing import Dict, Any, List, Tuple, Optional
import math
import random
from connectome.annotations import get_transmitter_sign


class ConnectomeGraph:
    """
    Represents a sparse directed neural connectome graph with signed synaptic weights.
    """

    def __init__(self, data: Dict[str, Any], weight_strategy: str = "connectome_weighted", base_weight_scale: float = 0.5):
        self.metadata = data.get("dataset_metadata", {})
        self.neurons = data.get("neurons", [])
        self.raw_synapses = data.get("synapses", [])
        self.weight_strategy = weight_strategy
        self.base_weight_scale = base_weight_scale

        # Index mapping
        self.neuron_id_to_idx: Dict[str, int] = {
            str(n["id"]): idx for idx, n in enumerate(self.neurons)
        }
        self.idx_to_neuron_id: Dict[int, str] = {
            idx: str(n["id"]) for idx, n in enumerate(self.neurons)
        }
        self.n_neurons = len(self.neurons)

        # Build sparse edge list: (src_idx, tgt_idx, weight)
        self.edges: List[Tuple[int, int, float]] = []
        self._build_graph()

    def _build_graph(self):
        if not self.raw_synapses:
            return

        max_count = max([s.get("count", 1) for s in self.raw_synapses], default=1)
        
        edges_temp = []
        for s in self.raw_synapses:
            src_str = str(s["source"])
            tgt_str = str(s["target"])
            if src_str not in self.neuron_id_to_idx or tgt_str not in self.neuron_id_to_idx:
                continue

            src_idx = self.neuron_id_to_idx[src_str]
            tgt_idx = self.neuron_id_to_idx[tgt_str]
            count = float(s.get("count", 1))

            src_neuron = self.neurons[src_idx]
            sign = get_transmitter_sign(src_neuron.get("neurotransmitter", "ACH"))

            if self.weight_strategy == "binary":
                weight = sign * self.base_weight_scale
            elif self.weight_strategy == "random_topology":
                # Randomized weight preserving sign
                weight = sign * random.uniform(0.1, 1.0) * self.base_weight_scale
            else:  # "connectome_weighted" (Strategy A)
                norm_count = math.log1p(count) / math.log1p(max_count)
                weight = sign * (0.2 + 0.8 * norm_count) * self.base_weight_scale

            edges_temp.append((src_idx, tgt_idx, weight))

        if self.weight_strategy == "random_rewired":
            # Preserve node degree distribution but rewire targets (Strategy C)
            target_indices = [e[1] for e in edges_temp]
            random.shuffle(target_indices)
            self.edges = [(e[0], target_indices[i], e[2]) for i, e in enumerate(edges_temp)]
        else:
            self.edges = edges_temp

    def get_sparse_adjacency(self) -> List[Tuple[int, int, float]]:
        """Returns the list of (source_idx, target_idx, weight) tuples."""
        return self.edges

    def get_in_and_out_degrees(self) -> Tuple[List[int], List[int]]:
        """Returns in-degree and out-degree lists for each neuron."""
        in_degrees = [0] * self.n_neurons
        out_degrees = [0] * self.n_neurons
        for src, tgt, _ in self.edges:
            out_degrees[src] += 1
            in_degrees[tgt] += 1
        return in_degrees, out_degrees

    def compute_statistics(self) -> Dict[str, Any]:
        """Calculates topological graph statistics."""
        in_deg, out_deg = self.get_in_and_out_degrees()
        n_edges = len(self.edges)
        possible_edges = self.n_neurons * (self.n_neurons - 1) if self.n_neurons > 1 else 1
        density = n_edges / possible_edges if possible_edges > 0 else 0.0

        return {
            "num_neurons": self.n_neurons,
            "num_edges": n_edges,
            "density": round(density, 6),
            "mean_in_degree": round(sum(in_deg) / max(1, self.n_neurons), 2),
            "max_in_degree": max(in_deg, default=0),
            "mean_out_degree": round(sum(out_deg) / max(1, self.n_neurons), 2),
            "max_out_degree": max(out_deg, default=0),
            "strategy": self.weight_strategy,
        }
