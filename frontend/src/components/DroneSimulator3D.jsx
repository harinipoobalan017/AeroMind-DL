import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Play, Pause, RotateCcw, AlertTriangle, BatteryCharging, 
  Eye, Zap, Shield, Compass, Navigation, Radio, Maximize2, Crosshair,
  Flame, AlertOctagon, Target, ChevronDown, ChevronUp, Activity
} from 'lucide-react';

export default function DroneSimulator3D({ 
  activeAlgorithm = 'MAPPO', 
  onAlgorithmChange,
  onTelemetryUpdate,
  llmDirective
}) {
  const mountRef = useRef(null);
  const [isRunning, setIsRunning] = useState(true);
  const [cameraMode, setCameraMode] = useState('ORBIT'); // 'ORBIT', 'FOLLOW', 'TOP_DOWN'
  const [selectedDroneId, setSelectedDroneId] = useState(1);
  const [simSpeed, setSimSpeed] = useState(1);
  const [activeFailure, setActiveFailure] = useState(null);
  
  // Real-time telemetry state
  const [telemetry, setTelemetry] = useState({
    step: 0,
    activeDrones: 8,
    completionPct: 18.5,
    batteryAvg: 92.4,
    collisions: 0,
    targetsCompleted: 3,
    totalTargets: 20,
    totalDistance: 245.0,
    edgeLatency: 7.2,
    events: []
  });

  // Dedicated Emergency Red Alert Target State & Real-Time Distance Engine
  const [emergencyTarget, setEmergencyTarget] = useState({
    active: true,
    id: 'RED_ALERT_01',
    label: 'CRITICAL WILDFIRE / S.O.S SURVIVOR',
    pos: [142, 118, 4.0], // [X, Z, Y]
    assignedDroneId: 2,
    assignedDist: 18.4,
    assignedEta: 2.5,
    status: 'INTERCEPTING', // 'INTERCEPTING', 'CONTAINED'
    containmentProgress: 35,
    droneDistances: [
      { id: 2, name: 'D2', dist: 18.4, eta: 2.5, battery: 93, isAssigned: true, status: 'INTERCEPTING' },
      { id: 1, name: 'D1', dist: 34.2, eta: 4.6, battery: 97, isAssigned: false, status: 'PATROL' },
      { id: 4, name: 'D4', dist: 41.0, eta: 5.5, battery: 95, isAssigned: false, status: 'PATROL' },
      { id: 6, name: 'D6', dist: 52.8, eta: 7.0, battery: 90, isAssigned: false, status: 'PATROL' },
      { id: 3, name: 'D3', dist: 63.5, eta: 8.5, battery: 89, isAssigned: false, status: 'PATROL' },
      { id: 5, name: 'D5', dist: 69.1, eta: 9.2, battery: 91, isAssigned: false, status: 'PATROL' },
      { id: 7, name: 'D7', dist: 77.4, eta: 10.3, battery: 92, isAssigned: false, status: 'PATROL' },
      { id: 8, name: 'D8', dist: 88.6, eta: 11.8, battery: 88, isAssigned: false, status: 'PATROL' }
    ]
  });
  const [showEmergencyMatrix, setShowEmergencyMatrix] = useState(true);
  const [emergencyAlertToast, setEmergencyAlertToast] = useState(null);
  const [activeDockTab, setActiveDockTab] = useState('RED_ALERT'); // 'RED_ALERT', 'FAILURES'
  const [isEmergencyDockOpen, setIsEmergencyDockOpen] = useState(true);

  // Drone & Scene object references in Three.js scene
  const sceneRef = useRef(null);
  const dronesRef = useRef([]);
  const targetsRef = useRef([]);
  const trailsRef = useRef([]);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const groundMeshRef = useRef(null);
  const emergencyMeshRef = useRef(null);
  const emergencyLaserRef = useRef(null);
  const emergencyRaysRef = useRef(null);
  const relocateEmergencyRef = useRef(null);

  // Simulation internal state
  const stateRef = useRef({
    step: 0,
    isRunning: true,
    speed: 1,
    algorithm: activeAlgorithm,
    selectedDroneId: 1,
    drones: [],
    targets: [],
    events: [],
    collisions: 0,
    totalDistance: 0,
    emergency: {
      active: true,
      pos: [142, 118, 4.0],
      assignedDroneId: 2,
      assignedDist: 18.4,
      assignedEta: 2.5,
      status: 'INTERCEPTING',
      containmentProgress: 35,
      boostActive: false,
      droneDistances: []
    }
  });

  // Relocation Callback with Spatial Coordinates Clamping
  const relocateEmergency = useCallback((targetX, targetZ) => {
    const clampedX = Math.max(25, Math.min(175, Math.round(targetX)));
    const clampedZ = Math.max(25, Math.min(175, Math.round(targetZ)));
    
    // Reposition 3D meshes in scene
    if (emergencyMeshRef.current && emergencyMeshRef.current.group) {
      emergencyMeshRef.current.group.position.set(clampedX, 0, clampedZ);
    }

    const state = stateRef.current;
    state.emergency.pos = [clampedX, clampedZ, 4.0];
    state.emergency.status = 'INTERCEPTING';
    state.emergency.containmentProgress = 0;

    setEmergencyAlertToast(`🚨 RED ALERT RELOCATED: Grid [X: ${clampedX}m, Z: ${clampedZ}m] — Dynamic reroute dispatched!`);
    setTimeout(() => {
      setEmergencyAlertToast(null);
    }, 3800);
  }, []);

  useEffect(() => {
    relocateEmergencyRef.current = relocateEmergency;
  }, [relocateEmergency]);

  const handleRandomEmergency = () => {
    const rx = 35 + Math.random() * 130;
    const rz = 35 + Math.random() * 130;
    relocateEmergency(rx, rz);
  };

  const handleToggleSpeedBoost = () => {
    const state = stateRef.current;
    state.emergency.boostActive = !state.emergency.boostActive;
    setEmergencyTarget(prev => ({ ...prev, boostActive: state.emergency.boostActive }));
    setEmergencyAlertToast(
      state.emergency.boostActive 
        ? "⚡ 1.5x AFTERBURNER ENGAGED: Emergency interceptor sprint speed boosted to 9.8 m/s!" 
        : "Standard intercept patrol speed restored (7.2 m/s)."
    );
    setTimeout(() => setEmergencyAlertToast(null), 3200);
  };

  // Keep stateRef synced with props
  useEffect(() => {
    stateRef.current.algorithm = activeAlgorithm;
  }, [activeAlgorithm]);

  useEffect(() => {
    stateRef.current.isRunning = isRunning;
  }, [isRunning]);

  useEffect(() => {
    stateRef.current.speed = simSpeed;
  }, [simSpeed]);

  useEffect(() => {
    stateRef.current.selectedDroneId = selectedDroneId;
  }, [selectedDroneId]);

  // Initialize Scene, Drones, Targets, and Three.js WebGL Renderer
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 580;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x06080c);
    scene.fog = new THREE.FogExp2(0x06080c, 0.0035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    cameraRef.current = camera;
    camera.position.set(100, 130, 220);
    camera.lookAt(100, 15, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(120, 180, 80);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    scene.add(sunLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    blueRimLight.position.set(-50, 40, -50);
    scene.add(blueRimLight);

    // 3. 3D Terrain Grid (200m x 200m)
    const gridSize = 200;
    const gridDivisions = 40;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x334155, 0x1e293b);
    gridHelper.position.set(100, 0, 100);
    scene.add(gridHelper);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x090d16, 
      roughness: 0.9, 
      metalness: 0.1 
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(100, -0.1, 100);
    ground.receiveShadow = true;
    scene.add(ground);
    groundMeshRef.current = ground;

    // 3B. PERSISTENT RED EMERGENCY BEACON (Always Present on Map)
    const emGroup = new THREE.Group();
    emGroup.position.set(142, 0, 118);

    // Core Glowing Red Crystal
    const emCoreGeo = new THREE.OctahedronGeometry(3.0, 0);
    const emCoreMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0033,
      emissiveIntensity: 2.8,
      roughness: 0.1,
      metalness: 0.9
    });
    const emCore = new THREE.Mesh(emCoreGeo, emCoreMat);
    emCore.position.y = 5.0;
    emGroup.add(emCore);

    // Hazard Rotating Wireframe Cage
    const emWireGeo = new THREE.OctahedronGeometry(4.2, 0);
    const emWireMat = new THREE.MeshBasicMaterial({ color: 0xff2255, wireframe: true });
    const emWire = new THREE.Mesh(emWireGeo, emWireMat);
    emWire.position.y = 5.0;
    emGroup.add(emWire);

    // Vertical Sky Laser Pillar (80m into atmosphere)
    const beamGeo = new THREE.CylinderGeometry(0.8, 1.8, 80, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff0033,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 40;
    emGroup.add(beamMesh);

    // Expanding Ground Sonar Rings
    const ring1Geo = new THREE.RingGeometry(3.2, 4.2, 32);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xff0033, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = -Math.PI / 2;
    ring1Mesh.position.y = 0.25;
    emGroup.add(ring1Mesh);

    const ring2Geo = new THREE.RingGeometry(5.2, 6.4, 32);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xff3366, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.x = -Math.PI / 2;
    ring2Mesh.position.y = 0.3;
    emGroup.add(ring2Mesh);

    // Red Warning Light Strobe
    const emLight = new THREE.PointLight(0xff0033, 4.5, 75);
    emLight.position.y = 6.0;
    emGroup.add(emLight);

    scene.add(emGroup);
    emergencyMeshRef.current = {
      group: emGroup,
      core: emCore,
      wire: emWire,
      beam: beamMesh,
      ring1: ring1Mesh,
      ring2: ring2Mesh,
      light: emLight
    };

    // 3C. Primary Animated Interceptor Laser Line (Drone -> Red Emergency Beacon)
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(20, 15, 20),
      new THREE.Vector3(142, 5, 118)
    ]);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0xff0033,
      transparent: true,
      opacity: 0.95
    });
    const laserLine = new THREE.Line(laserGeo, laserMat);
    scene.add(laserLine);
    emergencyLaserRef.current = { line: laserLine, geo: laserGeo, mat: laserMat };

    // 3D. Secondary Distance Measurement Network Rays
    const raysGeo = new THREE.BufferGeometry();
    const raysMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 2,
      gapSize: 2,
      transparent: true,
      opacity: 0.35
    });
    const raysLine = new THREE.LineSegments(raysGeo, raysMat);
    scene.add(raysLine);
    emergencyRaysRef.current = { line: raysLine, geo: raysGeo };

    // Base Station Landing Pads [H]
    const baseGeo = new THREE.BoxGeometry(22, 0.4, 22);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(20, 0.2, 20);
    scene.add(baseMesh);

    // Base Station Beacon Rings
    const ringGeo = new THREE.RingGeometry(8, 9, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(20, 0.45, 20);
    scene.add(ringMesh);

    // 4. 3D Obstacles (Buildings, Silos, Cranes)
    const obstaclesData = [
      { x: 60, z: 80, h: 35, r: 12, type: 'HQ Tower' },
      { x: 130, z: 70, h: 28, r: 15, type: 'Collapsed Silo' },
      { x: 90, z: 140, h: 40, r: 16, type: 'Industrial Complex' },
      { x: 155, z: 145, h: 26, r: 14, type: 'Crane Gantry' }
    ];

    obstaclesData.forEach(obs => {
      const obsGeo = new THREE.CylinderGeometry(obs.r * 0.8, obs.r, obs.h, 8);
      const obsMat = new THREE.MeshStandardMaterial({ 
        color: 0x1e293b, 
        roughness: 0.7,
        metalness: 0.3,
        wireframe: false 
      });
      const obsMesh = new THREE.Mesh(obsGeo, obsMat);
      obsMesh.position.set(obs.x, obs.h / 2, obs.z);
      obsMesh.castShadow = true;
      obsMesh.receiveShadow = true;
      scene.add(obsMesh);

      // Wireframe contour overlay
      const wireGeo = new THREE.WireframeGeometry(obsGeo);
      const wireMat = new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 1 });
      const wireLine = new THREE.LineSegments(wireGeo, wireMat);
      wireLine.position.copy(obsMesh.position);
      scene.add(wireLine);
    });

    // 5. Restricted No-Fly Airspace Zone (Toxic Plume / Smoke)
    const rzGeo = new THREE.CylinderGeometry(22, 22, 45, 24, 1, true);
    const rzMat = new THREE.MeshBasicMaterial({ 
      color: 0xef4444, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.35 
    });
    const rzMesh = new THREE.Mesh(rzGeo, rzMat);
    rzMesh.position.set(105, 22.5, 105);
    scene.add(rzMesh);

    // 6. Spawn Targets
    const targets = [];
    const targetMeshes = [];
    const targetDefs = [
      { type: 'PERSON', label: 'Survivor Beacon', color: 0x10b981, priority: 90 },
      { type: 'FIRE', label: 'Wildfire Hotspot', color: 0xf97316, priority: 95 },
      { type: 'BUILDING', label: 'Damaged Structure', color: 0xfacc15, priority: 70 },
      { type: 'ROAD_BLOCK', label: 'Blocked Evac Route', color: 0x06b6d4, priority: 60 }
    ];

    for (let i = 1; i <= 20; i++) {
      const def = targetDefs[(i - 1) % targetDefs.length];
      const tx = 35 + ((i * 37) % 135) + Math.sin(i) * 12;
      const tz = 35 + ((i * 47) % 135) + Math.cos(i) * 12;
      const ty = def.type === 'PERSON' ? 1.5 : (i % 2 === 0 ? 12 : 24);

      // Target Marker in 3D
      const group = new THREE.Group();
      group.position.set(tx, ty, tz);

      // Core mesh
      let markerGeo;
      if (def.type === 'PERSON') {
        markerGeo = new THREE.SphereGeometry(2.0, 16, 16);
      } else if (def.type === 'FIRE') {
        markerGeo = new THREE.ConeGeometry(2.5, 5, 8);
      } else {
        markerGeo = new THREE.BoxGeometry(3.5, 3.5, 3.5);
      }
      
      const markerMat = new THREE.MeshStandardMaterial({ 
        color: def.color, 
        emissive: def.color,
        emissiveIntensity: 0.6,
        roughness: 0.2 
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      group.add(markerMesh);

      // Ground projection ring & vertical tether
      const groundRingGeo = new THREE.RingGeometry(3.0, 3.6, 16);
      const groundRingMat = new THREE.MeshBasicMaterial({ color: def.color, side: THREE.DoubleSide });
      const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
      groundRing.rotation.x = -Math.PI / 2;
      groundRing.position.set(0, -ty + 0.1, 0);
      group.add(groundRing);

      // Tether line
      const tetherGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -ty, 0)
      ]);
      const tetherMat = new THREE.LineDashedMaterial({ 
        color: def.color, 
        dashSize: 1.5, 
        gapSize: 1.5, 
        opacity: 0.45, 
        transparent: true 
      });
      const tetherLine = new THREE.Line(tetherGeo, tetherMat);
      tetherLine.computeLineDistances();
      group.add(tetherLine);

      scene.add(group);
      targetMeshes.push({ group, markerMesh, initialY: ty, type: def.type, color: def.color });

      targets.push({
        id: i,
        type: def.type,
        label: `${def.label} #${i}`,
        pos: [tx, tz, ty],
        completed: false,
        priority: def.priority,
        inspectedTime: 0,
        requiredTime: 18,
        assignedDrone: null
      });
    }

    stateRef.current.targets = targets;
    targetsRef.current = targetMeshes;

    // 7. Construct 8 3D Drone Models
    const drones = [];
    const droneMeshes = [];

    for (let i = 1; i <= 8; i++) {
      const droneGroup = new THREE.Group();
      
      // Central Fuselage / Avionics Pod
      const bodyGeo = new THREE.BoxGeometry(2.2, 0.7, 2.2);
      const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x0f172a, 
        roughness: 0.3, 
        metalness: 0.8 
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      droneGroup.add(body);

      // Carbon Fiber Quad Arms (X Configuration)
      const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.2);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
      
      const arm1 = new THREE.Mesh(armGeo, armMat);
      arm1.rotation.z = Math.PI / 2;
      arm1.rotation.y = Math.PI / 4;
      droneGroup.add(arm1);

      const arm2 = new THREE.Mesh(armGeo, armMat);
      arm2.rotation.z = Math.PI / 2;
      arm2.rotation.y = -Math.PI / 4;
      droneGroup.add(arm2);

      // 4 Rotor Hubs & Propellers
      const rotorDiscs = [];
      const armDist = 1.48;
      const rotorPositions = [
        [armDist, 0.45, armDist],
        [-armDist, 0.45, armDist],
        [armDist, 0.45, -armDist],
        [-armDist, 0.45, -armDist]
      ];

      rotorPositions.forEach(pos => {
        const hubGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 12);
        const hubMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const hub = new THREE.Mesh(hubGeo, hubMat);
        hub.position.set(pos[0], pos[1], pos[2]);
        droneGroup.add(hub);

        // Propeller Blade
        const propGeo = new THREE.BoxGeometry(2.0, 0.04, 0.22);
        const propMat = new THREE.MeshStandardMaterial({ 
          color: 0x94a3b8, 
          metalness: 0.5, 
          roughness: 0.2 
        });
        const prop = new THREE.Mesh(propGeo, propMat);
        prop.position.set(pos[0], pos[1] + 0.16, pos[2]);
        droneGroup.add(prop);
        rotorDiscs.push(prop);
      });

      // Directional LED Navigation Strobe Light
      const ledGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: i === 1 ? 0x38bdf8 : 0x06b6d4 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, 0.4, 1.2);
      droneGroup.add(led);

      // Downward Laser Rangefinder / Optical Camera Sensor Cone
      const coneGeo = new THREE.ConeGeometry(3.5, 12, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({ 
        color: 0x38bdf8, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.18 
      });
      const sensorCone = new THREE.Mesh(coneGeo, coneMat);
      sensorCone.position.set(0, -6, 0);
      sensorCone.rotation.x = Math.PI;
      droneGroup.add(sensorCone);

      // Altitude Tether line to ground
      const groundLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -15, 0)
      ]);
      const groundLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 });
      const groundLine = new THREE.Line(groundLineGeo, groundLineMat);
      droneGroup.add(groundLine);

      // Spawn near base station
      const spawnX = 14 + (i % 4) * 6;
      const spawnZ = 14 + Math.floor(i / 4) * 6;
      const spawnY = 12 + i * 2;
      droneGroup.position.set(spawnX, spawnY, spawnZ);

      scene.add(droneGroup);
      droneMeshes.push({
        group: droneGroup,
        props: rotorDiscs,
        led,
        ledMat,
        sensorCone,
        coneMat,
        groundLine
      });

      drones.push({
        id: i,
        name: `D${i}`,
        pos: [spawnX, spawnZ, spawnY], // [x, z, altitude]
        vel: [0, 0, 0],
        targetPos: [35 + i * 15, 45 + i * 12, 18],
        assignedTargetId: null,
        battery: 100,
        status: 'SEARCHING',
        distanceFlown: 0,
        faultInjected: false
      });
    }

    stateRef.current.drones = drones;
    dronesRef.current = droneMeshes;

    // 8. Flight Trajectory Ribbon Trails
    const trails = [];
    for (let i = 0; i < 8; i++) {
      const maxTrailPoints = 60;
      const points = [];
      for (let p = 0; p < maxTrailPoints; p++) {
        points.push(new THREE.Vector3(20, 15, 20));
      }
      const trailGeo = new THREE.BufferGeometry().setFromPoints(points);
      const trailMat = new THREE.LineBasicMaterial({ 
        color: i === 0 ? 0x38bdf8 : 0x64748b, 
        transparent: true, 
        opacity: 0.5 
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      scene.add(trailLine);
      trails.push({ line: trailLine, points, geo: trailGeo });
    }
    trailsRef.current = trails;

    // 9. Mouse Orbit Interaction & Terrain Raycasting
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let mouseDownStartX = 0;
    let mouseDownStartY = 0;
    let orbitAzimuth = Math.PI / 4;
    let orbitPolar = Math.PI / 4;
    let orbitRadius = 260;

    const onMouseDown = (e) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      mouseDownStartX = e.clientX;
      mouseDownStartY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      orbitAzimuth -= deltaX * 0.005;
      orbitPolar = Math.max(0.1, Math.min(Math.PI / 2.1, orbitPolar - deltaY * 0.005));
    };

    const onMouseUp = (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;

      // Detect click on 3D terrain canvas (vs orbit dragging)
      const dragDist = Math.hypot(e.clientX - mouseDownStartX, e.clientY - mouseDownStartY);
      if (dragDist < 6 && rendererRef.current && cameraRef.current && groundMeshRef.current) {
        const rect = domElement.getBoundingClientRect();
        if (
          e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom
        ) {
          const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
          const intersects = raycaster.intersectObject(groundMeshRef.current);

          if (intersects.length > 0) {
            const hit = intersects[0].point;
            if (relocateEmergencyRef.current) {
              relocateEmergencyRef.current(hit.x, hit.z);
            }
          }
        }
      }
    };

    const onWheel = (e) => {
      orbitRadius = Math.max(40, Math.min(450, orbitRadius + e.deltaY * 0.2));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel);

    // 10. Animation Loop & Kinematic Physics
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const state = stateRef.current;

      // A. Animate Persistent Red Emergency Alert Beacon (Meshes & Lighting)
      if (emergencyMeshRef.current) {
        const em = emergencyMeshRef.current;
        const time = clock.getElapsedTime();
        em.core.rotation.y += 2.2 * delta;
        em.core.rotation.x = Math.sin(time * 3) * 0.25;
        em.wire.rotation.y -= 1.6 * delta;
        em.wire.rotation.z = Math.cos(time * 2.4) * 0.25;

        // Pulsing atmospheric sky laser
        if (em.beam && em.beam.material) {
          em.beam.material.opacity = 0.38 + Math.sin(time * 5.0) * 0.18;
        }

        // Expanding ground shockwave sonar rings
        if (em.ring1 && em.ring1.material) {
          const c1 = (time * 1.6) % 2.4;
          const r1Scale = 1.0 + c1 * 1.8;
          em.ring1.scale.set(r1Scale, r1Scale, r1Scale);
          em.ring1.material.opacity = Math.max(0, 0.95 - (c1 / 2.4) * 0.95);
        }

        if (em.ring2 && em.ring2.material) {
          const c2 = ((time * 1.6) + 1.2) % 2.4;
          const r2Scale = 1.0 + c2 * 1.8;
          em.ring2.scale.set(r2Scale, r2Scale, r2Scale);
          em.ring2.material.opacity = Math.max(0, 0.75 - (c2 / 2.4) * 0.75);
        }

        // Emergency strobe point light
        if (em.light) {
          em.light.intensity = 3.5 + Math.sin(time * 10.0) * 2.5;
        }
      }

      // B. Real-Time Distance-to-Distance Engine: Calculate Euclidean Distances from all 8 Drones
      const emPos = state.emergency.pos;
      const calculatedDistances = state.drones.map(d => {
        const dx = d.pos[0] - emPos[0];
        const dz = d.pos[1] - emPos[1];
        const dy = (d.pos[2] || 15) - emPos[2];
        const dist3D = Math.hypot(dx, dz, dy);
        const isAssigned = d.id === state.emergency.assignedDroneId;
        const speed = state.emergency.boostActive && isAssigned ? 9.8 : 7.2;
        const eta = Math.max(0.4, dist3D / speed);
        return {
          id: d.id,
          name: d.name || `D${d.id}`,
          dist: Math.round(dist3D * 10) / 10,
          eta: Math.round(eta * 10) / 10,
          battery: Math.round(d.battery),
          status: d.status,
          rawDist: dist3D
        };
      });

      // Autonomous Multi-Objective Decision Engine: Select closest eligible drone
      const candidatesForEmergency = calculatedDistances.filter(d => d.status !== 'CRITICAL_FAIL' && d.battery > 18);
      let bestDrone = null;
      if (candidatesForEmergency.length > 0) {
        // Multi-objective weighting (distance cost 70%, battery reserve 30%)
        candidatesForEmergency.sort((a, b) => {
          const costA = a.rawDist * 0.7 - a.battery * 0.3;
          const costB = b.rawDist * 0.7 - b.battery * 0.3;
          return costA - costB;
        });
        bestDrone = candidatesForEmergency[0];
      } else if (calculatedDistances.length > 0) {
        bestDrone = calculatedDistances[0];
      }

      if (bestDrone) {
        state.emergency.assignedDroneId = bestDrone.id;
        state.emergency.assignedDist = bestDrone.dist;
        state.emergency.assignedEta = bestDrone.eta;
      }

      // Sort distances ascending for the HUD ranking matrix
      calculatedDistances.sort((a, b) => a.dist - b.dist);
      state.emergency.droneDistances = calculatedDistances.map(d => ({
        ...d,
        isAssigned: d.id === state.emergency.assignedDroneId
      }));

      // Update 3D Intercept Laser Geometry from Assigned Interceptor to Emergency Site
      const assignedDroneObj = state.drones.find(d => d.id === state.emergency.assignedDroneId);
      if (assignedDroneObj && emergencyLaserRef.current) {
        const laserPoints = [
          new THREE.Vector3(assignedDroneObj.pos[0], assignedDroneObj.pos[2], assignedDroneObj.pos[1]),
          new THREE.Vector3(emPos[0], emPos[2] + 4.5, emPos[1])
        ];
        emergencyLaserRef.current.geo.setFromPoints(laserPoints);
        if (emergencyLaserRef.current.mat) {
          emergencyLaserRef.current.mat.opacity = 0.75 + Math.sin(clock.getElapsedTime() * 12) * 0.25;
        }
      }

      // Update Secondary Multi-Drone Distance Rays (next closest 3 candidate drones)
      if (emergencyRaysRef.current) {
        const rayPoints = [];
        state.emergency.droneDistances.slice(1, 4).forEach(cand => {
          const cd = state.drones.find(d => d.id === cand.id);
          if (cd && cd.status !== 'CRITICAL_FAIL') {
            rayPoints.push(new THREE.Vector3(cd.pos[0], cd.pos[2], cd.pos[1]));
            rayPoints.push(new THREE.Vector3(emPos[0], emPos[2] + 4.5, emPos[1]));
          }
        });
        emergencyRaysRef.current.geo.setFromPoints(rayPoints);
        if (emergencyRaysRef.current.line) {
          emergencyRaysRef.current.line.computeLineDistances();
        }
      }

      // Spin propellers continuously
      droneMeshes.forEach((dm, idx) => {
        const drone = state.drones[idx];
        const isOffline = drone && drone.status === 'CRITICAL_FAIL';
        const spinSpeed = isOffline ? 0 : 38;
        dm.props.forEach((prop, pIdx) => {
          prop.rotation.y += (pIdx % 2 === 0 ? 1 : -1) * spinSpeed * delta;
        });
      });

      // Pulse targets
      targetMeshes.forEach((tm, idx) => {
        const t = state.targets[idx];
        if (t && t.completed) {
          tm.markerMesh.scale.set(0.5, 0.5, 0.5);
          tm.markerMesh.material.opacity = 0.25;
          tm.markerMesh.material.transparent = true;
        } else {
          const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 4 + idx) * 0.15;
          tm.markerMesh.scale.set(pulse, pulse, pulse);
          tm.group.position.y = tm.initialY + Math.sin(clock.getElapsedTime() * 2 + idx) * 0.5;
        }
      });

      // Update Simulation Physics Step if running
      if (state.isRunning) {
        state.step += 1;
        const dt = 0.5 * state.speed;
        let stepDist = 0;

        // Dynamic task allocation cycle for standard targets
        state.targets.forEach(target => {
          if (!target.completed && !target.assignedDrone) {
            // Find best drone (skip drone currently assigned to emergency intercept)
            const candidates = state.drones.filter(d => 
              d.status !== 'CRITICAL_FAIL' && 
              d.status !== 'RETURNING' && 
              d.id !== state.emergency.assignedDroneId &&
              !d.assignedTargetId && 
              d.battery > 22
            );

            if (candidates.length > 0) {
              if (state.algorithm === 'MAPPO') {
                candidates.sort((a, b) => {
                  const distA = Math.hypot(a.pos[0] - target.pos[0], a.pos[1] - target.pos[1]);
                  const distB = Math.hypot(b.pos[0] - target.pos[0], b.pos[1] - target.pos[1]);
                  const costA = distA * 0.7 - a.battery * 0.3;
                  const costB = distB * 0.7 - b.battery * 0.3;
                  return costA - costB;
                });
              } else if (state.algorithm === 'NEAREST') {
                candidates.sort((a, b) => {
                  const distA = Math.hypot(a.pos[0] - target.pos[0], a.pos[1] - target.pos[1]);
                  const distB = Math.hypot(b.pos[0] - target.pos[0], b.pos[1] - target.pos[1]);
                  return distA - distB;
                });
              } else if (state.algorithm === 'GREEDY') {
                candidates.sort((a, b) => (100 - a.battery) - (100 - b.battery));
              }

              const chosen = candidates[0];
              chosen.assignedTargetId = target.id;
              chosen.targetPos = [...target.pos];
              target.assignedDrone = chosen.id;
            }
          }
        });

        // Update each drone position and battery
        state.drones.forEach((drone, idx) => {
          const meshObj = droneMeshes[idx];

          if (drone.status === 'CRITICAL_FAIL') {
            if (drone.pos[2] > 0.5) {
              drone.pos[2] = Math.max(0.5, drone.pos[2] - 14 * delta);
              meshObj.group.position.y = drone.pos[2];
              meshObj.group.rotation.z = Math.PI / 4;
              meshObj.group.rotation.x = Math.PI / 5;
            }
            meshObj.ledMat.color.setHex(0xef4444);
            meshObj.coneMat.opacity = 0;
            return;
          }

          // Emergency Interceptor Flight Override & Containment Loop
          const isEmergencyInterceptor = (drone.id === state.emergency.assignedDroneId);
          if (isEmergencyInterceptor && drone.status !== 'CRITICAL_FAIL' && drone.status !== 'RETURNING') {
            drone.targetPos = [emPos[0], emPos[1], emPos[2] + 4.5];
            const distToEm = Math.hypot(drone.pos[0] - emPos[0], drone.pos[1] - emPos[1]);
            
            if (distToEm <= 7.0) {
              drone.status = 'CONTAINING_EMERGENCY';
              state.emergency.containmentProgress = Math.min(
                100, 
                state.emergency.containmentProgress + (state.emergency.boostActive ? 0.45 : 0.25) * dt * 8
              );
              if (state.emergency.containmentProgress >= 100) {
                state.emergency.status = 'CONTAINED';
              }
            } else {
              drone.status = 'EMERGENCY_INTERCEPT';
            }

            // High-visibility crimson / cyan emergency LED strobe
            const strobe = Math.floor(clock.getElapsedTime() * 12) % 2 === 0;
            meshObj.ledMat.color.setHex(strobe ? 0xff0033 : 0x00f0ff);
            meshObj.coneMat.color.setHex(0xff0033);
            meshObj.coneMat.opacity = 0.45;
          }

          // Move towards targetPos
          const dx = drone.targetPos[0] - drone.pos[0];
          const dz = drone.targetPos[1] - drone.pos[1];
          const dy = drone.targetPos[2] - drone.pos[2];
          const dist3D = Math.sqrt(dx*dx + dz*dz + dy*dy);

          const maxSpeed = (isEmergencyInterceptor && state.emergency.boostActive) ? 9.8 : (isEmergencyInterceptor ? 8.2 : 7.5);
          if (dist3D > 0.8) {
            const speed = Math.min(maxSpeed, dist3D * 0.7);
            const vx = (dx / dist3D) * speed;
            const vz = (dz / dist3D) * speed;
            const vy = (dy / dist3D) * speed;

            drone.pos[0] += vx * dt;
            drone.pos[1] += vz * dt;
            drone.pos[2] += vy * dt;

            const disp = Math.sqrt(vx*vx + vz*vz + vy*vy) * dt;
            drone.distanceFlown += disp;
            stepDist += disp;

            // Attitude Tilt proportional to velocity
            const tiltPitch = (vz / maxSpeed) * 0.35;
            const tiltRoll = -(vx / maxSpeed) * 0.35;
            meshObj.group.rotation.x = tiltPitch;
            meshObj.group.rotation.z = tiltRoll;
            meshObj.group.rotation.y = Math.atan2(dx, dz);
          }

          // Battery Drain
          const drain = (0.045 + (dist3D > 1 ? 0.025 : 0.01)) * dt;
          drone.battery = Math.max(0, drone.battery - drain);

          // Return-to-base safeguard at 20%
          if (drone.battery <= 20 && drone.status !== 'RETURNING') {
            drone.status = 'RETURNING';
            drone.targetPos = [20, 20, 10];
            drone.assignedTargetId = null;
          }

          // Recharging at base
          if (drone.status === 'RETURNING') {
            const distToBase = Math.hypot(drone.pos[0] - 20, drone.pos[1] - 20);
            if (distToBase < 6) {
              drone.status = 'CHARGING';
              drone.battery = Math.min(100, drone.battery + 12 * dt);
              if (drone.battery >= 95) {
                drone.status = 'SEARCHING';
              }
            }
          }

          // Target Inspection Progress for standard targets
          if (drone.assignedTargetId && !isEmergencyInterceptor) {
            const target = state.targets.find(t => t.id === drone.assignedTargetId);
            if (target && !target.completed) {
              const distToT = Math.hypot(drone.pos[0] - target.pos[0], drone.pos[1] - target.pos[1]);
              if (distToT <= 8) {
                drone.status = 'INSPECTING';
                target.inspectedTime += 1;
                meshObj.ledMat.color.setHex(0x10b981);
                meshObj.coneMat.color.setHex(0x10b981);
                meshObj.coneMat.opacity = 0.45;

                if (target.inspectedTime >= target.requiredTime) {
                  target.completed = true;
                  drone.assignedTargetId = null;
                  drone.status = 'SEARCHING';
                }
              } else {
                drone.status = 'SEARCHING';
                meshObj.ledMat.color.setHex(0x38bdf8);
                meshObj.coneMat.color.setHex(0x38bdf8);
                meshObj.coneMat.opacity = 0.18;
              }
            }
          }

          // Sync Three.js Position
          meshObj.group.position.set(drone.pos[0], drone.pos[2], drone.pos[1]);

          // Update Trail Ribbon
          const trail = trails[idx];
          if (trail && state.step % 2 === 0) {
            trail.points.pop();
            trail.points.unshift(new THREE.Vector3(drone.pos[0], drone.pos[2], drone.pos[1]));
            trail.geo.setFromPoints(trail.points);
          }
        });

        state.totalDistance += stepDist;

        // Collision detection: D_min < 5.0m
        const activeList = state.drones.filter(d => d.status !== 'CRITICAL_FAIL' && d.pos[2] > 2);
        for (let i = 0; i < activeList.length; i++) {
          for (let j = i + 1; j < activeList.length; j++) {
            const d1 = activeList[i];
            const d2 = activeList[j];
            const dist = Math.hypot(d1.pos[0] - d2.pos[0], d1.pos[1] - d2.pos[1], d1.pos[2] - d2.pos[2]);
            if (dist < 5.0) {
              state.collisions += 1;
            }
          }
        }

        // Periodic Telemetry State Push to UI
        if (state.step % 6 === 0) {
          const completedCount = state.targets.filter(t => t.completed).length;
          const avgBat = state.drones.reduce((acc, d) => acc + d.battery, 0) / state.drones.length;
          const aliveDrones = state.drones.filter(d => d.status !== 'CRITICAL_FAIL').length;

          const updatedTelemetry = {
            step: state.step,
            activeDrones: aliveDrones,
            completionPct: Math.round((completedCount / state.targets.length) * 1000) / 10,
            batteryAvg: Math.round(avgBat * 10) / 10,
            collisions: state.collisions,
            targetsCompleted: completedCount,
            totalTargets: state.targets.length,
            totalDistance: Math.round(state.totalDistance * 10) / 10,
            edgeLatency: Math.round((6.4 + aliveDrones * 0.4) * 10) / 10,
            events: state.events.slice(-6)
          };

          setTelemetry(updatedTelemetry);
          if (onTelemetryUpdate) onTelemetryUpdate(updatedTelemetry, state.drones);

          // Push Emergency State Updates to React
          setEmergencyTarget({
            active: true,
            id: 'RED_ALERT_01',
            label: 'CRITICAL WILDFIRE / S.O.S SURVIVOR',
            pos: [...state.emergency.pos],
            assignedDroneId: state.emergency.assignedDroneId,
            assignedDist: state.emergency.assignedDist,
            assignedEta: state.emergency.assignedEta,
            status: state.emergency.status,
            containmentProgress: Math.round(state.emergency.containmentProgress),
            boostActive: !!state.emergency.boostActive,
            droneDistances: state.emergency.droneDistances
          });
        }
      }

      // Update Camera Position based on CameraMode
      if (cameraMode === 'ORBIT') {
        camera.position.x = 100 + orbitRadius * Math.sin(orbitPolar) * Math.cos(orbitAzimuth);
        camera.position.z = 100 + orbitRadius * Math.sin(orbitPolar) * Math.sin(orbitAzimuth);
        camera.position.y = orbitRadius * Math.cos(orbitPolar);
        camera.lookAt(100, 15, 100);
      } else if (cameraMode === 'FOLLOW') {
        const selDrone = state.drones.find(d => d.id === state.selectedDroneId) || state.drones[0];
        if (selDrone) {
          camera.position.set(selDrone.pos[0] - 22, selDrone.pos[2] + 16, selDrone.pos[1] - 22);
          camera.lookAt(selDrone.pos[0], selDrone.pos[2], selDrone.pos[1]);
        }
      } else if (cameraMode === 'TOP_DOWN') {
        camera.position.set(100, 240, 100);
        camera.lookAt(100, 0, 100);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cameraMode]);

  // Failure Injection Handlers
  const handleInjectFailure = (droneId, type) => {
    const state = stateRef.current;
    const targetDrone = state.drones.find(d => d.id === droneId);
    if (!targetDrone) return;

    if (type === 'MOTOR_FAILURE') {
      targetDrone.status = 'CRITICAL_FAIL';
      targetDrone.faultInjected = true;
      setActiveFailure(`D${droneId} Motor Malfunction`);

      // Dynamic task failover takeover
      if (targetDrone.assignedTargetId) {
        const orphanTarget = state.targets.find(t => t.id === targetDrone.assignedTargetId);
        if (orphanTarget) {
          orphanTarget.assignedDrone = null;
          targetDrone.assignedTargetId = null;
        }
      }
    } else if (type === 'BATTERY_DROP') {
      targetDrone.battery = 13.0;
      targetDrone.status = 'RETURNING';
      targetDrone.targetPos = [20, 20, 10];
      setActiveFailure(`D${droneId} Low Battery (13%)`);
      if (targetDrone.assignedTargetId) {
        const orphanTarget = state.targets.find(t => t.id === targetDrone.assignedTargetId);
        if (orphanTarget) {
          orphanTarget.assignedDrone = null;
          targetDrone.assignedTargetId = null;
        }
      }
    }
  };

  const handleResetMission = () => {
    setActiveFailure(null);
    const state = stateRef.current;
    state.step = 0;
    state.collisions = 0;
    state.totalDistance = 0;
    state.drones.forEach((d, idx) => {
      d.battery = 100;
      d.status = 'SEARCHING';
      d.faultInjected = false;
      d.assignedTargetId = null;
      d.pos = [14 + (idx % 4) * 6, 14 + Math.floor(idx / 4) * 6, 12 + idx * 2];
      d.targetPos = [35 + idx * 15, 45 + idx * 12, 18];
    });
    state.targets.forEach(t => {
      t.completed = false;
      t.inspectedTime = 0;
      t.assignedDrone = null;
    });
    setIsRunning(true);
  };

  return (
    <div className="w-full bg-[#070b14] text-white border border-slate-800/80 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
      {/* 1. Mission Control Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 px-4 sm:px-6 py-3.5 bg-[#0a0f1d]/90 backdrop-blur-xl text-xs font-mono gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold tracking-wider text-white uppercase text-xs sm:text-sm">AeroMind Mission 3D Twin</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400">EDGE RUNTIME: <strong className="text-emerald-400">{telemetry.edgeLatency} ms</strong></span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400">COORDINATOR: <strong className="text-cyan-400">{activeAlgorithm}</strong></span>
          
          {/* Real-Time Red Emergency Alert Status Capsule */}
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-950/80 border border-rose-500/50 rounded-full text-rose-300 font-mono text-[11px] shadow-lg shadow-rose-950/40">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-bold">RED ALERT INTERCEPT:</span>
            <span>D{emergencyTarget.assignedDroneId} • {emergencyTarget.assignedDist}m (ETA {emergencyTarget.assignedEta}s)</span>
          </div>
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#070b14] border border-slate-800 rounded-full p-1">
            <button 
              onClick={() => setCameraMode('ORBIT')} 
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${cameraMode === 'ORBIT' ? 'bg-cyan-500 text-black shadow-sm font-black' : 'text-slate-400 hover:text-white'}`}
            >
              ORBIT 3D
            </button>
            <button 
              onClick={() => setCameraMode('FOLLOW')} 
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${cameraMode === 'FOLLOW' ? 'bg-cyan-500 text-black shadow-sm font-black' : 'text-slate-400 hover:text-white'}`}
            >
              CHASE (D{selectedDroneId})
            </button>
            <button 
              onClick={() => setCameraMode('TOP_DOWN')} 
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${cameraMode === 'TOP_DOWN' ? 'bg-cyan-500 text-black shadow-sm font-black' : 'text-slate-400 hover:text-white'}`}
            >
              RADAR
            </button>
          </div>

          <button 
            onClick={() => setIsRunning(!isRunning)} 
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black font-extrabold text-xs hover:bg-slate-200 rounded-full transition-colors cursor-pointer shadow-md"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'PAUSE' : 'RESUME'}
          </button>

          <button 
            onClick={handleResetMission} 
            className="p-2 border border-slate-700 hover:border-white text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main 3D Canvas Area */}
      <div className="relative w-full h-[540px] md:h-[620px] bg-black">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Emergency Relocation Toast Notification */}
        {emergencyAlertToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-rose-950/95 border border-rose-500/80 text-rose-100 px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 font-mono text-xs pointer-events-none animate-in fade-in duration-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping"></span>
            <span className="font-bold">{emergencyAlertToast}</span>
          </div>
        )}

        {/* 3D Viewport HUD Overlays */}
        {/* Top-Left Telemetry KPI Overlay */}
        <div className="absolute top-4 left-4 bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 text-xs font-mono max-w-[270px] pointer-events-auto shadow-2xl">
          <div className="text-[11px] text-slate-400 font-bold tracking-widest uppercase border-b border-slate-800 pb-2 mb-2.5">
            SWARM TELEMETRY [ACTIVE]
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">COMPLETION:</span>
              <span className="font-bold text-emerald-400">{telemetry.completionPct}% ({telemetry.targetsCompleted}/{telemetry.totalTargets})</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${telemetry.completionPct}%` }} />
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-400">ACTIVE DRONES:</span>
              <span className="font-bold text-white">{telemetry.activeDrones} / 8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">FLEET BATTERY:</span>
              <span className={`font-bold ${telemetry.batteryAvg < 30 ? 'text-rose-400' : 'text-cyan-400'}`}>{telemetry.batteryAvg}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">COLLISIONS:</span>
              <span className="font-bold text-emerald-400">{telemetry.collisions === 0 ? '0 (100% SAFE)' : `${telemetry.collisions} BREACHES`}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">FLIGHT DISTANCE:</span>
              <span className="font-bold text-slate-200">{telemetry.totalDistance} m</span>
            </div>
          </div>
        </div>

        {/* Top-Right Tactical Command Dock (Red Alert Distance Matrix & Failover Controls) */}
        <div className="absolute top-4 right-4 bg-[#0a0f1d]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 text-xs font-mono w-[300px] sm:w-[330px] shadow-2xl pointer-events-auto">
          {/* Tab Switcher: Red Alert Radar vs Fault Injection */}
          <div className="flex items-center gap-1.5 p-1 bg-[#070b14] border border-slate-800/90 rounded-xl mb-3">
            <button
              onClick={() => setActiveDockTab('RED_ALERT')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDockTab === 'RED_ALERT'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>SOS RADAR</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-ping ml-0.5" />
            </button>
            <button
              onClick={() => setActiveDockTab('FAILURES')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDockTab === 'FAILURES'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>FAILOVER</span>
            </button>
          </div>

          {/* DOCK CONTENT 1: RED ALERT EMERGENCY DISTANCE MATRIX */}
          {activeDockTab === 'RED_ALERT' && (
            <div className="space-y-3">
              {/* Emergency Beacon Site Info */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>DISASTER GROUND ZERO</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/40 text-rose-300">
                  X:{emergencyTarget.pos[0].toFixed(0)} Z:{emergencyTarget.pos[1].toFixed(0)}
                </span>
              </div>

              {/* Dispatched Interceptor Spotlight Card */}
              <div className="p-3 bg-gradient-to-br from-rose-950/70 to-[#0c1220] border border-rose-500/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">PRIMARY INTERCEPTOR:</span>
                  <span className="text-xs font-black text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded-md border border-rose-500/40">
                    DRONE D{emergencyTarget.assignedDroneId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">DISTANCE:</span>
                    <strong className="text-rose-200 text-sm">{emergencyTarget.assignedDist} m</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ESTIMATED ETA:</span>
                    <strong className="text-rose-200 text-sm">{emergencyTarget.assignedEta} s</strong>
                  </div>
                </div>

                {/* Containment progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">
                      {emergencyTarget.containmentProgress >= 100 ? 'SITE CONTAINED' : 'CONTAINMENT STATUS:'}
                    </span>
                    <span className="font-bold text-rose-300">{emergencyTarget.containmentProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${emergencyTarget.containmentProgress}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Real-Time Distance Ranking Matrix Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>SWARM DISTANCES (CLOSEST → FARTHEST):</span>
                </div>

                <div className="max-h-[135px] overflow-y-auto space-y-1 pr-1 font-mono text-[11px] custom-scrollbar">
                  {emergencyTarget.droneDistances && emergencyTarget.droneDistances.map((d, rank) => (
                    <div 
                      key={d.id}
                      className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${
                        d.isAssigned
                          ? 'bg-rose-950/80 border-rose-500/70 text-white font-bold'
                          : 'bg-[#070b14]/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] w-3.5 text-center ${d.isAssigned ? 'text-rose-400 font-black' : 'text-slate-500'}`}>
                          #{rank + 1}
                        </span>
                        <span className={`font-bold ${d.isAssigned ? 'text-rose-300' : 'text-cyan-400'}`}>
                          {d.name}
                        </span>
                        {d.isAssigned && (
                          <span className="text-[9px] bg-rose-900/90 text-rose-200 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                            LEAD
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-200 font-mono">{d.dist}m</span>
                        <span className="text-slate-400 font-mono text-[10px]">{d.eta}s</span>
                        <span className={`text-[10px] ${d.battery < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {d.battery}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleRandomEmergency}
                  className="px-2.5 py-1.5 bg-[#0e1726] border border-rose-500/40 hover:bg-rose-600 hover:text-white text-rose-300 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Randomize emergency alert location"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>RELOCATE SOS</span>
                </button>
                <button
                  onClick={handleToggleSpeedBoost}
                  className={`px-2.5 py-1.5 border rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    emergencyTarget.boostActive
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-[#0e1726] border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle 1.5x afterburner sprint speed"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{emergencyTarget.boostActive ? 'BOOST: ACTIVE' : '1.5x BOOST'}</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 font-sans text-center leading-tight">
                💡 Click anywhere on the 3D ground plane to drop the beacon!
              </div>
            </div>
          )}

          {/* DOCK CONTENT 2: FAULT INJECTION CONTROLS */}
          {activeDockTab === 'FAILURES' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Simulate drone anomalies to demonstrate dynamic task redistribution:
              </p>
              <div className="space-y-2">
                <button 
                  onClick={() => handleInjectFailure(3, 'MOTOR_FAILURE')}
                  className="w-full px-3 py-1.5 border border-rose-500/50 hover:bg-rose-500 hover:text-white text-rose-300 text-xs font-bold text-left transition-colors flex items-center justify-between rounded-xl cursor-pointer"
                >
                  <span>INJECT MOTOR FAIL (D3)</span>
                  <span className="text-[10px] bg-rose-950 px-2 py-0.5 rounded-full text-rose-300 font-mono">KILL</span>
                </button>
                <button 
                  onClick={() => handleInjectFailure(5, 'BATTERY_DROP')}
                  className="w-full px-3 py-1.5 border border-amber-500/50 hover:bg-amber-500 hover:text-black text-amber-300 text-xs font-bold text-left transition-colors flex items-center justify-between rounded-xl cursor-pointer"
                >
                  <span>DROP BATTERY 13% (D5)</span>
                  <span className="text-[10px] bg-amber-950 px-2 py-0.5 rounded-full text-amber-300 font-mono">REROUTE</span>
                </button>
              </div>

              {activeFailure && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 rounded-xl leading-relaxed">
                  <strong className="block text-rose-400 uppercase text-[11px] mb-0.5">Automated Failover:</strong>
                  {activeFailure} triggered. Peers dynamically accepted reallocated task!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom HUD: Drone Selector Pills */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-3 text-xs font-mono shadow-2xl">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-400 text-xs font-bold uppercase mr-1">FLEET:</span>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(id => (
              <button
                key={id}
                onClick={() => setSelectedDroneId(id)}
                className={`px-3 py-1 text-xs font-bold border rounded-full transition-all cursor-pointer ${
                  selectedDroneId === id 
                    ? 'bg-cyan-500 text-black border-cyan-400 font-black shadow-md shadow-cyan-500/25' 
                    : 'bg-[#0c1220] text-slate-300 border-slate-800 hover:border-slate-600'
                }`}
              >
                D{id}
              </button>
            ))}
          </div>

          {/* Algorithm Quick Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs font-bold uppercase mr-1">ALGORITHM:</span>
            {['MAPPO', 'NEAREST', 'GREEDY', 'RANDOM'].map(algo => (
              <button
                key={algo}
                onClick={() => onAlgorithmChange && onAlgorithmChange(algo)}
                className={`px-3 py-1 text-xs font-bold border rounded-full transition-all cursor-pointer ${
                  activeAlgorithm === algo
                    ? 'bg-white text-black border-white font-black'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {algo}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
