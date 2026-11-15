import * as THREE from 'three';

/**
 * Deterministic regional terrain height function seeded by coordinates.
 * Carves a subtle watershed river channel near x = sin(z * 0.14) * 3.5 so the
 * central telemetry station sits on a safe elevated bench above the channel.
 */
export function makeHeightSampler(lat: number, lon: number) {
  const seedA = Math.sin(lat * 12.9898 + lon * 78.233) * 0.85;
  const seedB = Math.cos(lat * 39.346 + lon * 11.135) * 0.85;

  return function groundHeightAt(x: number, z: number): number {
    const distFromOrigin = Math.sqrt(x * x + z * z);
    // Broad valley ridges rising toward outer horizon
    const ridge1 = Math.sin(x * 0.11 + seedA) * Math.cos(z * 0.1 + seedB) * 2.4;
    const ridge2 = Math.sin(x * 0.24 - z * 0.19 + seedB) * 0.85;
    const basinLift = Math.min(5.2, Math.pow(distFromOrigin / 26, 2) * 3.4);

    // Winding river valley trough offset slightly from station (0,0)
    const riverCenterX = Math.sin(z * 0.12 + seedA * 0.5) * 4.5 + 5.2;
    const riverDist = Math.abs(x - riverCenterX);
    const channelCarve = Math.exp(-(riverDist * riverDist) / 14.0) * 2.1;

    // Flatten immediate pad around station (0,0) so station sits perfectly flush
    const padFlatten = Math.exp(-(distFromOrigin * distFromOrigin) / 9.0);
    const rawHeight = ridge1 + ridge2 + basinLift - channelCarve;
    return rawHeight * (1 - padFlatten * 0.78) + 0.35 * padFlatten;
  };
}

/**
 * Builds a 10-part Earth-observing spacecraft (Suomi NPP / VIIRS inspired)
 * with beveled octagonal bus, LatheGeometry optical barrel & S-band dish,
 * TubeGeometry booms, procedural solar wings, and nadir scan-swath cone.
 */
export function buildSatelliteGroup(solarTex: THREE.CanvasTexture): {
  group: THREE.Group;
  scanCone: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'EarthObservingSatellite';

  // Materials with distinct roughness/metalness contrast (>= 0.25 delta between adjacent parts)
  const goldFoilMat = new THREE.MeshPhysicalMaterial({
    color: 0xd99b26,
    roughness: 0.28,
    metalness: 0.92,
    anisotropy: 0.65,
    clearcoat: 0.2,
  });

  const busAlloyMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.45,
    metalness: 0.82,
  });

  const matteObsidianMat = new THREE.MeshStandardMaterial({
    color: 0x161f30,
    roughness: 0.82,
    metalness: 0.18,
  });

  const sapphireLensMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e56a0,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const solarWingMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    roughness: 0.3,
    metalness: 0.55,
  });

  // 1. Primary silhouette: Beveled octagonal spacecraft bus
  const octShape = new THREE.Shape();
  const radius = 0.72;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) octShape.moveTo(px, py);
    else octShape.lineTo(px, py);
  }
  octShape.closePath();

  const busGeo = new THREE.ExtrudeGeometry(octShape, {
    depth: 1.35,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  busGeo.center();
  busGeo.rotateX(Math.PI / 2);
  const busMesh = new THREE.Mesh(busGeo, goldFoilMat);
  busMesh.castShadow = true;
  group.add(busMesh);

  // 2. Upper structural titanium collar
  const collarGeo = new THREE.CylinderGeometry(0.68, 0.74, 0.24, 16);
  const collarMesh = new THREE.Mesh(collarGeo, busAlloyMat);
  collarMesh.position.y = 0.78;
  group.add(collarMesh);

  // 3. VIIRS Nadir optical telescope baffle (LatheGeometry)
  const bafflePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.36, 0.0),
    new THREE.Vector2(0.38, -0.22),
    new THREE.Vector2(0.3, -0.45),
    new THREE.Vector2(0.34, -0.58),
    new THREE.Vector2(0.24, -0.58),
    new THREE.Vector2(0.24, -0.15),
    new THREE.Vector2(0.0, -0.15),
  ];
  const baffleGeo = new THREE.LatheGeometry(bafflePts, 24);
  const baffleMesh = new THREE.Mesh(baffleGeo, matteObsidianMat);
  baffleMesh.position.y = -0.68;
  group.add(baffleMesh);

  // 4. Sapphire primary optical lens
  const lensGeo = new THREE.SphereGeometry(0.23, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
  lensGeo.rotateX(Math.PI);
  const lensMesh = new THREE.Mesh(lensGeo, sapphireLensMat);
  lensMesh.position.y = -0.95;
  group.add(lensMesh);

  // 5 & 6. Dual articulated solar array booms (TubeGeometry) + beveled solar panels
  const wingGeo = new THREE.BoxGeometry(2.6, 0.04, 1.05);
  const frameGeo = new THREE.BoxGeometry(2.68, 0.06, 1.12);

  for (const side of [-1, 1] as const) {
    const boomCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.68, 0.1, 0),
      new THREE.Vector3(side * 1.15, 0.12, 0),
      new THREE.Vector3(side * 1.45, 0.1, 0),
    ]);
    const boomGeo = new THREE.TubeGeometry(boomCurve, 10, 0.055, 8, false);
    const boomMesh = new THREE.Mesh(boomGeo, busAlloyMat);
    group.add(boomMesh);

    const wingHolder = new THREE.Group();
    wingHolder.position.set(side * 2.75, 0.1, 0);
    wingHolder.rotation.x = 0.25;

    const frameMesh = new THREE.Mesh(frameGeo, matteObsidianMat);
    const panelMesh = new THREE.Mesh(wingGeo, solarWingMat);
    panelMesh.position.y = 0.015;
    panelMesh.castShadow = true;

    wingHolder.add(frameMesh, panelMesh);
    group.add(wingHolder);
  }

  // 7. High-gain S-band parabolic dish (LatheGeometry + feed mast)
  const dishPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.16, 0.03),
    new THREE.Vector2(0.32, 0.11),
    new THREE.Vector2(0.42, 0.22),
  ];
  const dishGeo = new THREE.LatheGeometry(dishPts, 24);
  const dishGroup = new THREE.Group();
  dishGroup.position.set(0, 1.02, 0.28);
  dishGroup.rotation.x = 0.45;
  const dishMesh = new THREE.Mesh(dishGeo, busAlloyMat);
  const feedStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.34, 8), matteObsidianMat);
  feedStem.position.y = 0.17;
  const feedTip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.08, 12), goldFoilMat);
  feedTip.position.y = 0.34;
  dishGroup.add(dishMesh, feedStem, feedTip);
  group.add(dishGroup);

  // 8. Twin star-tracker optical hoods
  const trackerGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.28, 12);
  for (const side of [-1, 1] as const) {
    const tracker = new THREE.Mesh(trackerGeo, matteObsidianMat);
    tracker.position.set(side * 0.38, 0.94, -0.35);
    tracker.rotation.set(-0.45, 0, side * -0.3);
    group.add(tracker);
  }

  // 9. Reaction control thruster nozzles (4 corners)
  const nozzlePts = [
    new THREE.Vector2(0.02, 0.0),
    new THREE.Vector2(0.06, -0.14),
    new THREE.Vector2(0.04, -0.14),
    new THREE.Vector2(0.015, 0.0),
  ];
  const nozzleGeo = new THREE.LatheGeometry(nozzlePts, 10);
  for (const sx of [-1, 1] as const) {
    for (const sz of [-1, 1] as const) {
      const nozzle = new THREE.Mesh(nozzleGeo, busAlloyMat);
      nozzle.position.set(sx * 0.56, -0.68, sz * 0.56);
      group.add(nozzle);
    }
  }

  // 10. Volumetric nadir scan-swath cone
  const coneGeo = new THREE.ConeGeometry(4.2, 13.5, 32, 1, true);
  coneGeo.translate(0, -6.75, 0);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x5b9bff,
    transparent: true,
    opacity: 0.11,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const scanCone = new THREE.Mesh(coneGeo, coneMat);
  scanCone.position.y = -1.0;
  group.add(scanCone);

  return { group, scanCone };
}

/**
 * Builds an 8-part Ground Telemetry & Weather Station pivoted at bottom-center (y=0).
 */
export function buildTelemetryStation(
  shadowTex: THREE.CanvasTexture,
  solarTex: THREE.CanvasTexture
): {
  group: THREE.Group;
  anemometerHead: THREE.Group;
  statusDomeMat: THREE.MeshPhysicalMaterial;
} {
  const group = new THREE.Group();
  group.name = 'GroundTelemetryStation';

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.92,
    metalness: 0.0,
  });
  const mastAlloyMat = new THREE.MeshStandardMaterial({
    color: 0xdbe3ef,
    roughness: 0.35,
    metalness: 0.85,
  });
  const enclosureMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.65,
    metalness: 0.25,
  });
  const solarMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    roughness: 0.3,
    metalness: 0.5,
  });
  const statusDomeMat = new THREE.MeshPhysicalMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0.1,
    clearcoat: 1.0,
  });

  // 1. Soft radial contact shadow plane at y = 0.02
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  group.add(shadowPlane);

  // 2. Hexagonal concrete pad (bottom flush at y=0)
  const hexShape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 0.95;
    const y = Math.sin(a) * 0.95;
    if (i === 0) hexShape.moveTo(x, y);
    else hexShape.lineTo(x, y);
  }
  hexShape.closePath();
  const padGeo = new THREE.ExtrudeGeometry(hexShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  padGeo.rotateX(-Math.PI / 2);
  const padMesh = new THREE.Mesh(padGeo, concreteMat);
  padMesh.position.y = 0.04;
  padMesh.castShadow = true;
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // 3. Primary vertical telemetry mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.75, 12), mastAlloyMat);
  mast.position.y = 1.55;
  mast.castShadow = true;
  group.add(mast);

  // 4. NEMA telemetry enclosure box
  const boxShape = new THREE.Shape();
  boxShape.moveTo(-0.24, -0.28);
  boxShape.lineTo(0.24, -0.28);
  boxShape.lineTo(0.24, 0.28);
  boxShape.lineTo(-0.24, 0.28);
  boxShape.closePath();
  const boxGeo = new THREE.ExtrudeGeometry(boxShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  boxGeo.center();
  const enclosure = new THREE.Mesh(boxGeo, enclosureMat);
  enclosure.position.set(0, 1.35, 0.16);
  enclosure.castShadow = true;
  group.add(enclosure);

  // 5. Station solar panel
  const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 0.56), solarMat);
  solarPanel.position.set(0, 2.08, 0.26);
  solarPanel.rotation.x = 0.58;
  solarPanel.castShadow = true;
  group.add(solarPanel);

  // 6. Tipping-bucket rain gauge funnel (LatheGeometry) on side arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), mastAlloyMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0, 2.48, 0);
  group.add(arm);

  const funnelPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.11, 0.0),
    new THREE.Vector2(0.11, 0.18),
    new THREE.Vector2(0.16, 0.26),
    new THREE.Vector2(0.13, 0.26),
    new THREE.Vector2(0.09, 0.18),
    new THREE.Vector2(0.0, 0.18),
  ];
  const rainGauge = new THREE.Mesh(new THREE.LatheGeometry(funnelPts, 18), mastAlloyMat);
  rainGauge.position.set(-0.46, 2.5, 0);
  group.add(rainGauge);

  // 7. Three-cup rotating anemometer on right arm
  const anemometerHead = new THREE.Group();
  anemometerHead.position.set(0.46, 2.58, 0);
  const cupGeo = new THREE.SphereGeometry(0.055, 12, 8, 0, Math.PI);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const armHolder = new THREE.Group();
    armHolder.rotation.y = angle;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6), mastAlloyMat);
    spoke.rotation.z = Math.PI / 2;
    spoke.position.x = 0.11;
    const cup = new THREE.Mesh(cupGeo, enclosureMat);
    cup.position.x = 0.22;
    cup.rotation.y = Math.PI / 2;
    armHolder.add(spoke, cup);
    anemometerHead.add(armHolder);
  }
  group.add(anemometerHead);

  // 8. Top status beacon dome
  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.12, 16), enclosureMat);
  beaconBase.position.y = 2.95;
  const beaconDome = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), statusDomeMat);
  beaconDome.position.y = 3.04;
  group.add(beaconBase, beaconDome);

  return { group, anemometerHead, statusDomeMat };
}

/**
 * Builds an instanced conifer/scrub vegetation cluster and rock scatter grounded on terrain.
 */
export function buildInstancedLandscape(
  groundHeightAt: (x: number, z: number) => number,
  gwetRoot: number | null
): {
  group: THREE.Group;
  updateMoistureTint: (wetness: number | null) => void;
  updateHeights: (sampler: (x: number, z: number) => number) => void;
} {
  const group = new THREE.Group();
  group.name = 'InstancedLandscape';

  const treeCount = 48;
  const rockCount = 32;

  const trunkGeo = new THREE.CylinderGeometry(0.07, 0.12, 0.65, 7);
  trunkGeo.translate(0, 0.325, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.9,
    metalness: 0.0,
  });

  const canopyGeo = new THREE.ConeGeometry(0.48, 1.35, 7);
  canopyGeo.translate(0, 1.12, 0);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.0,
  });

  const rockGeo = new THREE.DodecahedronGeometry(0.38, 0);
  rockGeo.translate(0, 0.18, 0);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.04,
  });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCount);
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  trunks.castShadow = true;
  canopies.castShadow = true;
  canopies.receiveShadow = true;
  rocks.castShadow = true;
  rocks.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  // Deterministic placement avoiding central station pad & river trough
  let seed = 4201;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const treePlacements: Array<{ x: number; z: number; scale: number; yScale: number; rotY: number; factor: number }> = [];
  for (let i = 0; i < treeCount; i++) {
    let x = 0;
    let z = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const angle = rand() * Math.PI * 2;
      const dist = 4.2 + rand() * 21.0;
      x = Math.cos(angle) * dist;
      z = Math.sin(angle) * dist;
      if (Math.abs(x - 5.2) > 2.2) break;
    }
    const scale = 0.85 + rand() * 0.35; // +-15% variation
    treePlacements.push({
      x,
      z,
      scale,
      yScale: scale * (0.9 + rand() * 0.25),
      rotY: rand() * Math.PI * 2,
      factor: rand(),
    });
  }

  const rockPlacements: Array<{ x: number; z: number; s: number; rx: number; ry: number; rz: number }> = [];
  for (let i = 0; i < rockCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 3.2 + rand() * 22.0;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const s = 0.75 + rand() * 0.5;
    rockPlacements.push({
      x,
      z,
      s,
      rx: rand() * 0.4,
      ry: rand() * Math.PI * 2,
      rz: rand() * 0.4,
    });

    const shade = 0.42 + rand() * 0.22;
    color.setRGB(shade, shade + 0.02, shade + 0.05);
    rocks.setColorAt(i, color);
  }
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;

  function updateHeights(sampler: (x: number, z: number) => number) {
    for (let i = 0; i < treeCount; i++) {
      const t = treePlacements[i];
      const y = sampler(t.x, t.z);
      dummy.position.set(t.x, y, t.z);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(t.scale, t.yScale, t.scale);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      canopies.setMatrixAt(i, dummy.matrix);
    }

    for (let i = 0; i < rockCount; i++) {
      const r = rockPlacements[i];
      const y = sampler(r.x, r.z);
      dummy.position.set(r.x, y - 0.05, r.z);
      dummy.rotation.set(r.rx, r.ry, r.rz);
      dummy.scale.set(r.s * 1.2, r.s * 0.72, r.s);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }

    trunks.instanceMatrix.needsUpdate = true;
    canopies.instanceMatrix.needsUpdate = true;
    rocks.instanceMatrix.needsUpdate = true;
    trunks.computeBoundingSphere();
    canopies.computeBoundingSphere();
    rocks.computeBoundingSphere();
  }

  updateHeights(groundHeightAt);

  group.add(trunks, canopies, rocks);

  function updateMoistureTint(wetness: number | null) {
    const w = wetness ?? 0.5;
    // Healthy emerald when wet, dry olive/ochre when drought-stressed
    const dryColor = new THREE.Color(0x9a7b3e);
    const healthyColor = new THREE.Color(0x2a6f47);
    const lushColor = new THREE.Color(0x1f7a5a);

    const base =
      w < 0.35
        ? dryColor.clone().lerp(healthyColor, THREE.MathUtils.clamp(w / 0.35, 0, 1))
        : healthyColor.clone().lerp(lushColor, THREE.MathUtils.clamp((w - 0.35) / 0.65, 0, 1));

    for (let i = 0; i < treeCount; i++) {
      const f = treePlacements[i].factor;
      color.copy(base).offsetHSL((f - 0.5) * 0.04, (f - 0.5) * 0.08, (f - 0.5) * 0.08);
      canopies.setColorAt(i, color);
    }
    if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
  }

  updateMoistureTint(gwetRoot);

  return { group, updateMoistureTint, updateHeights };
}

/**
 * Builds a 4-part composite hazard beacon (contact shadow + plinth + mast + diamond crystal).
 */
export function buildHazardBeacon(
  x: number,
  y: number,
  z: number,
  colorHex: number,
  shadowTex: THREE.CanvasTexture
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.6,
    roughness: 0.22,
    metalness: 0.25,
    clearcoat: 0.9,
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.5,
  });

  // 1. Contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.9),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;

  // 2. Plinth base
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.2, 8), plinthMat);
  plinth.position.y = 0.1;

  // 3. Beacon mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.4, 8), plinthMat);
  mast.position.y = 0.8;

  // 4. Faceted diamond beacon + ground ring
  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), mat);
  diamond.position.y = 1.75;
  diamond.name = 'beaconDiamond';

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 0.82, 24),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;

  group.add(shadow, plinth, mast, diamond, ring);
  return group;
}
