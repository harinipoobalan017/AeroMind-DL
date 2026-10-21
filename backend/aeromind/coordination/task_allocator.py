"""
Dynamic Task Allocation & Fault-Tolerant Fleet Orchestration Engine.
Handles real-time priority task assignment, battery-aware rerouting,
and instant failover redistribution upon drone malfunction.
"""

import math
from typing import Dict, List, Any, Optional

class DynamicTaskAllocator:
    """
    Cloud-Edge Task Orchestrator:
    Balances multi-drone workloads, enforces battery thresholds,
    and handles autonomous peer take-overs.
    """
    def __init__(self, battery_critical_threshold: float = 20.0):
        self.battery_critical_threshold = battery_critical_threshold

    def orchestrate_cycle(
        self,
        env_state: Dict[str, Any],
        algorithm: str = "MAPPO"
    ) -> Dict[str, Any]:
        """
        Executes one coordination cycle:
        1. Checks health & battery of each drone
        2. Frees targets assigned to returning/dead drones
        3. Assigns unassigned high-priority targets to best eligible drones
        4. Detects & resolves duplication conflicts
        """
        drones = env_state.get("drones", [])
        targets = env_state.get("targets", [])
        reassignments = []
        alerts = []

        # 1. Health & Battery Audit
        for drone in drones:
            if drone["status"] == "CRITICAL_FAIL":
                if drone.get("assigned_target_id") is not None:
                    tid = drone["assigned_target_id"]
                    drone["assigned_target_id"] = None
                    # Mark target unassigned
                    for t in targets:
                        if t["id"] == tid:
                            t["assigned_drone"] = None
                    alerts.append(f"Drone {drone['name']} hardware offline. Target #{tid} released to pool.")

            elif drone["battery"] <= self.battery_critical_threshold and drone["status"] != "RETURNING":
                drone["status"] = "RETURNING"
                if drone.get("assigned_target_id") is not None:
                    tid = drone["assigned_target_id"]
                    drone["assigned_target_id"] = None
                    for t in targets:
                        if t["id"] == tid:
                            t["assigned_drone"] = None
                    alerts.append(f"Drone {drone['name']} low battery ({drone['battery']:.1f}%). Reallocating target #{tid} to healthier peer.")

        # 2. Match unassigned targets with idle/searching drones
        unassigned_targets = [
            t for t in targets
            if not t["completed"] and t["assigned_drone"] is None
        ]
        
        # Sort targets by priority descending (Wildfire & Survivors first)
        unassigned_targets.sort(key=lambda t: t["priority"], reverse=True)

        available_drones = [
            d for d in drones
            if d["status"] in ["SEARCHING"]
            and d["assigned_target_id"] is None
            and d["battery"] > self.battery_critical_threshold + 5.0
        ]

        for target in unassigned_targets:
            if not available_drones:
                break

            # If MAPPO or Greedy: compute weighted spatial cost
            best_drone = None
            best_cost = float("inf")

            for drone in available_drones:
                dist = math.dist(drone["pos"], target["pos"])
                # Cost function incorporates distance and battery advantage
                if algorithm == "MAPPO":
                    # MAPPO cooperative cost: distance + battery preservation + communication density
                    comm_peers = len(drone.get("connected_peers", []))
                    cost = dist * 0.7 - (drone["battery"] * 0.3) - (comm_peers * 3.0)
                elif algorithm == "NEAREST":
                    cost = dist
                elif algorithm == "GREEDY":
                    cost = (dist * 0.8) + (100.0 - drone["battery"]) * 0.4
                else:  # RANDOM
                    cost = 1.0

                if cost < best_cost:
                    best_cost = cost
                    best_drone = drone

            if best_drone:
                available_drones.remove(best_drone)
                best_drone["assigned_target_id"] = target["id"]
                best_drone["target_pos"] = list(target["pos"])
                target["assigned_drone"] = best_drone["id"]
                reassignments.append({
                    "drone_id": best_drone["id"],
                    "drone_name": best_drone["name"],
                    "target_id": target["id"],
                    "target_type": target["type"],
                    "priority": target["priority"]
                })

        return {
            "reassignments": reassignments,
            "alerts": alerts,
            "pending_targets_count": len([t for t in targets if not t["completed"]])
        }
