import React, { useState } from 'react';
import { 
  Brain, Eye, Target, Battery, AlertTriangle, ShieldCheck, 
  ArrowRight, Play, RotateCcw, Cpu, Zap, Cloud, Server, 
  CheckCircle2, Sparkles, Navigation, Layers, Flame, Users
} from 'lucide-react';

/**
 * AIWorkflowExplainer:
 * Interactive step-by-step visual engine directly implementing the 14-step
 * "How the AI Actually Works" specification for AeroMind-DL:
 * - Model 1: YOLO Vision ("What is in front of me?")
 * - Model 2: MAPPO Multi-Agent Deep RL ("What should I do about it?")
 * - 18D State Vector S_t Generator
 * - Actor-Critic Neural Network (256 -> 256 -> 128)
 * - Mathematical Reward Engine (+50, +100, -100, -30)
 * - Smart Multi-Drone Cooperation vs Nearest Neighbor Failure
 * - Dynamic Task Reallocation (15% Battery -> RTH -> Drone 4 Takeover)
 * - Fault-Tolerant Drone Failure (Drone 3 Outage -> D4+D5 Redistribution)
 * - High-Level LLM Planning Layer
 * - Cloud vs Edge Architecture
 */

export default function AIWorkflowExplainer() {
  const [activeStep, setActiveStep] = useState(1);
  const [dilemmaAlgorithm, setDilemmaAlgorithm] = useState('MAPPO'); // 'NEAREST', 'MAPPO'
  const [batteryReallocTriggered, setBatteryReallocTriggered] = useState(false);
  const [failureReallocTriggered, setFailureReallocTriggered] = useState(false);

  // Steps matching the user's explicit specification
  const STEPS = [
    { id: 1, title: '1. The Multi-Drone Problem', subtitle: '8 Drones, 20 Locations, Constraints' },
    { id: 2, title: '2. Model 1: YOLO Vision', subtitle: '"What is in front of me?"' },
    { id: 3, title: '3. What a Drone Sees (State St)', subtitle: '18D Numerical Vector' },
    { id: 4, title: '4. Model 2: MAPPO Brain', subtitle: '"What should I do about it?"' },
    { id: 5, title: '5. Reward Engine', subtitle: '+50 Survivor, -100 Collision' },
    { id: 6, title: '6. Cooperation vs Nearest-Neighbor', subtitle: '15% Batt vs 90% Batt Dilemma' },
    { id: 7, title: '7. Dynamic Task Reallocation', subtitle: 'Low Battery Auto Takeover' },
    { id: 8, title: '8. Fault-Tolerant Failure Recovery', subtitle: 'Drone 3 Outage -> D4+D5 Continuation' },
    { id: 9, title: '9. Model 3: LLM Mission Planner', subtitle: 'Natural Language to Goals' },
    { id: 10, title: '10. Cloud vs Edge Separation', subtitle: 'AWS Training vs Jetson Real-Time' }
  ];

  return (
    <div className="w-full bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-8 font-mono text-xs shadow-2xl">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold mb-2">
            <Sparkles className="w-3 h-3" />
            <span>INTERACTIVE MULTI-AGENT RL ENGINE WALKTHROUGH</span>
          </div>
          <h3 className="text-xl sm:text-3xl font-extrabold text-white uppercase tracking-tight font-sans">
            🚁 AeroMind-DL: How the AI Actually Works
          </h3>
          <p className="text-slate-400 font-sans text-sm mt-1 max-w-3xl leading-relaxed">
            Follow the complete decision pipeline: from simulated YOLO camera perception down to the 18D state vector, MAPPO Actor-Critic actions, dynamic failover, and cloud–edge separation.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="px-4 py-1.5 bg-[#0c1220] border border-slate-700 text-slate-300 disabled:opacity-40 hover:text-white font-bold cursor-pointer rounded-full text-xs transition-all"
          >
            ← PREV
          </button>
          <span className="text-cyan-400 font-bold px-2 text-xs font-mono">STEP {activeStep} / 10</span>
          <button
            onClick={() => setActiveStep(prev => Math.min(10, prev + 1))}
            disabled={activeStep === 10}
            className="px-4 py-1.5 bg-cyan-500 text-black font-extrabold hover:bg-cyan-400 disabled:opacity-40 cursor-pointer rounded-full text-xs shadow-md shadow-cyan-500/25 transition-all"
          >
            NEXT →
          </button>
        </div>
      </div>

      {/* Step Navigation Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`p-2.5 border text-center transition-all cursor-pointer rounded-xl ${
              activeStep === step.id
                ? 'bg-cyan-500 text-black border-cyan-400 font-black shadow-md shadow-cyan-500/20'
                : 'bg-[#070b14] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
            }`}
          >
            <div className="text-xs uppercase font-mono font-bold truncate">
              {step.id}. {step.title.split('. ')[1]?.split(' ')[0]}
            </div>
          </button>
        ))}
      </div>

      {/* Main Interactive Stage for Selected Step */}
      <div className="p-6 sm:p-8 bg-[#0c1220]/90 border border-cyan-500/30 rounded-2xl space-y-6 shadow-xl">
        {/* STEP 1: THE MULTI-DRONE PROBLEM */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h4 className="text-lg sm:text-xl font-bold text-white uppercase flex items-center gap-2 font-mono">
                <span>1. The Real Multi-Drone Problem You're Solving</span>
              </h4>
              <span className="text-cyan-400 font-bold px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-xs">
                8 Drones • 20 Disaster Locations
              </span>
            </div>

            <p className="text-slate-300 font-sans text-sm sm:text-base leading-relaxed">
              In a disaster area (wildfire + collapsed infrastructure), we deploy <strong>8 autonomous drones</strong> to inspect <strong>20 critical targets</strong> (find survivors, map fire fronts, inspect damaged buildings, clear evacuation roads).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#0a1020] border border-slate-800 rounded-md space-y-1.5">
                <span className="text-slate-400 text-xs font-mono">FLEET SIZE</span>
                <strong className="text-white text-base block font-mono">8 Autonomous Drones</strong>
                <span className="text-cyan-400 text-xs">Homogeneous quadcopters</span>
              </div>
              <div className="p-4 bg-[#0a1020] border border-slate-800 rounded-md space-y-1.5">
                <span className="text-slate-400 text-xs font-mono">MISSION OBJECTIVES</span>
                <strong className="text-emerald-400 text-base block font-mono">20 Targets of Interest</strong>
                <span className="text-slate-400 text-xs">People, Fires, Structures</span>
              </div>
              <div className="p-4 bg-[#0a1020] border border-slate-800 rounded-md space-y-1.5">
                <span className="text-slate-400 text-xs font-mono">REAL CONSTRAINTS</span>
                <strong className="text-amber-400 text-base block font-mono">Battery & Obstacles</strong>
                <span className="text-slate-400 text-xs">Limited flight time & range</span>
              </div>
              <div className="p-4 bg-[#0a1020] border border-slate-800 rounded-md space-y-1.5">
                <span className="text-slate-400 text-xs font-mono">THE CORE QUESTION</span>
                <strong className="text-cyan-400 text-base block font-mono">Dynamic Coordination</strong>
                <span className="text-slate-400 text-xs">Who goes where, and when?</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-[#0c1428] border border-slate-800 rounded-md text-slate-300 font-sans text-xs sm:text-sm space-y-2 leading-relaxed">
              <div className="text-white font-bold font-mono text-sm">Why Fixed Rules Fail:</div>
              <p>A conventional rule-based system might say: <em>"If target is closest, send nearest drone."</em></p>
              <p>But what if Drone 1 is closest, but has only 15% battery? Or what if three drones all race toward the same survivor, leaving a wildfire unmonitored? That's why we need <strong>Multi-Agent Deep Reinforcement Learning (MAPPO)</strong>.</p>
            </div>
          </div>
        )}

        {/* STEP 2: MODEL 1: YOLO COMPUTER VISION */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <span>Model 1: Computer Vision (YOLO) — "What is in front of me?"</span>
              </h4>
              <span className="text-emerald-400 font-bold">JOB: 👁️ SEE (Not Control)</span>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              When Drone 3 flies over a sector, its camera captures video frames. The YOLO (You Only Look Once) or Vision Transformer model detects targets and outputs bounding boxes and confidence scores:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Simulated Camera Frame */}
              <div className="relative w-full h-[220px] bg-[#050811] border border-slate-800 p-4 rounded-md overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>
                
                {/* Simulated Target 1: Survivor */}
                <div className="absolute top-12 left-10 p-2.5 border-2 border-emerald-400 bg-emerald-950/70 rounded text-xs font-mono">
                  <span className="text-emerald-300 font-bold block">👤 PERSON DETECTED</span>
                  <span className="text-white text-[11px]">Conf = 0.94 | (x=125, y=240)</span>
                </div>

                {/* Simulated Target 2: Fire */}
                <div className="absolute top-6 right-10 p-2.5 border-2 border-orange-500 bg-orange-950/70 rounded text-xs font-mono">
                  <span className="text-orange-300 font-bold block">🔥 WILDFIRE FRONT</span>
                  <span className="text-white text-[11px]">Conf = 0.89 | (x=430, y=180)</span>
                </div>

                {/* Simulated Target 3: Vehicle */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 p-2.5 border-2 border-cyan-400 bg-cyan-950/70 rounded text-xs font-mono">
                  <span className="text-cyan-300 font-bold block">🚙 STRANDED VEHICLE</span>
                  <span className="text-white text-[11px]">Conf = 0.91 | (x=310, y=410)</span>
                </div>

                <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-slate-400">
                  CAMERA RESOLUTION: 1080p @ 30FPS | LATENCY: 5.2ms
                </div>
              </div>

              {/* Distinction Card */}
              <div className="p-5 sm:p-6 bg-[#0a1020] border border-slate-800 rounded-md space-y-3 font-sans text-xs sm:text-sm">
                <div className="text-emerald-400 font-mono font-bold text-sm">
                  KEY ARCHITECTURAL DISTINCTION:
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  <strong>YOLO's job is NOT to pilot the drone.</strong> YOLO does not compute motor thrust or change altitude. Its only job is <strong>PERCEPTION</strong>: to see what is in front of the camera and push geo-referenced coordinates into the multi-agent state space.
                </p>
                <div className="p-3.5 bg-[#070b14] border border-slate-800 rounded font-mono text-xs text-slate-300 space-y-1">
                  <div>Model 1 (YOLO) answers: <span className="text-emerald-400 font-bold">"What is in front of me?"</span></div>
                  <div>Model 2 (MAPPO) answers: <span className="text-cyan-400 font-bold">"What should I do about it?"</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WHAT A DRONE ACTUALLY SEES (STATE VECTOR St) */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>3. What Does a Drone Actually See? (The State Vector St)</span>
              </h4>
              <span className="text-cyan-400 font-bold">18-DIMENSIONAL NUMERICAL INPUT</span>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              The MAPPO reinforcement learning agent does not take raw camera pixels directly. We convert the drone's sensors, battery, proximity, and vision detections into an <strong>18-dimensional mathematical state vector $S_t$</strong>:
            </p>

            {/* Live Drone 3 State Inspector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-[#050811] border border-cyan-500/30 rounded-md space-y-2.5 font-mono text-xs shadow-md">
                <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2 mb-2 flex justify-between">
                  <span>DRONE 3: REAL-TIME STATE VECTOR S_t</span>
                  <span className="text-emerald-400">TELEMETRY 20Hz</span>
                </div>
                <div className="space-y-2 text-slate-300 text-xs">
                  <div className="flex justify-between"><span>Position (x, y, z):</span><strong className="text-white">[80.4, 120.2, 18.5] m</strong></div>
                  <div className="flex justify-between"><span>Velocity (vx, vy, vz):</span><strong className="text-cyan-300">[5.1, 2.3, 0.2] m/s</strong></div>
                  <div className="flex justify-between"><span>Battery Level:</span><strong className="text-amber-400">67.4%</strong></div>
                  <div className="flex justify-between"><span>Nearest Target Distance:</span><strong className="text-emerald-400">120.5 m</strong></div>
                  <div className="flex justify-between"><span>Nearby Peer Drones:</span><strong className="text-white">2 in mesh range</strong></div>
                  <div className="flex justify-between"><span>Obstacle Distance:</span><strong className="text-white">14.2 m (Safe &gt; 3m)</strong></div>
                  <div className="flex justify-between"><span>Mission Priority:</span><strong className="text-amber-400">HIGH (Survivor in sector)</strong></div>
                  <div className="flex justify-between"><span>Communication Mesh:</span><strong className="text-emerald-400">GOOD (MQTT &lt; 8ms)</strong></div>
                  <div className="flex justify-between"><span>Detected Objects:</span><strong className="text-cyan-300">[1x PERSON, 1x FIRE]</strong></div>
                  <div className="flex justify-between"><span>Unfinished Targets:</span><strong className="text-white">13 / 20 Remaining</strong></div>
                </div>
              </div>

              <div className="p-5 bg-[#0a1020] border border-slate-800 rounded-md space-y-3.5 font-sans text-xs shadow-md flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="text-white font-mono font-bold text-sm">MATHEMATICAL FORMULATION:</div>
                  <code className="block p-3 bg-[#070b14] border border-slate-700/70 rounded text-cyan-300 font-mono text-xs leading-relaxed">
                    S_t = [ p_i, v_i, battery_i, d_target, d_obstacle, ρ_peers, priority, comm_signal, detections... ]
                  </code>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Every 50 milliseconds (20Hz), this numerical vector is fed into the local <strong>Actor Neural Network</strong> on the drone.
                  </p>
                </div>
                <div className="p-3 bg-[#070b14] border border-slate-800 rounded text-slate-300 text-xs font-mono">
                  ✓ Lightweight representation allows inference in <strong className="text-emerald-400">1.4ms</strong> on edge hardware without heavy GPU lag.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MODEL 2: MAPPO ACTOR-CRITIC BRAIN */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <span>4. Model 2: MAPPO Actor-Critic Brain — "What should I do about it?"</span>
              </h4>
              <span className="text-cyan-400 font-bold">256 → 256 → 128 PYTORCH DEEP NEURAL NETWORK</span>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              MAPPO (Multi-Agent Proximal Policy Optimization) runs an <strong>Actor-Critic architecture</strong> using deep neural networks:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 sm:p-6 bg-[#0a1020] border border-slate-800 rounded-md space-y-3.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Target className="w-4 h-4" />
                  <h5>THE ACTOR (Local Policy πθ)</h5>
                </div>
                <div className="text-slate-400 text-xs">Job: <strong className="text-white">"What action should I take?"</strong></div>
                <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
                  Takes the local 18D state vector $S_t$ and outputs continuous 3D velocity vectors $[v_x, v_y, v_z]$ plus discrete mission modes:
                </p>
                <div className="p-3.5 bg-[#070b14] border border-slate-800 rounded space-y-1.5 font-mono text-xs">
                  <div>• Velocity vx: <span className="text-cyan-300">+2.4 m/s</span></div>
                  <div>• Velocity vy: <span className="text-cyan-300">-0.8 m/s</span></div>
                  <div>• Velocity vz (alt): <span className="text-cyan-300">+0.5 m/s (Ascend)</span></div>
                  <div>• Mode: <span className="text-emerald-400 font-bold">INSPECT_TARGET</span></div>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-[#0a1020] border border-slate-800 rounded-md space-y-3.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <h5>THE CRITIC (Centralized Value Vϕ)</h5>
                </div>
                <div className="text-slate-400 text-xs">Job: <strong className="text-white">"How good is this entire swarm situation?"</strong></div>
                <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
                  During offline cloud training, the Critic evaluates the global 144-dimensional joint state of all 8 drones simultaneously, computing Generalized Advantage Estimation (GAE).
                </p>
                <div className="p-3.5 bg-[#070b14] border border-slate-800 rounded font-mono text-xs text-emerald-300 space-y-1">
                  <div>Value Baseline Vϕ(S_global) = 48.2 pts</div>
                  <div>Advantage A_t = Reward - Value = +12.4 pts</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: THE REWARD ENGINE */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>5. How MAPPO Knows What Is "Good" (The Reward Engine)</span>
              </h4>
              <span className="text-amber-400 font-bold">REINFORCEMENT LEARNING OBJECTIVE</span>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              Unlike supervised machine learning (where you give input and correct label), in reinforcement learning the agent takes an action, interacts with the simulation, and receives a numerical <strong>Reward ($R$)</strong>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Positive Rewards */}
              <div className="p-5 sm:p-6 bg-[#051a14] border border-emerald-500/40 rounded-md space-y-3.5">
                <div className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>GOOD ACTIONS (POSITIVE REWARD)</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2.5 bg-[#070b14] border border-emerald-900/60 rounded">
                    <span className="text-slate-300 font-sans">Drone finds/identifies survivor:</span>
                    <strong className="text-emerald-400">+50 Reward</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-[#070b14] border border-emerald-900/60 rounded">
                    <span className="text-slate-300 font-sans">Full sector search completed:</span>
                    <strong className="text-emerald-400">+100 Reward</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-[#070b14] border border-emerald-900/60 rounded">
                    <span className="text-slate-300 font-sans">Explores new unmapped grid cell:</span>
                    <strong className="text-emerald-400">+20 Reward</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-[#070b14] border border-emerald-900/60 rounded">
                    <span className="text-slate-300 font-sans">Maintains safe separation (&gt;3m):</span>
                    <strong className="text-emerald-400">+10 Reward</strong>
                  </div>
                </div>
              </div>

              {/* Negative Penalties */}
              <div className="p-5 sm:p-6 bg-[#1f0a0d] border border-rose-500/40 rounded-md space-y-3.5">
                <div className="text-rose-400 font-bold text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>BAD ACTIONS (PENALTIES)</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2.5 bg-[#070b14] border border-rose-950/60 rounded">
                    <span className="text-slate-300 font-sans">Mid-air collision with peer or building:</span>
                    <strong className="text-rose-400">-100 Penalty</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-[#070b14] border border-rose-950/60 rounded">
                    <span className="text-slate-300 font-sans">Critical battery exhaustion in flight:</span>
                    <strong className="text-rose-400">-30 Penalty</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-[#070b14] border border-rose-950/60 rounded">
                    <span className="text-slate-300 font-sans">Entering restricted toxic smoke plume:</span>
                    <strong className="text-rose-400">-20 Penalty</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-[#070b14] border border-rose-950/60 rounded">
                    <span className="text-slate-300 font-sans">Unnecessary motor jitter & energy drain:</span>
                    <strong className="text-rose-400">-5 Penalty</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SMART COOPERATION VS NEAREST NEIGHBOR */}
        {activeStep === 6 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>6. Multi-Drone Coordination: Nearest-Neighbor vs MAPPO</span>
              </h4>
              <div className="flex bg-[#070b14] border border-slate-700 rounded-md p-0.5 text-xs">
                <button
                  onClick={() => setDilemmaAlgorithm('NEAREST')}
                  className={`px-3 py-1.5 rounded cursor-pointer font-bold transition-colors ${dilemmaAlgorithm === 'NEAREST' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  NEAREST-NEIGHBOR (DUMB)
                </button>
                <button
                  onClick={() => setDilemmaAlgorithm('MAPPO')}
                  className={`px-3 py-1.5 rounded cursor-pointer font-bold transition-colors ${dilemmaAlgorithm === 'MAPPO' ? 'bg-emerald-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  MAPPO COOPERATIVE (SMART)
                </button>
              </div>
            </div>

            {/* Scenario Visualization */}
            <div className="p-5 sm:p-6 bg-[#050811] border border-slate-800 rounded-md space-y-4">
              <div className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
                <strong className="text-white">The Scenario:</strong> Target A 🔥 (Wildfire Front) appears. 
                <span className="text-cyan-300 font-mono font-bold"> Drone 1</span> is 50m away but has <strong>only 15% battery</strong>. 
                <span className="text-cyan-300 font-mono font-bold"> Drone 2</span> is 95m away, but has <strong>90% battery</strong>.
              </div>

              {dilemmaAlgorithm === 'NEAREST' ? (
                <div className="p-4 sm:p-5 bg-rose-950/40 border border-rose-500 rounded-md text-rose-200 text-xs sm:text-sm font-sans space-y-2">
                  <div className="font-bold font-mono text-sm text-rose-300">
                    ❌ NEAREST-NEIGHBOR HEURISTIC FAILURE:
                  </div>
                  <p>Because Drone 1 is physically closest (50m vs 95m), the fixed rule sends <strong>Drone 1</strong>.</p>
                  <p className="font-bold text-rose-400">
                    OUTCOME: Drone 1 reaches the fire, runs out of battery mid-mission, and crashes! Target A is abandoned.
                  </p>
                </div>
              ) : (
                <div className="p-4 sm:p-5 bg-emerald-950/40 border border-emerald-500 rounded-md text-emerald-200 text-xs sm:text-sm font-sans space-y-2">
                  <div className="font-bold font-mono text-sm text-emerald-300">
                    ✅ MAPPO MULTI-AGENT COOPERATIVE INTELLIGENCE:
                  </div>
                  <p>MAPPO evaluates joint state: Drone 1 is low battery, so it orders Drone 1 to <strong>RETURN TO BASE</strong>, and dispatches <strong>Drone 2 (90% battery)</strong> to Target A!</p>
                  <p className="font-bold text-emerald-400">
                    OUTCOME: Drone 1 lands safely at charging station. Drone 2 maps Target A with 0% casualty rate!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: DYNAMIC TASK REALLOCATION */}
        {activeStep === 7 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Battery className="w-5 h-5 text-amber-400" />
                <span>7. Dynamic Task Reallocation (Low Battery Auto-Handoff)</span>
              </h4>
              <button
                onClick={() => setBatteryReallocTriggered(!batteryReallocTriggered)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase transition-colors cursor-pointer text-xs rounded-md shadow-sm"
              >
                {batteryReallocTriggered ? 'RESET ASSIGNMENTS' : 'TRIGGER: D2 REACHES 15% BATT'}
              </button>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              Suppose Drone 2 is searching Sector B and its battery drops to 15%. No human operator has to intervene—the decentralized task allocator instantly executes dynamic handoff:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
              <div className="p-5 sm:p-6 bg-[#0a1020] border border-slate-800 rounded-md space-y-3">
                <span className="text-slate-400 uppercase text-xs font-bold block border-b border-slate-800 pb-2">INITIAL ASSIGNMENT</span>
                <div className="space-y-1.5 text-slate-300">
                  <div>• Drone 1 → Zone A (Patrol)</div>
                  <div className={batteryReallocTriggered ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    • Drone 2 → Zone B (Survivor Sweep) {batteryReallocTriggered && '[15% BATT]'}
                  </div>
                  <div>• Drone 3 → Zone C (Wildfire)</div>
                  <div>• Drone 4 → Zone D (Reserve Chokepoint)</div>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-[#0a1020] border border-slate-800 rounded-md space-y-3">
                <span className="text-slate-400 uppercase text-xs font-bold block border-b border-slate-800 pb-2">AUTONOMOUS SYSTEM RESPONSE</span>
                {batteryReallocTriggered ? (
                  <div className="space-y-2 text-emerald-300">
                    <div className="text-amber-400 font-bold">● Drone 2: Abort Sector B → RETURN TO CHARGING PAD</div>
                    <div className="text-cyan-300 font-bold">● Drone 4: Reallocated → TAKES OVER SECTOR B IMMEDIATELY</div>
                    <div className="text-slate-300 text-xs font-sans leading-relaxed pt-1">
                      Handoff Latency: <strong className="text-emerald-400">8.4ms</strong> via MQTT message broker. Mission continues uninterrupted!
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic font-sans py-4">
                    Click "TRIGGER: D2 REACHES 15% BATT" above to test dynamic task reallocation.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: FAULT-TOLERANT FAILURE RECOVERY */}
        {activeStep === 8 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
                <span>8. Drone Failure Recovery (100% Continuation Guarantee)</span>
              </h4>
              <button
                onClick={() => setFailureReallocTriggered(!failureReallocTriggered)}
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-extrabold uppercase transition-colors cursor-pointer text-xs rounded-md shadow-sm"
              >
                {failureReallocTriggered ? 'RESTORE DRONE 3' : 'TEST MOTOR OUTAGE ON D3'}
              </button>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              If Drone 3 suddenly suffers catastrophic motor failure mid-flight, a traditional system loses whatever search tasks Drone 3 was handling. AeroMind-DL detects missing heartbeats and recovers autonomously:
            </p>

            <div className="p-5 sm:p-6 bg-[#050811] border border-slate-800 rounded-md space-y-4 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-3 text-slate-300">
                <span className="px-2 py-1 bg-[#0a1020] border border-slate-800 rounded">D1 ✅</span>
                <span className="px-2 py-1 bg-[#0a1020] border border-slate-800 rounded">D2 ✅</span>
                <span className={`px-2.5 py-1 rounded font-bold ${failureReallocTriggered ? 'text-rose-300 bg-rose-950 border border-rose-500' : 'text-emerald-300 bg-[#0a1020] border border-slate-800'}`}>
                  {failureReallocTriggered ? 'D3 ❌ FAILED' : 'D3 ✅'}
                </span>
                <span className="px-2 py-1 bg-[#0a1020] border border-slate-800 rounded">D4 ✅</span>
                <span className="px-2 py-1 bg-[#0a1020] border border-slate-800 rounded">D5 ✅</span>
                <span className="px-2 py-1 bg-[#0a1020] border border-slate-800 rounded">D6 ✅</span>
                <span className="px-2 py-1 bg-[#0a1020] border border-slate-800 rounded">D7 ✅</span>
                <span className="px-2 py-1 bg-[#0a1020] border border-slate-800 rounded">D8 ✅</span>
              </div>

              {failureReallocTriggered ? (
                <div className="p-4 sm:p-5 bg-rose-950/40 border border-rose-500 rounded-md text-slate-200 text-xs sm:text-sm font-sans space-y-2 leading-relaxed">
                  <div className="font-bold text-rose-300 font-mono text-sm">AUTONOMOUS FAILOVER SEQUENCE TRIGGERED:</div>
                  <div>1. Missing MQTT heartbeat detected from D3 (timestamp timeout &gt; 250ms).</div>
                  <div>2. D3's remaining unvisited waypoints in Zone C queued into swarm orphan pool.</div>
                  <div className="text-emerald-300 font-bold">
                    3. Closest healthy high-battery peers (D4 + D5) split and accept Zone C search corridor!
                  </div>
                  <div className="text-cyan-400 font-bold">
                    Result: 0% task loss. Mission completion sustained at 94.8%!
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 italic font-sans py-2">
                  Click "TEST MOTOR OUTAGE ON D3" to simulate real-time fault-tolerant reallocation.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 9: MODEL 3: NATURAL LANGUAGE LLM MISSION PLANNER */}
        {activeStep === 9 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>9. Model 3: High-Level LLM Planning Layer</span>
              </h4>
              <span className="text-purple-400 font-bold">HUMAN-ROBOT INTERACTION (HRI)</span>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              We do not force the LLM to control the drone directly (an LLM cannot output 20Hz motor thrust). Instead, an LLM sits at the <strong>high-level planning layer</strong> to translate natural English commands into mathematical constraints:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start font-mono text-xs">
              <div className="p-5 sm:p-6 bg-[#0a1020] border border-slate-800 rounded-md space-y-3.5">
                <span className="text-purple-400 font-bold uppercase block text-sm">HUMAN OPERATOR INPUT:</span>
                <p className="text-white font-sans text-sm italic bg-[#070b14] p-3.5 border border-slate-700 rounded-md leading-relaxed">
                  "Search Sector A for survivors first and prioritize active fire containment. Keep 25% battery reserve and strictly avoid restricted toxic plumes."
                </p>
                <div className="text-slate-400 text-xs font-sans">
                  LLM parses intent, safety boundaries, and target priorities into mathematical objective weights.
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-[#050811] border border-purple-500/30 rounded-md space-y-2.5">
                <span className="text-cyan-400 font-bold uppercase block text-sm">COMPILED STRUCTURED MISSION CONSTRAINTS:</span>
                <pre className="text-cyan-300 text-xs leading-relaxed overflow-x-auto p-3.5 bg-[#070b14] border border-slate-800 rounded">
{`{
  "mission": "search_and_rescue",
  "priority_target": "PERSON",
  "priority_weights": {
    "PERSON": 2.5,
    "FIRE": 2.2,
    "BUILDING": 1.0
  },
  "min_battery_reserve_pct": 25.0,
  "avoid_restricted_zones": true,
  "swarm_mode": "COOPERATIVE_MAPPO"
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: CLOUD VS EDGE SEPARATION */}
        {activeStep === 10 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Cloud className="w-5 h-5 text-purple-400" />
                <span>10. Cloud vs Edge Computing Separation</span>
              </h4>
              <span className="text-cyan-400 font-bold">AWS EC2 GPU + NVIDIA JETSON</span>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              If an edge drone detects an obstacle 2 meters ahead, it cannot wait for a round-trip internet ping to the cloud. AeroMind-DL strictly decouples long-horizon training from ultra-fast reactive flight:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="p-5 sm:p-6 bg-[#0a1020] border border-purple-500/40 rounded-md space-y-3.5">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Cloud className="w-4 h-4" />
                  <span>☁️ CLOUD (AWS EC2 / GPU)</span>
                </div>
                <div className="text-slate-400 text-xs font-sans">Handles Long-Horizon Optimization:</div>
                <ul className="space-y-2 text-slate-300 font-sans text-xs sm:text-sm">
                  <li>• Multi-Agent RL Training (1,000,000 steps on NVIDIA A10G)</li>
                  <li>• Large-scale parallel simulation environments</li>
                  <li>• Model registry & Amazon S3 checkpoint synchronization</li>
                  <li>• Swarm analytics and historical telemetry logging</li>
                </ul>
              </div>

              <div className="p-5 sm:p-6 bg-[#0a1020] border border-cyan-500/40 rounded-md space-y-3.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>⚡ EDGE (NVIDIA JETSON / EMBEDDED)</span>
                </div>
                <div className="text-slate-400 text-xs font-sans">Handles Sub-10ms Real-Time Control:</div>
                <ul className="space-y-2 text-slate-300 font-sans text-xs sm:text-sm">
                  <li>• On-board YOLOv8 object detection (5.2ms INT8)</li>
                  <li>• Real-time reactive obstacle avoidance (&lt; 2.0ms)</li>
                  <li>• Local Actor policy execution at 20Hz continuous loop</li>
                  <li>• PX4 autopilot MAVLink velocity commands</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer for Presentation / Judge Question */}
      <div className="p-5 sm:p-6 bg-[#0c1428] border border-slate-800 rounded-lg shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="text-cyan-400 font-bold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>HOW TO EXPLAIN AEROMIND-DL IN 30 SECONDS:</span>
          </div>
          <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed max-w-4xl">
            "AeroMind-DL uses a hierarchical multi-model AI system. <strong>YOLO</strong> provides real-time on-board visual perception ('What is in front of me?'). <strong>MAPPO</strong> provides the core multi-agent deep reinforcement learning layer ('What should I do about it?'). An <strong>LLM</strong> converts human tactical directives into structured constraints, while <strong>Cloud GPUs (AWS)</strong> handle large-scale RL training and <strong>Edge hardware (Jetson)</strong> performs sub-10ms flight control."
          </p>
        </div>
        <button
          onClick={() => setActiveStep(activeStep < 10 ? activeStep + 1 : 1)}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer shadow-lg shadow-cyan-500/20 rounded-md text-xs font-mono"
        >
          {activeStep < 10 ? `STEP ${activeStep + 1} →` : 'RESTART TOUR ↺'}
        </button>
      </div>
    </div>
  );
}
