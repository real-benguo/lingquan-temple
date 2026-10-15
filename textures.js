import * as THREE from 'three';

// 每种纹理代表 1m × 1m 的实际面积（模型 UV 单位就是米）
const S = 256;

function cv(size = S) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function grain(g, size, amt = 16) {
  const img = g.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

function tex(c, aniso) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso || 8;
  t.needsUpdate = true;
  return t;
}

/* ---------------- 屋面瓦 ---------------- */
function roofTex(base, edge, hi, rows) {
  const [c, g] = cv();
  const n = 3;                       // 1m 内 3 道瓦垄
  const w = S / n;
  for (let i = 0; i < n; i++) {
    const x = i * w;
    const grd = g.createLinearGradient(x, 0, x + w, 0);
    grd.addColorStop(0.00, edge);
    grd.addColorStop(0.16, base);
    grd.addColorStop(0.46, hi);
    grd.addColorStop(0.62, base);
    grd.addColorStop(0.86, edge);
    grd.addColorStop(1.00, edge);
    g.fillStyle = grd;
    g.fillRect(x, 0, w + 1, S);
  }
  // 横向瓦接缝
  const step = S / rows;
  for (let y = 0; y < S; y += step) {
    g.fillStyle = 'rgba(0,0,0,0.26)';
    g.fillRect(0, y, S, 1.6);
    g.fillStyle = 'rgba(255,255,255,0.10)';
    g.fillRect(0, y + 1.8, S, 1.2);
  }
  grain(g, S, 14);
  return c;
}

/* ---------------- 砖墙 ---------------- */
function brickTex(base, mortar, rows = 4) {
  const [c, g] = cv();
  g.fillStyle = mortar;
  g.fillRect(0, 0, S, S);
  const bh = S / rows;
  const bw = S / 2;                  // 1m 内 2 块砖宽（错缝）
  for (let r = 0; r < rows; r++) {
    const y = r * bh;
    const off = (r % 2) ? -bw / 2 : 0;
    for (let x = off; x < S; x += bw) {
      const x0 = Math.max(0, x + 1.5);
      const x1 = Math.min(S, x + bw - 1.5);
      if (x1 <= x0) continue;
      const v = (Math.random() - 0.5) * 20;
      g.fillStyle = shade(base, v);
      g.fillRect(x0, y + 1.5, x1 - x0, bh - 3);
      // 砖面微亮
      g.fillStyle = 'rgba(255,255,255,0.045)';
      g.fillRect(x0, y + 1.5, x1 - x0, 1.5);
    }
  }
  grain(g, S, 16);
  return c;
}

/* ---------------- 石板铺地 ---------------- */
function pavingTex(base, joint, cell = 3) {
  const [c, g] = cv();
  g.fillStyle = joint;
  g.fillRect(0, 0, S, S);
  const s = S / cell;
  for (let j = 0; j < cell; j++) {
    for (let i = 0; i < cell; i++) {
      const v = (Math.random() - 0.5) * 26;
      g.fillStyle = shade(base, v);
      g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      g.fillStyle = 'rgba(255,255,255,0.05)';
      g.fillRect(i * s + 2, j * s + 2, s - 4, 1.6);
    }
  }
  grain(g, S, 12);
  return c;
}

/* ---------------- 石材 / 木 ---------------- */
function stoneTex(base, streak) {
  const [c, g] = cv();
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 130; i++) {
    g.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.07})`;
    g.lineWidth = 0.5 + Math.random() * 1.4;
    const y = Math.random() * S;
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(S * 0.3, y + (Math.random() - 0.5) * streak,
                    S * 0.7, y + (Math.random() - 0.5) * streak, S, y);
    g.stroke();
  }
  grain(g, S, 20);
  return c;
}

function woodTex(base, dark) {
  const [c, g] = cv();
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`;
    g.lineWidth = 0.6 + Math.random() * 2.2;
    const x = Math.random() * S;
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + (Math.random() - 0.5) * 12, S * 0.35,
                    x + (Math.random() - 0.5) * 12, S * 0.7, x, S);
    g.stroke();
  }
  g.fillStyle = dark;
  g.globalAlpha = 0.10;
  for (let i = 0; i < 4; i++) g.fillRect(0, Math.random() * S, S, 1.5);
  g.globalAlpha = 1;
  grain(g, S, 12);
  return c;
}

function shade(hex, dv) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + dv));
  const gg = Math.max(0, Math.min(255, ((n >> 8) & 255) + dv));
  const b = Math.max(0, Math.min(255, (n & 255) + dv));
  return `rgb(${r|0},${gg|0},${b|0})`;
}

/* ---------------- 汇总 ---------------- */
export function makeTextures() {
  const t = {};
  t.tile = tex(roofTex('#4a5058', '#31363d', '#6b737d', 4));
  t.tile_gold = tex(roofTex('#c09420', '#8a6a12', '#e8c25c', 4));
  t.wall = tex(brickTex('#8e2a22', '#5d1a14', 4));
  t.platform = tex(pavingTex('#ada79c', '#6d685f', 3));
  t.step = tex(pavingTex('#a19a8f', '#67625a', 3));
  t.ground = tex(pavingTex('#726d64', '#4a463f', 2));
  t.path = tex(pavingTex('#928b7e', '#5f5a52', 3));
  t.stone = tex(stoneTex('#928c82', 14));
  t.wood = tex(woodTex('#4a2e1a', '#2a1809'));
  t.ceiling = tex(woodTex('#7a6448', '#4a3a26'));
  t.beam = tex(woodTex('#1e4a52', '#0e2c32'));
  t.pillar = tex(woodTex('#a02d1c', '#6b1c11'));
  t.white = tex(stoneTex('#cac5ba', 8));
  t.bronze = tex(stoneTex('#7a5e28', 10));
  return t;
}

// 材质名 -> 纹理与凹凸强度
export const MAT_TEX = {
  mat_tile: ['tile', 0.035],
  mat_tile_gold: ['tile_gold', 0.035],
  mat_wall: ['wall', 0.03],
  mat_platform: ['platform', 0.022],
  mat_step: ['step', 0.022],
  mat_ground: ['ground', 0.02],
  mat_path: ['path', 0.02],
  mat_stone: ['stone', 0.03],
  mat_wood: ['wood', 0.02],
  mat_ceiling: ['ceiling', 0.018],
  mat_beam: ['beam', 0.02],
  mat_pillar: ['pillar', 0.02],
  mat_white: ['white', 0.02],
  mat_bronze: ['bronze', 0.015]
};
