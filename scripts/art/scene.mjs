import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'https://esm.sh/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js';

// Build-time art tool only. The app consumes its local JPG/PNG output.
const MODEL_URL = new URL('../../assets/robot-dog/robot-dog.glb', import.meta.url).href;
const PIT = new THREE.Vector3(60, 0, 0);

export const LOOKS = {
  dusk: { name: 'dusk', sky: ['#0D1830', '#6A2E1C'], fog: '#2E2426', fogNear: 18, fogFar: 190, sand: '#5B5850', rock: '#3A3834', struct: '#9A9E96', structDark: '#262A28', wall: '#4A4F4A', rust: '#7A3E24', body: '#F2F2EE', dark: '#1E2A22', metal: '#8E948C', accent: '#E0662F', glow: '#9EF0A8', cat: '#F2F2EE', catDark: '#1E2A22', catAccent: '#7EC8F0', catGlow: '#9EF0A8', screen: '#0E2016', bezel: '#3C4A40', outline: true, shade: 3, sun: 2.0, sunColor: '#FFDDC2', hemi: 1.25, hemiSky: '#A9BCDD', hemiGround: '#5E4A40' },
  ink: { name: 'ink', sky: ['#E3E4DF', '#C9CBC4'], fog: '#D7D9D2', sand: '#C9CBC4', rock: '#9EA29A', struct: '#B9BCB4', structDark: '#3C4A40', body: '#F2F2EE', dark: '#1E2A22', metal: '#8E948C', accent: '#E0662F', glow: '#9EF0A8', cat: '#F2F2EE', catDark: '#1E2A22', catAccent: '#7EC8F0', catGlow: '#9EF0A8', screen: '#0E2016', bezel: '#3C4A40', outline: true, shade: 3, sun: 2.3, hemi: 1.35 },
  poster: { name: 'poster', sky: ['#E3E4DF', '#B9BCB4'], fog: '#C9CBC4', sand: '#B9BCB4', rock: '#7E8379', struct: '#8E948C', structDark: '#1E2A22', body: '#E3E4DF', dark: '#1E2A22', metal: '#5E655D', accent: '#9EF0A8', glow: '#9EF0A8', cat: '#E3E4DF', catDark: '#1E2A22', catAccent: '#9EF0A8', catGlow: '#9EF0A8', screen: '#0E2016', bezel: '#1E2A22', outline: false, shade: 2, sun: 2.5, hemi: 1.1 },
  book: { name: 'book', sky: ['#0A1828', '#1B3A26'], fog: '#132B1C', sand: '#1E2A22', rock: '#2F5E3E', struct: '#3C4A40', structDark: '#132B1C', body: '#C9CBC4', dark: '#132B1C', metal: '#4E8C5E', accent: '#F2C879', glow: '#9EF0A8', cat: '#C9CBC4', catDark: '#132B1C', catAccent: '#7EC8F0', catGlow: '#7EC8F0', screen: '#0B1A12', bezel: '#3C4A40', outline: true, shade: 3, sun: 1.6, hemi: 1.2 },
};
export const COATS = {
  factory: { glow: '#9EF0A8' },
  arctic: { body: '#E8F4FC', dark: '#1C4060', accent: '#7EC8F0', glow: '#7EC8F0' },
  carbon: { body: '#2E3A33', dark: '#0B1A12', metal: '#5E655D', accent: '#9EF0A8', glow: '#9EF0A8' },
  desert: { body: '#E6D7B0', dark: '#3C4A40', metal: '#A39A80', accent: '#F2C879', glow: '#F2C879' },
  forest: { body: '#A9B89C', dark: '#253B2B', accent: '#9EF0A8', glow: '#9EF0A8' },
  rust: { body: '#B98265', dark: '#3C2D27', accent: '#F2C879', glow: '#F2C879' },
  rescue: { body: '#F2F2EE', dark: '#2E1616', accent: '#F07167', glow: '#F07167' },
};
const CLIPS = { idle: 'Idle_Pokoy', walk: 'Walk_Hodba', joy: 'Joy_Radost', sad: 'Sad_Grust' };

const gradCache = {};
function grad(n) {
  if (gradCache[n]) return gradCache[n];
  const v = n === 2 ? [90, 255] : [60, 165, 255];
  const t = new THREE.DataTexture(new Uint8Array(v), v.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return (gradCache[n] = t);
}
function mkMat(look, color, o = {}) {
  const c = new THREE.Color(color);
  const m = look.shade ? new THREE.MeshToonMaterial({ color: c, gradientMap: grad(look.shade) }) : new THREE.MeshLambertMaterial({ color: c });
  if (o.emissive) m.emissive = new THREE.Color(o.emissive);
  if (o.side) m.side = o.side;
  if (o.noOutline) m.userData.outlineParameters = { visible: false };
  return m;
}
const col = (look, coat, role) => (look.name !== 'poster' && coat[role]) || look[role];

function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function faceTex(kind, glow, bg, aspect) {
  const W = 512, H = Math.max(96, Math.round(512 / aspect)); const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = bg; rrect(x, 0, 0, W, H, H * 0.28); x.fill();
  x.fillStyle = x.strokeStyle = glow; x.shadowColor = glow; x.shadowBlur = H * 0.12; x.lineCap = 'round';
  const ex = [W * 0.31, W * 0.69], ey = H * 0.5, s = Math.min(H * 1.15, W * 0.5);
  for (const cx of ex) {
    if (kind === 'happy') { x.lineWidth = s * 0.13; x.beginPath(); x.arc(cx, ey + s * 0.1, s * 0.2, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
    else if (kind === 'wide') { rrect(x, cx - s * 0.13, ey - s * 0.27, s * 0.26, s * 0.54, s * 0.13); x.fill(); x.shadowBlur = 0; x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx + s * 0.04, ey - s * 0.12, s * 0.05, 0, 7); x.fill(); x.fillStyle = glow; x.shadowBlur = H * 0.12; }
    else { x.beginPath(); x.arc(cx, ey, s * 0.2, 0, 7); x.fill(); x.shadowBlur = 0; x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx + s * 0.07, ey - s * 0.07, s * 0.06, 0, 7); x.fill(); x.fillStyle = glow; x.shadowBlur = H * 0.12; }
  }
  if (kind === 'cat') {
    x.shadowBlur = 0; x.fillStyle = 'rgba(255,140,170,0.55)'; for (const cx of ex) { x.beginPath(); x.ellipse(cx + (cx < W / 2 ? -s * 0.12 : s * 0.12), ey + s * 0.3, s * 0.12, s * 0.07, 0, 0, 7); x.fill(); }
    x.strokeStyle = glow; x.lineWidth = s * 0.06; x.beginPath(); x.arc(W / 2 - s * 0.07, ey + s * 0.26, s * 0.07, 0.2, Math.PI - 0.2); x.arc(W / 2 + s * 0.07, ey + s * 0.26, s * 0.07, 0.2, Math.PI - 0.2); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function catTex(mode, glow, ink, screen) {
  const W = 512, H = 384; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const eye = mode === 'soft' ? ink : glow; const lx = W * 0.3, rx = W * 0.7, ey = H * 0.44, R = H * 0.15;
  if (mode === 'glow') { x.fillStyle = screen; rrect(x, W * 0.04, H * 0.05, W * 0.92, H * 0.9, H * 0.26); x.fill(); x.shadowColor = glow; x.shadowBlur = 22; }
  x.fillStyle = eye; for (const cx of [lx, rx]) { x.beginPath(); x.ellipse(cx, ey, R * 0.92, R * 1.08, 0, 0, 7); x.fill(); }
  x.shadowBlur = 0; x.fillStyle = mode === 'soft' ? '#FFFFFF' : '#FFFFFF';
  for (const cx of [lx, rx]) { x.beginPath(); x.arc(cx + R * 0.34, ey - R * 0.4, R * 0.36, 0, 7); x.fill(); x.beginPath(); x.arc(cx - R * 0.3, ey + R * 0.35, R * 0.16, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(244,140,165,0.75)'; for (const cx of [lx - R * 0.35, rx + R * 0.35]) { x.beginPath(); x.ellipse(cx, ey + R * 1.55, R * 0.62, R * 0.36, 0, 0, 7); x.fill(); }
  x.strokeStyle = mode === 'soft' ? ink : glow; x.lineWidth = H * 0.028; x.lineCap = 'round'; x.lineJoin = 'round';
  const my = ey + R * 1.45, mw = R * 0.42; x.beginPath(); x.arc(W / 2 - mw, my, mw, 0.15, Math.PI - 0.15); x.stroke(); x.beginPath(); x.arc(W / 2 + mw, my, mw, 0.15, Math.PI - 0.15); x.stroke();
  x.fillStyle = mode === 'soft' ? '#F48CA5' : glow; x.beginPath(); x.moveTo(W / 2 - R * 0.28, my - R * 0.42); x.lineTo(W / 2 + R * 0.28, my - R * 0.42); x.lineTo(W / 2, my - R * 0.1); x.closePath(); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

let dogP;
const loadDog = () => (dogP ??= new Promise((res, rej) => new GLTFLoader().load(MODEL_URL, res, undefined, rej)));

function earGroup(kind, M, s) {
  const g = new THREE.Group();
  if (kind === 'floppy') {
    const p = new THREE.Group(); p.rotation.set(-0.62, 0, 0.3); g.add(p);
    const e = new THREE.Mesh(new RoundedBoxGeometry(0.2 * s, 1.1 * s, 0.6 * s, 3, 0.09 * s), M.dark); e.position.y = -0.5 * s; p.add(e);
    const tip = new THREE.Mesh(new RoundedBoxGeometry(0.22 * s, 0.22 * s, 0.52 * s, 3, 0.08 * s), M.accent); tip.position.y = -1.0 * s; p.add(tip);
    g.position.y = 0.12 * s;
  } else if (kind === 'radar') {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.06 * s, 0.45 * s, 10), M.metal); st.position.y = 0.22 * s; g.add(st);
    const d = new THREE.Group(); d.position.y = 0.5 * s; d.rotation.set(0.9, 0, -0.5); g.add(d);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.4 * s, 22, 10, 0, Math.PI * 2, 0, 0.95), mkMat(M.look, M.cBody, { side: THREE.DoubleSide })); dish.rotation.x = Math.PI; dish.position.y = 0.38 * s; d.add(dish);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.08 * s, 12, 8), M.accent); pin.position.y = 0.05 * s; d.add(pin);
  } else if (kind === 'round') {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.36 * s, 0.36 * s, 0.14 * s, 28), M.dark); d.rotation.z = Math.PI / 2; d.position.y = 0.38 * s; g.add(d);
    const i = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.2 * s, 0.16 * s, 24), M.accent); i.rotation.z = Math.PI / 2; i.position.set(0.02 * s, 0.38 * s, 0); g.add(i);
    g.rotation.x = 0.25;
  } else if (kind === 'antenna') {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * s, 0.05 * s, 1.0 * s, 8), M.metal); r.position.y = 0.5 * s; g.add(r);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.13 * s, 16, 10), M.glowBall); b.position.y = 1.05 * s; g.add(b);
    g.rotation.set(0.3, 0, -0.2);
  }
  return g;
}

export async function makeDog(look, { coat = 'factory', ears = 'blade', face = 'dots', armor = false, joint = false, stage = 0, rack = false } = {}) {
  stage = +stage || 0; if (stage >= 2) armor = true; if (stage >= 3) joint = true;
  const gltf = await loadDog(); const root = gltf.scene.clone(true); const C = COATS[coat] || {};
  const roleOf = { Body: 'body', Dark: 'dark', Metal: 'metal', Accent: 'accent', Glow: 'glow', '': 'dark' };
  const M = { look, cBody: col(look, C, 'body') };
  for (const r of ['body', 'dark', 'metal', 'accent']) M[r] = mkMat(look, col(look, C, r));
  M.glow = mkMat(look, '#15161a', { emissive: col(look, C, 'glow') });
  M.glowBall = mkMat(look, col(look, C, 'glow'), { emissive: col(look, C, 'glow') });
  const glows = [];
  root.traverse(o => { if (o.isMesh) { const r = roleOf[o.material.name] ?? 'dark'; if (r === 'glow') glows.push(o); o.material = M[r]; o.castShadow = true; o.receiveShadow = false; } });
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root); const ctr = box.getCenter(new THREE.Vector3());
  let visor = null, vbA = 0;
  for (const g of glows) { const b = new THREE.Box3().setFromObject(g); const sz = b.getSize(new THREE.Vector3()); const a = sz.y * Math.max(sz.z, sz.x); if (a > vbA) { vbA = a; visor = b; } }
  const vc = visor ? visor.getCenter(new THREE.Vector3()) : new THREE.Vector3(box.max.x, ctr.y, 0);
  const headSign = vc.x >= ctr.x ? 1 : -1;
  const body = root.getObjectByName('Body');
  const bodyMeshBox = new THREE.Box3(); body.children.forEach(ch => { if (ch.isMesh && ch.material === M.body) bodyMeshBox.expandByObject(ch); });
  if (!rack) body.children.forEach(ch => { if (ch.isMesh && ch.material !== M.body) { const b = new THREE.Box3().setFromObject(ch); if (!bodyMeshBox.isEmpty() && b.max.y > bodyMeshBox.max.y + 0.06 && b.min.y > bodyMeshBox.max.y - 0.25) ch.visible = false; } });
  const s = Math.max(0.6, bodyMeshBox.isEmpty() ? 1 : bodyMeshBox.getSize(new THREE.Vector3()).y / 1.1);
  // ears
  const mL = root.getObjectByName('Mast_L'), mR = root.getObjectByName('Mast_R');
  if (ears !== 'blade' && mL && mR) {
    for (const m of [mL, mR]) {
      m.visible = false; const side = m.position.z >= 0 ? 1 : -1;
      const g = earGroup(ears, M, s); const w = new THREE.Group(); w.position.copy(m.position); w.scale.set(headSign, 1, side); w.add(g); body.add(w);
    }
  }
  if (face !== 'none') glows.forEach(g => { g.visible = false; });
  // face screen over the visor
  if (visor && face !== 'none') {
    const inv = new THREE.Matrix4().copy(body.matrixWorld).invert();
    const lb = visor.clone().applyMatrix4(inv); const lsz = lb.getSize(new THREE.Vector3()); const lc = lb.getCenter(new THREE.Vector3());
    const w = Math.max(lsz.z, 0.2) * 1.3, h = Math.max(lsz.y * 3.1, 0.3);
    const bez = new THREE.Mesh(new RoundedBoxGeometry(0.06, h * 1.18, w * 1.1, 3, Math.min(h, w) * 0.2), mkMat(look, look.bezel || '#3C4A40')); bez.position.set(headSign > 0 ? lb.max.x - 0.012 : lb.min.x + 0.012, lc.y, lc.z); body.add(bez);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: faceTex(face, col(look, C, 'glow'), look.screen, w / h), transparent: true, toneMapped: false }));
    pl.material.userData.outlineParameters = { visible: false };
    pl.position.set(headSign > 0 ? lb.max.x + 0.022 : lb.min.x - 0.022, lc.y, lc.z); pl.rotation.y = headSign > 0 ? Math.PI / 2 : -Math.PI / 2; body.add(pl);
  }
  // armor shells on thigh + shin
  const legs = ['FL', 'FR', 'RL', 'RR'];
  if (armor) for (const L of legs) {
    const hip = root.getObjectByName(L + '_Hip'), knee = root.getObjectByName(L + '_Knee'), next = root.getObjectByName(L + '_Hock') || root.getObjectByName(L + '_Ankle');
    for (const [a, b] of [[hip, knee], [knee, next]]) {
      if (!a || !b || b.parent !== a) continue;
      const v = b.position.clone(); const len = v.length(); if (len < 1e-3) continue;
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.16 * s, len * 0.72, 16, 1, true, -Math.PI * 0.55, Math.PI * 1.1), mkMat(look, col(look, C, 'accent'), { side: THREE.DoubleSide }));
      sh.position.copy(v).multiplyScalar(0.5); sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
      const wz = new THREE.Vector3(); a.getWorldPosition(wz); if (wz.z < ctr.z) sh.rotateY(Math.PI);
      sh.castShadow = true; a.add(sh);
      const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 10, 8), M.metal); bolt.position.copy(sh.position); a.add(bolt);
    }
  }
  if (joint) for (const L of legs) {
    const mt = root.getObjectByName(L + '_HipMount'); if (!mt) continue;
    const j = new THREE.Group(); j.position.copy(mt.position); body.add(j);
    j.add(new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 18, 12), M.metal));
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.28 * s, 0.06 * s, 10, 24, Math.PI), M.dark); j.add(yoke);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.06 * s, 0.62 * s, 12), M.accent); pin.rotation.x = Math.PI / 2; j.add(pin);
  }
  if (!bodyMeshBox.isEmpty() && stage >= 3) {
    const inv = new THREE.Matrix4().copy(body.matrixWorld).invert(); const bb = bodyMeshBox.clone().applyMatrix4(inv); const bc = bb.getCenter(new THREE.Vector3()); const bs = bb.getSize(new THREE.Vector3());
    if (stage >= 3) {
      const hx = headSign > 0 ? bb.max.x : bb.min.x;
      const lamp = new THREE.Group(); lamp.position.set(hx - headSign * 0.35 * s, bb.max.y + 0.12 * s, bc.z); body.add(lamp);
      const lb = new THREE.Mesh(new RoundedBoxGeometry(0.5 * s, 0.24 * s, 0.34 * s, 3, 0.08 * s), M.dark); lamp.add(lb);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.1 * s, 0.05 * s, 18), M.glowBall); lens.rotation.z = Math.PI / 2; lens.position.x = headSign * 0.26 * s; lamp.add(lens);
      for (const zz of [-1, 1]) {
        const sp = new THREE.Mesh(new RoundedBoxGeometry(bs.x * 0.3, bs.y * 0.55, 0.12 * s, 3, 0.05 * s), M.accent); sp.position.set(hx - headSign * bs.x * 0.22, bc.y - bs.y * 0.05, zz > 0 ? bb.max.z + 0.06 * s : bb.min.z - 0.06 * s); sp.castShadow = true; body.add(sp);
        const st = new THREE.Mesh(new THREE.BoxGeometry(bs.x * 0.36, 0.05 * s, 0.02), M.glowBall); st.position.set(bc.x - headSign * bs.x * 0.2, bc.y - bs.y * 0.18, zz > 0 ? bb.max.z + 0.02 : bb.min.z - 0.02); body.add(st);
      }
    }
  }
  const wrap = new THREE.Group(); wrap.add(root);
  root.position.set(-ctr.x, -box.min.y, -ctr.z); wrap.rotation.y = 0; if (headSign < 0) { root.rotation.y = Math.PI; root.position.x = ctr.x; root.position.z = ctr.z; }
  const mixer = new THREE.AnimationMixer(root);
  const actions = {}; for (const k in CLIPS) { const c = gltf.animations.find(a => a.name === CLIPS[k]); if (c) actions[k] = mixer.clipAction(c); }
  let cur = null;
  wrap.userData = {
    kind: 'dog', root, mixer, s,
    head: new THREE.Vector3(box.max.x - ctr.x - 0.35 * s, vc.y - box.min.y, 0),
    size: box.getSize(new THREE.Vector3()),
    play(k, t) { const a = actions[k] || actions.idle; if (!a) return; if (cur && cur !== a) cur.stop(); cur = a; a.reset().play(); if (t != null) mixer.setTime(t); },
    tick(dt) { mixer.update(dt); },
    joints() { const out = []; const J = n => root.getObjectByName(n); for (const L of legs) { const ch = [J(L + '_HipMount'), J(L + '_Hip'), J(L + '_Knee'), J(L + '_Hock'), J(L + '_Ankle')].filter(Boolean); out.push([J('Body'), ...ch]); } return out; },
  };
  wrap.userData.play('idle', 0);
  return wrap;
}

export function makeCat(look, face = 'glow') {
  const g = new THREE.Group();
  const B = mkMat(look, look.cat), D = mkMat(look, look.catDark), A = mkMat(look, look.catAccent), G = mkMat(look, look.catGlow, { emissive: look.catGlow });
  const torso = new THREE.Mesh(new RoundedBoxGeometry(1.25, 0.72, 0.78, 4, 0.3), B); torso.position.y = 0.8; g.add(torso);
  const head = new THREE.Group(); head.position.set(0.7, 1.5, 0); g.add(head);
  head.add(new THREE.Mesh(new RoundedBoxGeometry(0.94, 0.8, 0.92, 5, face === 'tv' ? 0.32 : 0.2), B));
  if (face !== 'tv') { const fp = new THREE.Mesh(new THREE.PlaneGeometry(face === 'glow' ? 0.7 : 0.58, face === 'glow' ? 0.525 : 0.435), new THREE.MeshBasicMaterial({ map: catTex(face === 'glow' ? 'glow' : 'soft', look.catGlow, '#1E2A22', look.screen), transparent: true, toneMapped: false })); fp.material.userData.outlineParameters = { visible: false }; fp.position.set(0.473, -0.02, 0); fp.rotation.y = Math.PI / 2; head.add(fp); }
  if (face === 'tv') {
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.48), new THREE.MeshBasicMaterial({ map: faceTex('cat', look.catGlow, look.screen, 0.66 / 0.5), transparent: true, toneMapped: false }));
    fp.material.userData.outlineParameters = { visible: false };
    const bz = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.62, 0.8, 3, 0.1), D); bz.position.x = 0.43; head.add(bz);
    fp.position.x = 0.474; fp.rotation.y = Math.PI / 2; head.add(fp);
  } else if (face === '__visor') {
    const band = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.24, 0.86, 3, 0.1), mkMat(look, look.screen)); band.position.set(0.45, 0.06, 0); head.add(band);
    for (const z of [-0.18, 0.18]) { const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.1, 4, 8), G); e.rotation.x = Math.PI / 2; e.position.set(0.485, 0.06, z); head.add(e); }
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), A); n.position.set(0.47, -0.12, 0); head.add(n);
  }
  for (const sd of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 4), B); e.rotation.set(sd * 0.28, Math.PI / 4, 0); e.scale.set(1, 1, 0.55); e.position.set(-0.02, 0.52, sd * 0.25); head.add(e);
    const i = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 4), A); i.rotation.copy(e.rotation); i.scale.set(1, 1, 0.5); i.position.set(0.06, 0.5, sd * 0.25); head.add(i);
  }
  for (const [x, z] of [[0.42, 0.24], [0.42, -0.24], [-0.42, 0.24], [-0.42, -0.24]]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.3, 4, 10), D); l.position.set(x, 0.28, z); l.castShadow = true; g.add(l); }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 8, 28), A); collar.position.set(0.42, 1.17, 0); collar.rotation.y = Math.PI / 2; g.add(collar);
  const tail = new THREE.Group(); tail.position.set(-0.6, 0.95, 0); g.add(tail);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.38, 0.22, 0), new THREE.Vector3(-0.35, 0.72, 0), new THREE.Vector3(-0.12, 1.0, 0)]);
  tail.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.07, 8), D));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), G); ball.position.set(-0.12, 1.02, 0); tail.add(ball);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  let t = 0;
  g.userData = { kind: 'cat', head, tail, tick(dt) { t += dt; head.rotation.z = Math.sin(t * 1.3) * 0.07; head.rotation.x = Math.sin(t * 0.9) * 0.1; tail.rotation.x = Math.sin(t * 2.1) * 0.28; torso.position.y = 0.8 + Math.sin(t * 2) * 0.02; }, setT(v) { t = v; this.tick(0); } };
  return g;
}

function skyTex(a, b) { const c = document.createElement('canvas'); c.width = 2; c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, a); gr.addColorStop(1, b); x.fillStyle = gr; x.fillRect(0, 0, 2, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function rnd(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

function lights(scene, look, focus) {
  scene.add(new THREE.HemisphereLight(look.hemiSky || look.sky[0], look.hemiGround || look.sand, look.hemi));
  const d = new THREE.DirectionalLight(look.sunColor || '#fff4e0', look.sun); d.position.copy(focus).add(new THREE.Vector3(-14, 16, 12)); d.target.position.copy(focus); scene.add(d, d.target);
  d.castShadow = true; d.shadow.mapSize.set(2048, 2048); const c = d.shadow.camera; c.left = c.bottom = -16; c.right = c.top = 16; c.near = 1; c.far = 80; d.shadow.bias = -0.002; d.shadow.normalBias = 0.03;
}

export function buildWorld(look) {
  const w = new THREE.Group();
  const gg = new THREE.RingGeometry(12.3, 340, 180, 90); const p = gg.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const d = Math.hypot(x, y); const wx = x + PIT.x, wz = -y; const f = sstep(13, 34, d) * (0.04 + 0.96 * sstep(3, 26, Math.abs(wz))); p.setZ(i, f * (Math.sin(wx * 0.07) * 1.6 + Math.sin(wz * 0.1 + wx * 0.03) * 1.3 + Math.sin((wx + wz) * 0.19) * 0.4)); }
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, mkMat(look, look.sand)); ground.rotation.x = -Math.PI / 2; ground.position.copy(PIT); ground.receiveShadow = true; ground.material.userData.outlineParameters = { thickness: 0.002 }; w.add(ground);
  const dm = new THREE.Object3D();
  const wall = new THREE.Mesh(new THREE.LatheGeometry([[12.3, 0.02], [12, -0.2], [12, -12.6], [0.01, -12.6]].map(([r, y]) => new THREE.Vector2(r, y)), 72), mkMat(look, look.wall || look.struct, { side: THREE.DoubleSide })); wall.position.copy(PIT); wall.receiveShadow = true; w.add(wall);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(12.3, 0.3, 8, 72), mkMat(look, look.structDark)); lip.rotation.x = Math.PI / 2; lip.position.copy(PIT); w.add(lip);
  const slots = [0, 100, 260].map(d => d * Math.PI / 180);
  const cellM = mkMat(look, look.struct), frameM = mkMat(look, look.structDark);
  for (let k = 0; k < 4; k++) {
    const ro = 12 - 2 * k, ri = ro - 1.9, top = -2.4 * (k + 1), h = top + 12.6, rc = (ro + ri) / 2; const n = Math.round(rc * 2.3);
    const g = new THREE.BoxGeometry(1.9, h, (2 * Math.PI * rc / n) * 0.92); const im = new THREE.InstancedMesh(g, cellM, n); let c = 0;
    for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * Math.PI * 2; if (k < 2 && slots.some(sa => Math.abs(Math.atan2(Math.sin(a - sa), Math.cos(a - sa))) < 0.16)) continue; dm.position.set(PIT.x + Math.cos(a) * rc, top - h / 2, Math.sin(a) * rc); dm.rotation.set(0, -a, 0); dm.updateMatrix(); im.setMatrixAt(c++, dm.matrix); }
    im.count = c; im.receiveShadow = true; im.castShadow = true; w.add(im);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(ri, 0.07, 6, 90), frameM); edge.rotation.x = Math.PI / 2; edge.position.set(PIT.x, top + 0.02, 0); w.add(edge);
  }
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.1, 0.6, 48), cellM); plat.position.set(PIT.x, -12.3, 0); plat.receiveShadow = true; w.add(plat);
  const pr = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.05, 6, 60), frameM); pr.rotation.x = Math.PI / 2; pr.position.set(PIT.x, -11.98, 0); w.add(pr);
  const rustM = mkMat(look, look.rust || look.structDark), colM = mkMat(look, look.wall || look.struct);
  const gtg = new THREE.BoxGeometry(1.1, 1.3, 1.3);
  slots.forEach(a => {
    const gr = new THREE.Group(); gr.position.set(PIT.x + Math.cos(a) * 12.9, -1.2, Math.sin(a) * 12.9); gr.rotation.y = -a; w.add(gr);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 1.2, 40), rustM); wheel.rotation.x = Math.PI / 2; wheel.castShadow = true; gr.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.6, 20), frameM); hub.rotation.x = Math.PI / 2; gr.add(hub);
    const ti = new THREE.InstancedMesh(gtg, rustM, 13); for (let i = 0; i < 13; i++) { const b = i / 13 * Math.PI * 2; dm.position.set(Math.cos(b) * 5.6, Math.sin(b) * 5.6, 0); dm.rotation.set(0, 0, b); dm.updateMatrix(); ti.setMatrixAt(i, dm.matrix); } gr.add(ti);
    const col = new THREE.Mesh(new THREE.BoxGeometry(3.4, 420, 4.2), colM); col.position.set(3.6, 60, 0); col.castShadow = true; gr.add(col);
  });
  const gate = new THREE.Group(); gate.position.set(PIT.x + 105, 0, -14);
  const gm = mkMat(look, look.structDark);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(40, 4.2, 14, 80), gm); ring.rotation.y = Math.PI / 2; ring.position.y = 24; gate.add(ring);
  const tg = new THREE.BoxGeometry(5, 5, 5); const ti = new THREE.InstancedMesh(tg, gm, 36);
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; dm.position.set(0, 24 + Math.sin(a) * 44.5, Math.cos(a) * 44.5); dm.rotation.set(-a, 0, 0); dm.updateMatrix(); ti.setMatrixAt(i, dm.matrix); } gate.add(ti);
  const zig = new THREE.Mesh(new THREE.LatheGeometry([[60, -1], [52, 4], [44, 4], [38, 9], [30, 9], [24, 14], [0.1, 14]].map(([r, y]) => new THREE.Vector2(r, y)), 8), mkMat(look, look.struct)); gate.add(zig);
  for (const z of [-58, 58]) { const py = new THREE.Mesh(new THREE.BoxGeometry(7, 80, 7), gm); py.position.set(0, 40, z); gate.add(py); }
  w.add(gate);
  const R = rnd(7); const rg = new THREE.DodecahedronGeometry(1, 0); const rm = mkMat(look, look.rock);
  for (let i = 0; i < 46; i++) { const x = -40 + R() * 150, z = (R() < 0.5 ? -1 : 1) * (8 + R() * 60); if (Math.hypot(x - PIT.x, z) < 18) continue; const r = new THREE.Mesh(rg, rm); const sc = 0.4 + R() * 1.8; r.scale.set(sc, sc * (0.6 + R() * 0.6), sc); r.position.set(x, sc * 0.2, z); r.rotation.set(R() * 3, R() * 3, R() * 3); r.castShadow = true; w.add(r); }
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(2 + R() * 3, 6 + R() * 18, 2 + R() * 3), mkMat(look, look.struct)); b.position.set(-30 + R() * 140, 3, (R() < 0.5 ? -1 : 1) * (40 + R() * 60)); b.rotation.set(R() * 0.3, R() * 3, R() * 0.3); w.add(b); }
  return w;
}

const SHOTS = {
  walk: { cam: [0.5, 2.3, 14], at: [1.4, 1.2, 1], fov: 34, dog: { p: [0, 0, 0], r: 0, clip: 'walk', t: 0.3 }, cat: { p: [2.2, 0, 2.5], r: -1.8, t: 1 } },
  low: { cam: [-0.2, 0.42, 0.15], at: [60, 7, -6], fov: 78, dog: { p: [0, 0, 0], r: 0, clip: 'idle', t: 1 }, cat: { p: [2.6, 0, -2.6], r: -0.3, t: 2 } },
  name: { cam: [2.2, 1.9, 8.4], at: [0.9, 1.2, 0.3], fov: 34, dog: { p: [0, 0, 0], r: 0.25, clip: 'idle', t: 2 }, cat: { p: [1.9, 0, 1.8], r: -1.6, t: 0.5 } },
  edge: { cam: [39.5, 4.2, 1.6], at: [54, -4, 0], fov: 52, dog: { p: [45.6, 0, -0.9], r: 0, clip: 'idle', t: 3 }, cat: { p: [45.2, 0, 1.6], r: -0.15, t: 1.2 } },
  fall: { cam: [49.2, 1.4, 6.4], at: [52.8, -2.8, 0.3], fov: 54, dog: { p: [52.6, -2.6, 0.4], r: -2.1, rx: 0.55, rz: 0.4, clip: 'joy', t: 1.1 }, cat: { p: [47.4, 0, -0.6], r: -0.2, t: 0.8 }, debris: [[51.4, -0.9, 1.6], [53.9, -4.2, -0.9], [50.9, -2.0, -1.1], [54.2, -1.4, 1.7], [55.6, -3.4, 0.4]] },
  bottom: { cam: [63.4, -11.3, 0.7], at: [58, -6.2, -0.2], fov: 76, dog: { p: [60.2, -12, 0], r: 0.18, clip: 'sad', t: 3 }, cat: { p: [48.5, 0, 5], r: 0.3, t: 0.3, tilt: -0.5 } },
  climb: { cam: [47.6, 2.8, 12], at: [47.9, 1, 0], fov: 44, dog: { p: [49.5, -0.55, 0], r: -2.15, rz: -0.28, clip: 'joy', t: 0.5 }, cat: { p: [46.1, 0, 0.65], r: -1.15, t: 1.6 } },
  exit: { cam: [15, 3, 5], at: [28, 1.6, 0.8], fov: 40, dog: { p: [27, 0, -1], r: -2.95, clip: 'walk', t: 0.6 }, cat: { p: [27, 0, 2.4], r: -2.95, t: 2 } },
};

function place(o, d) { o.position.set(...d.p); o.rotation.set(d.rx || 0, d.r || 0, d.rz || 0, 'YXZ'); }
const V = a => new THREE.Vector3(...a);

export async function composeShot(shot, look, opt) {
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 900);
  if (SHOTS[shot]) {
    const S = SHOTS[shot]; scene.background = skyTex(look.sky[0], look.sky[1]); scene.fog = new THREE.Fog(look.fog, look.fogNear || 25, look.fogFar || 330);
    scene.add(buildWorld(look));
    const dog = await makeDog(look, opt); place(dog, S.dog); dog.userData.play(S.dog.clip, S.dog.t); scene.add(dog);
    const cat = makeCat(look, opt.catFace); place(cat, S.cat); cat.userData.setT(S.cat.t); if (S.cat.tilt) cat.userData.head.rotation.z = S.cat.tilt; scene.add(cat);
    if (S.debris) { const dg = new THREE.DodecahedronGeometry(1, 0), dmm = mkMat(look, look.wall || look.struct); S.debris.forEach((p, i) => { const r = new THREE.Mesh(dg, dmm); const sc = 0.25 + (i % 3) * 0.15; r.scale.setScalar(sc); r.position.set(...p); r.rotation.set(i, i * 2, i * 3); r.castShadow = true; scene.add(r); }); }
    lights(scene, look, V(S.dog.p)); cam.fov = S.fov; cam.position.set(...S.cam); cam.lookAt(V(S.at));
    return { scene, cam };
  }
  scene.background = new THREE.Color(opt.bg || look.sky[0]);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 48), mkMat(look, opt.floor || look.sand)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.material.userData.outlineParameters = { visible: false }; scene.add(floor);
  lights(scene, look, new THREE.Vector3());
  const [kind, arg] = shot.split(':');
  const dog = await makeDog(look, { ...opt, ears: kind === 'ears' ? arg : opt.ears, face: kind === 'face' ? arg : opt.face }); scene.add(dog);
  const h = dog.userData.head;
  if (kind === 'ears') { dog.rotation.y = -0.5; cam.fov = 30; const hp = h.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.5); cam.position.set(hp.x + 3.6, hp.y + 1.3, hp.z + 3.2); cam.lookAt(hp.x - 0.1, hp.y + 0.35, hp.z); }
  else if (kind === 'face') { cam.fov = 24; cam.position.set(h.x + 2.6, h.y + 0.25, 0.6); cam.lookAt(h.x, h.y, 0); }
  else if (kind === 'duo') { dog.rotation.y = -0.35; const cat = makeCat(look, opt.catFace); cat.position.set(0.6, 0, 2.6); cat.rotation.y = -0.9; cat.userData.setT(1); scene.add(cat); cam.fov = 30; cam.position.set(6.5, 2.6, 7.5); cam.lookAt(0.3, 1.2, 1); }
  else if (kind === 'cat') { scene.remove(dog); const cat = makeCat(look, opt.catFace); cat.rotation.y = -0.6; cat.userData.setT(1); scene.add(cat); cam.fov = 30; cam.position.set(3.4, 1.8, 3.8); cam.lookAt(0, 1.05, 0); }
  else { dog.rotation.y = -0.55; cam.fov = 30; cam.position.set(5.4, 3, 6.2); cam.lookAt(0, 1.1, 0); }
  return { scene, cam };
}
