"""
Reward calculation module for Minecraft goal-directed navigation tasks.
Implements shaped rewards according to configs/reward.yaml and Section 20 of the PRD.
"""

from typing import Dict, Any, Tuple


class RewardCalculator:
    """Computes reinforcement learning reward signals for navigation and survival."""

    def __init__(
        self,
        target_reached: float = 100.0,
        progress_scale: float = 1.0,
        useful_movement: float = 0.1,
        step_penalty: float = -0.05,
        collision_penalty: float = -2.0,
        severe_failure: float = -10.0,
        episode_death: float = -100.0,
        target_reach_threshold: float = 1.5,
    ):
        self.r_target_reached = target_reached
        self.r_progress_scale = progress_scale
        self.r_useful_movement = useful_movement
        self.r_step_penalty = step_penalty
        self.r_collision_penalty = collision_penalty
        self.r_severe_failure = severe_failure
        self.r_episode_death = episode_death
        self.target_reach_threshold = target_reach_threshold

    def calculate(
        self,
        prev_dist: float,
        curr_dist: float,
        collided: bool,
        health: float,
        is_alive: bool,
        step_count: int,
        max_steps: int,
    ) -> Tuple[float, bool, Dict[str, float]]:
        """
        Calculates step reward, termination flag, and reward component breakdown.
        """
        reward = self.r_step_penalty
        terminated = False
        breakdown = {"step_penalty": self.r_step_penalty}

        # Progress reward (distance delta)
        dist_delta = prev_dist - curr_dist
        if dist_delta > 0:
            prog_r = dist_delta * self.r_progress_scale + self.r_useful_movement
            reward += prog_r
            breakdown["progress"] = prog_r
        else:
            prog_r = dist_delta * self.r_progress_scale
            reward += prog_r
            breakdown["progress"] = prog_r

        # Collision penalty
        if collided:
            reward += self.r_collision_penalty
            breakdown["collision"] = self.r_collision_penalty

        # Check death
        if not is_alive or health <= 0:
            reward += self.r_episode_death
            terminated = True
            breakdown["death"] = self.r_episode_death
            return reward, terminated, breakdown

        # Check target reached
        if curr_dist <= self.target_reach_threshold:
            reward += self.r_target_reached
            terminated = True
            breakdown["target_reached"] = self.r_target_reached

        return reward, terminated, breakdown
