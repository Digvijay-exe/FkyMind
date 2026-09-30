"""
Action decoder for FlyMind.
Converts motor neuron spike activity and readout potentials into discrete action distributions.
"""

from typing import List, Tuple
import math
import random

ACTION_NAMES = [
    "NO_OP",
    "MOVE_FORWARD",
    "MOVE_BACKWARD",
    "TURN_LEFT",
    "TURN_RIGHT",
    "JUMP",
    "ATTACK",
    "INTERACT",
]


class ActionDecoder:
    """
    Decodes motor spike counts into discrete action probabilities via softmax.
    """

    def __init__(self, num_actions: int = 8, temperature: float = 1.0, seed: int = 42):
        self.num_actions = num_actions
        self.temperature = max(0.01, temperature)
        self.rng = random.Random(seed)

    def set_seed(self, seed: int):
        self.rng = random.Random(seed)

    def decode_from_counts(self, spike_counts: List[int], bias: List[float] = None) -> Tuple[int, List[float]]:
        """
        Takes spike counts of readout neurons and converts them to action logits.
        Returns:
            (selected_action, action_probabilities)
        """
        assert len(spike_counts) >= self.num_actions, (
            f"Expected at least {self.num_actions} readout neurons, got {len(spike_counts)}"
        )

        logits = [float(spike_counts[i]) for i in range(self.num_actions)]
        if bias and len(bias) >= self.num_actions:
            logits = [l + bias[i] for i, l in enumerate(logits)]

        # Softmax with temperature
        scaled = [l / self.temperature for l in logits]
        max_logit = max(scaled)
        exp_logits = [math.exp(l - max_logit) for l in scaled]
        sum_exp = sum(exp_logits)
        probs = [e / sum_exp for e in exp_logits]

        # Sample action according to probabilities
        r = self.rng.random()
        cumulative = 0.0
        action = 0
        for i, p in enumerate(probs):
            cumulative += p
            if r <= cumulative:
                action = i
                break

        return action, probs

    def get_action_name(self, action_idx: int) -> str:
        if 0 <= action_idx < len(ACTION_NAMES):
            return ACTION_NAMES[action_idx]
        return f"UNKNOWN_{action_idx}"
