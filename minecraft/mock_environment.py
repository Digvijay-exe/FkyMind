"""
Gymnasium-compatible Minecraft Mock Environment for offline development and testing.
Simulates player motion, orientation, target positioning, obstacles, and multi-angle raycasts.
Allows full end-to-end RL training and evaluation without requiring a running Minecraft instance.
"""

from typing import Dict, Any, Tuple, List, Optional
import math
import random
from minecraft.rewards import RewardCalculator
from minecraft.observations import observation_packet_to_vector


class MockMinecraftEnv:
    """
    Simulated 2D/3D navigation environment with Minecraft physics abstractions.
    """

    def __init__(
        self,
        world_size: Tuple[float, float] = (32.0, 32.0),
        num_obstacles: int = 12,
        seed: int = 42,
        max_steps: int = 250,
        task: str = "target_navigation",
    ):
        self.world_w, self.world_h = world_size
        self.num_obstacles = num_obstacles
        self.max_steps = max_steps
        self.task = task
        self.rng = random.Random(seed)
        self.reward_calc = RewardCalculator()

        # State variables
        self.step_count = 0
        self.player_x = 4.0
        self.player_z = 4.0
        self.player_yaw = 0.0  # degrees: 0 = East (+X), 90 = South (+Z), etc.
        self.player_health = 20.0
        self.target_x = 28.0
        self.target_z = 28.0
        self.obstacles: List[Tuple[float, float, float, float]] = []  # (min_x, min_z, max_x, max_z)
        self.prev_dist = 0.0

        self.reset(seed=seed)

    def reset(self, seed: Optional[int] = None) -> Tuple[List[float], Dict[str, Any]]:
        """Resets the player, target, and randomized obstacle field."""
        if seed is not None:
            self.rng = random.Random(seed)

        self.step_count = 0
        self.player_x = 4.0
        self.player_z = 4.0
        self.player_yaw = self.rng.uniform(0.0, 360.0)
        self.player_health = 20.0
        self.target_x = self.world_w - 4.0
        self.target_z = self.world_h - 4.0

        # Generate non-overlapping box obstacles
        self.obstacles = []
        for _ in range(self.num_obstacles):
            ox = self.rng.uniform(6.0, self.world_w - 8.0)
            oz = self.rng.uniform(6.0, self.world_h - 8.0)
            w = self.rng.uniform(1.5, 3.0)
            h = self.rng.uniform(1.5, 3.0)
            self.obstacles.append((ox, oz, ox + w, oz + h))

        self.prev_dist = self._dist_to_target()
        raw_obs = self._get_raw_obs()
        obs_vec = observation_packet_to_vector(raw_obs)
        return obs_vec, {"raw": raw_obs}

    def _dist_to_target(self) -> float:
        dx = self.target_x - self.player_x
        dz = self.target_z - self.player_z
        return math.sqrt(dx * dx + dz * dz)

    def _angle_to_target(self) -> float:
        """Returns relative angle from player heading to target in degrees (-180 to 180)."""
        dx = self.target_x - self.player_x
        dz = self.target_z - self.player_z
        target_dir = math.degrees(math.atan2(dz, dx))
        diff = (target_dir - self.player_yaw + 180.0) % 360.0 - 180.0
        return diff

    def _raycast(self, angle_offset_deg: float, max_dist: float = 12.0) -> float:
        """Simulates distance sensor ray along heading + angle_offset."""
        ray_yaw = math.radians(self.player_yaw + angle_offset_deg)
        dir_x = math.cos(ray_yaw)
        dir_z = math.sin(ray_yaw)

        dist = max_dist
        step_sz = 0.4
        curr_dist = 0.0
        while curr_dist < max_dist:
            curr_dist += step_sz
            rx = self.player_x + dir_x * curr_dist
            rz = self.player_z + dir_z * curr_dist

            # Check boundary collision
            if rx <= 0.0 or rx >= self.world_w or rz <= 0.0 or rz >= self.world_h:
                dist = curr_dist
                break

            # Check obstacle bounding boxes
            hit = False
            for (min_x, min_z, max_x, max_z) in self.obstacles:
                if min_x <= rx <= max_x and min_z <= rz <= max_z:
                    dist = curr_dist
                    hit = True
                    break
            if hit:
                break

        return min(max_dist, dist)

    def _get_raw_obs(self) -> Dict[str, Any]:
        """Builds raw JSON matching the Fabric mod observation schema."""
        dist = self._dist_to_target()
        angle = self._angle_to_target()
        front_d = self._raycast(0.0)
        left_d = self._raycast(-45.0)
        right_d = self._raycast(45.0)

        return {
            "tick": self.step_count,
            "position": {"x": round(self.player_x, 2), "y": 64.0, "z": round(self.player_z, 2)},
            "yaw": round(self.player_yaw, 1),
            "pitch": 0.0,
            "health": self.player_health,
            "velocity": [0.0, 0.0, 0.0],
            "target": {"distance": round(dist, 2), "angle": round(angle, 1)},
            "raycast": {"front": round(front_d, 2), "left": round(left_d, 2), "right": round(right_d, 2)},
        }

    def step(self, action: int) -> Tuple[List[float], float, bool, bool, Dict[str, Any]]:
        """
        Executes one environmental step.
        action: 0: NO_OP, 1: FORWARD, 2: BACKWARD, 3: LEFT, 4: RIGHT, 5: JUMP, 6: ATTACK, 7: INTERACT
        """
        self.step_count += 1
        collided = False
        step_size = 0.8
        turn_angle = 15.0  # degrees

        if action == 1:  # FORWARD
            rad = math.radians(self.player_yaw)
            new_x = self.player_x + math.cos(rad) * step_size
            new_z = self.player_z + math.sin(rad) * step_size
            if self._is_valid_pos(new_x, new_z):
                self.player_x = new_x
                self.player_z = new_z
            else:
                collided = True
        elif action == 2:  # BACKWARD
            rad = math.radians(self.player_yaw)
            new_x = self.player_x - math.cos(rad) * (step_size * 0.5)
            new_z = self.player_z - math.sin(rad) * (step_size * 0.5)
            if self._is_valid_pos(new_x, new_z):
                self.player_x = new_x
                self.player_z = new_z
            else:
                collided = True
        elif action == 3:  # TURN_LEFT
            self.player_yaw = (self.player_yaw - turn_angle) % 360.0
        elif action == 4:  # TURN_RIGHT
            self.player_yaw = (self.player_yaw + turn_angle) % 360.0
        elif action == 5:  # JUMP / FORWARD JUMP
            rad = math.radians(self.player_yaw)
            new_x = self.player_x + math.cos(rad) * (step_size * 1.2)
            new_z = self.player_z + math.sin(rad) * (step_size * 1.2)
            if self._is_valid_pos(new_x, new_z):
                self.player_x = new_x
                self.player_z = new_z
            else:
                collided = True

        curr_dist = self._dist_to_target()
        reward, terminated, breakdown = self.reward_calc.calculate(
            prev_dist=self.prev_dist,
            curr_dist=curr_dist,
            collided=collided,
            health=self.player_health,
            is_alive=True,
            step_count=self.step_count,
            max_steps=self.max_steps,
        )
        self.prev_dist = curr_dist

        truncated = self.step_count >= self.max_steps
        raw_obs = self._get_raw_obs()
        obs_vec = observation_packet_to_vector(raw_obs)

        info = {
            "breakdown": breakdown,
            "collided": collided,
            "distance_to_target": curr_dist,
            "raw": raw_obs,
            "success": curr_dist <= self.reward_calc.target_reach_threshold,
        }

        return obs_vec, reward, terminated, truncated, info

    def _is_valid_pos(self, x: float, z: float) -> bool:
        """Returns True if position is within bounds and free of obstacle collisions."""
        radius = 0.4
        if x - radius <= 0.0 or x + radius >= self.world_w:
            return False
        if z - radius <= 0.0 or z + radius >= self.world_h:
            return False
        for (min_x, min_z, max_x, max_z) in self.obstacles:
            if (min_x - radius <= x <= max_x + radius) and (min_z - radius <= z <= max_z + radius):
                return False
        return True
