"""
AeroMind-DL 3D Multi-Drone Simulation Environment
Models 3D kinematics, battery discharge, communication topology,
obstacle collision avoidance, and multi-objective rewards.
"""

import math
import random
from typing import Dict, List, Tuple, Any, Optional

class TargetType:
    PERSON = "PERSON"
    FIRE = "FIRE"
    BUILDING = "BUILDING"
    ROAD_BLOCK = "ROAD_BLOCK"
    CHARGING_PAD = "CHARGING_PAD"

class DroneStatus:
    SEARCHING = "SEARCHING"
    INSPECTING = "INSPECTING"
    RETURNING = "RETURNING"
    CHARGING = "CHARGING"
    CRITICAL_FAIL = "CRITICAL_FAIL"
    REALLOCATED = "REALLOCATED"

class MultiDroneEnvironment:
    """
    3D Cooperative Multi-Drone Environment for Mission Coordination.
    Domain: 200m x 200m x 50m Disaster Zone.
    """
    def __init__(
        self,
        num_drones: int = 8,
        num_targets: int = 20,
        area_size: Tuple[float, float, float] = (200.0, 200.0, 45.0),
        safe_distance: float = 6.0,
        comm_range: float = 65.0,
        max_steps: int = 600,
        seed: Optional[int] = 42
    ):
        self.num_drones = num_drones
        self.num_targets = num_targets
        self.area_x, self.area_y, self.area_z = area_size
        self.safe_distance = safe_distance
        self.comm_range = comm_range
        self.max_steps = max_steps
        
        if seed is not None:
            random.seed(seed)
            
        self.base_station = [20.0, 20.0, 0.0]
        self.charging_stations = [
            [20.0, 20.0, 0.0],
            [180.0, 180.0, 0.0]
        ]
        
        # 3D Obstacles: [x, y, z_min, z_max, radius, label]
        self.obstacles = [
            {"x": 60.0, "y": 80.0, "z_min": 0.0, "z_max": 35.0, "radius": 12.0, "type": "TOWER"},
            {"x": 130.0, "y": 70.0, "z_min": 0.0, "z_max": 28.0, "radius": 15.0, "type": "COLLAPSED_HQ"},
            {"x": 90.0, "y": 140.0, "z_min": 0.0, "z_max": 40.0, "radius": 18.0, "type": "INDUSTRIAL_SILO"},
            {"x": 150.0, "y": 140.0, "z_min": 0.0, "z_max": 25.0, "radius": 14.0, "type": "CRANE"}
        ]
        
        # Restricted No-Fly Zones (Toxic/Dense Smoke plume)
        self.restricted_zones = [
            {"x": 105.0, "y": 105.0, "radius": 22.0, "z_max": 45.0, "reason": "DENSE_TOXIC_PLUME"}
        ]
        
        self.current_step = 0
        self.total_distance_traveled = 0.0
        self.total_energy_consumed = 0.0
        self.collision_events = 0
        self.targets_completed = 0
        self.drones: List[Dict[str, Any]] = []
        self.targets: List[Dict[str, Any]] = []
        self.event_log: List[Dict[str, Any]] = []
        
        self.reset()

    def reset(self, num_drones: Optional[int] = None) -> Dict[str, Any]:
        """Reset environment to initial state."""
        if num_drones:
            self.num_drones = num_drones
            
        self.current_step = 0
        self.total_distance_traveled = 0.0
        self.total_energy_consumed = 0.0
        self.collision_events = 0
        self.targets_completed = 0
        self.event_log = []
        
        # Initialize Drones at base station with slight offset
        self.drones = []
        for i in range(self.num_drones):
            spawn_x = self.base_station[0] + (i % 4) * 6.0
            spawn_y = self.base_station[1] + (i // 4) * 6.0
            drone = {
                "id": i + 1,
                "name": f"D{i+1}",
                "pos": [spawn_x, spawn_y, 2.0],
                "vel": [0.0, 0.0, 0.0],
                "target_pos": [spawn_x, spawn_y, 15.0],
                "assigned_target_id": None,
                "battery": 100.0,  # 0 to 100%
                "battery_drain_rate": 0.07 + random.uniform(-0.01, 0.01),
                "status": DroneStatus.SEARCHING,
                "distance_flown": 0.0,
                "energy_used": 0.0,
                "inspection_time": 0,
                "payload_capability": "SURVEILLANCE" if i % 2 == 0 else "RESCUE_MEDIC",
                "connected_peers": [],
                "fov_angle": 60.0,
                "fault_injected": False,
                "heading": 0.0
            }
            self.drones.append(drone)
            
        # Initialize Diverse Disaster Targets
        target_types = [
            (TargetType.PERSON, "Survivor in Debris", 90),
            (TargetType.FIRE, "Active Wildfire Front", 95),
            (TargetType.BUILDING, "Unstable Damaged Roof", 70),
            (TargetType.ROAD_BLOCK, "Critical Evacuation Choke", 60)
        ]
        
        self.targets = []
        for t_id in range(1, self.num_targets + 1):
            t_type, desc, priority = target_types[(t_id - 1) % len(target_types)]
            # Spread across map avoiding base station
            tx = random.uniform(35.0, self.area_x - 20.0)
            ty = random.uniform(35.0, self.area_y - 20.0)
            tz = random.uniform(1.0, 18.0) if t_type in [TargetType.PERSON, TargetType.ROAD_BLOCK] else random.uniform(10.0, 32.0)
            
            self.targets.append({
                "id": t_id,
                "type": t_type,
                "description": f"{desc} #{t_id}",
                "pos": [round(tx, 1), round(ty, 1), round(tz, 1)],
                "priority": priority,
                "required_time": 18,  # steps needed to fully inspect
                "inspected_time": 0,
                "completed": False,
                "assigned_drone": None,
                "detected": False
            })
            
        self._log_event("MISSION_INIT", f"AeroMind initialized with {self.num_drones} autonomous drones and {self.num_targets} mission targets.")
        self._update_communication_graph()
        return self.get_state()

    def _log_event(self, event_type: str, message: str, drone_id: Optional[int] = None):
        """Append to system event log with timestamp."""
        entry = {
            "step": self.current_step,
            "type": event_type,
            "message": message,
            "drone_id": drone_id
        }
        self.event_log.append(entry)
        if len(self.event_log) > 100:
            self.event_log.pop(0)

    def _update_communication_graph(self):
        """Calculates mesh network links based on wireless communication range."""
        for i, d1 in enumerate(self.drones):
            peers = []
            if d1["status"] != DroneStatus.CRITICAL_FAIL:
                for j, d2 in enumerate(self.drones):
                    if i != j and d2["status"] != DroneStatus.CRITICAL_FAIL:
                        dist = math.dist(d1["pos"], d2["pos"])
                        if dist <= self.comm_range:
                            peers.append(d2["id"])
            d1["connected_peers"] = peers

    def inject_drone_failure(self, drone_id: int):
        """Simulate hardware/motor or link failure on a specific drone."""
        for d in self.drones:
            if d["id"] == drone_id:
                d["status"] = DroneStatus.CRITICAL_FAIL
                d["fault_injected"] = True
                d["vel"] = [0.0, 0.0, -2.5]
                self._log_event(
                    "MOTOR_FAILURE",
                    f"CRITICAL: Drone {d['name']} propulsion malfunction! Failing at {d['pos']}. Triggering fault-tolerant failover.",
                    drone_id
                )
                # Reassign orphaned target
                if d["assigned_target_id"] is not None:
                    target_id = d["assigned_target_id"]
                    d["assigned_target_id"] = None
                    for t in self.targets:
                        if t["id"] == target_id:
                            t["assigned_drone"] = None
                    self._reallocate_orphaned_target(target_id, failed_drone_id=drone_id)
                break

    def inject_battery_drop(self, drone_id: int, new_level: float = 14.0):
        """Simulate rapid battery degradation or cell failure."""
        for d in self.drones:
            if d["id"] == drone_id:
                d["battery"] = max(2.0, new_level)
                self._log_event(
                    "BATTERY_CRITICAL",
                    f"WARNING: Drone {d['name']} battery dropped to {d['battery']:.1f}%. Automatic Return-To-Base triggered.",
                    drone_id
                )
                d["status"] = DroneStatus.RETURNING
                d["target_pos"] = list(self.base_station)
                d["target_pos"][2] = 12.0
                if d["assigned_target_id"] is not None:
                    t_id = d["assigned_target_id"]
                    d["assigned_target_id"] = None
                    self._reallocate_orphaned_target(t_id, failed_drone_id=drone_id)
                break

    def _reallocate_orphaned_target(self, target_id: int, failed_drone_id: int):
        """Dynamic Task Allocation: Peer take-over when a drone drops out."""
        # Find closest active drone that has sufficient battery
        candidates = [
            d for d in self.drones
            if d["id"] != failed_drone_id
            and d["status"] in [DroneStatus.SEARCHING, DroneStatus.INSPECTING]
            and d["battery"] > 35.0
        ]
        
        target = next((t for t in self.targets if t["id"] == target_id), None)
        if not target or target["completed"]:
            return

        if candidates:
            # Sort by distance to target
            candidates.sort(key=lambda d: math.dist(d["pos"], target["pos"]))
            best_peer = candidates[0]
            best_peer["assigned_target_id"] = target_id
            best_peer["target_pos"] = list(target["pos"])
            target["assigned_drone"] = best_peer["id"]
            self._log_event(
                "FAILOVER_TAKEOVER",
                f"Dynamic Reallocation: Peer {best_peer['name']} accepted mission target #{target_id} from {f'D{failed_drone_id}'}.",
                best_peer["id"]
            )
        else:
            self._log_event(
                "TAKEOVER_QUEUED",
                f"No healthy peers available immediately. Target #{target_id} queued for priority reallocation."
            )

    def step(self, actions: Optional[Dict[int, List[float]]] = None) -> Tuple[Dict[str, Any], float, bool, Dict[str, Any]]:
        """
        Advance simulation by one discrete time step (dt = 0.5s).
        actions: Dict of {drone_id: [vx, vy, vz]} or target waypoints.
        """
        self.current_step += 1
        step_reward = 0.0
        dt = 0.5
        max_speed = 8.0  # m/s

        # 1. Update Drones
        for drone in self.drones:
            if drone["status"] == DroneStatus.CRITICAL_FAIL:
                # Controlled fall to ground
                if drone["pos"][2] > 0.0:
                    drone["pos"][2] = max(0.0, drone["pos"][2] + drone["vel"][2] * dt)
                continue

            # Apply actions or autonomous guidance
            if actions and drone["id"] in actions:
                cmd_vx, cmd_vy, cmd_vz = actions[drone["id"]]
            else:
                # Default kinematic pursuit toward target_pos
                dx = drone["target_pos"][0] - drone["pos"][0]
                dy = drone["target_pos"][1] - drone["pos"][1]
                dz = drone["target_pos"][2] - drone["pos"][2]
                dist = math.sqrt(dx*dx + dy*dy + dz*dz)
                if dist > 0.5:
                    speed = min(max_speed, dist * 0.8)
                    cmd_vx = (dx / dist) * speed
                    cmd_vy = (dy / dist) * speed
                    cmd_vz = (dz / dist) * speed
                else:
                    cmd_vx, cmd_vy, cmd_vz = 0.0, 0.0, 0.0

            # Low battery safeguard (< 20%)
            if drone["battery"] <= 20.0 and drone["status"] != DroneStatus.RETURNING:
                drone["status"] = DroneStatus.RETURNING
                drone["target_pos"] = list(self.base_station)
                drone["target_pos"][2] = 10.0
                step_reward -= 30.0  # Battery critical penalty
                self._log_event("BATTERY_LOW", f"Drone {drone['name']} below 20% battery. Initiating return to charging pad.", drone["id"])

            # Compute displacement
            old_pos = list(drone["pos"])
            drone["pos"][0] = max(0.0, min(self.area_x, drone["pos"][0] + cmd_vx * dt))
            drone["pos"][1] = max(0.0, min(self.area_y, drone["pos"][1] + cmd_vy * dt))
            drone["pos"][2] = max(0.0, min(self.area_z, drone["pos"][2] + cmd_vz * dt))
            
            displacement = math.dist(old_pos, drone["pos"])
            drone["distance_flown"] += displacement
            self.total_distance_traveled += displacement
            drone["vel"] = [cmd_vx, cmd_vy, cmd_vz]
            
            # Heading computation for 3D orientation
            if abs(cmd_vx) > 0.1 or abs(cmd_vy) > 0.1:
                drone["heading"] = math.atan2(cmd_vy, cmd_vx)

            # Realistic battery drain model
            # Base hover power + kinetic velocity expenditure
            v_mag = math.sqrt(cmd_vx**2 + cmd_vy**2 + cmd_vz**2)
            energy_step = (drone["battery_drain_rate"] * (1.0 + 0.15 * (v_mag / max_speed))) * dt
            drone["battery"] = max(0.0, drone["battery"] - energy_step)
            drone["energy_used"] += energy_step
            self.total_energy_consumed += energy_step
            
            if drone["battery"] <= 0.0:
                drone["status"] = DroneStatus.CRITICAL_FAIL
                self._log_event("BATTERY_DEPLETED", f"Drone {drone['name']} battery completely exhausted!", drone["id"])
                step_reward -= 50.0

            # Charging logic at base
            if drone["status"] == DroneStatus.RETURNING:
                dist_to_base = math.dist(drone["pos"][:2], self.base_station[:2])
                if dist_to_base < 8.0:
                    drone["status"] = DroneStatus.CHARGING
                    drone["battery"] = min(100.0, drone["battery"] + 2.5)
                    if drone["battery"] >= 95.0:
                        drone["status"] = DroneStatus.SEARCHING
                        self._log_event("RECHARGED", f"Drone {drone['name']} recharged to {drone['battery']:.0f}%. Resuming patrol.", drone["id"])

            # Check target inspection progress
            if drone["assigned_target_id"] is not None and drone["status"] in [DroneStatus.SEARCHING, DroneStatus.INSPECTING]:
                t = next((target for target in self.targets if target["id"] == drone["assigned_target_id"]), None)
                if t and not t["completed"]:
                    dist_to_target = math.dist(drone["pos"], t["pos"])
                    if dist_to_target <= 10.0:
                        drone["status"] = DroneStatus.INSPECTING
                        t["inspected_time"] += 1
                        drone["inspection_time"] += 1
                        step_reward += 2.0  # continuous inspection reward
                        if t["inspected_time"] >= t["required_time"]:
                            t["completed"] = True
                            self.targets_completed += 1
                            drone["assigned_target_id"] = None
                            drone["status"] = DroneStatus.SEARCHING
                            step_reward += 50.0  # Target successfully completed reward!
                            self._log_event(
                                "TARGET_RESOLVED",
                                f"SUCCESS: {drone['name']} completed inspection of {t['description']} at ({t['pos'][0]:.0f}, {t['pos'][1]:.0f}).",
                                drone["id"]
                            )

        # 2. Collision Detection: D_min < D_safe
        active_drones = [d for d in self.drones if d["status"] not in [DroneStatus.CRITICAL_FAIL, DroneStatus.CHARGING] and d["pos"][2] > 1.0]
        for i in range(len(active_drones)):
            for j in range(i + 1, len(active_drones)):
                d1 = active_drones[i]
                d2 = active_drones[j]
                d_ij = math.dist(d1["pos"], d2["pos"])
                if d_ij < self.safe_distance:
                    self.collision_events += 1
                    step_reward -= 100.0  # Critical collision penalty
                    self._log_event("COLLISION_WARNING", f"PROXIMITY ALERT: D{d1['id']} and D{d2['id']} breached safe distance ({d_ij:.1f}m < {self.safe_distance}m)!")
                    # Elastic repulsion maneuver
                    repulse = [(d1["pos"][k] - d2["pos"][k]) / (d_ij + 1e-4) * 2.0 for k in range(3)]
                    d1["pos"] = [d1["pos"][k] + repulse[k] for k in range(3)]
                    d2["pos"] = [d2["pos"][k] - repulse[k] for k in range(3)]

        # 3. Obstacle & Restricted Area Breaches
        for drone in active_drones:
            for obs in self.obstacles:
                dist_xy = math.hypot(drone["pos"][0] - obs["x"], drone["pos"][1] - obs["y"])
                if dist_xy < obs["radius"] and obs["z_min"] <= drone["pos"][2] <= obs["z_max"]:
                    self.collision_events += 1
                    step_reward -= 50.0
                    self._log_event("OBSTACLE_COLLISION", f"{drone['name']} brushed obstacle {obs['type']}! Initiating evasion.", drone["id"])
                    drone["pos"][2] = obs["z_max"] + 3.0  # ascend to clear

            for rz in self.restricted_zones:
                dist_xy = math.hypot(drone["pos"][0] - rz["x"], drone["pos"][1] - rz["y"])
                if dist_xy < rz["radius"] and drone["pos"][2] <= rz["z_max"]:
                    step_reward -= 20.0
                    self._log_event("RESTRICTED_ZONE_BREACH", f"ALERT: {drone['name']} entered No-Fly Zone ({rz['reason']})!", drone["id"])

        # 4. Update Communication Network Topology
        self._update_communication_graph()

        # Check mission completion
        is_done = (self.targets_completed >= self.num_targets) or (self.current_step >= self.max_steps)
        if self.targets_completed >= self.num_targets:
            step_reward += 100.0  # Mission full completion bonus
            self._log_event("MISSION_SUCCESS", "MISSION ACCOMPLISHED: All priority targets located, classified, and resolved.")

        return self.get_state(), step_reward, is_done, {
            "completion_rate": self.targets_completed / max(1, self.num_targets),
            "collisions": self.collision_events,
            "total_distance": round(self.total_distance_traveled, 1),
            "total_energy": round(self.total_energy_consumed, 1)
        }

    def get_state(self) -> Dict[str, Any]:
        """Returns full environment state dictionary for telemetry and frontend."""
        avg_battery = sum(d["battery"] for d in self.drones) / max(1, len(self.drones))
        completion_pct = (self.targets_completed / max(1, self.num_targets)) * 100.0

        return {
            "step": self.current_step,
            "max_steps": self.max_steps,
            "active_drones": len([d for d in self.drones if d["status"] != DroneStatus.CRITICAL_FAIL]),
            "total_drones": self.num_drones,
            "targets_completed": self.targets_completed,
            "total_targets": self.num_targets,
            "completion_percentage": round(completion_pct, 1),
            "battery_avg": round(avg_battery, 1),
            "collision_events": self.collision_events,
            "total_distance_m": round(self.total_distance_traveled, 1),
            "total_energy_units": round(self.total_energy_consumed, 1),
            "drones": self.drones,
            "targets": self.targets,
            "obstacles": self.obstacles,
            "restricted_zones": self.restricted_zones,
            "recent_events": self.event_log[-8:]
        }
