"""
Synapse implementation for sparse spike propagation.
Maintains sparse adjacency list or CSR-like lookups to avoid NxN dense allocations.
"""

from typing import List, Tuple, Dict


class SparseSynapticGraph:
    """
    Manages sparse recurrent synaptic connections between spiking neurons.
    """

    def __init__(self, n_neurons: int, edges: List[Tuple[int, int, float]], synaptic_decay: float = 0.8):
        self.n_neurons = n_neurons
        self.synaptic_decay = synaptic_decay

        # Pre-build incoming adjacency map: target_idx -> list of (source_idx, weight)
        self.incoming: Dict[int, List[Tuple[int, float]]] = {i: [] for i in range(n_neurons)}
        # Pre-build outgoing adjacency map: source_idx -> list of (target_idx, weight)
        self.outgoing: Dict[int, List[Tuple[int, float]]] = {i: [] for i in range(n_neurons)}

        for src, tgt, w in edges:
            if 0 <= src < n_neurons and 0 <= tgt < n_neurons:
                self.incoming[tgt].append((src, w))
                self.outgoing[src].append((tgt, w))

        # Trace of synaptic currents (for exponential EPSC / IPSC decay)
        self.current_traces = [0.0] * n_neurons

    def reset_state(self):
        self.current_traces = [0.0] * self.n_neurons

    def compute_currents(self, spikes: List[int], external_currents: List[float] = None) -> List[float]:
        """
        Calculates total synaptic currents arriving at each neuron given active spikes.
        Decays previous synaptic trace and adds newly arriving spikes.
        """
        # Apply exponential decay to ongoing synaptic currents
        new_traces = [trace * self.synaptic_decay for trace in self.current_traces]

        # Propagate from active spiking neurons
        for src_idx, spiked in enumerate(spikes):
            if spiked:
                for tgt_idx, weight in self.outgoing.get(src_idx, []):
                    new_traces[tgt_idx] += weight

        # Add external input currents
        if external_currents:
            for i in range(self.n_neurons):
                new_traces[i] += external_currents[i]

        self.current_traces = new_traces
        return list(self.current_traces)
