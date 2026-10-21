"""
Baseline Multi-Drone Allocation and Navigation Algorithms for Benchmarking:
- Baseline 1: Random Task Allocation
- Baseline 2: Nearest Drone Allocation (Euclidean Greedy)
- Baseline 3: Greedy Energy-Distance Optimization Heuristic
"""

import math
import random
from typing import Dict, List, Any

class BaselineAllocators:
    """Provides algorithmic task allocation baselines to evaluate against AeroMind MAPPO."""

    @staticmethod
    def random_allocation(env_state: Dict[str, Any]) -> Dict[int, int]:
        """
        Baseline 1: Random task assignment.
        Each available drone is randomly assigned to an uncompleted target.
        """
        assignments = {}
        unassigned_targets = [
            t for t in env_state["targets"]
            if not t["completed"] and t["assigned_drone"] is None
        ]
        available_drones = [
            d for d in env_state["drones"]
            if d["status"] in ["SEARCHING", "INSPECTING"]
            and d["assigned_target_id"] is None
        ]

        random.shuffle(unassigned_targets)
        for drone in available_drones:
            if unassigned_targets:
                target = unassigned_targets.pop()
                assignments[drone["id"]] = target["id"]

        return assignments

    @staticmethod
    def nearest_drone_allocation(env_state: Dict[str, Any]) -> Dict[int, int]:
        """
        Baseline 2: Nearest Drone (Greedy Spatial) Allocation.
        Assigns each uncompleted target to the closest idle drone.
        Ignores battery health, collision trajectories, and peer coordination.
        """
        assignments = {}
        unassigned_targets = [
            t for t in env_state["targets"]
            if not t["completed"] and t["assigned_drone"] is None
        ]
        available_drones = [
            d for d in env_state["drones"]
            if d["status"] in ["SEARCHING", "INSPECTING"]
            and d["assigned_target_id"] is None
        ]

        for target in unassigned_targets:
            if not available_drones:
                break
            # Find closest drone regardless of remaining battery
            available_drones.sort(
                key=lambda d: math.dist(d["pos"], target["pos"])
            )
            closest_drone = available_drones.pop(0)
            assignments[closest_drone["id"]] = target["id"]

        return assignments

    @staticmethod
    def greedy_energy_heuristic(env_state: Dict[str, Any]) -> Dict[int, int]:
        """
        Baseline 3: Greedy Energy-Distance Heuristic.
        Minimizes score: Cost = (Distance / 10.0) - (Battery_Pct * 0.5) - (Priority * 0.2).
        Accounts for battery, but lacks predictive multi-agent collision avoidance.
        """
        assignments = {}
        unassigned_targets = [
            t for t in env_state["targets"]
            if not t["completed"] and t["assigned_drone"] is None
        ]
        available_drones = [
            d for d in env_state["drones"]
            if d["status"] in ["SEARCHING", "INSPECTING"]
            and d["assigned_target_id"] is None
            and d["battery"] > 25.0
        ]

        # Prioritize higher priority targets first
        unassigned_targets.sort(key=lambda t: t["priority"], reverse=True)

        for target in unassigned_targets:
            if not available_drones:
                break

            best_drone = None
            best_score = float("inf")

            for drone in available_drones:
                dist = math.dist(drone["pos"], target["pos"])
                # Cost function balancing distance and battery preservation
                cost = (dist * 0.8) + (100.0 - drone["battery"]) * 0.5
                if cost < best_score:
                    best_score = cost
                    best_drone = drone

            if best_drone:
                available_drones.remove(best_drone)
                assignments[best_drone["id"]] = target["id"]

        return assignments
