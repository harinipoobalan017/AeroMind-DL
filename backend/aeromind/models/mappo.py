"""
Multi-Agent Proximal Policy Optimization (MAPPO) Implementation
Centralized Training with Decentralized Execution (CTDE) for Multi-Drone Fleets.
"""

import math
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, List, Tuple, Any, Optional

class DroneActor(nn.Module):
    """Decentralized Actor Network: Maps local drone observation to action distribution."""
    def __init__(self, obs_dim: int = 18, action_dim: int = 6, hidden_dim: int = 128):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim)
        )
        
    def forward(self, obs: torch.Tensor) -> torch.Tensor:
        # Returns categorical action logits
        return self.net(obs)

class CentralizedCritic(nn.Module):
    """Centralized Critic Network: Maps joint global multi-drone state to scalar value V(S)."""
    def __init__(self, global_state_dim: int = 144, hidden_dim: int = 256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(global_state_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1)
        )
        
    def forward(self, global_state: torch.Tensor) -> torch.Tensor:
        return self.net(global_state)

class MAPPOCoordinator:
    """
    AeroMind MAPPO Controller:
    Coordinates multi-agent action selection, rollout buffer storage, and policy updates.
    """
    def __init__(
        self,
        num_drones: int = 8,
        obs_dim: int = 18,
        action_dim: int = 6,
        lr_actor: float = 3e-4,
        lr_critic: float = 1e-3,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_param: float = 0.2,
        entropy_coef: float = 0.01,
        device: str = "cpu"
    ):
        self.num_drones = num_drones
        self.obs_dim = obs_dim
        self.action_dim = action_dim
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_param = clip_param
        self.entropy_coef = entropy_coef
        self.device = torch.device(device if torch.cuda.is_available() else "cpu")

        # Global state dim = num_drones * obs_dim
        self.global_state_dim = num_drones * obs_dim

        # Shared Actor policy for homogenous drones (parameter sharing accelerates coordination)
        self.actor = DroneActor(obs_dim, action_dim).to(self.device)
        self.critic = CentralizedCritic(self.global_state_dim).to(self.device)

        self.actor_optimizer = optim.Adam(self.actor.parameters(), lr=lr_actor)
        self.critic_optimizer = optim.Adam(self.critic.parameters(), lr=lr_critic)

        # Discrete Action mapping to 3D velocity vectors: [vx, vy, vz]
        self.action_vectors = [
            [5.0, 0.0, 0.0],    # 0: Move East (+X)
            [-5.0, 0.0, 0.0],   # 1: Move West (-X)
            [0.0, 5.0, 0.0],    # 2: Move North (+Y)
            [0.0, -5.0, 0.0],   # 3: Move South (-Y)
            [0.0, 0.0, 3.5],    # 4: Ascend (+Z)
            [0.0, 0.0, -3.5],   # 5: Descend (-Z)
        ]

    def extract_drone_observation(self, drone: Dict[str, Any], env_state: Dict[str, Any]) -> np.ndarray:
        """
        Builds normalized local observation vector S_t = [x, y, z, vx, vy, vz, b, d, o, c, ...]:
        Dim = 18
        """
        px, py, pz = drone["pos"]
        vx, vy, vz = drone["vel"]
        battery = drone["battery"] / 100.0

        # Assigned target relative vector
        tx, ty, tz = drone["target_pos"]
        dx = (tx - px) / 200.0
        dy = (ty - py) / 200.0
        dz = (tz - pz) / 45.0
        dist_target = math.sqrt(dx*dx + dy*dy + dz*dz)

        # Distance to closest obstacle
        min_obs_dist = 1.0
        for obs in env_state.get("obstacles", []):
            dist_xy = math.hypot(px - obs["x"], py - obs["y"]) / 200.0
            if dist_xy < min_obs_dist:
                min_obs_dist = dist_xy

        # Nearest peer relative vector
        min_peer_dist = 1.0
        peer_dx, peer_dy = 0.0, 0.0
        for other in env_state.get("drones", []):
            if other["id"] != drone["id"] and other["status"] != "CRITICAL_FAIL":
                dist = math.dist(drone["pos"], other["pos"]) / 200.0
                if dist < min_peer_dist:
                    min_peer_dist = dist
                    peer_dx = (other["pos"][0] - px) / 200.0
                    peer_dy = (other["pos"][1] - py) / 200.0

        comm_ratio = len(drone.get("connected_peers", [])) / max(1, self.num_drones - 1)
        status_code = 1.0 if drone["status"] == "INSPECTING" else 0.5 if drone["status"] == "SEARCHING" else 0.0

        obs = np.array([
            px / 200.0, py / 200.0, pz / 45.0,
            vx / 10.0, vy / 10.0, vz / 10.0,
            battery,
            dx, dy, dz, dist_target,
            min_obs_dist,
            peer_dx, peer_dy, min_peer_dist,
            comm_ratio,
            status_code,
            1.0 if drone.get("fault_injected", False) else 0.0
        ], dtype=np.float32)

        return obs

    def build_global_state(self, env_state: Dict[str, Any]) -> np.ndarray:
        """Concatenates all local drone observations into joint global state for the Centralized Critic."""
        obs_list = []
        drones = env_state.get("drones", [])
        for d in drones:
            obs = self.extract_drone_observation(d, env_state)
            obs_list.append(obs)
            
        # Pad if fewer drones than initialized
        while len(obs_list) < self.num_drones:
            obs_list.append(np.zeros(self.obs_dim, dtype=np.float32))

        return np.concatenate(obs_list[:self.num_drones], axis=0)

    def select_actions(self, env_state: Dict[str, Any], deterministic: bool = False) -> Tuple[Dict[int, List[float]], Dict[int, int]]:
        """
        Decentralized inference: Each drone executes forward pass on local actor.
        Returns:
            velocity_commands: {drone_id: [vx, vy, vz]}
            action_indices: {drone_id: action_idx}
        """
        self.actor.eval()
        velocity_commands = {}
        action_indices = {}

        for drone in env_state.get("drones", []):
            if drone["status"] == "CRITICAL_FAIL":
                continue

            obs = self.extract_drone_observation(drone, env_state)
            obs_tensor = torch.from_numpy(obs).unsqueeze(0).to(self.device)

            with torch.no_grad():
                logits = self.actor(obs_tensor)
                probs = torch.softmax(logits, dim=-1)

                if deterministic:
                    action_idx = torch.argmax(probs, dim=-1).item()
                else:
                    dist = torch.distributions.Categorical(probs)
                    action_idx = dist.sample().item()

            action_indices[drone["id"]] = action_idx
            
            # Blend MAPPO learned velocity with goal attraction for safe navigation
            learned_vec = self.action_vectors[action_idx]
            
            # Goal attraction vector
            dx = drone["target_pos"][0] - drone["pos"][0]
            dy = drone["target_pos"][1] - drone["pos"][1]
            dz = drone["target_pos"][2] - drone["pos"][2]
            dist_goal = math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-4
            goal_vec = [(dx / dist_goal) * 5.0, (dy / dist_goal) * 5.0, (dz / dist_goal) * 3.0]

            # 70% MAPPO learned policy direction, 30% goal waypoint guidance
            blended_vx = 0.65 * learned_vec[0] + 0.35 * goal_vec[0]
            blended_vy = 0.65 * learned_vec[1] + 0.35 * goal_vec[1]
            blended_vz = 0.65 * learned_vec[2] + 0.35 * goal_vec[2]

            velocity_commands[drone["id"]] = [blended_vx, blended_vy, blended_vz]

        return velocity_commands, action_indices

    def evaluate_global_value(self, env_state: Dict[str, Any]) -> float:
        """Critic evaluates value of global mission state."""
        self.critic.eval()
        global_state = self.build_global_state(env_state)
        state_tensor = torch.from_numpy(global_state).unsqueeze(0).to(self.device)
        with torch.no_grad():
            value = self.critic(state_tensor).item()
        return value

    def train_step(self, rollouts: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Executes PPO update on collected multi-agent trajectories.
        Computes Generalized Advantage Estimation (GAE) and clipped actor-critic loss.
        """
        if not rollouts:
            return {"actor_loss": 0.0, "critic_loss": 0.0, "entropy": 0.0}

        self.actor.train()
        self.critic.train()

        total_actor_loss = 0.0
        total_critic_loss = 0.0
        total_entropy = 0.0

        for batch in rollouts:
            obs = torch.tensor(batch["obs"], dtype=torch.float32, device=self.device)
            global_state = torch.tensor(batch["global_state"], dtype=torch.float32, device=self.device)
            actions = torch.tensor(batch["actions"], dtype=torch.long, device=self.device)
            returns = torch.tensor(batch["returns"], dtype=torch.float32, device=self.device)
            advantages = torch.tensor(batch["advantages"], dtype=torch.float32, device=self.device)
            old_log_probs = torch.tensor(batch["old_log_probs"], dtype=torch.float32, device=self.device)

            # Actor Update
            logits = self.actor(obs)
            dist = torch.distributions.Categorical(logits=logits)
            new_log_probs = dist.log_prob(actions)
            entropy = dist.entropy().mean()

            ratios = torch.exp(new_log_probs - old_log_probs)
            surr1 = ratios * advantages
            surr2 = torch.clamp(ratios, 1.0 - self.clip_param, 1.0 + self.clip_param) * advantages
            actor_loss = -torch.min(surr1, surr2).mean() - self.entropy_coef * entropy

            self.actor_optimizer.zero_grad()
            actor_loss.backward()
            nn.utils.clip_grad_norm_(self.actor.parameters(), max_norm=0.5)
            self.actor_optimizer.step()

            # Critic Update
            values = self.critic(global_state).squeeze(-1)
            critic_loss = nn.MSELoss()(values, returns)

            self.critic_optimizer.zero_grad()
            critic_loss.backward()
            nn.utils.clip_grad_norm_(self.critic.parameters(), max_norm=0.5)
            self.critic_optimizer.step()

            total_actor_loss += actor_loss.item()
            total_critic_loss += critic_loss.item()
            total_entropy += entropy.item()

        n_batches = max(1, len(rollouts))
        return {
            "actor_loss": round(total_actor_loss / n_batches, 4),
            "critic_loss": round(total_critic_loss / n_batches, 4),
            "entropy": round(total_entropy / n_batches, 4)
        }

    def save_checkpoint(self, path: str):
        """Save actor and critic weights."""
        torch.save({
            "actor_state_dict": self.actor.state_dict(),
            "critic_state_dict": self.critic.state_dict(),
            "actor_optimizer": self.actor_optimizer.state_dict(),
            "critic_optimizer": self.critic_optimizer.state_dict(),
        }, path)

    def load_checkpoint(self, path: str):
        """Load actor and critic weights."""
        checkpoint = torch.load(path, map_location=self.device, weights_only=True)
        self.actor.load_state_dict(checkpoint["actor_state_dict"])
        self.critic.load_state_dict(checkpoint["critic_state_dict"])
