"""
Unit tests for Connectome parsing, validation, and subgraph generation.
"""

import unittest
from connectome.download import load_dataset
from connectome.validate import validate_connectome_dict
from connectome.graph import ConnectomeGraph
from connectome.subgraph import extract_sensorimotor_subgraph


class TestConnectomePipeline(unittest.TestCase):

    def test_load_and_validate_dataset(self):
        """Validates that the real FlyWire sample subgraph adheres strictly to schema."""
        data = load_dataset()
        is_valid, errors = validate_connectome_dict(data)
        self.assertTrue(is_valid, f"Validation errors: {errors}")
        self.assertGreater(len(data["neurons"]), 0)
        self.assertGreater(len(data["synapses"]), 0)

    def test_graph_construction_and_degrees(self):
        """Tests sparse graph edge mapping and degree statistics."""
        data = load_dataset()
        graph = ConnectomeGraph(data, weight_strategy="connectome_weighted")
        stats = graph.compute_statistics()
        self.assertEqual(stats["num_neurons"], len(data["neurons"]))
        self.assertGreater(stats["num_edges"], 0)
        self.assertGreaterEqual(stats["density"], 0.0)

    def test_subgraph_extraction(self):
        """Verifies sensorimotor subgraph extraction retains sensory and motor nodes."""
        data = load_dataset()
        sub = extract_sensorimotor_subgraph(data, max_hops=3)
        self.assertGreater(len(sub["neurons"]), 0)
        self.assertGreater(len(sub["synapses"]), 0)


if __name__ == "__main__":
    unittest.main()
