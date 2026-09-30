"""
Observation normalizer and feature extractor for Minecraft agent.
Maps 3D Minecraft state and proximity raycasts to the 14-dimensional input vector.
"""

from typing import Dict, Any, List
import math


def observation_packet_to_vector(
    obs: Dict[str, Any], max_raycast_dist: float = 12.0, max_target_dist: float = 40.0
) -> List[float]:
    """
    Transforms raw JSON observation into 14 normalized channels in [0, 1]:
    0: distance_front
    1: distance_left
    2: distance_right
    3: target_direction (normalized relative angle / 180)
    4: target_distance (normalized)
    5: player_health (0.0 to 1.0)
    6: player_velocity_forward
    7: player_velocity_lateral
    8: obstacle_front_looming (1 if close, 0 if far)
    9: obstacle_left_looming
    10: obstacle_right_looming
    11: target_in_front_cone
    12: resource_visible / target_reachable
    13: yaw_error_magnitude
    """
    raycast = obs.get("raycast", {})
    front_dist = float(raycast.get("front", max_raycast_dist))
    left_dist = float(raycast.get("left", max_raycast_dist))
    right_dist = float(raycast.get("right", max_raycast_dist))

    norm_front = min(1.0, max(0.0, front_dist / max_raycast_dist))
    norm_left = min(1.0, max(0.0, left_dist / max_raycast_dist))
    norm_right = min(1.0, max(0.0, right_dist / max_raycast_dist))

    target = obs.get("target", {})
    tgt_dist = float(target.get("distance", max_target_dist))
    tgt_angle = float(target.get("angle", 0.0))  # degrees: -180 to 180

    norm_tgt_dist = min(1.0, max(0.0, tgt_dist / max_target_dist))
    norm_tgt_angle = (tgt_angle + 180.0) / 360.0  # mapped to [0, 1]

    health = float(obs.get("health", 20.0))
    norm_health = min(1.0, max(0.0, health / 20.0))

    vel = obs.get("velocity", [0.0, 0.0, 0.0])
    v_fwd = min(1.0, max(0.0, abs(vel[0]) * 5.0))
    v_lat = min(1.0, max(0.0, abs(vel[2]) * 5.0))

    loom_front = 1.0 - norm_front
    loom_left = 1.0 - norm_left
    loom_right = 1.0 - norm_right

    target_in_front = 1.0 if abs(tgt_angle) < 30.0 else 0.0
    target_near = 1.0 if tgt_dist < 3.0 else 0.0
    yaw_err_mag = min(1.0, abs(tgt_angle) / 180.0)

    return [
        norm_front,
        norm_left,
        norm_right,
        norm_tgt_angle,
        norm_tgt_dist,
        norm_health,
        v_fwd,
        v_lat,
        loom_front,
        loom_left,
        loom_right,
        target_in_front,
        target_near,
        yaw_err_mag,
    ]
