"""
Observation encoder for FlyMind.
Converts normalized continuous Minecraft observations into spike trains using rate or temporal coding.
"""

from typing import List
import random
import math


class RateEncoder:
    """
    Rate-based Poisson/Bernoulli spike encoder.
    Maps continuous input values in [0, 1] to spike probabilities per simulation step.
    """

    def __init__(self, max_spike_rate_hz: float = 100.0, dt_ms: float = 1.0, seed: int = 42):
        self.max_rate_hz = max_spike_rate_hz
        self.dt_ms = dt_ms
        # Max probability per time step dt
        self.max_prob_per_step = (max_spike_rate_hz / 1000.0) * dt_ms
        self.rng = random.Random(seed)

    def set_seed(self, seed: int):
        self.rng = random.Random(seed)

    def encode_step(self, observation: List[float]) -> List[int]:
        """
        Generates binary spikes for an observation vector for a single time step.
        Clamps inputs to [0.0, 1.0].
        """
        spikes = []
        for val in observation:
            clamped = max(0.0, min(1.0, float(val)))
            prob = clamped * self.max_prob_per_step
            spikes.append(1 if self.rng.random() < prob else 0)
        return spikes

    def encode_window(self, observation: List[float], n_steps: int) -> List[List[int]]:
        """
        Generates a sequence of spike vectors over n_steps time window.
        Returns shape [n_steps, num_inputs].
        """
        return [self.encode_step(observation) for _ in range(n_steps)]


class LatencyEncoder:
    """
    Temporal / latency encoder. Stronger inputs cause earlier spikes in the time window.
    """

    def __init__(self, n_steps: int = 16):
        self.n_steps = n_steps

    def encode_window(self, observation: List[float]) -> List[List[int]]:
        """
        Encodes each feature into an exact spike timing: step = round((1 - val) * (n_steps - 1)).
        """
        n_features = len(observation)
        spikes_over_time = [[0] * n_features for _ in range(self.n_steps)]

        for feat_idx, val in enumerate(observation):
            clamped = max(0.0, min(1.0, float(val)))
            if clamped > 0.05:  # Only fire if above minimal intensity
                timing = int(round((1.0 - clamped) * (self.n_steps - 1)))
                timing = max(0, min(self.n_steps - 1, timing))
                spikes_over_time[timing][feat_idx] = 1

        return spikes_over_time
