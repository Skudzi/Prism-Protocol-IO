import * as THREE from 'three';
import { WeaponSkinDef } from '../game/types';

export function createArenaFloorTextures(
  baseHex: string,
  accentHex: string,
  maxAnisotropy: number,
  isOutdoor = true
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#909090';
  bctx.fillRect(0, 0, size, size);

  if (isOutdoor) {
    // Staggered stone flagstones / urban plaza pavers
    const rowH = 64;
    const tileW = 128;
    for (let row = 0; row < size / rowH; row++) {
      const offsetX = row % 2 === 0 ? 0 : tileW / 2;
      for (let col = -1; col <= size / tileW; col++) {
        const x = col * tileW + offsetX;
        const y = row * rowH;
        const shade = ((row * 7 + col * 13) % 5) - 2;
        ctx.fillStyle =
          shade > 0
            ? `rgba(255,255,255,${0.035 * shade})`
            : `rgba(0,0,0,${0.055 * Math.abs(shade)})`;
        ctx.fillRect(x + 3, y + 3, tileW - 6, rowH - 6);

        // Subtle inner stone bevel highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, tileW - 8, rowH - 8);

        // Raised stone tile in bump map
        const bumpVal = 148 + shade * 10;
        bctx.fillStyle = `rgb(${bumpVal},${bumpVal},${bumpVal})`;
        bctx.fillRect(x + 3, y + 3, tileW - 6, rowH - 6);
      }
    }

    // Aggregate speckle / stone surface grain
    for (let i = 0; i < 4200; i++) {
      const rx = (i * 73 + (i % 19) * 11) % size;
      const ry = (i * 137 + (i % 23) * 7) % size;
      const bright = i % 3 === 0;
      ctx.fillStyle = bright ? 'rgba(255,255,255,0.065)' : 'rgba(0,0,0,0.16)';
      ctx.fillRect(rx, ry, 2, 2);
      bctx.fillStyle = bright ? '#b8b8b8' : '#585858';
      bctx.fillRect(rx, ry, 2, 2);
    }

    // Deep dark mortar grout lines
    ctx.strokeStyle = 'rgba(4,8,15,0.58)';
    ctx.lineWidth = 4;
    bctx.strokeStyle = '#242424';
    bctx.lineWidth = 5;
    for (let row = 0; row <= size / rowH; row++) {
      const y = row * rowH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();

      bctx.beginPath();
      bctx.moveTo(0, y);
      bctx.lineTo(size, y);
      bctx.stroke();

      const offsetX = row % 2 === 0 ? 0 : tileW / 2;
      for (let col = 0; col <= size / tileW + 1; col++) {
        const x = col * tileW + offsetX;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();

        bctx.beginPath();
        bctx.moveTo(x, y);
        bctx.lineTo(x, y + rowH);
        bctx.stroke();
      }
    }
  } else {
    // Industrial Hangar Metal Deck Plates + Diamond Tread
    const step = 128;
    for (let gx = 0; gx < size; gx += step) {
      for (let gy = 0; gy < size; gy += step) {
        const alt = ((gx / step + gy / step) % 2) === 0;
        ctx.fillStyle = alt ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.12)';
        ctx.fillRect(gx + 3, gy + 3, step - 6, step - 6);

        // Diamond-tread cleats
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        bctx.fillStyle = '#c4c4c4';
        for (let tx = 14; tx < step - 12; tx += 18) {
          for (let ty = 14; ty < step - 12; ty += 18) {
            ctx.fillRect(gx + tx, gy + ty, 6, 3);
            bctx.fillRect(gx + tx, gy + ty, 6, 3);
          }
        }

        // Corner bolts
        ctx.fillStyle = 'rgba(148,163,184,0.35)';
        for (const [bx, by] of [[10, 10], [step - 14, 10], [10, step - 14], [step - 14, step - 14]]) {
          ctx.fillRect(gx + bx, gy + by, 4, 4);
        }
      }
    }

    ctx.strokeStyle = 'rgba(5,10,18,0.65)';
    ctx.lineWidth = 4;
    bctx.strokeStyle = '#202020';
    bctx.lineWidth = 5;
    for (let i = 0; i <= size; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();

      bctx.beginPath();
      bctx.moveTo(i, 0);
      bctx.lineTo(i, size);
      bctx.stroke();
      bctx.beginPath();
      bctx.moveTo(0, i);
      bctx.lineTo(size, i);
      bctx.stroke();
    }

    ctx.fillStyle = accentHex;
    ctx.globalAlpha = 0.25;
    for (let x = 0; x < size; x += step) {
      for (let y = 0; y < size; y += step) {
        ctx.fillRect(x + 6, y + 6, 14, 3);
        ctx.fillRect(x + 6, y + 6, 3, 14);
      }
    }
    ctx.globalAlpha = 1;
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(16, 16);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(16, 16);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createCrateTexture(
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base industrial tactical polymer/steel hull
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, size, size);

  // Corrugated vertical steel ribs
  for (let x = 16; x < size - 16; x += 20) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x, 22, 8, size - 44);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x + 8, 22, 4, size - 44);
  }

  // Outer heavy steel frame & diagonal cross brace
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 22;
  ctx.strokeRect(11, 11, size - 22, size - 22);

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 3;
  ctx.strokeRect(23, 23, size - 46, size - 46);

  // Accent stencil stripe + cargo code
  ctx.fillStyle = accentHex;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(28, size * 0.44, size - 56, 18);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('PRISM CARGO // 04', 44, size * 0.44 + 13);

  // Corner bolts
  ctx.fillStyle = '#94a3b8';
  for (const [bx, by] of [[12, 12], [size - 16, 12], [12, size - 16], [size - 16, size - 16]]) {
    ctx.fillRect(bx, by, 5, 5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHouseFacadeTexture(
  wallHex: string,
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Upper composite stucco/panel facade
  ctx.fillStyle = wallHex;
  ctx.fillRect(0, 0, size, size);

  // Fine plaster texture grain
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect((i * 61) % size, (i * 103) % size, 2, 2);
  }

  // Lower stone brick masonry wainscot (bottom 35%)
  ctx.fillStyle = 'rgba(15,23,42,0.45)';
  ctx.fillRect(0, size * 0.65, size, size * 0.35);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  for (let y = Math.floor(size * 0.65); y < size; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
    const ox = ((y / 18) % 2) * 20;
    for (let x = ox; x < size; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 18);
      ctx.stroke();
    }
  }

  // Horizontal architectural trim band
  ctx.fillStyle = accentHex;
  ctx.globalAlpha = 0.65;
  ctx.fillRect(0, size * 0.63, size, 5);
  ctx.globalAlpha = 1;

  // Dual recessed glass windows with frames & warm interior bounce
  for (const wx of [38, 152]) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(wx - 4, 48, 74, 72);
    const glassGrad = ctx.createLinearGradient(wx, 52, wx + 66, 116);
    glassGrad.addColorStop(0, '#38bdf8');
    glassGrad.addColorStop(0.5, '#0f172a');
    glassGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(wx, 52, 66, 64);

    // Window mullions
    ctx.fillStyle = '#334155';
    ctx.fillRect(wx + 31, 52, 4, 64);
    ctx.fillRect(wx, 82, 66, 4);

    // Window sill
    ctx.fillStyle = '#64748b';
    ctx.fillRect(wx - 7, 118, 80, 6);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBarrierTexture(
  wallHex: string,
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = wallHex;
  ctx.fillRect(0, 0, size, size);

  // Concrete / ballistic armor panel seams & speckle
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect((i * 47) % size, (i * 89) % size, 2, 2);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.38)';
  ctx.lineWidth = 3;
  for (let x = 64; x < size; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  // Caution / tactical accent stripe near top edge
  ctx.fillStyle = accentHex;
  ctx.globalAlpha = 0.72;
  ctx.fillRect(0, 22, size, 12);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Textured dark asphalt
  ctx.fillStyle = '#1b1f27';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.16)';
    ctx.fillRect((i * 53) % w, (i * 97) % h, 2, 2);
  }

  // Side curb lines
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(10, 0, 5, h);
  ctx.fillRect(w - 15, 0, 5, h);

  // Dashed center highway line
  ctx.fillStyle = '#fbbf24';
  for (let y = 16; y < h; y += 64) {
    ctx.fillRect(w / 2 - 4, y, 8, 36);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 8);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWoodGrainTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5c3317';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 3) {
    const shade = Math.sin(y * 0.14) * 18;
    ctx.strokeStyle = shade > 0 ? 'rgba(139, 90, 43, 0.45)' : 'rgba(42, 22, 10, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.05 + y * 0.08) * 3.5);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createWeaponPatternTexture(skin: WeaponSkinDef): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  if (skin.pattern === 'rainbow') {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.2, '#f59e0b');
    grad.addColorStop(0.4, '#10b981');
    grad.addColorStop(0.6, '#06b6d4');
    grad.addColorStop(0.8, '#6366f1');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    for (let i = -size; i < size * 2; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
  } else if (skin.pattern === 'gold_walnut') {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, skin.primaryColor);
    grad.addColorStop(0.5, skin.secondaryColor);
    grad.addColorStop(1, skin.primaryColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    for (let y = 16; y < size; y += 32) {
      ctx.strokeRect(12, y, size - 24, 14);
    }
  } else if (skin.pattern === 'hex_carbon') {
    ctx.fillStyle = skin.primaryColor;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = skin.secondaryColor;
    ctx.lineWidth = 2;
    for (let y = 0; y < size; y += 20) {
      for (let x = 0; x < size; x += 24) {
        const ox = (y / 20) % 2 === 0 ? 0 : 12;
        ctx.strokeRect(x + ox, y, 16, 14);
      }
    }
    ctx.fillStyle = skin.emissiveColor;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(0, size * 0.46, size, 12);
    ctx.globalAlpha = 1;
  } else if (skin.pattern === 'circuit') {
    ctx.fillStyle = skin.primaryColor;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = skin.emissiveColor;
    ctx.lineWidth = 3;
    for (let i = 16; i < size; i += 36) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(i + 40, i);
      ctx.lineTo(i + 64, i + 24);
      ctx.lineTo(size, i + 24);
      ctx.stroke();
    }
  } else if (skin.pattern === 'prism_holo') {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#818cf8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i < size; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(size - i, size);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = skin.primaryColor;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = skin.secondaryColor;
    ctx.fillRect(0, size * 0.35, size, size * 0.16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createSkyDomeMaterial(
  topHex: string,
  horizonHex: string
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(topHex) },
      horizonColor: { value: new THREE.Color(horizonHex) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float t = pow(max(h, 0.0), 0.55);
        gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0,0,0,0.72)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
