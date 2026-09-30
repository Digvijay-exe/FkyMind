"""
Sparse Spiking Neural Network (SNN) engine for FlyMind.
Runs recurrent LIF neural dynamics over multi-step temporal windows with sparse synaptic connections.
Records full telemetry: spike raster, membrane traces, and instantaneous firing rates.
"""

from typing import List, Dict, Tuple, Any, Optional
from brain.lif import LIFNeuronLayer, LIFParameters
from brain.synapse import SparseSynapticGraph


class SparseSNN:
    """
    Recurrent Spiking Neural Network built on sparse connectivity and LIF biophysics.
    """

    def __init__(
        self,
        n_neurons: int,
        edges: List[Tuple[int, int, float]],
        lif_params: Optional[LIFParameters] = None,
        synaptic_decay: float = 0.8,
    ):
        self.n_neurons = n_neurons
        self.edges = edges
        self.lif = LIFNeuronLayer(n_neurons, lif_params)
        self.synapse = SparseSynapticGraph(n_neurons, edges, synaptic_decay)

        # Telemetry buffers
        self.spike_history: List[List[int]] = []
        self.voltage_history: List[List[float]] = []

    def reset(self):
        """Resets membrane potentials, refractory states, and synaptic currents."""
        self.lif.reset_state()
        self.synapse.reset_state()
        self.spike_history = []
        self.voltage_history = []

    def step(self, external_currents: List[float] = None) -> Tuple[List[int], List[float]]:
        """
        Executes a single simulation time step dt.
        Returns (spikes, potentials).
        """
        # 1. Compute incoming synaptic currents from previous spikes + external currents
        last_spikes = self.lif.last_spikes
        syn_currents = self.synapse.compute_currents(last_spikes, external_currents)

        # 2. Update LIF membrane potentials and generate new spikes
        spikes, voltages = self.lif.step(syn_currents)

        # 3. Buffer telemetry
        self.spike_history.append(spikes)
        self.voltage_history.append(voltages)

        return spikes, voltages

    def run_window(
        self,
        input_spikes_over_time: List[List[int]],
        sensory_indices: List[int],
        input_current_scale: float = 3.5,
    ) -> Dict[str, Any]:
        """
        Runs the SNN over a temporal sequence of input spikes.
        input_spikes_over_time: shape [time_steps, num_inputs]
        sensory_indices: mapped neuron indices corresponding to the input features.
        """
        n_steps = len(input_spikes_over_time)
        accumulated_spikes = [0] * self.n_neurons
        step_spikes = []
        step_voltages = []

        for t in range(n_steps):
            ext_currents = [0.0] * self.n_neurons
            inp_spikes = input_spikes_over_time[t]
            for feat_idx, is_spiking in enumerate(inp_spikes):
                if is_spiking and feat_idx < len(sensory_indices):
                    target_neuron = sensory_indices[feat_idx]
                    if 0 <= target_neuron < self.n_neurons:
                        ext_currents[target_neuron] += input_current_scale

            spikes, voltages = self.step(ext_currents)
            step_spikes.append(spikes)
            step_voltages.append(voltages)
            for i in range(self.n_neurons):
                accumulated_spikes[i] += spikes[i]

        return {
            "accumulated_spikes": accumulated_spikes,
            "step_spikes": step_spikes,
            "step_voltages": step_voltages,
            "total_spike_count": sum(accumulated_spikes),
            "mean_firing_rate_hz": (sum(accumulated_spikes) / (self.n_neurons * n_steps * (self.lif.params.dt / 1000.0))),
        }
