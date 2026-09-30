"""
Leaky Integrate-and-Fire (LIF) neuron model for FlyMind.
Implements biologically grounded membrane dynamics, leakage, absolute refractory period,
threshold spike generation, and post-spike hyperpolarization reset.
"""

from typing import List, Tuple
import math


class LIFParameters:
    """Configuration container for LIF neuron biophysics."""

    def __init__(
        self,
        v_rest: float = -65.0,     # mV
        v_reset: float = -70.0,    # mV
        v_thresh: float = -50.0,   # mV
        tau_m: float = 20.0,       # ms
        t_ref: float = 2.0,        # ms
        dt: float = 1.0,           # ms
        r_membrane: float = 10.0,  # MOhm
    ):
        self.v_rest = v_rest
        self.v_reset = v_reset
        self.v_thresh = v_thresh
        self.tau_m = tau_m
        self.t_ref = t_ref
        self.dt = dt
        self.r_membrane = r_membrane
        # Membrane decay factor per step: exp(-dt / tau_m)
        self.alpha = math.exp(-dt / tau_m)


class LIFNeuronLayer:
    """
    Vectorized layer of Leaky Integrate-and-Fire neurons.
    Maintains membrane potential (V) and refractory counter for N neurons.
    """

    def __init__(self, n_neurons: int, params: LIFParameters = None):
        self.n_neurons = n_neurons
        self.params = params or LIFParameters()

        # States
        self.v = [self.params.v_rest] * n_neurons
        self.refractory_steps = [0] * n_neurons
        self.refractory_limit = int(round(self.params.t_ref / self.params.dt))
        self.last_spikes = [0] * n_neurons

    def reset_state(self):
        """Resets all membrane potentials to resting state and clears refractory counters."""
        self.v = [self.params.v_rest] * self.n_neurons
        self.refractory_steps = [0] * self.n_neurons
        self.last_spikes = [0] * self.n_neurons

    def step(self, synaptic_currents: List[float]) -> Tuple[List[int], List[float]]:
        """
        Advances the LIF dynamics by one time-step dt.
        Arguments:
            synaptic_currents: list of input currents for each neuron (nA)
        Returns:
            (spikes, potentials):
                spikes: binary list (1 if spiked, 0 otherwise)
                potentials: current membrane potentials (mV)
        """
        spikes = [0] * self.n_neurons
        new_v = [self.params.v_rest] * self.n_neurons

        for i in range(self.n_neurons):
            # Check refractory state
            if self.refractory_steps[i] > 0:
                self.refractory_steps[i] -= 1
                new_v[i] = self.params.v_reset
                continue

            # Leaky integration: V(t+dt) = V_rest + (V(t) - V_rest)*alpha + I*R*(1 - alpha)
            leak = self.params.v_rest + (self.v[i] - self.params.v_rest) * self.params.alpha
            input_drive = synaptic_currents[i] * self.params.r_membrane * (1.0 - self.params.alpha)
            v_tentative = leak + input_drive

            # Threshold check
            if v_tentative >= self.params.v_thresh:
                spikes[i] = 1
                new_v[i] = self.params.v_reset
                self.refractory_steps[i] = self.refractory_limit
            else:
                new_v[i] = v_tentative

        self.v = new_v
        self.last_spikes = spikes
        return spikes, list(self.v)
