import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Eye, Brain, Cpu, Shield, Cloud, Radio, Zap, Layers } from 'lucide-react';

/**
 * Continuous Rotating 3D Exhibition Gallery
 * Arranges 8 AeroMind-DL project pillars around an invisible horizontal 3D ring.
 * Rotates continuously around its vertical axis with realistic perspective depth.
 * Tilts slightly downward so back cards appear higher and smaller, front cards appear larger.
 * Pauses on hover, preserves exact rotation angle, click opens component view.
 */

const EXHIBITION_ITEMS = [
  {
    id: '01',
    title: '8-DRONE SWARM MAPPO COORDINATION',
    subtitle: 'MULTI-AGENT DEEP RL',
    tag: 'CORE BRAIN',
    icon: Brain,
    accent: '#38bdf8',
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
    description: 'Centralized Critic evaluates joint 8-drone behavior while decentralized Actor networks execute local 3D velocities at 20Hz.'
  },
  {
    id: '02',
    title: 'ON-BOARD YOLOv8 & ViT COMPUTER VISION',
    subtitle: 'OBJECT DETECTION & GEO-MAPPING',
    tag: 'PERCEPTION',
    icon: Eye,
    accent: '#10b981',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80',
    description: 'Real-time detection of human survivors (98.2%), wildfire hot-spots (96.5%), and stranded emergency vehicles at 30 FPS.'
  },
  {
    id: '03',
    title: 'DYNAMIC TASK REALLOCATION & FAILOVER',
    subtitle: 'FAULT-TOLERANT MARL SWARMS',
    tag: 'RESILIENCE',
    icon: Shield,
    accent: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    description: 'Autonomous peer rerouting when Drone 3 suffers propulsion failure or Drone 2 reaches critical 15% battery reserve.'
  },
  {
    id: '04',
    title: 'NATURAL LANGUAGE LLM MISSION PLANNER',
    subtitle: 'HIGH-LEVEL HRI COMPILER',
    tag: 'PLANNING',
    icon: Sparkles,
    accent: '#c084fc',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    description: 'Translates operator instructions ("Search Sector A for survivors first") into structured mathematical reward weights.'
  },
  {
    id: '05',
    title: 'AWS CLOUD GPU DISTRIBUTED TRAINING',
    subtitle: 'AWS EC2 A10G & S3 CHECKPOINTS',
    tag: 'CLOUD GPU',
    icon: Cloud,
    accent: '#a855f7',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    description: 'Scalable parallel simulation on AWS EC2 GPU instances syncing model weights to S3 buckets via Boto3.'
  },
  {
    id: '06',
    title: 'NVIDIA JETSON EDGE INFERENCE',
    subtitle: 'SUB-10MS TENSORRT DEPLOYMENT',
    tag: 'EDGE AI',
    icon: Zap,
    accent: '#22c55e',
    image: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=800&q=80',
    description: 'INT8 quantized Actor inference delivering 6.8ms latency aboard each drone for rapid reactive obstacle avoidance.'
  },
  {
    id: '07',
    title: 'MQTT & ROS 2 SWARM MESH NETWORK',
    subtitle: 'PEER-TO-PEER DATA BROKER',
    tag: 'COMMUNICATION',
    icon: Radio,
    accent: '#38bdf8',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    description: 'Sub-10ms peer-to-peer pub/sub telemetry exchange over Eclipse Mosquitto topics aeromind/swarm/telemetry.'
  },
  {
    id: '08',
    title: 'AIRSIM & GAZEBO 3D KINEMATICS RIG',
    subtitle: 'PHYSICS SIMULATION TWIN',
    tag: 'SIMULATION',
    icon: Layers,
    accent: '#f97316',
    image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
    description: 'High-fidelity rigid-body aerodynamics simulating rotor thrust, drag coefficients, battery drain, and wind gusts.'
  }
];

export default function Rotating3DGallery({ onSelectPillar }) {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  const numItems = EXHIBITION_ITEMS.length;
  const radius = 390; // horizontal radius in pixels

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (!isPaused) {
        // Slow continuous rotation (~38 seconds per full turn)
        setRotationAngle((prev) => (prev + deltaTime * 0.165) % (Math.PI * 2));
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPaused]);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3.5">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-bold tracking-widest uppercase block mb-1">
            CIRCULAR 3D EXHIBITION RING
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight font-mono">
            8 Core Architectural Pillars Exhibition
          </h3>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
          <span>● HOVER TO PAUSE ROTATION</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">CLICK CARD TO INSPECT</span>
        </div>
      </div>

      {/* 3D Ring Viewport Container */}
      <div 
        className="relative w-full h-[480px] sm:h-[540px] flex items-center justify-center overflow-hidden select-none bg-[#070b14] border border-slate-800/80 rounded-2xl shadow-2xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ perspective: '1100px' }}
      >
        {/* Synthetic spatial grid floor beneath the ring */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 pointer-events-none"></div>

        {/* 3D Rotating Ring */}
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {EXHIBITION_ITEMS.map((item, idx) => {
            const itemAngle = rotationAngle + (idx * 2 * Math.PI) / numItems;
            const sinA = Math.sin(itemAngle);
            const cosA = Math.cos(itemAngle);

            // 3D Coordinates:
            // X: horizontal position (-radius to +radius)
            // Z: depth into screen (cosA > 0 is front, cosA < 0 is rear)
            // Y: rear cards appear higher on screen (Y is negative)
            const x = sinA * radius;
            const z = cosA * radius;
            const y = (1 - cosA) * -16;

            // Rotate cards to face outward tangent to ring
            const rotY = (itemAngle * 180) / Math.PI;

            // Normalized depth (0 back to 1 front)
            const normZ = (cosA + 1) / 2;
            const scale = 0.65 + normZ * 0.45;
            const opacity = 0.45 + normZ * 0.55;
            const zIndex = Math.round(normZ * 100);

            const IconComp = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => onSelectPillar && onSelectPillar(item)}
                className="absolute cursor-pointer transition-opacity duration-300 group"
                style={{
                  width: 'clamp(230px, 25vw, 320px)',
                  height: 'clamp(300px, 34vw, 420px)',
                  transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) scale(${scale})`,
                  transformStyle: 'preserve-3d',
                  zIndex: zIndex,
                  opacity: opacity,
                  willChange: 'transform, opacity'
                }}
              >
                {/* Rectangular Exhibition Card */}
                <div 
                  className="w-full h-full bg-[#0c1220]/95 backdrop-blur-md border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-2xl relative"
                  style={{
                    borderColor: normZ > 0.7 ? item.accent : '#1e293b',
                    boxShadow: normZ > 0.7 ? `0 10px 30px -10px ${item.accent}33` : 'none'
                  }}
                >
                  {/* Card Image */}
                  <div className="relative w-full h-[52%] overflow-hidden bg-[#070b14] border-b border-slate-800">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                      loading="eager"
                    />
                    <div className="absolute top-2.5 left-2.5 px-3 py-1 bg-black/85 border border-slate-700 text-xs font-mono font-bold text-white uppercase rounded-full">
                      {item.id} / {item.tag}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between font-mono">
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                        {item.subtitle}
                      </div>
                      <h4 className="text-white font-extrabold text-xs sm:text-sm uppercase tracking-tight line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-slate-300 font-sans text-xs line-clamp-2 leading-relaxed mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500 uppercase text-[11px]">AEROMIND PILLAR</span>
                      <span 
                        className="font-bold flex items-center gap-1 group-hover:underline text-xs"
                        style={{ color: item.accent }}
                      >
                        EXPLORE →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
