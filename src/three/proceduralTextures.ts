import * as THREE from 'three';

export function createSolarArrayTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0D1E45';
    ctx.fillRect(0, 0, 512, 256);

    const cols = 16;
    const rows = 8;
    const cellW = 512 / cols;
    const cellH = 256 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW;
        const y = r * cellH;
        const grad = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
        grad.addColorStop(0, '#122B64');
        grad.addColorStop(0.5, '#17387D');
        grad.addColorStop(1, '#0E2252');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1.5, y + 1.5, cellW - 3, cellH - 3);

        // Fine silver finger busbars
        ctx.fillStyle = 'rgba(205, 224, 255, 0.32)';
        ctx.fillRect(x + cellW * 0.5 - 0.5, y + 2, 1, cellH - 4);
      }
    }

    // Structural panel seam lines
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, 509, 253);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function createTerrainDetailTextures(maxAnisotropy: number): {
  colorMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  if (cCtx && rCtx) {
    cCtx.fillStyle = '#E8ECF2';
    cCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#D4D4D4';
    rCtx.fillRect(0, 0, size, size);

    // Subtle organic mineral grain (deterministic pseudo-random)
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 4500; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 1 + rand() * 3.2;
      const shade = Math.floor(205 + rand() * 45);
      cCtx.fillStyle = `rgba(${shade}, ${shade}, ${shade + 4}, 0.16)`;
      cCtx.fillRect(x, y, r, r);

      const rVal = Math.floor(170 + rand() * 75);
      rCtx.fillStyle = `rgb(${rVal}, ${rVal}, ${rVal})`;
      rCtx.fillRect(x, y, r * 1.4, r * 1.4);
    }

    // Fine telemetry cartographic grid lines
    cCtx.strokeStyle = 'rgba(91, 155, 255, 0.14)';
    cCtx.lineWidth = 1;
    const step = size / 8;
    for (let i = 0; i <= 8; i++) {
      const pos = i * step;
      cCtx.beginPath();
      cCtx.moveTo(pos, 0);
      cCtx.lineTo(pos, size);
      cCtx.stroke();

      cCtx.beginPath();
      cCtx.moveTo(0, pos);
      cCtx.lineTo(size, pos);
      cCtx.stroke();
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(4, 4);
  colorMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(4, 4);
  roughnessMap.anisotropy = maxAnisotropy;

  return { colorMap, roughnessMap };
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      4,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, 'rgba(4, 9, 18, 0.72)');
    grad.addColorStop(0.55, 'rgba(4, 9, 18, 0.28)');
    grad.addColorStop(1, 'rgba(4, 9, 18, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createParticleSpriteTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      1,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.65)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
