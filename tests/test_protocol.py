"""
Unit tests for Minecraft JSON protocol encoding and decoding.
"""

import unittest
from minecraft.protocol import encode_action_packet, decode_observation_packet, MinecraftProtocolError


class TestMinecraftProtocol(unittest.TestCase):

    def test_encode_action_packet(self):
        packet = encode_action_packet({"forward": True, "jump": True})
        self.assertTrue(packet.endswith("\n"))
        self.assertIn('"forward": true', packet)
        self.assertIn('"jump": true', packet)
        self.assertIn('"back": false', packet)

    def test_decode_valid_observation(self):
        raw = (
            '{"tick": 100, "position": {"x": 1.0, "y": 64.0, "z": 2.0}, '
            '"yaw": 45.0, "pitch": 0.0, "health": 20.0, "velocity": [0.0, 0.0, 0.0], '
            '"target": {"distance": 10.0, "angle": 0.0}, '
            '"raycast": {"front": 5.0, "left": 6.0, "right": 7.0}}\n'
        )
        data = decode_observation_packet(raw)
        self.assertEqual(data["tick"], 100)
        self.assertEqual(data["health"], 20.0)

    def test_decode_invalid_observation_raises(self):
        with self.assertRaises(MinecraftProtocolError):
            decode_observation_packet('{"invalid": "data"}')


if __name__ == "__main__":
    unittest.main()
