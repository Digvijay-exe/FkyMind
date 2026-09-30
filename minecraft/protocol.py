"""
Communication protocol for Minecraft Fabric Mod <-> Python Bridge.
Handles JSON serialization, observation decoding, and action command encoding.
"""

from typing import Dict, Any, Tuple
import json

PROTOCOL_VERSION = "v1.2-flymind"


class MinecraftProtocolError(Exception):
    """Raised when an invalid packet or incompatible schema is received."""
    pass


def encode_action_packet(action_dict: Dict[str, bool]) -> str:
    """
    Serializes action commands to JSON string to be sent to Minecraft Fabric Mod.
    Schema matching Section 17 of the PRD:
    {
      "forward": bool,
      "back": bool,
      "left": bool,
      "right": bool,
      "jump": bool,
      "attack": bool,
      "interact": bool
    }
    """
    payload = {
        "forward": bool(action_dict.get("forward", False)),
        "back": bool(action_dict.get("back", False)),
        "left": bool(action_dict.get("left", False)),
        "right": bool(action_dict.get("right", False)),
        "jump": bool(action_dict.get("jump", False)),
        "attack": bool(action_dict.get("attack", False)),
        "interact": bool(action_dict.get("interact", False)),
    }
    return json.dumps(payload) + "\n"


def decode_observation_packet(raw_json_str: str) -> Dict[str, Any]:
    """
    Deserializes and validates observation packet from Minecraft Fabric Mod.
    Schema matching Section 16 of the PRD.
    """
    try:
        data = json.loads(raw_json_str.strip())
    except json.JSONDecodeError as e:
        raise MinecraftProtocolError(f"Malformed JSON from Minecraft bridge: {e}")

    # Required top-level keys
    required_keys = ["tick", "position", "yaw", "pitch", "health", "target", "raycast"]
    for k in required_keys:
        if k not in data:
            raise MinecraftProtocolError(f"Observation packet missing required field '{k}'")

    return data
