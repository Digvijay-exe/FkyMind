"""
Action representations and discrete-to-boolean command mappings for Minecraft.
"""

from typing import Dict, Any

# Discrete Action Space:
# 0: NO_OP
# 1: MOVE_FORWARD
# 2: MOVE_BACKWARD
# 3: TURN_LEFT
# 4: TURN_RIGHT
# 5: JUMP
# 6: ATTACK
# 7: INTERACT

ACTION_MAP = {
    0: {"forward": False, "back": False, "left": False, "right": False, "jump": False, "attack": False, "interact": False},
    1: {"forward": True,  "back": False, "left": False, "right": False, "jump": False, "attack": False, "interact": False},
    2: {"forward": False, "back": True,  "left": False, "right": False, "jump": False, "attack": False, "interact": False},
    3: {"forward": False, "back": False, "left": True,  "right": False, "jump": False, "attack": False, "interact": False},
    4: {"forward": False, "back": False, "left": False, "right": True,  "jump": False, "attack": False, "interact": False},
    5: {"forward": True,  "back": False, "left": False, "right": False, "jump": True,  "attack": False, "interact": False},
    6: {"forward": False, "back": False, "left": False, "right": False, "jump": False, "attack": True,  "interact": False},
    7: {"forward": False, "back": False, "left": False, "right": False, "jump": False, "attack": False, "interact": True},
}


def discrete_to_action_dict(action_id: int) -> Dict[str, bool]:
    """Converts discrete action index (0-7) into Minecraft control boolean dictionary."""
    return ACTION_MAP.get(int(action_id), ACTION_MAP[0]).copy()
