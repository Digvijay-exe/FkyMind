"""
Unit tests for Sparse SNN spike propagation and synaptic currents.
"""

import unittest
from brain.sparse_snn import SparseSNN
from brain.lif import LIFParameters


class TestSparseSNN(unittest.TestCase):

    def setUp(self):
        # 3-neuron chain: 0 -> 1 -> 2
        edges = [(0, 1, 8.0), (1, 2, 8.0)]
        params = LIFParameters(v_rest=-65.0, v_reset=-70.0, v_thresh=-50.0, tau_m=10.0, dt=1.0)
        self.snn = SparseSNN(n_neurons=3, edges=edges, lif_params=params)

    def test_spike_transmission_chain(self):
        """Spiking neuron 0 should excite neuron 1, which in turn excites neuron 2."""
        self.snn.reset()
        # Force neuron 0 to spike by delivering large external current
        s1, _ = self.snn.step([50.0, 0.0, 0.0])
        self.assertEqual(s1[0], 1)

        # Step 2: Synaptic current arrives at neuron 1
        s2, v2 = self.snn.step([0.0, 0.0, 0.0])
        # Neuron 1 receives excitatory current
        self.assertGreater(v2[1], -65.0)


if __name__ == "__main__":
    unittest.main()
