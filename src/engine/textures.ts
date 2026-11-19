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

export function createWoodGrainPBRTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;

  // Rich hand-oiled American walnut base
  const woodGrad = ctx.createLinearGradient(0, 0, size, size);
  woodGrad.addColorStop(0, '#5a2f15');
  woodGrad.addColorStop(0.5, '#6e3b1d');
  woodGrad.addColorStop(1, '#4a240e');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  rctx.fillStyle = '#7c7c7c';
  rctx.fillRect(0, 0, size, size);

  // Flowing cathedral burl wood grain streaks
  for (let y = 0; y < size; y += 2) {
    const shade = Math.sin(y * 0.09) + Math.cos(y * 0.037) * 0.6;
    ctx.strokeStyle =
      shade > 0 ? 'rgba(164, 102, 52, 0.36)' : 'rgba(28, 12, 4, 0.48)';
    ctx.lineWidth = shade > 0.4 ? 1.6 : 2.2;
    bctx.strokeStyle = shade > 0 ? '#9e9e9e' : '#646464';
    bctx.lineWidth = 1.6;
    rctx.strokeStyle = shade > 0 ? '#686868' : '#969696';
    rctx.lineWidth = 1.6;

    for (const target of [ctx, bctx, rctx]) {
      target.beginPath();
      target.moveTo(0, y);
      for (let x = 0; x <= size; x += 24) {
        const wave =
          Math.sin(x * 0.025 + y * 0.04) * 5 +
          Math.cos(x * 0.06 - y * 0.02) * 2.5;
        target.lineTo(x, y + wave);
      }
      target.stroke();
    }
  }

  // Fine diamond checkering panel across grip section
  ctx.strokeStyle = 'rgba(20, 8, 2, 0.44)';
  ctx.lineWidth = 1.4;
  bctx.strokeStyle = '#383838';
  bctx.lineWidth = 2;
  rctx.strokeStyle = '#c8c8c8';
  rctx.lineWidth = 2;
  for (let i = -size; i < size * 2; i += 14) {
    for (const target of [ctx, bctx, rctx]) {
      target.beginPath();
      target.moveTo(i, size * 0.25);
      target.lineTo(i + size * 0.55, size * 0.85);
      target.stroke();

      target.beginPath();
      target.moveTo(i + size * 0.55, size * 0.25);
      target.lineTo(i, size * 0.85);
      target.stroke();
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap, roughnessMap };
}

export function createWoodGrainTexture(): THREE.CanvasTexture {
  return createWoodGrainPBRTextures().map;
}

export function createGripKnurlTextures(): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 256;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;

  bctx.fillStyle = '#505050';
  bctx.fillRect(0, 0, size, size);
  rctx.fillStyle = '#bcbcbc';
  rctx.fillRect(0, 0, size, size);

  // Tactile rubberized diamond stipple
  const step = 10;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const ox = (y / step) % 2 === 0 ? 0 : step * 0.5;
      bctx.fillStyle = '#d4d4d4';
      bctx.beginPath();
      bctx.moveTo(x + ox, y - 3);
      bctx.lineTo(x + ox + 3, y);
      bctx.lineTo(x + ox, y + 3);
      bctx.lineTo(x + ox - 3, y);
      bctx.closePath();
      bctx.fill();

      rctx.fillStyle = '#8e8e8e';
      rctx.fillRect(x + ox - 1.5, y - 1.5, 3, 3);
    }
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 3);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 3);

  return { bumpMap, roughnessMap };
}

export function createWeaponPBRTextures(skin: WeaponSkinDef): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);
  rctx.fillStyle = '#707070';
  rctx.fillRect(0, 0, size, size);

  if (skin.pattern === 'rainbow') {
    // Automotive chameleon pearlescent gradient + metallic flake + racing chevrons
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#f43f5e');
    grad.addColorStop(0.18, '#f59e0b');
    grad.addColorStop(0.36, '#10b981');
    grad.addColorStop(0.54, '#06b6d4');
    grad.addColorStop(0.75, '#6366f1');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    rctx.fillStyle = '#282828';
    rctx.fillRect(0, 0, size, size);

    // Metallic flake micro-sparkle
    for (let i = 0; i < 3600; i++) {
      const fx = (i * 97 + (i % 31) * 13) % size;
      const fy = (i * 151 + (i % 17) * 19) % size;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.12)';
      ctx.fillRect(fx, fy, 2, 2);
      rctx.fillStyle = i % 2 === 0 ? '#181818' : '#424242';
      rctx.fillRect(fx, fy, 2, 2);
    }

    // Crisp milled bevel ribs & brushed sheen lines
    ctx.strokeStyle = 'rgba(255,255,255,0.24)';
    ctx.lineWidth = 2;
    bctx.strokeStyle = '#bcbcbc';
    bctx.lineWidth = 2;
    for (let i = -size; i < size * 2; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();

      bctx.beginPath();
      bctx.moveTo(i, 0);
      bctx.lineTo(i + size, size);
      bctx.stroke();
    }
  } else if (skin.pattern === 'gold_walnut') {
    // GTA V Luxury Finish: Brushed 24K Gold / Black Titanium with Baroque Scroll Engraving
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, skin.primaryColor);
    grad.addColorStop(0.35, skin.secondaryColor);
    grad.addColorStop(0.68, skin.primaryColor);
    grad.addColorStop(1, skin.secondaryColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Directional brushed metal micro-grooves
    for (let y = 0; y < size; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
      ctx.fillRect(0, y, size, 1);
    }

    // Engraved baroque scrollwork & filigree medallions
    const darkInlay = skin.primaryColor === '#18181b';
    ctx.strokeStyle = darkInlay ? 'rgba(250, 204, 21, 0.72)' : 'rgba(69, 34, 6, 0.55)';
    ctx.lineWidth = 2.6;
    bctx.strokeStyle = darkInlay ? '#d6d6d6' : '#303030';
    bctx.lineWidth = 3.2;
    rctx.fillStyle = '#303030';
    rctx.fillRect(0, 0, size, size);
    rctx.strokeStyle = '#909090';
    rctx.lineWidth = 3;

    // Border filigree frame
    for (const target of [ctx, bctx, rctx]) {
      target.strokeRect(18, 18, size - 36, size - 36);
      target.strokeRect(28, 28, size - 56, size - 56);
    }

    // Repeating arabesque curls & diamond rosettes
    for (let row = 64; row < size - 48; row += 76) {
      for (let col = 64; col < size - 48; col += 76) {
        for (const target of [ctx, bctx, rctx]) {
          target.beginPath();
          target.arc(col, row, 22, 0, Math.PI * 1.65);
          target.stroke();
          target.beginPath();
          target.arc(col + 18, row + 18, 14, Math.PI * 0.5, Math.PI * 2.15);
          target.stroke();
          target.beginPath();
          target.moveTo(col - 10, row);
          target.lineTo(col, row - 10);
          target.lineTo(col + 10, row);
          target.lineTo(col, row + 10);
          target.closePath();
          target.stroke();
        }
      }
    }
  } else if (skin.pattern === 'hex_carbon') {
    // 2x2 Aerospace Carbon Fiber Twill Weave + Anodized Trim Stripe
    ctx.fillStyle = skin.primaryColor;
    ctx.fillRect(0, 0, size, size);
    rctx.fillStyle = '#525252';
    rctx.fillRect(0, 0, size, size);

    const cell = 16;
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        const diag = ((x / cell + y / cell) % 2) === 0;
        ctx.fillStyle = diag ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.28)';
        ctx.fillRect(x + 1, y + 1, cell - 2, cell / 2 - 1);
        ctx.fillStyle = diag ? 'rgba(0,0,0,0.24)' : 'rgba(255,255,255,0.07)';
        ctx.fillRect(x + 1, y + cell / 2 + 1, cell - 2, cell / 2 - 2);

        bctx.fillStyle = diag ? '#a6a6a6' : '#5c5c5c';
        bctx.fillRect(x + 1, y + 1, cell - 2, cell / 2 - 1);
        rctx.fillStyle = diag ? '#2e2e2e' : '#7a7a7a';
        rctx.fillRect(x + 1, y + 1, cell - 2, cell / 2 - 1);
      }
    }

    // Crimson / accent clearcoat racing band
    ctx.fillStyle = skin.emissiveColor;
    ctx.globalAlpha = 0.72;
    ctx.fillRect(0, size * 0.44, size, 14);
    ctx.globalAlpha = 1;
    rctx.fillStyle = '#1f1f1f';
    rctx.fillRect(0, size * 0.44, size, 14);
  } else if (skin.pattern === 'circuit') {
    // Precision anodized metal chassis + etched gold/emerald PCB micro-traces
    ctx.fillStyle = skin.primaryColor;
    ctx.fillRect(0, 0, size, size);

    for (let x = 0; x < size; x += 2) {
      ctx.fillStyle = x % 4 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.09)';
      ctx.fillRect(x, 0, 1, size);
    }

    ctx.strokeStyle = skin.emissiveColor;
    ctx.lineWidth = 3;
    bctx.strokeStyle = '#cfcfcf';
    bctx.lineWidth = 3;
    rctx.fillStyle = '#707070';
    rctx.fillRect(0, 0, size, size);
    rctx.strokeStyle = '#252525';
    rctx.lineWidth = 3;

    for (let i = 20; i < size; i += 44) {
      for (const target of [ctx, bctx, rctx]) {
        target.beginPath();
        target.moveTo(0, i);
        target.lineTo(i + 56, i);
        target.lineTo(i + 92, i + 36);
        target.lineTo(size, i + 36);
        target.stroke();
      }
      // Via solder pads
      ctx.fillStyle = skin.secondaryColor;
      ctx.beginPath();
      ctx.arc(i + 56, i, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(i + 92, i + 36, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (skin.pattern === 'prism_holo') {
    // Faceted Holographic Titanium Refraction Foil
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.35, '#38bdf8');
    grad.addColorStop(0.7, '#818cf8');
    grad.addColorStop(1, '#f472b6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    rctx.fillStyle = '#242424';
    rctx.fillRect(0, 0, size, size);

    const step = 64;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        ctx.fillStyle = (x + y) % 128 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.14)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + step, y);
        ctx.lineTo(x + step * 0.5, y + step);
        ctx.closePath();
        ctx.fill();

        bctx.fillStyle = (x + y) % 128 === 0 ? '#bbbbbb' : '#585858';
        bctx.beginPath();
        bctx.moveTo(x, y);
        bctx.lineTo(x + step, y);
        bctx.lineTo(x + step * 0.5, y + step);
        bctx.closePath();
        bctx.fill();
      }
    }
  } else {
    // Precision Cerakote Gunmetal + CNC Machining Ribs & Serial Stencils
    ctx.fillStyle = skin.primaryColor;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 3200; i++) {
      const rx = (i * 83) % size;
      const ry = (i * 139) % size;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(rx, ry, 2, 2);
      bctx.fillStyle = i % 2 === 0 ? '#8d8d8d' : '#737373';
      bctx.fillRect(rx, ry, 2, 2);
    }

    ctx.fillStyle = skin.secondaryColor;
    ctx.fillRect(0, size * 0.34, size, size * 0.16);
    bctx.fillStyle = '#a8a8a8';
    bctx.fillRect(0, size * 0.34, size, size * 0.16);

    ctx.fillStyle = skin.emissiveColor;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(24, size * 0.41, size - 48, 6);
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(226,232,240,0.45)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('PRISM-SPEC // MK.IV', 26, 46);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap, roughnessMap };
}

export function createWeaponPatternTexture(skin: WeaponSkinDef): THREE.CanvasTexture {
  return createWeaponPBRTextures(skin).map;
}

export function createArmorPBRTextures(
  baseHex: string,
  trimHex: string,
  mode: 'cloth' | 'armor'
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);
  rctx.fillStyle = mode === 'cloth' ? '#bcbcbc' : '#646464';
  rctx.fillRect(0, 0, size, size);

  if (mode === 'cloth') {
    // Ripstop ballistic Cordura weave + tactical stitch lines
    for (let y = 0; y < size; y += 8) {
      for (let x = 0; x < size; x += 8) {
        const alt = ((x / 8 + y / 8) % 2) === 0;
        ctx.fillStyle = alt ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.09)';
        ctx.fillRect(x, y, 7, 7);
        bctx.fillStyle = alt ? '#949494' : '#6c6c6c';
        bctx.fillRect(x, y, 7, 7);
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.34)';
    ctx.lineWidth = 2;
    for (let y = 64; y < size; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  } else {
    // Kevlar hex plate + machined composite armor seams & accent piping
    const step = 20;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const ox = (y / step) % 2 === 0 ? 0 : step * 0.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + ox, y, step - 3, step - 3);
        bctx.strokeStyle = '#a8a8a8';
        bctx.lineWidth = 1.5;
        bctx.strokeRect(x + ox, y, step - 3, step - 3);
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, size - 12, size - 12);

    ctx.fillStyle = trimHex;
    ctx.globalAlpha = 0.65;
    ctx.fillRect(14, size * 0.47, size - 28, 6);
    ctx.globalAlpha = 1;
    rctx.fillStyle = '#383838';
    rctx.fillRect(14, size * 0.47, size - 28, 6);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap, roughnessMap };
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

export function createTrampledFieldFloorTextures(
  maxAnisotropy: number
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

  // Old earthy brown packed soil base
  ctx.fillStyle = '#6b4d32';
  ctx.fillRect(0, 0, size, size);
  bctx.fillStyle = '#7e7e7e';
  bctx.fillRect(0, 0, size, size);

  // Soft organic soil patches via radial gradients (no hard circular edges)
  for (let i = 0; i < 65; i++) {
    const px = (i * 97 + (i % 7) * 31) % size;
    const py = (i * 151 + (i % 11) * 23) % size;
    const r = 14 + (i % 5) * 8;
    const g = ctx.createRadialGradient(px, py, 1, px, py, r);
    const col =
      i % 3 === 0
        ? 'rgba(84, 59, 36, 0.34)'
        : i % 3 === 1
        ? 'rgba(132, 99, 64, 0.28)'
        : 'rgba(66, 52, 34, 0.22)';
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);

    bctx.fillStyle = i % 2 === 0 ? 'rgba(105,105,105,0.28)' : 'rgba(148,148,148,0.22)';
    bctx.beginPath();
    bctx.arc(px, py, r * 0.65, 0, Math.PI * 2);
    bctx.fill();
  }

  // Sparse dried grass / earth tufts near edges
  for (let i = 0; i < 160; i++) {
    const gx = (i * 107 + (i % 13) * 19) % size;
    const gy = (i * 173 + (i % 9) * 29) % size;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(85, 84, 46, 0.24)' : 'rgba(116, 88, 52, 0.28)';
    ctx.fillRect(gx, gy, 4, 2);
    ctx.fillRect(gx + 1, gy - 2, 2, 4);
  }

  // Subtle trampled boot impressions & pebbles
  for (let i = 0; i < 110; i++) {
    const fx = (i * 67 + (i % 5) * 41) % size;
    const fy = (i * 127 + (i % 7) * 37) % size;
    const ang = ((i * 37) % 314) / 100;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(42, 28, 16, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, -3, 3.0, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 4, 2.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    bctx.save();
    bctx.translate(fx, fy);
    bctx.rotate(ang);
    bctx.fillStyle = 'rgba(48, 48, 48, 0.38)';
    bctx.beginPath();
    bctx.ellipse(0, -3, 3.2, 4.6, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.beginPath();
    bctx.ellipse(0, 4, 2.7, 2.3, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
  }

  // Fine soil grit, dust & small stones
  for (let i = 0; i < 6200; i++) {
    const rx = (i * 73 + (i % 19) * 11) % size;
    const ry = (i * 137 + (i % 23) * 7) % size;
    const bright = i % 3 === 0;
    ctx.fillStyle = bright ? 'rgba(186, 152, 110, 0.16)' : 'rgba(34, 22, 12, 0.22)';
    ctx.fillRect(rx, ry, 2, 2);
    bctx.fillStyle = bright ? '#b6b6b6' : '#525252';
    bctx.fillRect(rx, ry, 2, 2);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(34, 34);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(34, 34);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createTrampledPathOverlayTexture(
  maxAnisotropy: number
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bctx = bumpCanvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, w, h);

  // Softly feathered worn-down dirt footpath core (lighter compacted tan-brown in center, fading to soil at edges)
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, 'rgba(116, 86, 54, 0)');
  grad.addColorStop(0.14, 'rgba(116, 86, 54, 0.55)');
  grad.addColorStop(0.32, 'rgba(136, 102, 66, 0.88)');
  grad.addColorStop(0.5, 'rgba(148, 112, 74, 0.94)');
  grad.addColorStop(0.68, 'rgba(136, 102, 66, 0.88)');
  grad.addColorStop(0.86, 'rgba(116, 86, 54, 0.55)');
  grad.addColorStop(1, 'rgba(116, 86, 54, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Twin compacted walking ruts down the trail
  for (const rutX of [w * 0.37, w * 0.63]) {
    const rutGrad = ctx.createLinearGradient(rutX - 30, 0, rutX + 30, 0);
    rutGrad.addColorStop(0, 'rgba(92, 66, 40, 0)');
    rutGrad.addColorStop(0.5, 'rgba(84, 58, 34, 0.42)');
    rutGrad.addColorStop(1, 'rgba(92, 66, 40, 0)');
    ctx.fillStyle = rutGrad;
    ctx.fillRect(rutX - 30, 0, 60, h);
  }

  // Dense overlapping boot & shoe prints showing heavy foot traffic along the path
  for (let i = 0; i < 140; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const jitterX = (((i * 31) % 19) - 9) * 2.1;
    const px = w * 0.5 + side * 22 + jitterX;
    const py = (i * 29 + (i % 5) * 11) % h;
    const tilt = side * 0.14 + (((i * 17) % 11) - 5) * 0.04;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(tilt);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(64, 43, 24, 0.45)' : 'rgba(78, 53, 30, 0.34)';
    ctx.beginPath();
    ctx.ellipse(0, -5, 5.2, 7.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 6, 4.4, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    bctx.save();
    bctx.translate(px, py);
    bctx.rotate(tilt);
    bctx.fillStyle = 'rgba(34, 34, 34, 0.55)';
    bctx.beginPath();
    bctx.ellipse(0, -5, 5.5, 8, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.beginPath();
    bctx.ellipse(0, 6, 4.6, 3.8, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
  }

  // Dust & gravel speckle
  for (let i = 0; i < 2400; i++) {
    const rx = 24 + ((i * 71) % (w - 48));
    const ry = (i * 113) % h;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(202, 170, 128, 0.18)' : 'rgba(54, 36, 20, 0.22)';
    ctx.fillRect(rx, ry, 2, 2);
    bctx.fillStyle = i % 2 === 0 ? '#a8a8a8' : '#585858';
    bctx.fillRect(rx, ry, 2, 2);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 5);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.ClampToEdgeWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(1, 5);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createWoodenCrateTextures(
  maxAnisotropy: number
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  // Warm weathered pine/oak base planks
  ctx.fillStyle = '#8b5e34';
  ctx.fillRect(0, 0, size, size);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  const plankH = 42;
  for (let row = 0; row < 6; row++) {
    const y = row * plankH;
    const toneShift = ((row * 17) % 5) - 2;
    ctx.fillStyle =
      toneShift >= 0
        ? `rgba(210, 165, 110, ${0.07 * (toneShift + 1)})`
        : `rgba(48, 28, 12, ${0.12 * Math.abs(toneShift)})`;
    ctx.fillRect(0, y + 2, size, plankH - 4);

    // Fine wood grain lines per plank
    for (let g = 4; g < plankH - 4; g += 4) {
      ctx.strokeStyle =
        (row + g) % 2 === 0 ? 'rgba(64, 36, 14, 0.24)' : 'rgba(176, 128, 78, 0.14)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, y + g);
      ctx.lineTo(size, y + g + Math.sin(row + g) * 2.5);
      ctx.stroke();

      bctx.strokeStyle = (row + g) % 2 === 0 ? '#686868' : '#969696';
      bctx.lineWidth = 1;
      bctx.beginPath();
      bctx.moveTo(0, y + g);
      bctx.lineTo(size, y + g);
      bctx.stroke();
    }

    // Deep plank seam groove
    ctx.fillStyle = 'rgba(32, 18, 8, 0.65)';
    ctx.fillRect(0, y, size, 3);
    bctx.fillStyle = '#262626';
    bctx.fillRect(0, y, size, 4);
  }

  // Outer timber batten frame & diagonal brace
  ctx.strokeStyle = '#684321';
  ctx.lineWidth = 24;
  ctx.strokeRect(12, 12, size - 24, size - 24);
  bctx.strokeStyle = '#c8c8c8';
  bctx.lineWidth = 24;
  bctx.strokeRect(12, 12, size - 24, size - 24);

  // Diagonal wooden brace across crate face
  ctx.save();
  ctx.strokeStyle = '#734b27';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(22, size - 22);
  ctx.lineTo(size - 22, 22);
  ctx.stroke();
  ctx.restore();

  bctx.save();
  bctx.strokeStyle = '#bebebe';
  bctx.lineWidth = 20;
  bctx.beginPath();
  bctx.moveTo(22, size - 22);
  bctx.lineTo(size - 22, 22);
  bctx.stroke();
  bctx.restore();

  // Iron nail heads on batten corners
  ctx.fillStyle = '#27272a';
  bctx.fillStyle = '#ececec';
  for (const [nx, ny] of [
    [12, 12],
    [size - 16, 12],
    [12, size - 16],
    [size - 16, size - 16],
    [size / 2, 12],
    [size / 2, size - 16],
  ]) {
    ctx.fillRect(nx, ny, 4, 4);
    bctx.fillRect(nx, ny, 4, 4);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createConcreteWallTextures(
  baseHex: string,
  maxAnisotropy: number
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  bctx.fillStyle = '#848484';
  bctx.fillRect(0, 0, size, size);

  // Soft concrete weathering patches + faint horizontal formwork streaks (no sharp circles)
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + (i % 7) * 29) % size;
    const y = (i * 151 + (i % 5) * 41) % size;
    const r = 36 + (i % 4) * 20;
    const wg = ctx.createRadialGradient(x, y, 2, x, y, r);
    wg.addColorStop(0, i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(15,23,42,0.075)');
    wg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = wg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let y = 0; y < size; y += 16) {
    ctx.fillStyle = (y / 16) % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(15,23,42,0.035)';
    ctx.fillRect(0, y, size, 8);
  }

  // Fine mineral aggregate speckle
  for (let i = 0; i < 4800; i++) {
    const rx = (i * 61 + (i % 13) * 17) % size;
    const ry = (i * 131 + (i % 19) * 11) % size;
    const bright = i % 3 === 0;
    ctx.fillStyle = bright ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(rx, ry, 2, 2);
    bctx.fillStyle = bright ? '#a8a8a8' : '#626262';
    bctx.fillRect(rx, ry, 2, 2);
  }

  // Formwork panel joints (128x128 poured concrete panels)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.34)';
  ctx.lineWidth = 3;
  bctx.strokeStyle = '#363636';
  bctx.lineWidth = 4;
  for (let i = 0; i <= size; i += 128) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    bctx.beginPath();
    bctx.moveTo(0, i);
    bctx.lineTo(size, i);
    bctx.stroke();

    bctx.beginPath();
    bctx.moveTo(i, 0);
    bctx.lineTo(i, size);
    bctx.stroke();
  }

  // Tie-rod form holes inside concrete panels
  for (let y = 32; y < size; y += 128) {
    for (let x = 32; x < size; x += 128) {
      for (const [ox, oy] of [[0, 0], [64, 0], [0, 64], [64, 64]]) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, 3.2, 0, Math.PI * 2);
        ctx.fill();

        bctx.fillStyle = '#202020';
        bctx.beginPath();
        bctx.arc(x + ox, y + oy, 3.5, 0, Math.PI * 2);
        bctx.fill();
      }
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

