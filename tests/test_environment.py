"""
Unit tests for Minecraft Mock Environment physics, raycasts, and reward functions.
"""

import unittest
from minecraft.mock_environment import MockMinecraftEnv


class TestMockEnvironment(unittest.TestCase):

    def setUp(self):
        self.env = MockMinecraftEnv(world_size=(32.0, 32.0), num_obstacles=8, seed=42)

    def test_reset_dimensions(self):
        obs, info = self.env.reset(seed=42)
        # 14 normalized input channels
        self.assertEqual(len(obs), 14)
        for val in obs:
            self.assertGreaterEqual(val, 0.0)
            self.assertLessEqual(val, 1.0)

    def test_step_mechanics(self):
        obs, info = self.env.reset(seed=42)
        initial_dist = self.env._dist_to_target()

        # Step forward (action 1)
        next_obs, reward, terminated, truncated, step_info = self.env.step(1)
        self.assertEqual(len(next_obs), 14)
        self.assertIsInstance(reward, float)
        self.assertIn("breakdown", step_info)


if __name__ == "__main__":
    unittest.main()
