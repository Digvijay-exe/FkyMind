"""
FlyMind Agent: Connectome-derived Spiking Neural Network for Minecraft.
Integrates:
- Sensory observation mapping
- Rate-based spike encoding
- FlyWire-derived sparse LIF recurrent architecture
- Central Complex (CX) heading and Fan-Shaped Body (FB) goal integration
- Descending motor neuron action readout
- Value estimation head for reinforcement learning
"""

from typing import List, Dict, Any, Tuple, Optional
import math
import random
from connectome.download import load_dataset
from connectome.graph import ConnectomeGraph
from brain.lif import LIFParameters
from brain.sparse_snn import SparseSNN
from brain.encoder import RateEncoder
from brain.decoder import ActionDecoder, ACTION_NAMES


class FlyMindAgent:
    """
    Connectome-inspired Spiking Neural Agent for autonomous Minecraft gameplay.
    """

    def __init__(
        self,
        connectome_data: Optional[Dict[str, Any]] = None,
        weight_strategy: str = "connectome_weighted",
        num_inputs: int = 14,
        num_actions: int = 8,
        time_steps: int = 16,
        seed: int = 42,
    ):
        self.seed = seed
        self.num_inputs = num_inputs
        self.num_actions = num_actions
        self.time_steps = time_steps
        self.rng = random.Random(seed)

        # 1. Load connectome & construct sparse topology
        self.raw_data = connectome_data or load_dataset()
        self.graph = ConnectomeGraph(self.raw_data, weight_strategy=weight_strategy)
        self.n_neurons = self.graph.n_neurons

        # 2. Extract sensory and motor indices
        self.sensory_indices = self._map_sensory_neurons()
        self.motor_indices = self._map_motor_neurons()

        # 3. Instantiate SNN engine
        lif_params = LIFParameters(
            v_rest=-65.0, v_reset=-70.0, v_thresh=-50.0, tau_m=20.0, t_ref=2.0, dt=1.0
        )
        self.snn = SparseSNN(self.n_neurons, self.graph.edges, lif_params=lif_params)

        # 4. Encoders and decoders
        self.encoder = RateEncoder(max_spike_rate_hz=100.0, dt_ms=1.0, seed=seed)
        self.decoder = ActionDecoder(num_actions=num_actions, temperature=1.0, seed=seed)

        # 5. Trainable linear policy bias and value weights for RL
        self.action_biases = [0.0] * num_actions
        self.value_weights = [random.uniform(-0.1, 0.1) for _ in range(self.n_neurons)]
        self.value_bias = 0.0

    def _map_sensory_neurons(self) -> List[int]:
        """Finds neuron indices designated as sensory inputs."""
        indices = []
        for idx, neuron in enumerate(self.graph.neurons):
            role = str(neuron.get("role", "")).lower()
            if "sensory" in role or "optic" in neuron.get("neuropil", "").lower():
                indices.append(idx)
        # Pad or truncate to num_inputs
        while len(indices) < self.num_inputs:
            indices.append(len(indices) % self.n_neurons)
        return indices[:self.num_inputs]

    def _map_motor_neurons(self) -> List[int]:
        """Finds neuron indices designated as motor descending readouts."""
        indices = []
        for idx, neuron in enumerate(self.graph.neurons):
            role = str(neuron.get("role", "")).lower()
            if "action" in role or "motor" in role or "descending" in neuron.get("neuropil", "").lower():
                indices.append(idx)
        # Pad or truncate to num_actions
        while len(indices) < self.num_actions:
            indices.append((self.n_neurons - 1 - len(indices)) % self.n_neurons)
        return indices[:self.num_actions]

    def reset(self):
        """Resets agent state between episodes."""
        self.snn.reset()

    def act(self, observation: List[float]) -> Tuple[int, float, Dict[str, Any]]:
        """
        Processes a Minecraft observation through the connectome SNN.
        Returns:
            action: selected discrete action (0-7)
            value_estimate: critic state-value prediction V(s)
            telemetry: spike records, firing rates, active neurons
        """
        # Encode observations into spike trains over time_steps
        input_spikes = self.encoder.encode_window(observation, self.time_steps)

        # Run recurrent sparse SNN
        run_result = self.snn.run_window(
            input_spikes, self.sensory_indices, input_current_scale=4.0
        )
        accum_spikes = run_result["accumulated_spikes"]

        # Read out spikes at motor neurons
        motor_spike_counts = [accum_spikes[idx] for idx in self.motor_indices]

        # Decode into action
        action, action_probs = self.decoder.decode_from_counts(
            motor_spike_counts, bias=self.action_biases
        )

        # Compute state value estimate V(s) from network activity
        value_est = self.value_bias
        for i in range(self.n_neurons):
            value_est += self.value_weights[i] * (accum_spikes[i] / float(self.time_steps))

        telemetry = {
            "action_name": ACTION_NAMES[action],
            "action_probs": action_probs,
            "motor_spikes": motor_spike_counts,
            "total_spikes": run_result["total_spike_count"],
            "mean_firing_rate_hz": run_result["mean_firing_rate_hz"],
            "step_spikes": run_result["step_spikes"],
            "step_voltages": run_result["step_voltages"],
            "active_neurons": [i for i, c in enumerate(accum_spikes) if c > 0],
        }

        return action, value_est, telemetry
