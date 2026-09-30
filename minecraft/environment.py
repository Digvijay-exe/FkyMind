"""
Unified FlyMind Minecraft Environment.
Gymnasium-compatible interface conforming to Section 18 of the PRD:
reset(), step(action), render(), close().
Automatically uses live Fabric mod bridge if available, otherwise runs the mock environment.
"""

from typing import Tuple, List, Dict, Any, Optional
from minecraft.bridge import MinecraftBridge
from minecraft.mock_environment import MockMinecraftEnv
from minecraft.actions import discrete_to_action_dict
from minecraft.observations import observation_packet_to_vector
from minecraft.rewards import RewardCalculator


class FlyMindMinecraftEnv:
    """
    Standard RL environment interface for Minecraft agents.
    Exposes observation_space, action_space, reward, terminated, truncated, info.
    """

    def __init__(
        self,
        mode: str = "auto",  # "auto", "fabric", or "mock"
        host: str = "127.0.0.1",
        port: int = 8085,
        world_size: Tuple[float, float] = (32.0, 32.0),
        seed: int = 42,
    ):
        self.mode = mode
        self.host = host
        self.port = port
        self.seed = seed
        self.bridge = MinecraftBridge(host=host, port=port)
        self.mock_env = MockMinecraftEnv(world_size=world_size, seed=seed)
        self.reward_calc = RewardCalculator()
        self.use_mock = True

        if mode in ("auto", "fabric"):
            connected = self.bridge.connect()
            self.use_mock = not connected
            if mode == "fabric" and not connected:
                raise ConnectionError(f"Could not connect to Fabric mod at {host}:{port}")

    def reset(self, seed: Optional[int] = None) -> Tuple[List[float], Dict[str, Any]]:
        if self.use_mock:
            return self.mock_env.reset(seed=seed)

        # In real Fabric mode, reset mission and receive initial frame
        self.bridge.send_action({"forward": False, "back": False, "left": False, "right": False, "jump": False, "attack": False, "interact": False})
        raw_obs = self.bridge.receive_observation()
        obs_vec = observation_packet_to_vector(raw_obs)
        return obs_vec, {"raw": raw_obs}

    def step(self, action: int) -> Tuple[List[float], float, bool, bool, Dict[str, Any]]:
        if self.use_mock:
            return self.mock_env.step(action)

        # Send action to Fabric mod
        action_dict = discrete_to_action_dict(action)
        self.bridge.send_action(action_dict)

        # Receive updated state
        raw_obs = self.bridge.receive_observation()
        obs_vec = observation_packet_to_vector(raw_obs)

        # Compute reward
        target = raw_obs.get("target", {})
        curr_dist = float(target.get("distance", 10.0))
        health = float(raw_obs.get("health", 20.0))
        reward, terminated, breakdown = self.reward_calc.calculate(
            prev_dist=curr_dist + 0.1,  # approximation for remote ticks
            curr_dist=curr_dist,
            collided=False,
            health=health,
            is_alive=health > 0,
            step_count=int(raw_obs.get("tick", 0)),
            max_steps=300,
        )

        truncated = False
        info = {
            "breakdown": breakdown,
            "raw": raw_obs,
            "success": curr_dist <= self.reward_calc.target_reach_threshold,
        }
        return obs_vec, reward, terminated, truncated, info

    def render(self):
        """No-op for headless, handled by visualization dashboard."""
        pass

    def close(self):
        if not self.use_mock:
            self.bridge.close()
