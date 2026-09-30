"""
Evaluation framework for FlyMind and baseline agents.
Executes test episodes and records key quantitative metrics:
- Success rate
- Average episode reward
- Steps to goal
- Collision rate
- Total spike count & firing rate
- Action distribution
"""

from typing import Dict, Any, List
import statistics
from minecraft.environment import FlyMindMinecraftEnv


def evaluate_agent(
    agent: Any,
    env: FlyMindMinecraftEnv = None,
    num_episodes: int = 20,
    seed: int = 100,
) -> Dict[str, Any]:
    """
    Evaluates an agent across multiple controlled episodes.
    """
    if env is None:
        env = FlyMindMinecraftEnv(mode="mock", seed=seed)

    rewards: List[float] = []
    successes: List[bool] = []
    steps_list: List[int] = []
    collisions_list: List[int] = []
    firing_rates: List[float] = []

    for ep in range(num_episodes):
        ep_seed = seed + ep * 13
        obs, _ = env.reset(seed=ep_seed)
        agent.reset()

        total_reward = 0.0
        step_count = 0
        total_collisions = 0
        ep_firing_rates = []
        done = False

        while not done:
            action, value_est, telemetry = agent.act(obs)
            obs, reward, terminated, truncated, info = env.step(action)
            total_reward += reward
            step_count += 1

            if info.get("collided", False):
                total_collisions += 1

            if "mean_firing_rate_hz" in telemetry:
                ep_firing_rates.append(telemetry["mean_firing_rate_hz"])

            done = terminated or truncated

        rewards.append(total_reward)
        successes.append(info.get("success", False))
        steps_list.append(step_count)
        collisions_list.append(total_collisions)
        if ep_firing_rates:
            firing_rates.append(statistics.mean(ep_firing_rates))

    success_rate = sum(1 for s in successes if s) / float(num_episodes)
    mean_reward = statistics.mean(rewards)
    std_reward = statistics.stdev(rewards) if len(rewards) > 1 else 0.0
    mean_steps = statistics.mean(steps_list)
    mean_collisions = statistics.mean(collisions_list)
    mean_firing = statistics.mean(firing_rates) if firing_rates else 0.0

    return {
        "num_episodes": num_episodes,
        "success_rate": round(success_rate, 4),
        "mean_reward": round(mean_reward, 2),
        "std_reward": round(std_reward, 2),
        "mean_steps_to_goal": round(mean_steps, 1),
        "mean_collisions_per_episode": round(mean_collisions, 2),
        "mean_firing_rate_hz": round(mean_firing, 2),
    }
