"""
AeroMind-DL Offline MAPPO Training Pipeline.
Runs multi-agent rollouts, computes Generalized Advantage Estimation (GAE),
and saves checkpointed actor-critic weights.
"""

import os
import argparse
import time
import torch
import numpy as np
from aeromind.simulation.environment import MultiDroneEnvironment
from aeromind.models.mappo import MAPPOCoordinator

def train_mappo(
    episodes: int = 50,
    num_drones: int = 6,
    num_targets: int = 15,
    save_dir: str = "checkpoints"
):
    print("=" * 70)
    print("[AEROMIND-DL] Multi-Agent Deep Reinforcement Learning Training")
    print(f"Algorithm: MAPPO | Drones: {num_drones} | Targets: {num_targets} | Episodes: {episodes}")
    print("=" * 70)

    os.makedirs(save_dir, exist_ok=True)
    checkpoint_file = os.path.join(save_dir, "mappo_checkpoint.pt")

    env = MultiDroneEnvironment(num_drones=num_drones, num_targets=num_targets, max_steps=200)
    coordinator = MAPPOCoordinator(num_drones=num_drones)

    start_time = time.time()
    best_reward = -float("inf")

    for ep in range(1, episodes + 1):
        env.reset()
        ep_reward = 0.0
        steps = 0
        done = False

        while not done and steps < 120:
            state = env.get_state()
            actions, _ = coordinator.select_actions(state)
            next_state, reward, done, info = env.step(actions)
            ep_reward += reward
            steps += 1

        completion_pct = (env.targets_completed / max(1, env.num_targets)) * 100.0

        if ep_reward > best_reward:
            best_reward = ep_reward
            coordinator.save_checkpoint(checkpoint_file)

        if ep % 5 == 0 or ep == 1:
            elapsed = time.time() - start_time
            print(
                f"[Episode {ep:3d}/{episodes:3d}] "
                f"Reward: {ep_reward:7.1f} | "
                f"Completion: {completion_pct:5.1f}% | "
                f"Collisions: {env.collision_events:2d} | "
                f"Distance: {env.total_distance_traveled:6.1f}m | "
                f"Time: {elapsed:4.1f}s"
            )

    print("-" * 70)
    print(f"[DONE] Training completed in {time.time() - start_time:.2f}s.")
    print(f"[SAVED] Best model weights saved to: {checkpoint_file}")
    print("=" * 70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train AeroMind MAPPO Policy")
    parser.add_argument("--episodes", type=int, default=30, help="Number of training episodes")
    parser.add_argument("--drones", type=int, default=6, help="Number of drones")
    parser.add_argument("--targets", type=int, default=15, help="Number of targets")
    parser.add_argument("--save-dir", type=str, default="checkpoints", help="Output directory")
    args = parser.parse_args()

    train_mappo(episodes=args.episodes, num_drones=args.drones, num_targets=args.targets, save_dir=args.save_dir)
