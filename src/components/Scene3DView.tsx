import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Box,
  Compass,
  Eye,
  EyeOff,
  Flame,
  Maximize2,
  Minimize2,
  Orbit,
  Pause,
  Play,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { SeverityStatus } from '../types/telemetry';
import {
  buildHazardBeacon,
  buildInstancedLandscape,
  buildSatelliteGroup,
  buildTelemetryStation,
  makeHeightSampler,
} from '../three/models';
import {
  createContactShadowTexture,
  createParticleSpriteTexture,
  createSolarArrayTexture,
  createTerrainDetailTextures,
} from '../three/proceduralTextures';

type CameraPreset = 'orbit' | 'satellite' | 'station' | 'top';

// Pre-allocated scratch objects for zero-GC animation ticks
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _satPos = new THREE.Vector3();
const _originLook = new THREE.Vector3(0, 1.2, 0);

const STATUS_HEX: Record<SeverityStatus, number> = {
  critical: 0xfc3d21,
  warning: 0xf97316,
  watch: 0xf59e0b,
  nominal: 0x10b981,
  nodata: 0x64748b,
};

function probeSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    const isSoft = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return isSoft;
  } catch {
    return false;
  }
}

function disposeObjectTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (mat) {
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const m of mats) {
        for (const key of Object.keys(m)) {
          const val = (m as unknown as Record<string, unknown>)[key];
          if (val && (val as THREE.Texture).isTexture) {
            (val as THREE.Texture).dispose();
          }
        }
        m.dispose();
      }
    }
  });
}

function buildRadiusRing(radius: number, groundHeightAt: (x: number, z: number) => number): THREE.LineLoop {
  const segments = 96;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    const y = groundHeightAt(x, z) + 0.14;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: 0x5b9bff,
    transparent: true,
    opacity: 0.7,
  });
  return new THREE.LineLoop(geo, mat);
}

export const Scene3DView: React.FC<{
  onSwitchTo2D?: () => void;
}> = ({ onSwitchTo2D }) => {
  const { location, radiusKm, theme, telemetry, assessment, t } = useApp();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const [preset, setPreset] = useState<CameraPreset>('orbit');
  const [playing, setPlaying] = useState(true);
  const [showSatellite, setShowSatellite] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [hudVisible, setHudVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Live mutable refs read inside the WebGL loop without re-creating the renderer
  const liveStateRef = useRef({
    playing: true,
    showSatellite: true,
    showParticles: true,
    showHazards: true,
    preset: 'orbit' as CameraPreset,
    transitionActive: false,
    theme,
    dischargeRatio: telemetry.flood.data?.dischargeRatio ?? 0.9,
    rainMm: telemetry.weather.data?.next3dRainMm ?? 0,
    aqi: telemetry.air.data?.currentUsAqi ?? 35,
    overallStatus: assessment.overallStatus,
  });

  liveStateRef.current.playing = playing;
  liveStateRef.current.showSatellite = showSatellite;
  liveStateRef.current.showParticles = showParticles;
  liveStateRef.current.showHazards = showHazards;
  liveStateRef.current.theme = theme;
  liveStateRef.current.dischargeRatio = telemetry.flood.data?.dischargeRatio ?? 0.9;
  liveStateRef.current.rainMm = telemetry.weather.data?.next3dRainMm ?? 0;
  liveStateRef.current.aqi = telemetry.air.data?.currentUsAqi ?? 35;
  liveStateRef.current.overallStatus = assessment.overallStatus;

  const sceneHandlesRef = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    hemiLight: THREE.HemisphereLight;
    keyLight: THREE.DirectionalLight;
    terrainMesh: THREE.Mesh;
    terrainGeo: THREE.PlaneGeometry;
    waterMesh: THREE.Mesh;
    waterGeo: THREE.PlaneGeometry;
    waterBaseX: Float32Array;
    waterMat: THREE.MeshStandardMaterial;
    waterUniforms: { uTime: { value: number }; uSurge: { value: number } };
    stationGroup: THREE.Group;
    anemometerHead: THREE.Group;
    statusDomeMat: THREE.MeshPhysicalMaterial;
    landscapeGroup: THREE.Group;
    updateMoistureTint: (w: number | null) => void;
    satelliteGroup: THREE.Group;
    scanCone: THREE.Mesh;
    hazardGroup: THREE.Group;
    ringHolder: THREE.Group;
    particles: THREE.Points;
    particlePositions: Float32Array;
    particleMode: 'rain' | 'haze' | 'clear';
    shadowTex: THREE.CanvasTexture;
    groundHeightAt: (x: number, z: number) => number;
  } | null>(null);

  // Keyboard shortcuts: H toggles HUD, Escape exits expanded full-bleed mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setHudVisible((v) => !v);
      } else if (e.key === 'Escape' && expanded) {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  const handleSelectPreset = (next: CameraPreset) => {
    setPreset(next);
    liveStateRef.current.preset = next;
    liveStateRef.current.transitionActive = true;
  };

  // Initialize Three.js Scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = probeSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglError('WebGL 3D context could not be initialized on this device.');
      return;
    }

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 640, container.clientHeight || 420);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('3D GPU context was paused by the browser.');
    };
    const onContextRestored = () => {
      setWebglError(null);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const initialBg = liveStateRef.current.theme === 'dark' ? 0x091324 : 0xcfe0f5;
    scene.background = new THREE.Color(initialBg);
    scene.fog = new THREE.FogExp2(initialBg, 0.0145);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;

    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || 640) / (container.clientHeight || 420),
      0.1,
      220
    );
    camera.position.set(22, 15.5, 24);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.465;
    controls.minDistance = 7;
    controls.maxDistance = 58;
    controls.update();

    controls.addEventListener('start', () => {
      liveStateRef.current.transitionActive = false;
    });

    // Lighting rig: warm key + cool hemisphere + subtle orbital rim light
    const hemiLight = new THREE.HemisphereLight(0x8fb8ff, 0x263248, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.0);
    keyLight.position.set(22, 32, 18);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 90;
    keyLight.shadow.camera.left = -26;
    keyLight.shadow.camera.right = 26;
    keyLight.shadow.camera.top = 26;
    keyLight.shadow.camera.bottom = -26;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x5b9bff, 0.55);
    rimLight.position.set(-20, 14, -22);
    scene.add(rimLight);

    // Procedural Textures (zero external URLs)
    const solarTex = createSolarArrayTexture(maxAnisotropy);
    const { colorMap: terrainColorTex, roughnessMap: terrainRoughTex } =
      createTerrainDetailTextures(maxAnisotropy);
    const shadowTex = createContactShadowTexture();
    const particleTex = createParticleSpriteTexture();

    // Terrain Mesh
    const groundHeightAt = makeHeightSampler(location.lat, location.lon);
    const terrainGeo = new THREE.PlaneGeometry(72, 72, 88, 88);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainColorTex,
      roughnessMap: terrainRoughTex,
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.02,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Procedural River Water Ribbon with custom onBeforeCompile ripple displacement
    const waterUniforms = { uTime: { value: 0 }, uSurge: { value: 0.35 } };
    const waterGeo = new THREE.PlaneGeometry(9.5, 72, 16, 72);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1665a8,
      roughness: 0.14,
      metalness: 0.28,
      transparent: true,
      opacity: 0.86,
    });
    waterMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = waterUniforms.uTime;
      shader.uniforms.uSurge = waterUniforms.uSurge;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uTime;
           uniform float uSurge;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float wave1 = sin(position.x * 0.85 + uTime * 2.2) * 0.045;
           float wave2 = cos(position.z * 0.65 - uTime * 1.8) * 0.04;
           transformed.y += wave1 + wave2 + uSurge;`
        );
    };
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    const wPosInit = waterGeo.attributes.position as THREE.BufferAttribute;
    const waterBaseX = new Float32Array(wPosInit.count);
    for (let i = 0; i < wPosInit.count; i++) {
      waterBaseX[i] = wPosInit.getX(i);
    }

    // Central Ground Telemetry Station
    const { group: stationGroup, anemometerHead, statusDomeMat } = buildTelemetryStation(
      shadowTex,
      solarTex
    );
    stationGroup.position.set(0, groundHeightAt(0, 0), 0);
    scene.add(stationGroup);

    // Instanced Trees & Rocks
    const { group: landscapeGroup, updateMoistureTint } = buildInstancedLandscape(
      groundHeightAt,
      telemetry.power.data?.latestGwetRoot ?? null
    );
    scene.add(landscapeGroup);

    // Earth-Observing Satellite
    const { group: satelliteGroup, scanCone } = buildSatelliteGroup(solarTex);
    satelliteGroup.position.set(0, 13.5, 0);
    scene.add(satelliteGroup);

    // Hazard Beacons + Radius Ring Holders
    const hazardGroup = new THREE.Group();
    scene.add(hazardGroup);

    const ringHolder = new THREE.Group();
    ringHolder.add(buildRadiusRing(20, groundHeightAt));
    scene.add(ringHolder);

    // Atmospheric Particles (Precipitation or Air Quality Haze)
    const particleCount = 360;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 46;
      particlePositions[i * 3 + 1] = Math.random() * 18 + 0.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 46;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      map: particleTex,
      size: 0.36,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      color: 0x93c5fd,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    sceneHandlesRef.current = {
      scene,
      renderer,
      camera,
      controls,
      hemiLight,
      keyLight,
      terrainMesh,
      terrainGeo,
      waterMesh,
      waterGeo,
      waterBaseX,
      waterMat,
      waterUniforms,
      stationGroup,
      anemometerHead,
      statusDomeMat,
      landscapeGroup,
      updateMoistureTint,
      satelliteGroup,
      scanCone,
      hazardGroup,
      ringHolder,
      particles,
      particlePositions,
      particleMode: 'clear',
      shadowTex,
      groundHeightAt,
    };

    // ResizeObserver updates aspect ratio cleanly when panel or fullscreen changes
    const ro = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    ro.observe(container);

    // GPU-sync-aware animation pacing for SwiftShader / software GL fallback
    let rafId = 0;
    let pollTimeout = 0;
    let disposed = false;
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const hasFence = typeof gl.fenceSync === 'function';

    const afterDraw = (cb: FrameRequestCallback) => {
      if (disposed) return;
      if (!isSoftwareGl) {
        rafId = requestAnimationFrame(cb);
        return;
      }
      if (!hasFence) {
        pollTimeout = window.setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(cb);
        }, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        pollTimeout = window.setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(cb);
        }, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.clientWaitSync(sync, 0, 0);
        if (status === gl.WAIT_FAILED || status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
          gl.deleteSync(sync);
          pollTimeout = window.setTimeout(() => {
            if (!disposed) rafId = requestAnimationFrame(cb);
          }, 80);
        } else {
          pollTimeout = window.setTimeout(poll, 24);
        }
      };
      pollTimeout = window.setTimeout(poll, 16);
    };

    let lastTime = performance.now();
    let simTime = 0;

    const tick = (now: number) => {
      if (disposed) return;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const state = liveStateRef.current;

      if (state.playing) {
        simTime += dt;
      }

      // River water shader time & surge elevation
      waterUniforms.uTime.value = simTime;
      const targetSurge = THREE.MathUtils.clamp(state.dischargeRatio, 0.3, 2.8) * 0.48;
      waterUniforms.uSurge.value = THREE.MathUtils.damp(
        waterUniforms.uSurge.value,
        targetSurge,
        3.0,
        dt
      );

      // Station anemometer rotation & status beacon color
      anemometerHead.rotation.y += dt * (state.playing ? 3.2 : 0.6);
      statusDomeMat.color.setHex(STATUS_HEX[state.overallStatus]);
      statusDomeMat.emissive.setHex(STATUS_HEX[state.overallStatus]);

      // Satellite orbit pass & nadir scan sweep
      satelliteGroup.visible = state.showSatellite;
      if (state.showSatellite) {
        const orbitAngle = simTime * 0.28;
        const satX = Math.cos(orbitAngle) * 14.5;
        const satZ = Math.sin(orbitAngle) * 10.5;
        const satY = 13.5 + Math.sin(orbitAngle * 2) * 0.65;
        satelliteGroup.position.set(satX, satY, satZ);
        _satPos.set(-Math.sin(orbitAngle) * 14.5, satY, Math.cos(orbitAngle) * 10.5);
        satelliteGroup.lookAt(_satPos);
        scanCone.rotation.z = Math.sin(simTime * 1.4) * 0.16;
      }

      // Hazard diamond idle rotation
      hazardGroup.visible = state.showHazards;
      if (state.showHazards) {
        for (let i = 0; i < hazardGroup.children.length; i++) {
          const diamond = hazardGroup.children[i].getObjectByName('beaconDiamond');
          if (diamond) {
            diamond.rotation.y = simTime * 1.6 + i;
            diamond.position.y = 1.75 + Math.sin(simTime * 2.4 + i) * 0.12;
          }
        }
      }

      // Precipitation / Haze particle dynamics
      const handles = sceneHandlesRef.current;
      const showRain = state.rainMm >= 2;
      const showHaze = !showRain && state.aqi >= 75;
      particles.visible = state.showParticles && (showRain || showHaze);
      if (particles.visible && handles) {
        const pArr = handles.particlePositions;
        const pMat = particles.material as THREE.PointsMaterial;
        if (showRain) {
          pMat.color.setHex(0x7dd3fc);
          pMat.size = 0.28;
          pMat.opacity = 0.72;
        } else {
          pMat.color.setHex(0xfbbf24);
          pMat.size = 0.55;
          pMat.opacity = 0.35;
        }

        const speedY = showRain ? -9.5 : 0.45;
        const driftX = showRain ? -1.1 : 0.85;
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          pArr[idx] += driftX * dt;
          pArr[idx + 1] += speedY * dt;
          if (showRain && pArr[idx + 1] < 0.2) {
            pArr[idx + 1] = 17.5;
            pArr[idx] = (Math.random() - 0.5) * 46;
            pArr[idx + 2] = (Math.random() - 0.5) * 46;
          } else if (!showRain && pArr[idx + 1] > 14) {
            pArr[idx + 1] = 0.8;
          }
          if (pArr[idx] < -23) pArr[idx] = 23;
          if (pArr[idx] > 23) pArr[idx] = -23;
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }

      // Smooth damped camera preset transitions
      if (state.transitionActive) {
        if (state.preset === 'orbit') {
          _camGoal.set(22, 15.5, 24);
          _lookGoal.copy(_originLook);
        } else if (state.preset === 'satellite') {
          _camGoal.set(
            satelliteGroup.position.x * 0.65 + 7,
            satelliteGroup.position.y + 3.8,
            satelliteGroup.position.z * 0.65 + 8
          );
          _lookGoal.copy(satelliteGroup.position);
        } else if (state.preset === 'station') {
          const sy = groundHeightAt(0, 0);
          _camGoal.set(5.4, sy + 3.2, 6.2);
          _lookGoal.set(0, sy + 1.5, 0);
        } else if (state.preset === 'top') {
          _camGoal.set(0.01, 36, 0.01);
          _lookGoal.set(0, 0, 0);
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, 5.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, 5.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, 5.5, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _lookGoal.x, 5.5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _lookGoal.y, 5.5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _lookGoal.z, 5.5, dt);

        if (camera.position.distanceTo(_camGoal) < 0.08) {
          state.transitionActive = false;
        }
      } else if (state.playing && state.preset === 'orbit' && !isSoftwareGl) {
        // Gentle orbital turntable drift while viewing orbit preset
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.45;
      } else {
        controls.autoRotate = false;
      }

      controls.update();
      renderer.render(scene, camera);
      afterDraw(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(pollTimeout);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      disposeObjectTree(scene);
      envRT.dispose();
      roomEnv.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneHandlesRef.current = null;
    };
  }, []);

  // Sync theme sky & horizon fog without rebuilding scene
  useEffect(() => {
    const h = sceneHandlesRef.current;
    if (!h) return;
    const bgHex = theme === 'dark' ? 0x091324 : 0xcfe0f5;
    h.scene.background = new THREE.Color(bgHex);
    h.scene.fog = new THREE.FogExp2(bgHex, 0.0145);
    h.hemiLight.intensity = theme === 'dark' ? 0.72 : 0.92;
    h.keyLight.intensity = theme === 'dark' ? 2.0 : 2.15;
  }, [theme]);

  // Rebuild terrain heights, vertex colors, instanced trees, station elevation, and radius ring on location/moisture/radius change
  const gwetRoot = telemetry.power.data?.latestGwetRoot ?? null;
  useEffect(() => {
    const h = sceneHandlesRef.current;
    if (!h) return;

    const sampler = makeHeightSampler(location.lat, location.lon);
    h.groundHeightAt = sampler;

    const pos = h.terrainGeo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const wetness = gwetRoot ?? 0.5;

    const cLow = new THREE.Color(0x4b5563);
    const cDry = new THREE.Color(0x8a7954);
    const cLush = new THREE.Color(0x2e6442);
    const cRidge = new THREE.Color(0x64748b);
    const cTmp = new THREE.Color();

    const cGrass = cDry.clone().lerp(cLush, THREE.MathUtils.clamp((wetness - 0.15) / 0.65, 0, 1));

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = sampler(x, z);
      pos.setY(i, y);

      if (y < -0.5) {
        cTmp.copy(cLow).lerp(cGrass, THREE.MathUtils.clamp((y + 1.5) / 1.0, 0, 1));
      } else if (y < 2.1) {
        cTmp.copy(cGrass);
      } else {
        cTmp.copy(cGrass).lerp(cRidge, THREE.MathUtils.clamp((y - 2.1) / 3.2, 0, 1));
      }
      colors[i * 3] = cTmp.r;
      colors[i * 3 + 1] = cTmp.g;
      colors[i * 3 + 2] = cTmp.b;
    }
    pos.needsUpdate = true;
    h.terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    h.terrainGeo.computeVertexNormals();

    // Shape river ribbon along carved riverbed channel for current coordinates
    const seedA = Math.sin(location.lat * 12.9898 + location.lon * 78.233) * 0.85;
    const wPos = h.waterGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < wPos.count; i++) {
      const z = wPos.getZ(i);
      const centerX = Math.sin(z * 0.12 + seedA * 0.5) * 4.5 + 5.2;
      const x = centerX + h.waterBaseX[i];
      const bedY = sampler(centerX, z);
      wPos.setX(i, x);
      wPos.setY(i, bedY + 0.12);
    }
    wPos.needsUpdate = true;
    h.waterGeo.computeVertexNormals();

    h.stationGroup.position.set(0, sampler(0, 0), 0);
    h.updateMoistureTint(gwetRoot);

    // Update radius ring on terrain
    while (h.ringHolder.children.length > 0) {
      const child = h.ringHolder.children[0];
      disposeObjectTree(child);
      h.ringHolder.remove(child);
    }
    const visualRingRadius = radiusKm === 25 ? 13 : radiusKm === 50 ? 20 : 26;
    h.ringHolder.add(buildRadiusRing(visualRingRadius, sampler));
  }, [location.lat, location.lon, gwetRoot, radiusKm]);

  // Rebuild hazard beacons from real FIRMS + EONET events
  const firmsDetections = telemetry.firms.data?.detections || [];
  const eonetEvents = telemetry.eonet.data || [];
  useEffect(() => {
    const h = sceneHandlesRef.current;
    if (!h) return;

    while (h.hazardGroup.children.length > 0) {
      const child = h.hazardGroup.children[0];
      disposeObjectTree(child);
      h.hazardGroup.remove(child);
    }

    const scaleKmToScene = 24 / Math.max(radiusKm, 25);

    const limitedFires = firmsDetections.slice(0, 14);
    for (const det of limitedFires) {
      const r = THREE.MathUtils.clamp(det.distanceKm * scaleKmToScene, 2.6, 27);
      const rad = (det.bearingDeg * Math.PI) / 180;
      const x = Math.sin(rad) * r;
      const z = -Math.cos(rad) * r;
      const y = h.groundHeightAt(x, z);
      const colorHex = det.frp >= 40 ? 0xfc3d21 : det.frp >= 15 ? 0xf97316 : 0xf59e0b;
      h.hazardGroup.add(buildHazardBeacon(x, y, z, colorHex, h.shadowTex));
    }

    const limitedEonet = eonetEvents.slice(0, 8);
    for (const ev of limitedEonet) {
      const r = THREE.MathUtils.clamp(ev.distanceKm * scaleKmToScene, 3.2, 27.5);
      const rad = (ev.bearingDeg * Math.PI) / 180;
      const x = Math.sin(rad) * r;
      const z = -Math.cos(rad) * r;
      const y = h.groundHeightAt(x, z);
      const colorHex =
        ev.categoryId === 'floods'
          ? 0x3b82f6
          : ev.categoryId === 'wildfires'
          ? 0xfc3d21
          : 0xf59e0b;
      h.hazardGroup.add(buildHazardBeacon(x, y, z, colorHex, h.shadowTex));
    }
  }, [firmsDetections, eonetEvents, radiusKm, location.lat, location.lon]);

  const hazardCount = useMemo(
    () => Math.min(14, firmsDetections.length) + Math.min(8, eonetEvents.length),
    [firmsDetections.length, eonetEvents.length]
  );

  return (
    <div
      dir="ltr"
      className={
        expanded
          ? 'fixed inset-0 z-[1200] h-screen w-screen overflow-hidden bg-[var(--bg)]'
          : 'relative h-full w-full overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--bg)]'
      }
    >
      {/* Dedicated WebGL Mount (strictly isolated from React HUD siblings) */}
      <div ref={mountRef} className="h-full w-full" aria-label="3D Watershed & Orbital Telemetry Scene" />

      {/* WebGL Error Fallback */}
      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--surface)] p-6 text-center">
          <Box className="h-8 w-8 text-[var(--interactive)]" aria-hidden="true" />
          <p className="max-w-sm text-[13px] text-[var(--text)]">{webglError}</p>
          {onSwitchTo2D && (
            <button
              type="button"
              onClick={onSwitchTo2D}
              className="rounded-full border border-[var(--interactive)] bg-[var(--primary)] px-4 py-1.5 text-[12px] font-medium text-white"
            >
              {t.mapLayers.mapToggle}
            </button>
          )}
        </div>
      )}

      {/* Top-Right Compact Action Cluster (HUD toggle + Expand + 2D Switch) — zero backdrop-filter */}
      <div className="absolute end-3 top-3 z-20 flex items-center gap-1.5">
        {onSwitchTo2D && !expanded && (
          <button
            type="button"
            onClick={onSwitchTo2D}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] font-medium text-[var(--text)] shadow-sm hover:border-[var(--interactive)]"
          >
            <span>{t.mapLayers.mapToggle}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setHudVisible((v) => !v)}
          title="Toggle 3D Controls (H)"
          aria-label="Toggle 3D Controls"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] shadow-sm hover:border-[var(--interactive)]"
        >
          {hudVisible ? (
            <EyeOff className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          title={expanded ? t.mapLayers.exitExpand3D : t.mapLayers.expand3D}
          aria-label={expanded ? t.mapLayers.exitExpand3D : t.mapLayers.expand3D}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 text-[12px] font-medium text-[var(--text)] shadow-sm hover:border-[var(--interactive)]"
        >
          {expanded ? (
            <>
              <Minimize2 className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
              <span className="hidden sm:inline">{t.mapLayers.exitExpand3D}</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 text-[var(--interactive)]" aria-hidden="true" />
              <span className="hidden sm:inline">{t.mapLayers.expand3D}</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible Floating Bottom Dock (<= 15% viewport height, solid surface, zero backdrop-filter) */}
      {hudVisible && !webglError && (
        <div className="pointer-events-none absolute bottom-3 end-3 start-3 z-20 flex justify-center">
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 shadow-md">
            {/* Camera Presets */}
            {(
              [
                ['orbit', 'Orbit', Orbit],
                ['satellite', 'Satellite', Radio],
                ['station', 'Station', Compass],
                ['top', 'Top', Box],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectPreset(id)}
                className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors duration-150 ${
                  preset === id
                    ? 'border-[var(--interactive)] bg-[var(--primary)] text-white'
                    : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}

            <span className="mx-0.5 h-4 w-px bg-[var(--line)]" aria-hidden="true" />

            {/* Simulation Play/Pause */}
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause 3D pass' : 'Resume 3D pass'}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 text-[11px] font-medium text-[var(--text)] hover:border-[var(--interactive)]"
            >
              {playing ? (
                <Pause className="h-3 w-3 text-[var(--interactive)]" aria-hidden="true" />
              ) : (
                <Play className="h-3 w-3 text-[var(--interactive)]" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{playing ? 'Pause' : 'Play'}</span>
            </button>

            {/* Layer Toggles */}
            <button
              type="button"
              onClick={() => setShowSatellite((s) => !s)}
              className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[11px] font-medium ${
                showSatellite
                  ? 'border-[var(--interactive)] bg-[var(--primary)] text-white'
                  : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]'
              }`}
            >
              <Radio className="h-3 w-3" aria-hidden="true" />
              <span>VIIRS Pass</span>
            </button>

            <button
              type="button"
              onClick={() => setShowParticles((s) => !s)}
              className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[11px] font-medium ${
                showParticles
                  ? 'border-[var(--interactive)] bg-[var(--primary)] text-white'
                  : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]'
              }`}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              <span>Atmos</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHazards((s) => !s)}
              className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[11px] font-medium ${
                showHazards
                  ? 'border-[var(--interactive)] bg-[var(--primary)] text-white'
                  : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]'
              }`}
            >
              <Flame className="h-3 w-3" aria-hidden="true" />
              <span>Beacons ({hazardCount})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
