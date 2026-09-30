"""
Unit tests for Leaky Integrate-and-Fire (LIF) neuron biophysics.
"""

import unittest
from brain.lif import LIFNeuronLayer, LIFParameters


class TestLIFNeuron(unittest.TestCase):

    def setUp(self):
        self.params = LIFParameters(
            v_rest=-65.0,
            v_reset=-70.0,
            v_thresh=-50.0,
            tau_m=20.0,
            t_ref=2.0,
            dt=1.0,
            r_membrane=10.0,
        )
        self.layer = LIFNeuronLayer(n_neurons=4, params=self.params)

    def test_resting_potential_stability(self):
        """Without external current, neuron must remain at resting potential."""
        self.layer.reset_state()
        spikes, voltages = self.layer.step([0.0, 0.0, 0.0, 0.0])
        for v in voltages:
            self.assertAlmostEqual(v, -65.0, places=3)
        for s in spikes:
            self.assertEqual(s, 0)

    def test_subthreshold_integration(self):
        """Small current should depolarize membrane towards threshold without spiking."""
        self.layer.reset_state()
        spikes, voltages = self.layer.step([0.5, 0.0, 0.0, 0.0])
        self.assertGreater(voltages[0], -65.0)
        self.assertLess(voltages[0], -50.0)
        self.assertEqual(spikes[0], 0)

    def test_action_potential_generation_and_reset(self):
        """Strong current should cross threshold, emit a spike (1), and reset to v_reset."""
        self.layer.reset_state()
        spikes, voltages = self.layer.step([50.0, 0.0, 0.0, 0.0])
        self.assertEqual(spikes[0], 1)
        self.assertEqual(voltages[0], self.params.v_reset)

    def test_refractory_period(self):
        """During refractory period, neuron must clamp at reset and not spike."""
        self.layer.reset_state()
        # Fire once
        spikes1, _ = self.layer.step([50.0, 0.0, 0.0, 0.0])
        self.assertEqual(spikes1[0], 1)

        # Immediate next step during refractory (t_ref=2.0ms, dt=1.0ms)
        spikes2, voltages2 = self.layer.step([50.0, 0.0, 0.0, 0.0])
        self.assertEqual(spikes2[0], 0)
        self.assertEqual(voltages2[0], self.params.v_reset)


if __name__ == "__main__":
    unittest.main()
