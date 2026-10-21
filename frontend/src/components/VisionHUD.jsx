import React, { useState, useEffect } from 'react';
import { Eye, Target, Crosshair, Cpu, Maximize, AlertCircle } from 'lucide-react';

export default function VisionHUD({ selectedDroneId = 1, telemetry }) {
  const [visionMode, setVisionMode] = useState('RGB'); // 'RGB', 'THERMAL'
  const [detections, setDetections] = useState([
    {
      id: 'det-1',
      label: 'HUMAN SURVIVOR',
      conf: 0.982,
      bbox: { top: '34%', left: '22%', width: '16%', height: '26%' },
      color: '#10b981',
      coords: 'LAT: 37.7749, LON: -122.4194',
      elevation: '4.2m'
    },
    {
      id: 'det-2',
      label: 'WILDFIRE HOTSPOT',
      conf: 0.965,
      bbox: { top: '18%', left: '56%', width: '24%', height: '30%' },
      color: '#f97316',
      coords: 'LAT: 37.7758, LON: -122.4182',
      elevation: '18.6m'
    },
    {
      id: 'det-3',
      label: 'STRANDED VEHICLE',
      conf: 0.948,
      bbox: { top: '54%', left: '74%', width: '20%', height: '22%' },
      color: '#38bdf8',
      coords: 'LAT: 37.7735, LON: -122.4168',
      elevation: '2.1m'
    }
  ]);

  // Dynamic detection updates based on step
  useEffect(() => {
    const interval = setInterval(() => {
      const randConf1 = (0.95 + Math.random() * 0.04).toFixed(3);
      const randConf2 = (0.93 + Math.random() * 0.05).toFixed(3);
      const randConf3 = (0.91 + Math.random() * 0.06).toFixed(3);
      setDetections([
        {
          id: 'det-1',
          label: 'HUMAN SURVIVOR',
          conf: parseFloat(randConf1),
          bbox: { 
            top: `${32 + Math.sin(Date.now() / 1500) * 3}%`, 
            left: `${22 + Math.cos(Date.now() / 1500) * 3}%`, 
            width: '16%', 
            height: '26%' 
          },
          color: '#10b981',
          coords: `LAT: 37.7749, LON: -122.4194`,
          elevation: '4.2m'
        },
        {
          id: 'det-2',
          label: 'WILDFIRE HOTSPOT',
          conf: parseFloat(randConf2),
          bbox: { 
            top: `${18 + Math.cos(Date.now() / 2000) * 3}%`, 
            left: `${56 + Math.sin(Date.now() / 2000) * 2}%`, 
            width: '24%', 
            height: '30%' 
          },
          color: '#f97316',
          coords: `LAT: 37.7758, LON: -122.4182`,
          elevation: '18.6m'
        },
        {
          id: 'det-3',
          label: 'STRANDED VEHICLE',
          conf: parseFloat(randConf3),
          bbox: { 
            top: `${54 + Math.sin(Date.now() / 1800) * 2}%`, 
            left: `${74 + Math.cos(Date.now() / 1800) * 2}%`, 
            width: '20%', 
            height: '22%' 
          },
          color: '#38bdf8',
          coords: `LAT: 37.7735, LON: -122.4168`,
          elevation: '2.1m'
        }
      ]);
    }, 1200);

    return () => clearInterval(interval);
  }, [selectedDroneId]);

  return (
    <div className="bg-[#0c1220]/90 border border-slate-800/80 p-6 rounded-2xl shadow-xl text-white font-mono flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-200">
            DRONE {selectedDroneId} — ON-BOARD YOLOv8 VISION FEED
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex border border-slate-700 rounded-full p-0.5 bg-[#070b14] text-xs">
            <button
              onClick={() => setVisionMode('RGB')}
              className={`px-3 py-1 cursor-pointer font-bold rounded-full transition-all ${visionMode === 'RGB' ? 'bg-cyan-500 text-black shadow-sm font-black' : 'text-slate-400 hover:text-white'}`}
            >
              RGB SENSOR
            </button>
            <button
              onClick={() => setVisionMode('THERMAL')}
              className={`px-3 py-1 cursor-pointer font-bold rounded-full transition-all ${visionMode === 'THERMAL' ? 'bg-orange-500 text-black shadow-sm font-black' : 'text-slate-400 hover:text-white'}`}
            >
              FLIR THERMAL
            </button>
          </div>
          <span className="text-emerald-400 font-bold hidden sm:inline px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs">5.2ms INT8</span>
        </div>
      </div>

      {/* Simulated Camera Feed Viewport */}
      <div className="relative w-full h-[260px] bg-[#050811] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
        {/* Synthetic Horizon & Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:28px_28px] opacity-20"></div>

        {/* Crosshair Center Reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-16 h-16 border border-cyan-400 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
          </div>
          <div className="absolute w-32 h-[1px] bg-cyan-400"></div>
          <div className="absolute h-32 w-[1px] bg-cyan-400"></div>
        </div>

        {/* Artificial Horizon Lines */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 text-[9px] text-slate-500">
          <span>+20°</span>
          <span>+10°</span>
          <span className="text-cyan-400 font-bold">-- 0° PITCH --</span>
          <span>-10°</span>
          <span>-20°</span>
        </div>

        {/* Real-time Bounding Boxes */}
        {detections.map(det => (
          <div 
            key={det.id}
            className="absolute border-2 transition-all duration-300 pointer-events-none"
            style={{
              top: det.bbox.top,
              left: det.bbox.left,
              width: det.bbox.width,
              height: det.bbox.height,
              borderColor: det.color,
              boxShadow: `0 0 10px ${det.color}33`
            }}
          >
            {/* Box Header Label */}
            <div 
              className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold text-black flex items-center gap-1 whitespace-nowrap rounded-t"
              style={{ backgroundColor: det.color }}
            >
              <span>{det.label}</span>
              <span>{(det.conf * 100).toFixed(1)}%</span>
            </div>

            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: det.color }}></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: det.color }}></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: det.color }}></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: det.color }}></div>

            {/* Bottom GPS Overlay */}
            <div className="absolute -bottom-4 left-0 text-[9px] text-slate-300 whitespace-nowrap bg-black/80 px-1 rounded-b">
              {det.coords} | ALT: {det.elevation}
            </div>
          </div>
        ))}

        {/* Camera HUD Corners */}
        <div className="absolute top-2 left-2 text-[10px] text-emerald-400 font-mono">
          REC ● [YOLOv8-NANO ACTIVE]
        </div>
        <div className="absolute top-2 right-2 text-[10px] text-slate-400 font-mono">
          FOV: 68.0° | GIMBAL: -45°
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 font-mono">
          TARGET QUEUE: AUTO-DISPATCH TO MAPPO
        </div>
      </div>

      {/* Target Discovery Dispatch Log */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="border border-slate-800 p-3.5 bg-[#070b14] rounded-xl space-y-1">
          <div className="text-xs text-slate-400 uppercase font-mono">Perception Pipeline</div>
          <div className="font-bold text-slate-200 text-sm">YOLOv8 Neural Detection</div>
          <div className="text-xs text-emerald-400">2 Live Targets Fed into RL State</div>
        </div>
        <div className="border border-slate-800 p-3.5 bg-[#070b14] rounded-xl space-y-1">
          <div className="text-xs text-slate-400 uppercase font-mono">Hierarchical Coordination</div>
          <div className="font-bold text-slate-200 text-sm">MAPPO Task Allocation</div>
          <div className="text-xs text-cyan-400">Decentralized Actor Waypoint Gen</div>
        </div>
      </div>
    </div>
  );
}
