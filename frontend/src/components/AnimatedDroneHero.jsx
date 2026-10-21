import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Play, Pause, RotateCcw, AlertTriangle, Eye, Zap, Shield, 
  Activity, Radio, Crosshair, Navigation, Target, Layers, Cpu, CheckCircle2
} from 'lucide-react';

/**
 * AeroMind-DL: 8-Drone Autonomous Swarm 3D Flight Simulator
 * Features:
 * - 8 High-fidelity autonomous 3D drones flying in formation
 * - Dynamic formation morphing: Tactical V, Circle Perimeter, Lawnmower Grid, Dispersed Recon
 * - Smooth physics-based hovering, banking tilt, propeller blur, and altitude oscillation
 * - Downwash particle rings & pulsing rangefinder laser cones
 * - Interactive mouse parallax perspective & 360° orbit controls
 * - Real-time individual drone inspection HUD & Autonomous failover injection
 */

const FORMATION_PRESETS = {
  V_FORMATION: {
    name: 'TACTICAL V-ARROWHEAD',
    description: 'Coordinated echelon patrol with optimal aerodynamic drafting',
    coords: [
      { id: 1, x: 0, y: 14, z: 12, label: 'D1' },
      { id: 2, x: -10, y: 15, z: 4, label: 'D2' },
      { id: 3, x: 10, y: 15, z: 4, label: 'D3' },
      { id: 4, x: -20, y: 16, z: -4, label: 'D4' },
      { id: 5, x: 20, y: 16, z: -4, label: 'D5' },
      { id: 6, x: -30, y: 17, z: -12, label: 'D6' },
      { id: 7, x: 30, y: 17, z: -12, label: 'D7' },
      { id: 8, x: 0, y: 18, z: -16, label: 'D8' }
    ]
  },
  CIRCLE_PERIMETER: {
    name: '360° CIRCULAR PERIMETER',
    description: 'Encirclement surveillance maintaining continuous sensor overlap',
    coords: [
      { id: 1, x: 22 * Math.cos(0), y: 15, z: 22 * Math.sin(0), label: 'D1' },
      { id: 2, x: 22 * Math.cos(Math.PI / 4), y: 15.5, z: 22 * Math.sin(Math.PI / 4), label: 'D2' },
      { id: 3, x: 22 * Math.cos(Math.PI / 2), y: 14.8, z: 22 * Math.sin(Math.PI / 2), label: 'D3' },
      { id: 4, x: 22 * Math.cos((3 * Math.PI) / 4), y: 15.2, z: 22 * Math.sin((3 * Math.PI) / 4), label: 'D4' },
      { id: 5, x: 22 * Math.cos(Math.PI), y: 15, z: 22 * Math.sin(Math.PI), label: 'D5' },
      { id: 6, x: 22 * Math.cos((5 * Math.PI) / 4), y: 15.6, z: 22 * Math.sin((5 * Math.PI) / 4), label: 'D6' },
      { id: 7, x: 22 * Math.cos((3 * Math.PI) / 2), y: 14.7, z: 22 * Math.sin((3 * Math.PI) / 2), label: 'D7' },
      { id: 8, x: 22 * Math.cos((7 * Math.PI) / 4), y: 15.3, z: 22 * Math.sin((7 * Math.PI) / 4), label: 'D8' }
    ]
  },
  GRID_SWEEP: {
    name: 'LAWNMOWER SEARCH MATRIX',
    description: 'Parallel strip coverage for exhaustive disaster zone mapping',
    coords: [
      { id: 1, x: -24, y: 14, z: 14, label: 'D1' },
      { id: 2, x: -8, y: 15, z: 14, label: 'D2' },
      { id: 3, x: 8, y: 15, z: 14, label: 'D3' },
      { id: 4, x: 24, y: 14, z: 14, label: 'D4' },
      { id: 5, x: -24, y: 16, z: -10, label: 'D5' },
      { id: 6, x: -8, y: 16, z: -10, label: 'D6' },
      { id: 7, x: 8, y: 16, z: -10, label: 'D7' },
      { id: 8, x: 24, y: 16, z: -10, label: 'D8' }
    ]
  },
  DISPERSED_SEARCH: {
    name: 'DYNAMIC DISPERSED RECON',
    description: 'MAPPO dynamic allocation maximizing multi-objective spatial entropy',
    coords: [
      { id: 1, x: 0, y: 14, z: 4, label: 'D1' },
      { id: 2, x: -16, y: 17, z: 12, label: 'D2' },
      { id: 3, x: 18, y: 12, z: 10, label: 'D3' },
      { id: 4, x: -28, y: 15, z: -8, label: 'D4' },
      { id: 5, x: 28, y: 18, z: -6, label: 'D5' },
      { id: 6, x: -12, y: 13, z: -20, label: 'D6' },
      { id: 7, x: 14, y: 15, z: -18, label: 'D7' },
      { id: 8, x: 2, y: 10, z: -26, label: 'D8' }
    ]
  }
};

export default function AnimatedDroneHero({ onExploreCaseStudy }) {
  const mountRef = useRef(null);
  const [activeFormation, setActiveFormation] = useState('V_FORMATION');
  const [selectedDroneId, setSelectedDroneId] = useState(1);
  const [isRotating, setIsRotating] = useState(true);
  const [activeFailure, setActiveFailure] = useState(null);

  // Swarm fleet telemetry state
  const [fleetStats, setFleetStats] = useState({
    airborne: 8,
    completion: 46.2,
    avgBattery: 92.8,
    collisions: 0,
    targetsFound: 8,
    totalDistance: 312.4
  });

  const [dronesData, setDronesData] = useState([
    { id: 1, name: 'D1-ALPHA', task: 'SWARM COMMAND', battery: 97, alt: 18.2, speed: 4.8, rpm: 8420, status: 'NOMINAL', role: 'Avionics Master' },
    { id: 2, name: 'D2-BRAVO', task: 'SURVIVOR SWEEP', battery: 93, alt: 21.4, speed: 5.1, rpm: 8550, status: 'NOMINAL', role: 'Thermal Scan' },
    { id: 3, name: 'D3-CHARLIE', task: 'WILDFIRE PERIMETER', battery: 89, alt: 15.6, speed: 4.2, rpm: 8300, status: 'NOMINAL', role: 'Hazard Border' },
    { id: 4, name: 'D4-DELTA', task: 'COLLAPSED RECON', battery: 95, alt: 19.8, speed: 4.9, rpm: 8480, status: 'NOMINAL', role: 'Structure LiDAR' },
    { id: 5, name: 'D5-ECHO', task: 'MEDIC CHOKEPOINT', battery: 91, alt: 23.5, speed: 5.3, rpm: 8600, status: 'NOMINAL', role: 'Evac Route' },
    { id: 6, name: 'D6-FOXTROT', task: 'SMOKE CORRIDOR', battery: 96, alt: 17.1, speed: 4.7, rpm: 8390, status: 'NOMINAL', role: 'Gas Sensing' },
    { id: 7, name: 'D7-GOLF', task: 'GEO MAP GRID', battery: 86, alt: 22.0, speed: 4.4, rpm: 8250, status: 'NOMINAL', role: 'Photogrammetry' },
    { id: 8, name: 'D8-HOTEL', task: 'MESH RELAY', battery: 98, alt: 13.4, speed: 3.9, rpm: 8120, status: 'NOMINAL', role: 'Base Comms' }
  ]);

  const dronesRef = useRef([]);
  const formationTargetRef = useRef(FORMATION_PRESETS.V_FORMATION.coords);
  const mouseParallaxRef = useRef({ x: 0, y: 0 });

  // Update target coordinates when formation changes
  useEffect(() => {
    formationTargetRef.current = FORMATION_PRESETS[activeFormation].coords;
  }, [activeFormation]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 600;

    // 1. Three.js Scene Setup with Aerospace Dark Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.005);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    camera.position.set(0, 32, 68);
    camera.lookAt(0, 12, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. High-Tech Studio Aerospace Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const cyanSun = new THREE.DirectionalLight(0x38bdf8, 2.2);
    cyanSun.position.set(50, 70, 40);
    cyanSun.castShadow = true;
    scene.add(cyanSun);

    const emeraldFill = new THREE.DirectionalLight(0x10b981, 1.2);
    emeraldFill.position.set(-50, 40, -30);
    scene.add(emeraldFill);

    const blueUnderLight = new THREE.DirectionalLight(0x1d4ed8, 0.8);
    blueUnderLight.position.set(0, -30, 0);
    scene.add(blueUnderLight);

    // 3. 3D Digital Twin Ground: Holographic Coordinate Grid & Elevation Rings
    const gridHelper = new THREE.GridHelper(160, 40, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    // Radar distance rings
    [20, 36, 52].forEach((radius, rIdx) => {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.35, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: rIdx === 0 ? 0x10b981 : rIdx === 1 ? 0x38bdf8 : 0x64748b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -5.9;
      scene.add(ring);
    });

    // 4. Disaster Environment Targets in 3D Space
    // Target A: Human Survivor Beacon (Glowing Emerald Hologram)
    const survivorGroup = new THREE.Group();
    survivorGroup.position.set(22, -5.5, 14);
    const survivorCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.4 })
    );
    survivorGroup.add(survivorCore);
    const sRing = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 4.0, 32),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    );
    sRing.rotation.x = -Math.PI / 2;
    survivorGroup.add(sRing);
    scene.add(survivorGroup);

    // Target B: Persistent Red Emergency Alert Beacon (Wildfire / SOS)
    const fireGroup = new THREE.Group();
    fireGroup.position.set(-24, -5.5, -10);
    const fireCone = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 7.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 2.5 })
    );
    fireCone.position.y = 3.75;
    fireGroup.add(fireCone);

    // Hazard rotating cage
    const fireCage = new THREE.Mesh(
      new THREE.OctahedronGeometry(4.2, 0),
      new THREE.MeshBasicMaterial({ color: 0xff2255, wireframe: true })
    );
    fireCage.position.y = 4.5;
    fireGroup.add(fireCage);

    // Atmospheric vertical sky laser
    const fireBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 1.4, 60, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    fireBeam.position.y = 30;
    fireGroup.add(fireBeam);

    // Expanding ground shockwave sonar ring
    const fireRing = new THREE.Mesh(
      new THREE.RingGeometry(3.6, 4.8, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0033, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    fireRing.rotation.x = -Math.PI / 2;
    fireRing.position.y = 0.1;
    fireGroup.add(fireRing);

    // Emergency strobe light
    const fireLight = new THREE.PointLight(0xff0033, 4.5, 60);
    fireLight.position.y = 5.0;
    fireGroup.add(fireLight);

    scene.add(fireGroup);

    // Interceptor Laser Line (Closest Drone -> Red Beacon)
    const heroLaserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 15, 0),
      new THREE.Vector3(-24, 0, -10)
    ]);
    const heroLaserMat = new THREE.LineBasicMaterial({
      color: 0xff0033,
      transparent: true,
      opacity: 0.85
    });
    const heroLaserLine = new THREE.Line(heroLaserGeo, heroLaserMat);
    scene.add(heroLaserLine);

    // Target C: Collapsed Structural Collapse (Yellow Wireframe)
    const buildingGeo = new THREE.BoxGeometry(10, 14, 10);
    const buildingWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(buildingGeo),
      new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 })
    );
    buildingWire.position.set(-14, 1, 24);
    scene.add(buildingWire);

    // Target D: Charging Pad Station
    const padGroup = new THREE.Group();
    padGroup.position.set(0, -5.8, -28);
    const padMesh = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.4, 14),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
    );
    padGroup.add(padMesh);
    const padRing = new THREE.Mesh(
      new THREE.RingGeometry(4.8, 5.6, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.y = 0.25;
    padGroup.add(padRing);
    scene.add(padGroup);

    // Target E: Stranded Emergency Vehicle (Cyan Wireframe Rig)
    const vehicleGroup = new THREE.Group();
    vehicleGroup.position.set(24, -4.5, -16);
    const vehicleGeo = new THREE.BoxGeometry(6, 2.8, 10);
    const vehicleWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(vehicleGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 })
    );
    vehicleGroup.add(vehicleWire);
    scene.add(vehicleGroup);

    // 5. Construct ALL 8 3D High-Fidelity Drones
    const droneObjects = [];
    const initialCoords = FORMATION_PRESETS.V_FORMATION.coords;

    // Materials
    const bodyMatWhite = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.4
    });
    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.5,
      metalness: 0.8
    });
    const propMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: 0.88
    });

    initialCoords.forEach((coord, i) => {
      const droneGroup = new THREE.Group();
      droneGroup.position.set(coord.x, coord.y, coord.z);

      // A. Aerodynamic Fuselage
      const bodyGeo = new THREE.CylinderGeometry(1.0, 1.4, 0.9, 24);
      bodyGeo.scale(1.25, 0.75, 1.6);
      const fuselage = new THREE.Mesh(bodyGeo, bodyMatWhite);
      fuselage.castShadow = true;
      droneGroup.add(fuselage);

      // B. Top Avionics Pod Dome
      const domeGeo = new THREE.SphereGeometry(1.05, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      domeGeo.scale(1.05, 0.55, 1.35);
      const dome = new THREE.Mesh(domeGeo, bodyMatWhite);
      dome.position.y = 0.35;
      droneGroup.add(dome);

      // C. Drone Identification Tag Strip
      const tagGeo = new THREE.BoxGeometry(0.8, 0.1, 1.2);
      const tagMat = new THREE.MeshStandardMaterial({
        color: i === 0 ? 0x38bdf8 : i === 2 ? 0xf97316 : 0x10b981,
        emissive: i === 0 ? 0x0284c7 : i === 2 ? 0xc2410c : 0x047857,
        emissiveIntensity: 0.8
      });
      const tag = new THREE.Mesh(tagGeo, tagMat);
      tag.position.y = 0.7;
      droneGroup.add(tag);

      // D. 4 Diagonal Carbon Fiber Motor Arms with Rotors & LEDs
      const armAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
      const armLength = 2.9;
      const rotors = [];

      armAngles.forEach((angle, aIdx) => {
        const ax = Math.cos(angle) * armLength;
        const az = Math.sin(angle) * armLength;

        // Structural arm
        const armGeo = new THREE.CylinderGeometry(0.13, 0.15, armLength, 12);
        const arm = new THREE.Mesh(armGeo, carbonMat);
        arm.position.set(ax / 2, 0.1, az / 2);
        arm.rotation.z = Math.PI / 2;
        arm.rotation.y = -angle;
        droneGroup.add(arm);

        // Brushless motor hub
        const motorGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.5, 16);
        const motor = new THREE.Mesh(motorGeo, carbonMat);
        motor.position.set(ax, 0.28, az);
        droneGroup.add(motor);

        // Nav LED
        const ledColor = aIdx < 2 ? 0xef4444 : 0x10b981;
        const ledGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const led = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: ledColor }));
        led.position.set(ax, 0.05, az);
        droneGroup.add(led);

        // Propeller Blade
        const bladeGeo = new THREE.BoxGeometry(2.7, 0.04, 0.26);
        const blade = new THREE.Mesh(bladeGeo, propMat);
        blade.position.set(ax, 0.56, az);
        droneGroup.add(blade);
        rotors.push(blade);
      });

      // E. Landing Skids
      [-1.0, 1.0].forEach(sx => {
        const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 3.4, 12);
        const leg = new THREE.Mesh(legGeo, bodyMatWhite);
        leg.rotation.x = Math.PI / 2;
        leg.position.set(sx, -1.5, 0);
        droneGroup.add(leg);

        const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.7, 12);
        const fStrut = new THREE.Mesh(strutGeo, bodyMatWhite);
        fStrut.position.set(sx, -0.75, 0.75);
        fStrut.rotation.x = -Math.PI / 8;
        droneGroup.add(fStrut);

        const rStrut = new THREE.Mesh(strutGeo, bodyMatWhite);
        rStrut.position.set(sx, -0.75, -0.75);
        rStrut.rotation.x = Math.PI / 8;
        droneGroup.add(rStrut);
      });

      // F. Downward Rangefinder Laser Cone
      const coneGeo = new THREE.ConeGeometry(2.2, 9.0, 16, 1, true);
      const coneColor = i === 0 ? 0x38bdf8 : i === 2 ? 0xf97316 : 0x10b981;
      const coneMat = new THREE.MeshBasicMaterial({
        color: coneColor,
        wireframe: true,
        transparent: true,
        opacity: 0.22
      });
      const laserCone = new THREE.Mesh(coneGeo, coneMat);
      laserCone.position.set(0, -4.5, 0);
      laserCone.rotation.x = Math.PI;
      droneGroup.add(laserCone);

      // G. Trajectory Ribbon Trail
      const trailPoints = [];
      for (let p = 0; p < 25; p++) {
        trailPoints.push(new THREE.Vector3(coord.x, coord.y, coord.z));
      }
      const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
      const trailLine = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({
          color: i === 0 ? 0x38bdf8 : i === 2 ? 0xf97316 : 0x10b981,
          transparent: true,
          opacity: 0.4
        })
      );
      scene.add(trailLine);

      scene.add(droneGroup);

      droneObjects.push({
        id: coord.id,
        label: coord.label,
        group: droneGroup,
        rotors,
        laserCone,
        coneMat,
        trailLine,
        trailPoints,
        trailGeo,
        targetPos: new THREE.Vector3(coord.x, coord.y, coord.z),
        isFailing: false
      });
    });

    dronesRef.current = droneObjects;

    // 5B. Dynamic MQTT / ROS 2 Swarm Mesh Network Communication Links
    const meshLinesGeo = new THREE.BufferGeometry();
    const meshLinesMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28
    });
    const meshLines = new THREE.LineSegments(meshLinesGeo, meshLinesMat);
    scene.add(meshLines);

    // 6. Interactive Mouse Orbit & Parallax Controls
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let orbitAzimuth = 0.2;
    let orbitElevation = 0.42;
    let orbitRadius = 58;

    const onMouseDown = (e) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      // Calculate mouse parallax offset normalized (-1 to 1)
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseParallaxRef.current = { x: nx * 4, y: ny * 2 };

      if (!isMouseDown) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      orbitAzimuth -= dx * 0.006;
      orbitElevation = Math.max(0.12, Math.min(Math.PI / 2.2, orbitElevation - dy * 0.006));
    };

    const onMouseUp = () => { isMouseDown = false; };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 7. Animation Loop (Smooth Lerp Formation Transitions, Rotors, Hover Waves)
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Retrieve current formation targets
      const currentTargets = formationTargetRef.current;

      droneObjects.forEach((drone, idx) => {
        // Fast propeller spin (140 rad/s)
        const spinSpeed = drone.isFailing ? 0 : 44;
        drone.rotors.forEach((rotor, rIdx) => {
          rotor.rotation.y += (rIdx % 2 === 0 ? 1 : -1) * spinSpeed;
        });

        // Failover descent simulation
        if (drone.isFailing) {
          if (drone.group.position.y > -5.0) {
            drone.group.position.y = Math.max(-5.0, drone.group.position.y - 14 * delta);
            drone.group.rotation.z = Math.PI / 4;
            drone.group.rotation.x = Math.PI / 6;
          }
          drone.coneMat.opacity = 0;
          return;
        }

        // Target coordinates from formation
        const targetCoord = currentTargets.find(c => c.id === drone.id) || currentTargets[idx];
        if (targetCoord) {
          drone.targetPos.set(targetCoord.x, targetCoord.y, targetCoord.z);
        }

        // Physics Wave Hovering
        const waveY = Math.sin(elapsedTime * 2.4 + idx * 0.8) * 0.65;
        const waveX = Math.cos(elapsedTime * 0.9 + idx * 0.6) * 0.8;
        const waveZ = Math.sin(elapsedTime * 1.1 + idx * 0.7) * 0.8;

        const desiredX = drone.targetPos.x + waveX;
        const desiredY = drone.targetPos.y + waveY;
        const desiredZ = drone.targetPos.z + waveZ;

        // Smooth Lerp Transition to Target Position (Formation Morphing Physics)
        drone.group.position.x += (desiredX - drone.group.position.x) * (2.8 * delta);
        drone.group.position.y += (desiredY - drone.group.position.y) * (2.8 * delta);
        drone.group.position.z += (desiredZ - drone.group.position.z) * (2.8 * delta);

        // Banking tilt when moving
        const velocityX = desiredX - drone.group.position.x;
        const velocityZ = desiredZ - drone.group.position.z;
        drone.group.rotation.z = -velocityX * 0.08 + Math.sin(elapsedTime * 1.6 + idx) * 0.04;
        drone.group.rotation.x = velocityZ * 0.08 + Math.cos(elapsedTime * 1.4 + idx) * 0.03;
        drone.group.rotation.y = Math.sin(elapsedTime * 0.6 + idx) * 0.15;

        // Laser cone pulse
        drone.coneMat.opacity = 0.18 + Math.sin(elapsedTime * 3 + idx) * 0.08;

        // Update Ribbon Trail Points
        if (drone.trailPoints) {
          drone.trailPoints.pop();
          drone.trailPoints.unshift(new THREE.Vector3(drone.group.position.x, drone.group.position.y, drone.group.position.z));
          drone.trailGeo.setFromPoints(drone.trailPoints);
        }
      });

      // Update MQTT / ROS 2 Mesh Network Peer-to-Peer Communication Lines
      const meshPositions = [];
      for (let i = 0; i < droneObjects.length; i++) {
        for (let j = i + 1; j < droneObjects.length; j++) {
          const d1 = droneObjects[i];
          const d2 = droneObjects[j];
          if (!d1.isFailing && !d2.isFailing) {
            const dist = d1.group.position.distanceTo(d2.group.position);
            if (dist < 42) {
              meshPositions.push(
                d1.group.position.x, d1.group.position.y, d1.group.position.z,
                d2.group.position.x, d2.group.position.y, d2.group.position.z
              );
            }
          }
        }
      }
      meshLinesGeo.setAttribute('position', new THREE.Float32BufferAttribute(meshPositions, 3));

      // Animate Targets & Persistent Red Emergency Alert Beacon
      const pulse = 1.0 + Math.sin(elapsedTime * 4) * 0.18;
      survivorCore.scale.set(pulse, pulse, pulse);
      fireCone.scale.y = 1.0 + Math.sin(elapsedTime * 6) * 0.15;

      // Rotate emergency cage, pulse vertical laser beam and shockwave ring
      fireCage.rotation.y += 1.8 * delta;
      fireCage.rotation.x += 0.9 * delta;
      fireBeam.material.opacity = 0.35 + Math.sin(elapsedTime * 5.0) * 0.18;
      const heroRingScale = 1.0 + ((elapsedTime * 1.5) % 2.5) * 1.5;
      fireRing.scale.set(heroRingScale, heroRingScale, heroRingScale);
      fireRing.material.opacity = Math.max(0, 0.9 - (heroRingScale - 1.0) * 0.35);
      fireLight.intensity = 3.5 + Math.sin(elapsedTime * 8) * 2.0;

      // Real-Time Distance Calculation & Dynamic Intercept Laser to Closest Swarm Drone
      const emTargetWorldPos = new THREE.Vector3(-24, 0, -10);
      let closestHeroDrone = droneObjects[0];
      let minHeroDist = Infinity;
      droneObjects.forEach(d => {
        if (!d.isFailing) {
          const dDist = d.group.position.distanceTo(emTargetWorldPos);
          if (dDist < minHeroDist) {
            minHeroDist = dDist;
            closestHeroDrone = d;
          }
        }
      });
      if (closestHeroDrone) {
        heroLaserGeo.setFromPoints([
          closestHeroDrone.group.position.clone(),
          new THREE.Vector3(-24, 3.5, -10)
        ]);
        heroLaserMat.opacity = 0.75 + Math.sin(elapsedTime * 10) * 0.25;
      }

      // Auto-orbit camera
      if (isRotating && !isMouseDown) {
        orbitAzimuth += 0.0028;
      }

      // Parallax mouse damping & Camera Orbit centered on swarm (Y=14)
      const parallax = mouseParallaxRef.current;
      const targetCamX = orbitRadius * Math.cos(orbitElevation) * Math.sin(orbitAzimuth) + parallax.x;
      const targetCamZ = orbitRadius * Math.cos(orbitElevation) * Math.cos(orbitAzimuth);
      const targetCamY = 14 + orbitRadius * Math.sin(orbitElevation) + parallax.y;

      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(0, 14, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating]);

  // Failure Injection
  const handleFailDrone = (droneId) => {
    const target = dronesRef.current.find(d => d.id === droneId);
    if (!target) return;

    target.isFailing = true;
    setActiveFailure(`D${droneId} Propulsion Failure Injected`);

    setDronesData(prev => prev.map(d =>
      d.id === droneId ? { ...d, status: 'MALFUNCTION', battery: 14, speed: 0.0, rpm: 0 } : d
    ));

    setFleetStats(prev => ({
      ...prev,
      airborne: Math.max(1, prev.airborne - 1)
    }));
  };

  const handleResetFleet = () => {
    dronesRef.current.forEach(d => {
      d.isFailing = false;
      const targetCoord = formationTargetRef.current.find(c => c.id === d.id);
      if (targetCoord) {
        d.group.position.set(targetCoord.x, targetCoord.y, targetCoord.z);
      }
      d.group.rotation.set(0, 0, 0);
      d.coneMat.opacity = 0.22;
    });

    setActiveFailure(null);
    setFleetStats({
      airborne: 8,
      completion: 46.2,
      avgBattery: 92.8,
      collisions: 0,
      targetsFound: 8,
      totalDistance: 312.4
    });

    setDronesData(prev => prev.map(d => ({
      ...d,
      status: 'NOMINAL',
      battery: d.id === 1 ? 97 : d.id === 3 ? 89 : 94,
      speed: 4.8,
      rpm: 8420
    })));
  };

  const selectedDrone = dronesData.find(d => d.id === selectedDroneId) || dronesData[0];

  return (
    <div className="w-full bg-[#070b14] border border-slate-800/80 font-mono relative overflow-hidden shadow-2xl rounded-2xl">
      {/* 1. Aerospace Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 px-4 sm:px-6 py-3.5 bg-[#0a0f1d]/90 backdrop-blur-xl text-xs gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <strong className="text-xs sm:text-sm font-bold tracking-wider text-white">
              AEROMIND-DL: 8-DRONE AUTONOMOUS SWARM SIMULATION
            </strong>
          </div>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-300 hidden md:inline">
            FORMATION: <strong className="text-cyan-400">{FORMATION_PRESETS[activeFormation].name}</strong>
          </span>
          <span className="text-slate-600 hidden lg:inline">|</span>
          <span className="text-slate-400 hidden lg:inline">
            FLEET STATUS: <strong className="text-emerald-400">{fleetStats.airborne} / 8 AIRBORNE</strong>
          </span>
        </div>

        {/* Formation Switcher Buttons (Pills) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.entries(FORMATION_PRESETS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setActiveFormation(key)}
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeFormation === key
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25 font-black'
                  : 'bg-[#0c1220] text-slate-400 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300'
              }`}
            >
              {key === 'V_FORMATION' ? 'TACTICAL V' : key === 'CIRCLE_PERIMETER' ? '360° CIRCLE' : key === 'GRID_SWEEP' ? 'GRID SWEEP' : 'DISPERSED'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main 3D Canvas Area (Open & Uncluttered Viewport) */}
      <div className="relative w-full h-[540px] sm:h-[620px] bg-[#070b14]">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing bg-[#070b14]" />

        {/* Minimal Non-Intrusive Top Left Live Badge with Emergency Alert */}
        <div className="absolute top-3 left-4 flex flex-wrap items-center gap-2 pointer-events-none z-10">
          <div className="flex items-center gap-2 bg-[#0a0f1d]/90 backdrop-blur-xl border border-cyan-500/30 rounded-full px-4 py-1.5 text-[11px] text-slate-300 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white uppercase tracking-wider">SWARM WEBGL TWIN</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">8 DRONES NOMINAL</span>
          </div>

          <div className="flex items-center gap-2 bg-rose-950/85 backdrop-blur-xl border border-rose-500/60 rounded-full px-3.5 py-1.5 text-[11px] text-rose-200 shadow-lg shadow-rose-950/50">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-bold text-rose-300">RED ALERT S.O.S:</span>
            <span className="text-white">D3 INTERCEPTING</span>
            <span className="text-rose-400 font-mono">(19.4m • ETA 2.8s)</span>
          </div>
        </div>

        {/* Top-Right Quick Failure Testing Triggers */}
        <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800/80 rounded-full p-1 text-xs pointer-events-auto shadow-lg">
          <button
            onClick={() => handleFailDrone(3)}
            title="Inject simulated motor outage into Drone 3"
            className="px-3 py-1 rounded-full border border-rose-500/50 hover:bg-rose-500 hover:text-white text-rose-300 font-bold text-[10px] transition-colors cursor-pointer uppercase"
          >
            KILL D3
          </button>
          <button
            onClick={() => handleFailDrone(5)}
            title="Force Drone 5 into critical 14% battery return-to-base mode"
            className="px-3 py-1 rounded-full border border-amber-500/50 hover:bg-amber-500 hover:text-black text-amber-300 font-bold text-[10px] transition-colors cursor-pointer uppercase"
          >
            DROP D5 (14%)
          </button>
          <button
            onClick={handleResetFleet}
            title="Reset all drones to nominal formation flight"
            className="px-3 py-1 rounded-full bg-white hover:bg-slate-200 text-black font-extrabold text-[10px] transition-colors cursor-pointer uppercase"
          >
            RESTORE
          </button>
        </div>

        {/* Dynamic Failover Alert Banner */}
        {activeFailure && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-rose-950/90 border border-rose-500/50 backdrop-blur-xl rounded-full px-6 py-2 text-xs text-rose-200 flex items-center gap-2 font-mono shadow-2xl animate-bounce z-20">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span><strong>AUTONOMOUS FAILOVER:</strong> {activeFailure}. Unfinished sector tasks reallocated to healthy peers!</span>
          </div>
        )}

        {/* Bottom Left Navigation Hints */}
        <div className="absolute bottom-3 left-4 text-[10px] text-slate-400 bg-[#0a0f1d]/90 backdrop-blur-xl px-3.5 py-1 rounded-full border border-slate-800 pointer-events-none shadow-md">
          <span className="text-cyan-400 font-bold">DRAG:</span> 360° ORBIT • <span className="text-emerald-400 font-bold">SCROLL:</span> ZOOM • <span className="text-amber-400 font-bold">CYAN CONES:</span> SCANNER
        </div>

        {/* Bottom Right Auto-Rotate Switcher */}
        <div className="absolute bottom-3 right-4 bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-full px-3 py-1 text-[10px] pointer-events-auto shadow-md">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 font-bold uppercase cursor-pointer"
          >
            {isRotating ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-cyan-400" />}
            <span>{isRotating ? 'PAUSE ROTATION' : 'RESUME ROTATE'}</span>
          </button>
        </div>
      </div>

      {/* 3. Dedicated Telemetry Deck Under Canvas */}
      <div className="p-5 sm:p-6 bg-[#080d18] border-t border-slate-800/80 space-y-6">
        {/* Top Info Grid: Swarm Fleet Metrics + Selected Drone Inspector + Live Flight Autopilot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Box 1: Swarm Fleet Global Metrics */}
          <div className="p-6 bg-[#0c1220]/90 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">SWARM DRL METRICS</span>
              <span className="text-emerald-400 font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px]">
                MAPPO CTDE
              </span>
            </div>
            <div className="space-y-2.5 text-slate-300 text-xs">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">DISASTER COVERAGE:</span>
                  <strong className="text-emerald-400 font-bold">{fleetStats.completion}%</strong>
                </div>
                <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${fleetStats.completion}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">ACTIVE FLEET:</span>
                <strong className="text-white font-bold">{fleetStats.airborne} / 8 DRONES</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">FLEET AVG BATTERY:</span>
                <strong className="text-cyan-400 font-bold">{fleetStats.avgBattery}%</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">COLLISION ACCIDENTS:</span>
                <strong className="text-emerald-400 font-bold">0.00% (100% SAFE)</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">TARGETS IDENTIFIED:</span>
                <strong className="text-amber-400 font-bold">{fleetStats.targetsFound} / 20 LOCATIONS</strong>
              </div>
            </div>
          </div>

          {/* Box 2: Selected Drone Inspector */}
          <div className="p-6 bg-[#0c1220]/90 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <span className="text-cyan-400 font-bold uppercase tracking-wider truncate max-w-[170px]">INSPECTING: {selectedDrone.name}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                selectedDrone.status === 'MALFUNCTION' 
                  ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40' 
                  : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
              }`}>
                ● {selectedDrone.status}
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">AVIONICS ROLE:</span>
                <strong className="text-white">{selectedDrone.role}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MISSION TASK:</span>
                <strong className="text-amber-400 truncate max-w-[180px]">{selectedDrone.task}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ALTITUDE (AGL):</span>
                <strong className="text-cyan-300">{selectedDrone.alt} m</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MOTOR SPEED:</span>
                <strong className="text-emerald-300">{selectedDrone.rpm} RPM</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">BATTERY RESERVE:</span>
                <strong className={selectedDrone.battery < 25 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {selectedDrone.battery}%
                </strong>
              </div>
            </div>
          </div>

          {/* Box 3: Failover & Mesh Subsystem Status */}
          <div className="p-6 bg-[#0c1220]/90 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <span className="text-purple-400 font-bold uppercase tracking-wider">FAILOVER & MESH</span>
              <span className="text-cyan-400 font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px]">
                ROS 2 / MQTT
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-300 font-sans">
              <div className="text-xs leading-relaxed">
                • <strong className="text-white font-mono">P2P Mesh Network:</strong> Sub-10ms pub/sub exchange on topic <code className="text-cyan-300">aeromind/swarm/telemetry</code>.
              </div>
              <div className="text-xs leading-relaxed">
                • <strong className="text-white font-mono">Continuous Velocity:</strong> Local Actor policy outputs <code className="text-amber-300">a = [vx, vy, vz]</code>.
              </div>
              <div className="text-xs leading-relaxed">
                • <strong className="text-white font-mono">Dynamic Handoff:</strong> Drones under 15% battery trigger automatic peer handover.
              </div>
            </div>
          </div>
        </div>

        {/* 8-Drone Fleet Matrix Cards (Click to Select) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-white uppercase tracking-wider">SWARM ROSTER (CLICK DRONE CARD TO INSPECT):</span>
            <span className="text-cyan-400 font-bold">8 HOMOGENEOUS QUADCOPTERS</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {dronesData.map(drone => (
              <div
                key={drone.id}
                onClick={() => setSelectedDroneId(drone.id)}
                className={`p-3.5 border transition-all cursor-pointer rounded-xl ${
                  drone.status === 'MALFUNCTION'
                    ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                    : selectedDroneId === drone.id
                    ? 'border-cyan-400 bg-cyan-950/50 text-white shadow-lg shadow-cyan-500/20'
                    : 'border-slate-800 bg-[#0c1220]/90 text-slate-300 hover:border-slate-600 hover:bg-[#0f172a]'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className={drone.status === 'MALFUNCTION' ? 'text-rose-400' : 'text-cyan-400'}>
                    {drone.name.split('-')[0]}
                  </span>
                  <span className={drone.battery < 25 ? 'text-rose-400' : 'text-emerald-400'}>
                    {drone.battery}%
                  </span>
                </div>
                <div className="w-full bg-[#1e293b] h-1.5 my-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${drone.battery < 25 ? 'bg-rose-500' : drone.battery < 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${drone.battery}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 truncate uppercase font-sans">
                  {drone.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Footer Bar with Mission Control Launcher */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 px-4 sm:px-6 py-4 bg-[#0a0f1d] text-xs gap-3">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-emerald-400 font-bold">● 8 DRONES REAL-TIME</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">CENTRALIZED TRAINING DECENTRALIZED EXECUTION</span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-cyan-400 hidden md:inline">FASTAPI + PYTORCH 20Hz</span>
        </div>

        {onExploreCaseStudy && (
          <button
            onClick={onExploreCaseStudy}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold uppercase transition-colors text-xs flex items-center gap-1.5 cursor-pointer rounded-full shadow-lg shadow-cyan-500/20"
          >
            <span>[ OPEN 3D DIGITAL TWIN ]</span>
          </button>
        )}
      </div>
    </div>
  );
}
