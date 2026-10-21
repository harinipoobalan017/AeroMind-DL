import React, { useState } from 'react';
import { 
  Eye, Brain, Target, BarChart2, MessageSquare, Globe, 
  Cloud, Zap, Radio, Layout, CheckCircle2, ArrowRight, 
  Terminal, Shield, Cpu, Activity, Sparkles, Layers
} from 'lucide-react';

/**
 * SystemArchitectureMatrix:
 * Directly maps all 10 Core Architectural Pillars from the AeroMind-DL Specification:
 * 1. 👁️ Vision: YOLO (Detect people/fire/vehicles)
 * 2. 🧠 Multi-agent brain: MAPPO (Coordinate drones)
 * 3. 🎯 Actor: MLP/Deep Neural Network (Select actions)
 * 4. 📊 Critic: MLP/Deep Neural Network (Evaluate decisions)
 * 5. 🗣️ High-level planning: LLM (Convert human mission instructions into goals)
 * 6. 🌍 Simulation: AirSim/Gazebo (Virtual drones/world)
 * 7. ☁️ Training: Cloud GPU (Large-scale RL training on AWS)
 * 8. ⚡ Edge AI: YOLO + trained policy (Real-time decisions)
 * 9. 📡 Communication: MQTT/ROS 2 (Drone communication & mesh pub/sub)
 * 10. 📊 Dashboard: React + Three.js (Live 3D WebGL visualization)
 */

export const SYSTEM_COMPONENTS = [
  {
    id: 'vision',
    icon: '👁️',
    component: 'Vision',
    tech: 'YOLOv8-Nano / ViT',
    job: 'Detect people, wildfire hotspots, and stranded vehicles in real time',
    latency: '5.2 ms',
    framework: 'PyTorch / TensorRT INT8',
    status: 'ONLINE',
    accent: '#10b981',
    description: 'Processes 1080p camera frames at 30 FPS aboard each drone. Employs lightweight bounding box regression to identify survivors, fire perimeters, and obstacles, projecting pixel coordinates into geo-referenced 3D waypoints for the multi-agent state space.',
    sampleCode: `from aeromind.vision.detector import EdgeYOLODetector\ndetector = EdgeYOLODetector(weights="yolov8n.pt", device="cuda:0")\ndetections = detector.detect(camera_frame) # [people, fire, vehicles]`
  },
  {
    id: 'brain',
    icon: '🧠',
    component: 'Multi-Agent Brain',
    tech: 'MAPPO (Multi-Agent PPO)',
    job: 'Coordinate all 8 drones under dynamic battery, obstacles & priority zones',
    latency: '6.8 ms',
    framework: 'PyTorch CTDE MARL',
    status: 'ONLINE',
    accent: '#38bdf8',
    description: 'Centralized Training with Decentralized Execution (CTDE) multi-agent reinforcement learning engine. Drones share learned policy representations to prevent redundant target coverage, maintain flight formations, and avoid collisions.',
    sampleCode: `from aeromind.models.mappo import MAPPOCoordinator\nbrain = MAPPOCoordinator(n_agents=8, obs_dim=18, action_dim=3)\nactions, values = brain.step(global_obs, local_obs)`
  },
  {
    id: 'actor',
    icon: '🎯',
    component: 'Actor Network',
    tech: 'MLP / Deep Neural Network',
    job: 'Select continuous 3D velocity actions [vx, vy, vz] for each drone',
    latency: '1.4 ms',
    framework: '3-Layer MLP (18 -> 256 -> 256 -> 3)',
    status: 'ONLINE',
    accent: '#06b6d4',
    description: 'Decentralized local policy network running aboard each drone. Takes the 18D local observation vector (kinematics, battery, nearest obstacle, target distance) and computes the continuous velocity command vector executed by the flight controller.',
    sampleCode: `class ActorNetwork(nn.Module):\n    def forward(self, local_obs):\n        feat = self.net(local_obs)\n        mu = self.mu_head(feat)\n        return torch.tanh(mu) * max_velocity`
  },
  {
    id: 'critic',
    icon: '📊',
    component: 'Critic Network',
    tech: 'MLP / Deep Neural Network',
    job: 'Evaluate global swarm decisions and compute Generalized Advantage (GAE)',
    latency: 'Offline / Cloud',
    framework: 'Centralized MLP (144 -> 512 -> 256 -> 1)',
    status: 'TRAINED',
    accent: '#818cf8',
    description: 'Evaluates joint swarm performance conditioned on the 144-dimensional global concatenated state of all 8 drones during cloud training. Produces baseline values to minimize policy variance without being needed during onboard execution.',
    sampleCode: `class CentralizedCritic(nn.Module):\n    def forward(self, global_joint_state):\n        # Evaluates joint swarm state across all 8 drones\n        return self.value_head(self.backbone(global_joint_state))`
  },
  {
    id: 'planning',
    icon: '🗣️',
    component: 'High-Level Planning',
    tech: 'LLM (Natural Language)',
    job: 'Convert human mission instructions into quantitative mathematical goals',
    latency: 'Sub-second',
    framework: 'Zero-Shot Structured JSON Decomposition',
    status: 'READY',
    accent: '#c084fc',
    description: 'Translates high-level tactical English commands (e.g. "Sweep Sector B for casualties, prioritize fire containment, preserve 25% battery") into numeric reward weights, target priorities, and boundary constraints for the MAPPO swarm.',
    sampleCode: `from aeromind.planning.llm_planner import LLMDirectivePlanner\nplanner = LLMDirectivePlanner()\nplan = planner.compile("Search Sector A for survivors first and avoid smoke.")`
  },
  {
    id: 'sim',
    icon: '🌍',
    component: 'Simulation World',
    tech: 'AirSim / Gazebo Rig',
    job: 'Simulate virtual drones, 3D physics, aerodynamics, battery drain & obstacles',
    latency: '20 Hz Loop',
    framework: '3D Rigid-Body Kinematics & Aerodynamics',
    status: 'ONLINE',
    accent: '#f59e0b',
    description: 'High-fidelity multi-rotor physics simulation incorporating rotor drag, non-linear battery depletion models, wind gusts, collision bounds, and elevation terrain with 20 disaster points of interest.',
    sampleCode: `from aeromind.simulation.environment import DroneSwarmEnv\nenv = DroneSwarmEnv(n_drones=8, n_targets=20, world_bounds=(200, 200, 50))\nobs, rewards, done, info = env.step(joint_actions)`
  },
  {
    id: 'training',
    icon: '☁️',
    component: 'Cloud Training',
    tech: 'Cloud GPU (AWS EC2)',
    job: 'Large-scale distributed RL training & automated checkpoint storage',
    latency: '18 min / 1M Steps',
    framework: 'AWS EC2 A10G/T4 + Amazon S3 + Boto3',
    status: 'CONNECTED',
    accent: '#a855f7',
    description: 'Parallelized policy rollouts leveraging CUDA GPUs in AWS EC2. Checkpoints are automatically synced to Amazon S3 buckets (s3://aeromind-dl-checkpoints/) and versioned with TensorBoard experiment logs.',
    sampleCode: `python backend/aeromind/cloud/aws_trainer.py \\\n  --s3-bucket aeromind-dl-checkpoints \\\n  --episodes 1000 --num-drones 8`
  },
  {
    id: 'edge',
    icon: '⚡',
    component: 'Edge AI Deployment',
    tech: 'YOLO + Trained Policy',
    job: 'Real-time on-board decisions without relying on cloud connectivity',
    latency: '6.8 ms Total',
    framework: 'NVIDIA Jetson Orin Nano + TensorRT',
    status: 'ACTIVE',
    accent: '#22c55e',
    description: 'Quantized INT8 models deployed to embedded NVIDIA Jetson modules on each physical/virtual drone airframe. Autonomous reactive flight decisions operate at 20Hz even when RF communication is degraded.',
    sampleCode: `# Edge Jetson Execution Loop\nobs = get_sensor_kinematics() # 20Hz\naction = actor_engine.execute(obs) # 1.4ms\npx4_mavlink.send_velocity(action)`
  },
  {
    id: 'comm',
    icon: '📡',
    component: 'Communication Mesh',
    tech: 'MQTT / ROS 2',
    job: 'Drone mesh peer-to-peer pub/sub telemetry, status heartbeats & failover',
    latency: '< 10 ms',
    framework: 'Eclipse Mosquitto / Micro-ROS',
    status: 'MESH INTACT',
    accent: '#38bdf8',
    description: 'Ad-hoc peer-to-peer mesh broker. Exposes topics `aeromind/swarm/telemetry` for high-frequency position exchange and `aeromind/swarm/failover` for autonomous task handoff upon single-drone hardware failures.',
    sampleCode: `mosquitto_sub -t "aeromind/swarm/telemetry" -h 127.0.0.1 -p 1883\n# Publishes 20Hz heartbeat JSON with battery, position, and status`
  },
  {
    id: 'dash',
    icon: '📊',
    component: 'Dashboard Twin',
    tech: 'React + Three.js WebGL',
    job: 'Live 3D visualization, swarm mission control, and interactive telemetry',
    latency: '60 FPS WebGL',
    framework: 'React 19 + Three.js + Tailwind CSS',
    status: 'RENDERED',
    accent: '#06b6d4',
    description: 'Web-based real-time command station featuring interactive 360° 3D orbital views of the 8-drone fleet, formation switcher, YOLO camera HUD, natural language command terminal, and empirical benchmark matrices.',
    sampleCode: `<AnimatedDroneHero />\n<DroneSimulator3D activeAlgorithm="MAPPO" />\n<VisionHUD selectedDroneId={1} />`
  }
];

export default function SystemArchitectureMatrix() {
  const [selectedComp, setSelectedComp] = useState(SYSTEM_COMPONENTS[0]);

  return (
    <div className="w-full bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800/80 p-6 sm:p-8 rounded-2xl space-y-8 font-mono text-xs shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-xs text-cyan-300 font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FULL 10-COMPONENT AEROMIND-DL SPECIFICATION</span>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white uppercase tracking-tight font-sans">
            Integrated System Architecture & Technology Stack
          </h3>
          <p className="text-slate-300 font-sans text-sm mt-1.5 max-w-3xl leading-relaxed">
            Every layer of the autonomous drone coordination pipeline—from high-level LLM mission instructions down to edge TensorRT neural inference and 3D WebGL digital twin rendering.
          </p>
        </div>

        <div className="flex items-center gap-2 text-slate-300 bg-[#070b14] border border-slate-800 px-4 py-2 rounded-full shadow-md">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-xs text-white">ALL 10 SUBSYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Grid of All 10 Components */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {SYSTEM_COMPONENTS.map((comp) => {
          const isSelected = selectedComp.id === comp.id;
          return (
            <div
              key={comp.id}
              onClick={() => setSelectedComp(comp)}
              className={`p-5 border transition-all cursor-pointer rounded-xl flex flex-col justify-between group ${
                isSelected
                  ? 'bg-[#111c35] border-cyan-400 shadow-xl shadow-cyan-500/20 -translate-y-0.5'
                  : 'bg-[#0c1220]/90 border-slate-800/80 hover:border-slate-600 hover:bg-[#0f172a]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{comp.icon}</span>
                  <span 
                    className="text-[10px] px-2 py-0.5 border font-bold rounded-full"
                    style={{ 
                      borderColor: comp.accent, 
                      color: comp.accent,
                      backgroundColor: `${comp.accent}15` 
                    }}
                  >
                    {comp.status}
                  </span>
                </div>

                <div className="text-white font-bold text-sm tracking-wide group-hover:text-cyan-400 transition-colors uppercase">
                  {comp.component}
                </div>
                <div className="text-cyan-400 font-mono text-xs font-bold mt-0.5 truncate">
                  {comp.tech}
                </div>
                <p className="text-slate-400 font-sans text-xs mt-2 line-clamp-2 leading-relaxed">
                  {comp.job}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>{comp.latency}</span>
                <span className="text-slate-400 group-hover:text-cyan-300 font-bold flex items-center gap-1">
                  DETAILS <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Inspection Panel for Selected Component */}
      <div className="p-6 sm:p-8 bg-[#0c1428]/90 border border-cyan-500/30 rounded-2xl space-y-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl">{selectedComp.icon}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h4 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wider">
                  {selectedComp.component} — {selectedComp.tech}
                </h4>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold rounded">
                  ● ACTIVE SUB-PIPELINE
                </span>
              </div>
              <div className="text-slate-400 text-xs sm:text-sm mt-1 font-sans">
                Primary Responsibility: <strong className="text-slate-200">{selectedComp.job}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono">
            <div className="text-right">
              <span className="text-slate-500 block text-xs">FRAMEWORK</span>
              <strong className="text-cyan-300 text-xs sm:text-sm">{selectedComp.framework}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-xs">EXECUTION LATENCY</span>
              <strong className="text-emerald-400 text-xs sm:text-sm">{selectedComp.latency}</strong>
            </div>
          </div>
        </div>

        {/* Detailed Explanation & Code Snippet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-3 font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block font-bold">
              SUBSYSTEM ARCHITECTURE & FUNCTION
            </span>
            <p>{selectedComp.description}</p>
            <div className="p-3.5 bg-[#0a1020] border border-slate-800 rounded-md font-mono text-xs text-slate-300 space-y-1.5">
              <div>• Operational Mode: <span className="text-cyan-400 font-bold">Autonomous Distributed</span></div>
              <div>• Swarm Redundancy: <span className="text-emerald-400 font-bold">Failover Resilient</span></div>
              <div>• Hardware Target: <span className="text-purple-400 font-bold">NVIDIA Jetson / AWS EC2</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>IMPLEMENTATION CODE SNIPPET</span>
              </span>
              <span className="text-xs text-slate-500">Python / PyTorch</span>
            </div>
            <pre className="p-4 bg-[#050811] border border-slate-800 text-cyan-300 text-xs overflow-x-auto font-mono leading-relaxed rounded-md">
              <code>{selectedComp.sampleCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
