/* PRXDIGY world — one persistent WebGL scene behind the page. See WORLD.md. */
(function () {
  'use strict';
  const body = document.body;
  const kind = body.dataset.world;
  const canvas = document.querySelector('.world-canvas');
  if (!kind || !canvas) return;
  const T = window.THREE;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fail = () => { body.classList.add('no-webgl'); canvas.remove(); };
  if (!T || !T.GLTFLoader) return fail();

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return fail(); }
  if (!renderer.getContext()) return fail();
  body.classList.add('has-world');

  const ASSETS = body.dataset.assets || '/assets/';
  const LOW = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  const portrait = () => innerWidth / innerHeight < 0.85;

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LOW ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x050506, 1);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(portrait() ? 50 : 38, innerWidth / innerHeight, 0.1, 400);
  const pmrem = new T.PMREMGenerator(renderer);
  // Dark studio with thin bright panels: chrome reads as black-and-white streaks instead of flat gray.
  function studioEnv() {
    const env = new T.Scene();
    env.background = new T.Color(0x000000);
    const panel = (w, h, pos, rot, color, power) => {
      const m = new T.MeshBasicMaterial({ color, side: T.DoubleSide });
      m.color.multiplyScalar(power);
      const p = new T.Mesh(new T.PlaneGeometry(w, h), m);
      p.position.set(...pos); p.lookAt(0, 0, 0);
      if (rot) p.rotation.z += rot;
      env.add(p);
    };
    panel(14, 2.2, [0, 9, 3], 0, 0xffffff, 3.2);      // overhead strip
    panel(1.4, 12, [-9, 1, 4], 0, 0xffffff, 4);       // left strip
    panel(1.1, 12, [9, 0, 2], 0, 0xffffff, 3);        // right strip
    // behind the camera: a chrome-logo gradient (bright sky, dark horizon band, bright floor)
    const grad = document.createElement('canvas'); grad.width = 4; grad.height = 256;
    const gg = grad.getContext('2d'), lg = gg.createLinearGradient(0, 0, 0, 256);
    [[0, '#ffffff'], [0.38, '#c9ccd4'], [0.5, '#1a1b20'], [0.58, '#3a3c44'], [1, '#e8eaf0']].forEach(([o, c]) => lg.addColorStop(o, c));
    gg.fillStyle = lg; gg.fillRect(0, 0, 4, 256);
    const fill = new T.Mesh(new T.PlaneGeometry(26, 14), new T.MeshBasicMaterial({ map: new T.CanvasTexture(grad), side: T.DoubleSide }));
    fill.material.color.setScalar(1.15);
    fill.position.set(0, 0, 12); fill.lookAt(0, 0, 0);
    env.add(fill);
    panel(10, 1.2, [0, -6, 6], 0, 0xff2418, 2.4);     // red kicker from below
    panel(3, 10, [-7, 2, -8], 0, 0x6f5cff, 1.4);      // violet rim
    panel(12, 1.4, [0, 4, -10], 0, 0xffffff, 1.6);    // back strip for edge highlights
    return env;
  }
  scene.environment = pmrem.fromScene(studioEnv(), 0.02).texture;
  // The textured models (Meshy exports: base colour + metal/rough maps) read best under a
  // bright neutral room, the light they were authored in; the dark strip-light studio above
  // is tuned for the code-built chrome and ruby.
  const roomEnv = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;
  function authoredLight(obj, intensity = 1) {
    obj.traverse(n => { if (n.isMesh) { n.material.envMap = roomEnv; n.material.envMapIntensity = intensity; n.material.fog = false; n.material.needsUpdate = true; } });
  }

  // ---------- shared materials + textures ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  function canvasTex(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }
  const dotTex = canvasTex(64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.2, 'rgba(255,255,255,.6)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });
  function cloudTex(seed) {
    return canvasTex(256, (g, s) => {
      let r = seed;
      const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 44; i++) {
        const a = rnd() * Math.PI * 2, d = rnd() * s * 0.2;
        const x = s / 2 + Math.cos(a) * d * 1.2, y = s / 2 + Math.sin(a) * d * 0.75;
        const rad = s * (0.07 + rnd() * 0.13);
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,255,255,0.2)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      }
    });
  }
  const cloudTexA = cloudTex(7), cloudTexB = cloudTex(4242);
  const glowTex = canvasTex(256, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.12, 'rgba(236,228,255,.75)');
    r.addColorStop(0.4, 'rgba(150,128,255,.22)');
    r.addColorStop(1, 'rgba(120,100,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });

  const chrome = () => new T.MeshStandardMaterial({ color: 0xd9dde2, metalness: 0.96, roughness: 0.2, envMapIntensity: 1.25 });
  const ruby = (glow = 1) => {
    const m = new T.MeshStandardMaterial({ metalness: 0.76, roughness: 0.24, envMapIntensity: 1.2 });
    m.color.setRGB(0.44, 0.008, 0.013);
    m.emissive.setRGB(0.035 * glow, 0.0003 * glow, 0.0005 * glow);
    return m;
  };

  // ---------- builders ----------
  function stars(count, box, redShare = 0.1, accent = [1, 0.35, 0.32]) {
    const g = new T.BufferGeometry();
    const p = new Float32Array(count * 3), s = new Float32Array(count), ph = new Float32Array(count), c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = rand(box[0], box[1]); p[i * 3 + 1] = rand(box[2], box[3]); p[i * 3 + 2] = rand(box[4], box[5]);
      s[i] = 0.05 + Math.pow(Math.random(), 7) * 0.32;
      ph[i] = Math.random() * 6.283;
      const red = Math.random() < redShare;
      c[i * 3] = red ? accent[0] : 0.85 + Math.random() * 0.15;
      c[i * 3 + 1] = red ? accent[1] : 0.88 + Math.random() * 0.12;
      c[i * 3 + 2] = red ? accent[2] : 1;
    }
    g.setAttribute('position', new T.BufferAttribute(p, 3));
    g.setAttribute('size', new T.BufferAttribute(s, 1));
    g.setAttribute('phase', new T.BufferAttribute(ph, 1));
    g.setAttribute('tint', new T.BufferAttribute(c, 3));
    const mat = new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uTex: { value: dotTex }, uScale: { value: 1 }, uFade: { value: 1 } },
      vertexShader: `attribute float size; attribute float phase; attribute vec3 tint;
        uniform float uTime; uniform float uScale; varying vec3 vTint; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
          vA = 0.55 + 0.45 * sin(uTime * 1.1 + phase); vTint = tint;
          gl_PointSize = max(1.5, size * uScale / -mv.z); }`,
      fragmentShader: `uniform sampler2D uTex; uniform float uFade; varying vec3 vTint; varying float vA;
        void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vTint * t.rgb, t.a * vA * uFade); }`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    });
    const pts = new T.Points(g, mat);
    pts.frustumCulled = false;
    pts.userData.star = true;
    return pts;
  }

  function cloudField({ count, center, spread, size, tint, opacity, tex = cloudTexA, line = null, jitter = 0.3 }) {
    const pos = [], uv = [], col = [], idx = [];
    const c = new T.Color(), white = new T.Color(0xffffff), base = new T.Color(tint);
    for (let i = 0; i < count; i++) {
      let x, y, z;
      if (line) {
        const k = Math.random();
        x = line[0][0] + (line[1][0] - line[0][0]) * k + rand(-jitter, jitter);
        y = line[0][1] + (line[1][1] - line[0][1]) * k + rand(-jitter, jitter);
        z = line[0][2] + (line[1][2] - line[0][2]) * k + rand(-jitter, jitter) * 0.6;
      } else {
        x = center[0] + rand(-0.5, 0.5) * spread[0];
        y = center[1] + rand(-0.5, 0.5) * spread[1];
        z = center[2] + rand(-0.5, 0.5) * spread[2];
      }
      const w = rand(size[0], size[1]), h = w * rand(0.55, 0.8);
      const b = pos.length / 3;
      pos.push(x - w / 2, y - h / 2, z, x + w / 2, y - h / 2, z, x + w / 2, y + h / 2, z, x - w / 2, y + h / 2, z);
      const flip = Math.random() < 0.5;
      uv.push(flip ? 1 : 0, 0, flip ? 0 : 1, 0, flip ? 0 : 1, 1, flip ? 1 : 0, 1);
      c.copy(base).lerp(white, Math.random() * 0.45);
      const a = opacity * rand(0.45, 1);
      for (let k = 0; k < 4; k++) col.push(c.r, c.g, c.b, a);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 4));
    geo.setIndex(idx);
    const mesh = new T.Mesh(geo, new T.MeshBasicMaterial({
      map: tex, vertexColors: true, transparent: true, depthWrite: false,
      blending: T.AdditiveBlending, fog: false, toneMapped: false,
    }));
    mesh.frustumCulled = false;
    return mesh;
  }

  function glow(size, pos, color = 0xffffff, opacity = 1) {
    const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({
      map: glowTex, color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending, fog: false, toneMapped: false,
    }));
    m.position.set(...pos);
    return m;
  }

  // Clean X: one outline (the union of two chisel-tipped blades, so no z-fighting where they
  // cross), extruded with a single wide flat bevel so every arm has a gem-like centre ridge.
  // Never the broken prxdigy-x.glb.
  function makeX(height = 4, glowAmt = 1) {
    const w = height * 0.085, bs = w * 0.8;   // arm half-width, bevel width
    const a = height * 0.62 - bs, c = w - bs, k = c * 3.6, th = 0.93;
    const dirs = [th, Math.PI - th, Math.PI + th, -th].map(r => new T.Vector2(Math.cos(r), Math.sin(r)));
    const left = d => new T.Vector2(-d.y, d.x);
    const at = (d, along, side) => d.clone().multiplyScalar(along).add(left(d).multiplyScalar(side));
    // where arm i's left edge meets arm i+1's right edge
    const waist = (d1, d2) => {
      const p1 = left(d1).multiplyScalar(c), p2 = left(d2).multiplyScalar(-c);
      const den = d1.x * d2.y - d1.y * d2.x, t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / den;
      return p1.add(d1.clone().multiplyScalar(t));
    };
    const pts = [];
    dirs.forEach((d, i) => {
      const n = dirs[(i + 1) % 4];
      pts.push(at(d, a, 0), at(d, a - k, c), waist(d, n), at(n, a - k, -c));
    });
    // narrow cap + wide single-segment bevel = faceted ridge down every arm
    const geo = new T.ExtrudeGeometry(new T.Shape(pts), {
      depth: height * 0.012, bevelEnabled: true, bevelThickness: height * 0.07,
      bevelSize: bs, bevelSegments: 1, curveSegments: 1,
    });
    geo.center();
    geo.computeVertexNormals();
    const mat = ruby(glowAmt);
    const mesh = new T.Mesh(geo, mat);
    const group = new T.Group();
    group.add(mesh);
    group.userData.material = mat;
    return group;
  }

  // Chrome ring with flat faces + chamfered edges -> crisp highlight bands (lathe, stood upright).
  function makeRing(radius = 3, thick = 0.22, depth = 0.34) {
    const r0 = radius - thick / 2, r1 = radius + thick / 2, h = depth / 2, c = Math.min(thick, depth) * 0.28;
    const prof = [
      [r0 + c, -h], [r1 - c, -h], [r1, -h + c], [r1, h - c], [r1 - c, h], [r0 + c, h], [r0, h - c], [r0, -h + c], [r0 + c, -h],
    ].map(([x, y]) => new T.Vector2(x, y));
    const geo = new T.LatheGeometry(prof, 160);
    geo.rotateX(Math.PI / 2);
    const m = new T.Mesh(geo, chrome());
    return m;
  }

  // The GLB's letter fronts are flat, so they reflect one flat tone. Paint the 2D logo's chrome
  // gradient (bright top, dark horizon line, lighter base) and a slow light sweep onto
  // camera-facing faces only; bevels and sides keep the real environment reflections.
  const sweepTime = { value: 0 };
  function logoFace(mat, box, red) {
    mat.customProgramCacheKey = () => (red ? 'logo-red' : 'logo-chrome');
    mat.onBeforeCompile = sh => {
      sh.uniforms.uTime = sweepTime;
      sh.uniforms.uZ = { value: new T.Vector2(box.min.z, box.max.z) };
      sh.uniforms.uX = { value: new T.Vector2(box.min.x, box.max.x) };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocal; varying vec3 vLocalN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position; vLocalN = normal;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocal; varying vec3 vLocalN; uniform float uTime; uniform vec2 uZ; uniform vec2 uX;')
        .replace('#include <output_fragment>', `
          float t = clamp((uZ.y - vLocal.z) / (uZ.y - uZ.x), 0.0, 1.0);
          float u = clamp((vLocal.x - uX.x) / (uX.y - uX.x), 0.0, 1.0);
          float face = smoothstep(0.75, 0.97, abs(normalize(vLocalN).y));
          ${red
            ? `vec3 grad = mix(vec3(0.16, 0.0, 0.01), vec3(0.95, 0.06, 0.07), smoothstep(0.05, 0.95, t));
               grad += vec3(1.0, 0.35, 0.3) * smoothstep(0.035, 0.0, abs(t - 0.62 - (u - 0.5) * 0.4)) * 0.55;`
            : `vec3 grad = mix(vec3(0.42, 0.44, 0.48), vec3(0.93, 0.95, 0.98), smoothstep(0.08, 0.46, t));
               grad = mix(grad, vec3(0.12, 0.12, 0.14), smoothstep(0.47, 0.5, t) * (1.0 - smoothstep(0.5, 0.56, t)));
               grad = mix(grad, vec3(1.08, 1.1, 1.14), smoothstep(0.62, 0.98, t) * 0.85);`}
          float sweep = smoothstep(0.05, 0.0, abs(fract(u * 0.8 + t * 0.25 - uTime * 0.07) - 0.5)) * 0.35;
          outgoingLight = mix(outgoingLight, grad + sweep, face * 0.88);
          #include <output_fragment>`);
    };
  }

  function gltfLoader() {
    const loader = new T.GLTFLoader();
    if (window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);
    return loader;
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el); });
  }
  async function loadGLB(url) {
    // Preview hosts can't serve .glb, so previews embed each model as base64 in a .glb.js file.
    const name = url.split('/').pop();
    if (window.PRX_PREVIEW && !(window.PRX_GLB && window.PRX_GLB[name])) await loadScript(url + '.js');
    const inline = window.PRX_GLB && window.PRX_GLB[name];
    if (inline) {
      const bytes = Uint8Array.from(atob(inline), ch => ch.charCodeAt(0));
      return new Promise((res, rej) => gltfLoader().parse(bytes.buffer, '', g => res(g.scene), rej));
    }
    return new Promise((res, rej) => gltfLoader().load(url, g => res(g.scene), undefined, rej));
  }

  function visibleAt(dist) {
    const h = 2 * dist * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    return { h, w: h * camera.aspect };
  }

  // ---------- finalized GLB models ----------
  // build.mjs lists the model files that exist (data-models), so nothing 404s. Each model is
  // centred and scaled to fit a unit cube; `turn` corrects how the file was authored.
  const available = new Set((body.dataset.models || '').split(',').filter(Boolean));
  const MODEL_SPEC = {
    'uad-sphere': { turn: [0, 0, 0] },
    'fuji-xh2s': { turn: [0, -0.55, 0] },
    'tlm-103': { turn: [0, 0, 0] },
    'prxdigy-x-final': { turn: [0, 0, 0] },
    'studio-badge': { turn: [0, 0, 0] },
    'creative-emblem': { turn: [0, 0, 0] },
  };
  const modelCache = {};
  function getModel(name) {
    if (!available.has(name)) return Promise.resolve(null);
    if (!modelCache[name]) {
      modelCache[name] = loadGLB(ASSETS + 'models/' + name + '.glb').then(obj => {
        const spec = MODEL_SPEC[name] || { turn: [0, 0, 0] };
        obj.rotation.set(...spec.turn);
        obj.updateMatrixWorld(true);
        const box = new T.Box3().setFromObject(obj), size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
        obj.position.sub(c);
        const fit = new T.Group();
        fit.add(obj);
        fit.scale.setScalar(1 / Math.max(size.x, size.y, size.z, 1e-6));
        authoredLight(fit, 1.05);
        return fit;
      }).catch(err => { console.warn('PRXDIGY: model ' + name + ' did not load', err); return null; });
    }
    return modelCache[name].then(m => (m ? m.clone() : null));
  }

  // Pin a 3D object to a page element: every frame it is placed where that element sits on
  // screen and sized to it, so models sit beside copy instead of over it.
  const anchors = [];
  function pinTo(el, { fill = 0.8, desktop = [0, 0], mobile = [0, 0], depth = 9 } = {}) {
    const holder = new T.Group(), rig = new T.Group();
    holder.add(rig);
    holder.visible = false;
    scene.add(holder);
    anchors.push({ el, holder, fill, desktop, mobile, depth });
    return rig;
  }
  const ndc = new T.Vector3(), ray = new T.Vector3();
  function placeAnchors() {
    anchors.forEach(a => {
      const r = a.el.getBoundingClientRect();
      if (!r.width || !r.height || r.bottom < -innerHeight * 0.25 || r.top > innerHeight * 1.25) { a.holder.visible = false; return; }
      a.holder.visible = true;
      const [ox, oy] = portrait() ? a.mobile : a.desktop;
      const cx = r.left + r.width * (0.5 + ox), cy = r.top + r.height * (0.5 + oy);
      ndc.set((cx / innerWidth) * 2 - 1, -((cy / innerHeight) * 2 - 1), 0.5).unproject(camera);
      ray.copy(ndc).sub(camera.position).normalize();
      a.holder.position.copy(camera.position).addScaledVector(ray, a.depth);
      a.holder.quaternion.copy(camera.quaternion);
      const worldH = 2 * a.depth * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      a.holder.scale.setScalar((Math.min(r.height, r.width * 1.25) / innerHeight) * worldH * a.fill);
    });
  }
  // Idle float + pointer response for a pinned model, with an eased return to rest.
  function presenter(rig, { sway = 0.5, tilt = 0.25, bob = 0.03, base = 0, drift = 0, roll = 0, phase = 0 } = {}) {
    const st = { ry: base, rx: 0, vy: 0, vx: 0 };
    spinners.push((f, dt) => {
      if (!rig.parent.visible) return;
      const t = clock + phase;
      const ty = base + Math.sin(t * 0.45) * 0.35 + pointer.sx * sway, tx = -pointer.sy * tilt + Math.sin(t * 0.33) * roll;
      st.vy += (ty - st.ry) * 30 * dt; st.vy *= Math.exp(-6 * dt); st.ry += st.vy * dt;
      st.vx += (tx - st.rx) * 30 * dt; st.vx *= Math.exp(-6 * dt); st.rx += st.vx * dt;
      rig.rotation.set(st.rx, st.ry, Math.sin(t * 0.27) * roll);
      rig.position.set(Math.sin(t * 0.21) * drift, Math.sin(t * 0.9) * bob + Math.sin(t * 0.37) * drift * 0.6, 0);
    });
  }
  // The X inside its chrome ring: the code-built version right away, replaced by the finalized
  // model (which includes the ring) as soon as it loads. `ring` = ring radius in world units.
  function brandMark(ring, glowAmt, ringThick = ring * 0.07, ringDepth = ring * 0.11) {
    const slot = new T.Group();
    const proc = new T.Group();
    proc.add(makeX(ring * 1.4, glowAmt), makeRing(ring, ringThick, ringDepth));
    slot.add(proc);
    getModel('prxdigy-x-final').then(m => {
      if (!m) return;
      m.scale.multiplyScalar(ring * 2.12);
      // a touch of self-light on the ruby so it glows like the code-built gem did
      m.traverse(n => { if (n.isMesh && n.material.map) { n.material.emissive = new T.Color(0x3a0303); n.material.emissiveMap = n.material.map; n.material.emissiveIntensity = 0.55 * Math.min(glowAmt, 3) / 3 + 0.25; } });
      slot.remove(proc);
      slot.add(m);
    });
    return slot;
  }

  // ---------- worlds ----------
  const cloudLayers = [];
  const spinners = [];

  function buildHome() {
    scene.fog = new T.FogExp2(0x050506, 0.028);
    const sky = stars(LOW ? 1400 : 2600, [-40, 40, -14, 26, -45, 4], 0.08);
    scene.add(sky);

    // wordmark hangs in the stars
    const wordmark = new T.Group();
    wordmark.position.set(0, 0.95, 0);
    scene.add(wordmark);
    const behind = glow(16, [0, 0.9, -3], 0x7a2230, 0.35);
    scene.add(behind);
    const useNewMark = available.has('prxdigy-logo-3d') && !/[?&]wm=classic/.test(location.search);
    if (useNewMark) loadGLB(ASSETS + 'models/prxdigy-logo-3d.glb').then(obj => {
      obj.updateMatrixWorld(true);
      const box = new T.Box3().setFromObject(obj);
      obj.position.sub(box.getCenter(new T.Vector3()));
      authoredLight(obj, 1.1);
      const inner = new T.Group();
      inner.add(obj);
      inner.userData.width = box.getSize(new T.Vector3()).x;
      wordmark.add(inner);
      wordmark.userData.inner = inner;
      fitWordmark();
      wordmark.userData.state = 'warming';
    }).catch(() => body.classList.add('no-wordmark'));
    else loadGLB(ASSETS + 'models/prxdigy-wordmark.glb').then(obj => {
      obj.rotation.x = Math.PI / 2;
      obj.updateMatrixWorld(true);
      const c = new T.Box3().setFromObject(obj).getCenter(new T.Vector3());
      obj.position.sub(c);
      obj.traverse(n => {
        if (!n.isMesh) return;
        n.material.envMapIntensity = 1.3;
        n.material.fog = false;
        const red = (n.material.name || '').toLowerCase().includes('red');
        if (red) n.material.emissive.setRGB(0.12, 0.001, 0.0016);
        n.geometry.computeBoundingBox();
        logoFace(n.material, n.geometry.boundingBox, red);
      });
      const inner = new T.Group();
      inner.add(obj);
      inner.userData.width = 10.07;
      wordmark.add(inner);
      wordmark.userData.inner = inner;
      fitWordmark();
      wordmark.userData.state = 'warming';
    }).catch(() => body.classList.add('no-wordmark'));

    const markTarget = () => Math.min(visibleAt(13).w * (portrait() ? 0.86 : 0.6), 9.2);
    function fitWordmark() {
      const inner = wordmark.userData.inner;
      if (!inner) return;
      inner.scale.setScalar(markTarget() / inner.userData.width);
    }

    // Intro: the flat logo holds the exact spot the 3D logo will occupy. Once the model has
    // loaded and rendered a few frames (textures uploaded, shaders compiled), the flat logo
    // glitches out while the 3D one resolves from coarse pixels to sharp.
    const heroMark = document.querySelector('.hero-mark');
    const heroSection = heroMark && heroMark.closest('section');
    const markPos = new T.Vector3();
    function placeFlatMark() {
      if (!heroMark) return;
      wordmark.getWorldPosition(markPos);
      const dist = markPos.distanceTo(camera.position);
      markPos.project(camera);
      const top = heroSection.getBoundingClientRect().top;
      heroMark.style.left = ((markPos.x + 1) / 2 * innerWidth) + 'px';
      heroMark.style.top = ((1 - markPos.y) / 2 * innerHeight - top) + 'px';
      const w = markTarget() / visibleAt(dist).w * innerWidth;
      heroMark.style.width = w + 'px';
      const cx = (markPos.x + 1) / 2, cy = (markPos.y + 1) / 2, hw = (w / innerWidth) * 0.62, hh = (w / 4.2 / innerHeight) * 1.1;
      reveal.box = [cx - hw, cy - hh, cx + hw, cy + hh];
    }

    // violet cloud sea + light bloom passing through
    const n = LOW ? 60 : 110, big = LOW ? 1.6 : 2;
    const sz = (a, b) => [a * big, b * big];
    const homeClouds = [
      cloudField({ count: n, center: [0, -10, -6], spread: [60, 8, 28], size: sz(5, 11), tint: 0x6f5cff, opacity: 0.22 }),
      cloudField({ count: n, center: [0, -13, -3], spread: [60, 7, 24], size: sz(5, 12), tint: 0x9d8cff, opacity: 0.19, tex: cloudTexB }),
      cloudField({ count: Math.round(n * 0.6), center: [0, -7.5, -12], spread: [72, 5, 22], size: sz(6, 13), tint: 0x5a46e0, opacity: 0.16 }),
      cloudField({ count: Math.round(n * 0.8), center: [0, -16.5, -6], spread: [64, 6, 26], size: sz(5, 12), tint: 0x7a66ff, opacity: 0.18, tex: cloudTexB }),
      cloudField({ count: Math.round(n * 0.7), center: [0, -19.5, -10], spread: [70, 5, 26], size: sz(6, 13), tint: 0x5a46e0, opacity: 0.15 }),
    ];
    homeClouds.forEach((m, i) => { scene.add(m); cloudLayers.push({ mesh: m, speed: [0.14, -0.1, 0.07, -0.08, 0.06][i], span: 60 }); });
    const bloomCore = glow(30, [3, -9, -16], 0xe6dcff, 0.5);
    scene.add(bloomCore);

    // ground: black mirror + the ruby X monument far off
    const floorY = -27.5;
    if (!LOW && T.Reflector) {
      const mirror = new T.Reflector(new T.PlaneGeometry(260, 260), {
        textureWidth: Math.floor(innerWidth * 0.5), textureHeight: Math.floor(innerHeight * 0.5), color: 0x2a2a30, clipBias: 0.003,
      });
      mirror.rotation.x = -Math.PI / 2;
      mirror.position.y = floorY;
      scene.add(mirror);
      const veil = new T.Mesh(new T.PlaneGeometry(260, 260), new T.MeshBasicMaterial({ color: 0x050506, transparent: true, opacity: 0.66 }));
      veil.rotation.x = -Math.PI / 2;
      veil.position.y = floorY + 0.01;
      scene.add(veil);
    } else {
      const floor = new T.Mesh(new T.PlaneGeometry(260, 260), new T.MeshBasicMaterial({ color: 0x070709 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = floorY;
      scene.add(floor);
    }

    const mon = new T.Group();
    mon.position.set(0, floorY + 4.6, -18);
    const X = brandMark(3.9, 3, 0.26, 0.42);
    mon.add(X);
    scene.add(mon);
    const redLight = new T.PointLight(0xff2a1a, 2.5, 26, 1.6);
    redLight.position.set(0, floorY + 3.2, -14.5);
    scene.add(redLight);
    const pool = glow(26, [0, floorY + 0.05, -17], 0xff2a1a, 0.1);
    pool.rotation.x = -Math.PI / 2;
    scene.add(pool);
    const halo = glow(15, [0, floorY + 4.6, -19.5], 0xff3020, 0.24);
    scene.add(halo);
    const dust = stars(LOW ? 300 : 600, [-30, 30, floorY, floorY + 16, -40, 10], 0.5);
    dust.material.uniforms.uFade.value = 0.45;
    scene.add(dust);

    spinners.push(f => {
      const inner = wordmark.userData.inner;
      const ud = wordmark.userData;
      if (ud.state !== 'shown') placeFlatMark();
      if (inner) {
        inner.rotation.y = Math.sin(clock * 0.3) * 0.07 + pointer.sx * 0.14;
        inner.rotation.x = -pointer.sy * 0.08 - Math.min(f, 1.2) * 0.35;
        let e = 1;
        if (ud.state === 'warming') {
          e = 0.001; // drawn but invisible, so every texture is on the GPU before the reveal
          ud.warm = (ud.warm || 0) + 1;
          if (ud.warm > 4) { ud.state = reduce ? 'shown' : 'revealing'; ud.start = clock; body.classList.add('world-wordmark'); }
        } else if (ud.state === 'revealing') {
          const t = Math.min(1, (clock - ud.start) / 1.35);
          const k = 1 - Math.pow(1 - t, 3);
          reveal.pixel = 1 + 46 * (1 - k);
          reveal.shift = (1 - k) * 0.006;
          e = Math.min(1, t * 6);
          if (t >= 1) { ud.state = 'shown'; reveal.pixel = 0; reveal.shift = 0; }
        }
        inner.traverse(o => { if (o.material) { o.material.transparent = e < 1; o.material.opacity = e; } });
      }
      mon.rotation.y = Math.sin(clock * 0.25) * 0.1 + (f - 2) * 0.22;
      X.rotation.z = Math.sin(clock * 0.4) * 0.015;
      redLight.intensity = 2.5 + Math.sin(clock * 1.4) * 0.4;
      bloomCore.material.opacity = 0.25 + Math.max(0, 1 - Math.abs(f - 1) * 1.4) * 0.3;
    });
    onResize.push(fitWordmark);

    const MON = { x: 0, y: floorY + 4.6, z: -18 };
    return {
      bloom: [0.28, 0.35, 0.86],
      keys: {
        sky: { pos: [0, 0, 13], look: [0, 0.1, 0] },
        clouds: { pos: [0, -10.5, 11], look: [0, -9.2, 0] },
        split: { pos: [0, -22.4, 17], look: [0, -24.6, -18] },
        statement: { pos: [-5.4, -23.2, 4], look: [MON.x - 5.2, MON.y - 0.4, MON.z] },
        contact: { pos: [-4.2, -23.4, -1.5], look: [MON.x - 3.6, MON.y - 0.3, MON.z] },
      },
      mobileKeys: {
        sky: { pos: [0, 0, 13], look: [0, -1.7, 0] },
        clouds: { pos: [0, -10.5, 11], look: [0, -9.2, 0] },
        split: { pos: [0, -22, 17], look: [0, -22.8, -18] },
        statement: { pos: [0, -23.2, 3], look: [0, MON.y - 2.6, MON.z] },
        contact: { pos: [0, -23.5, -2.5], look: [0, MON.y - 2.4, MON.z] },
      },
    };
  }

  function sideAnchor(obj, desktop, mobile) {
    const place = () => obj.position.set(...(portrait() ? mobile : desktop));
    place();
    onResize.push(place);
  }

  function buildLongIsland() {
    scene.fog = new T.FogExp2(0x050506, 0.035);
    const n = LOW ? 60 : 110;
    const ceil1 = cloudField({ count: n, center: [0, 7.2, -8], spread: [44, 2.4, 22], size: [4, 9], tint: 0xd8161e, opacity: 0.2 });
    const ceil2 = cloudField({ count: n, center: [0, 8.4, -12], spread: [50, 2, 18], size: [5, 10], tint: 0xff3b2a, opacity: 0.16, tex: cloudTexB });
    // Lower banks so the clouds follow the camera down to the photo slideshow.
    const low1 = cloudField({ count: Math.round(n * 0.8), center: [0, 1.5, -14], spread: [50, 3.5, 12], size: [5, 11], tint: 0xc8141c, opacity: 0.16 });
    const low2 = cloudField({ count: Math.round(n * 0.8), center: [0, -3.5, -15], spread: [52, 4, 12], size: [6, 12], tint: 0xff3b2a, opacity: 0.13, tex: cloudTexB });
    const low3 = cloudField({ count: Math.round(n * 0.6), center: [0, -7.5, -16], spread: [54, 3, 10], size: [6, 12], tint: 0xb01018, opacity: 0.12 });
    const clouds = [ceil1, ceil2, low1, low2, low3];
    clouds.forEach((m, i) => { scene.add(m); cloudLayers.push({ mesh: m, speed: [0.08, -0.06, 0.05, -0.05, 0.04][i], span: 48 }); });
    const dust = stars(LOW ? 260 : 520, [-22, 22, -14, 8, -30, 6], 0.55);
    dust.material.uniforms.uFade.value = 0.5;
    scene.add(dust);

    const stamp = new T.Group();
    stamp.add(brandMark(2.35, 4, 0.2, 0.34));
    scene.add(stamp);
    sideAnchor(stamp, [3.1, 0.2, -1], [0, 2.6, -3]);
    const light = new T.PointLight(0xff2a1a, 2, 14, 1.8);
    stamp.add(light); light.position.set(0, -0.4, 2.4);
    const halo = glow(10, [0, 0, -1.2], 0xff3020, 0.32);
    stamp.add(halo);

    // The clouds run from the top of the page down to the photo slideshow: full strength
    // until just before the gallery (beat 2), faded out once it is centred.
    spinners.push(f => {
      stamp.rotation.y = Math.sin(clock * 0.3) * 0.12 + pointer.sx * 0.2 + f * 0.35;
      stamp.rotation.x = -pointer.sy * 0.1;
      const keep = Math.min(1, Math.max(0, (2.35 - f) / 0.6));
      clouds.forEach(m => { m.material.opacity = keep; m.visible = keep > 0.01; });
    });

    const gearStage = document.querySelector('[data-anchor="li-gear"]');
    const hasGear = !!gearStage && (available.has('uad-sphere') || available.has('fuji-xh2s'));
    if (hasGear) {
      [['uad-sphere', { fill: 0.64, desktop: [-0.08, -0.19], mobile: [-0.22, 0] }, { sway: 0.6, base: 0.2, bob: 0.06, drift: 0.05, roll: 0.12, phase: 0 }],
       ['fuji-xh2s', { fill: 0.52, desktop: [0.06, 0.25], mobile: [0.24, 0.04] }, { sway: 0.7, base: -0.5, bob: 0.07, drift: 0.06, roll: 0.16, phase: 2.1 }]].forEach(([name, pin, motion]) => {
        getModel(name).then(m => {
          if (!m) return;
          const rig = pinTo(gearStage, pin);
          rig.add(m);
          presenter(rig, motion);
        });
      });
      const gearLight = new T.PointLight(0xff3020, 1.2, 30, 1.6);
      camera.add(gearLight);
      gearLight.position.set(-3, 2, 2);
      scene.add(camera);
    }
    return {
      bloom: [0.26, 0.35, 0.86],
      keys: {
        hero: { pos: [0, 0, 11], look: [0, 0.6, 0] },
        listen: { pos: [0.4, -3.2, 11], look: [0.6, -1.6, 0], dim: 0.75 },
        gallery: { pos: [0.4, -6, 11], look: [0.6, -4.5, 0], dim: 0.45 },
        services: { pos: [0, -8, 11], look: [0, -7, 0], dim: hasGear ? 0.95 : 0.3 },
        story: { pos: [0, -9.5, 11], look: [0, -8.5, 0], dim: 0.3 },
        book: { pos: [0, -11, 11], look: [0, -10, 0], dim: 0.16 },
      },
      mobileKeys: {
        hero: { pos: [0, -0.5, 13], look: [0, -0.4, 0] },
        listen: { pos: [0, -5.5, 11], look: [0, -5.2, 0], dim: 0.5 },
      },
    };
  }

  function makeCapsule() {
    const g = new T.Group();
    const R = 1, H = 1.25, seg = 24;
    const half = sign => {
      const pts = [];
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI / 2;
        pts.push(new T.Vector2(Math.cos(a) * R, sign * (H + Math.sin(a) * R)));
      }
      pts.reverse();
      pts.push(new T.Vector2(R, 0));
      pts.reverse();
      if (sign < 0) pts.reverse();
      return new T.LatheGeometry(pts.map(p => new T.Vector2(Math.max(p.x, 0.0001), p.y)), 96);
    };
    const top = new T.Mesh(half(1), chrome());
    // Real refraction where the GPU can afford it; a light tinted glass elsewhere.
    const glass = LOW
      ? new T.MeshStandardMaterial({ color: 0x9aa3b5, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.22, envMapIntensity: 1.6, depthWrite: false, side: T.DoubleSide })
      : new T.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.35, ior: 1.45, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.5, side: T.DoubleSide });
    const bottom = new T.Mesh(half(-1), glass);
    const band = new T.Mesh(new T.TorusGeometry(R * 1.01, 0.05, 16, 96), chrome());
    band.rotation.x = Math.PI / 2;
    // The logo floats inside the glass half; `inner` counter-rotates so it stays upright.
    const inner = new T.Group();
    inner.add(brandMark(0.7, 5, 0.06, 0.09));
    inner.position.set(0, -H * 0.85, 0);
    g.add(top, bottom, band, inner);
    g.rotation.z = -Math.PI / 2;
    g.userData.inner = inner;
    return g;
  }

  function buildCreative() {
    scene.fog = new T.FogExp2(0x050506, 0.03);
    const sky = stars(LOW ? 700 : 1300, [-30, 30, -18, 12, -40, 2], 0.12);
    scene.add(sky);
    const n = LOW ? 50 : 90;
    const floorClouds = cloudField({ count: n, center: [0, -13.5, -8], spread: [50, 3, 24], size: [5, 11], tint: 0x6f5cff, opacity: 0.18 });
    scene.add(floorClouds);
    cloudLayers.push({ mesh: floorClouds, speed: 0.07, span: 50 });

    const cap = makeCapsule();
    const holder = new T.Group();
    holder.add(cap);
    holder.scale.setScalar(1.02);
    scene.add(holder);
    sideAnchor(holder, [3.3, -6.2, -1], [0, -5.8, -2]);
    holder.add(glow(6, [0, -1.6, -0.8], 0xff2a1a, 0.18));
    const light = new T.PointLight(0xff2a1a, 1.6, 12, 1.8);
    light.position.set(0, 0, 2.2);
    holder.add(light);
    holder.add(glow(9, [0, 0, -1.6], 0xff3020, 0.28));

    // Springs: pointer and scroll push the pill hard, then it eases back to rest.
    const emblemStage = document.querySelector('[data-anchor="creative-emblem"]');
    const hasEmblem = !!emblemStage && available.has('creative-emblem');
    if (hasEmblem) getModel('creative-emblem').then(m => {
      if (!m) return;
      const rig = pinTo(emblemStage, { fill: 0.95 });
      rig.add(m);
      presenter(rig, { sway: 0.6, tilt: 0.25, bob: 0.02 });
    });
    const k = LOW ? 0.5 : 1;
    const st = { ry: -0.35, vy: 0, rx: 0, vx: 0, roll: 0, vroll: 0 };
    spinners.push((f, dt, vel) => {
      const ty = -0.35 + pointer.sx * 0.95 * k + Math.sin(clock * 0.25) * 0.06;
      const tx = pointer.sy * 0.45 * k;
      st.vy += (ty - st.ry) * 34 * dt; st.vy *= Math.exp(-5.5 * dt); st.ry += st.vy * dt;
      st.vx += (tx - st.rx) * 34 * dt; st.vx *= Math.exp(-5.5 * dt); st.rx += st.vx * dt;
      st.vroll += vel * 0.0016 * k * dt;
      st.vroll += -st.roll * 18 * dt; st.vroll *= Math.exp(-3.2 * dt); st.roll += st.vroll * dt;
      const spin = f * 1.6 + st.roll + Math.sin(clock * 0.35) * 0.08;
      cap.rotation.x = spin;
      holder.rotation.set(st.rx, st.ry, 0);
      cap.userData.inner.rotation.y = -spin;
    });
    return {
      bloom: [0.26, 0.35, 0.86],
      keys: {
        hero: { pos: [0, 0, 12], look: [0, -0.4, 0], dim: 0.8 },
        results: { pos: [0, -6.2, 10], look: [0, -6.2, 0] },
        capabilities: { pos: [0.4, -9, 10], look: [0.6, -8, 0], dim: 0.25 },
        work: { pos: [0.2, -11, 10], look: [0.3, -10.4, 0], dim: 0.35 },
        process: { pos: [0, -12.5, 10], look: [0, -12, 0], dim: 0.35 },
        contact: hasEmblem ? { pos: [0, -13.2, 11], look: [0, -13.6, 0], dim: 0.9 } : { pos: [1.7, -6.3, 10], look: [1.9, -6.2, 0], dim: 0.7 },
      },
      mobileKeys: {
        hero: { pos: [0, 1.6, 12], look: [0, 1.4, 0], dim: 0.6 },
        results: { pos: [0, -6, 10], look: [0, -7.6, 0] },
        contact: hasEmblem ? { pos: [0, -13.2, 11], look: [0, -13.6, 0], dim: 0.9 } : { pos: [0, -6.2, 10], look: [0, -7.4, 0], dim: 0.6 },
      },
    };
  }

  function buildBrooklyn() {
    const BLUE = 0x2f64ff, BLUE_2 = 0x5b8cff, ICE = 0xe4ecff;
    scene.fog = new T.FogExp2(0x02040d, 0.03);
    renderer.setClearColor(0x02030a, 1);
    const dust = stars(LOW ? 320 : 700, [-24, 24, -14, 10, -30, 6], 0.22, [0.45, 0.62, 1]);
    dust.material.uniforms.uFade.value = 0.6;
    scene.add(dust);
    const haze = cloudField({ count: LOW ? 40 : 70, center: [0, -9, -10], spread: [50, 4, 20], size: [6, 12], tint: 0x1d3cff, opacity: 0.12 });
    scene.add(haze);
    cloudLayers.push({ mesh: haze, speed: 0.06, span: 50 });

    // The installation: an X of LED-lit cloud between two uprights, with a beam across the top
    // and the bottom, the way it hangs in the room.
    const inst = new T.Group();
    const L = 2.7, per = LOW ? 70 : 120, W = L * 1.08, Hh = L * 1.25;
    const strip = (from, to, tint, count, tex = cloudTexA, op = 0.34) => cloudField({ count, line: [from, to], size: [0.7, 1.6], tint, opacity: op, jitter: 0.2, tex });
    inst.add(
      strip([-W, -Hh, 0], [W, Hh, 0], BLUE_2, per),
      strip([-W, Hh, 0.1], [W, -Hh, 0.1], BLUE, per, cloudTexB),
      strip([-W, -Hh, -0.2], [-W, Hh, -0.2], BLUE, Math.round(per * 0.55), cloudTexA, 0.26),
      strip([W, -Hh, -0.2], [W, Hh, -0.2], BLUE, Math.round(per * 0.55), cloudTexB, 0.26),
      strip([-6.5, Hh + 0.3, -1.2], [6.5, Hh + 0.3, -1.2], BLUE_2, Math.round(per * 0.6), cloudTexA, 0.24),
      strip([-6.5, -Hh - 0.2, -1.2], [6.5, -Hh - 0.2, -1.2], BLUE, Math.round(per * 0.6), cloudTexB, 0.2),
      glow(7, [0, 0, -0.4], ICE, 0.55), glow(20, [0, 0, -2], BLUE, 0.34),
    );
    const blueLight = new T.PointLight(0x3a6bff, 2.2, 22, 1.6);
    blueLight.position.set(0, 0, 3);
    inst.add(blueLight);
    scene.add(inst);
    sideAnchor(inst, [3.3, 0.2, -2.5], [0, 2.2, -4]);

    spinners.push(f => {
      inst.rotation.y = Math.sin(clock * 0.2) * 0.08 + pointer.sx * 0.15 + f * 0.12;
      inst.rotation.x = -pointer.sy * 0.08;
      inst.scale.setScalar(1 + Math.sin(clock * 0.8) * 0.012);
      blueLight.intensity = 2.2 + Math.sin(clock * 1.3) * 0.35;
    });

    const micStage = document.querySelector('[data-anchor="bk-mic"]');
    const hasMic = !!micStage && available.has('tlm-103');
    if (hasMic) {
      getModel('tlm-103').then(m => {
        if (!m) return;
        const rig = pinTo(micStage, { fill: 0.9, depth: 8 });
        rig.add(m);
        presenter(rig, { sway: 0.55, tilt: 0.2, bob: 0.05, drift: 0.03, roll: 0.08 });
      });
      const rim = new T.PointLight(0x4d7cff, 1.6, 30, 1.6);
      camera.add(rim);
      rim.position.set(3, 1.5, 1);
      scene.add(camera);
    }
    return {
      bloom: [0.34, 0.42, 0.78],
      keys: {
        hero: { pos: [0, 0, 11], look: [0, 0.3, 0] },
        installation: { pos: [1.4, 0, 7.5], look: [2.3, 0.1, -2.5], dim: hasMic ? 0.8 : 0.45 },
        room: { pos: [0.6, -4, 11], look: [0.8, -3, 0], dim: 0.35 },
        services: { pos: [0.4, -6.5, 11], look: [0.6, -5.5, 0], dim: 0.35 },
        links: { pos: [0, -3, 12], look: [0, -2, 0], dim: 0.55 },
      },
      mobileKeys: {
        installation: { pos: [0, 1, 8], look: [0, 1.6, -4], dim: hasMic ? 0.75 : 0.4 },
      },
    };
  }

  // The Team: a quiet starfield with a blue glow under the portraits.
  function buildTeam() {
    scene.fog = new T.FogExp2(0x03040a, 0.03);
    scene.add(stars(LOW ? 700 : 1300, [-30, 30, -16, 14, -40, 4], 0.18, [0.45, 0.62, 1]));
    const floor = cloudField({ count: LOW ? 45 : 80, center: [0, -9, -10], spread: [52, 4, 22], size: [6, 12], tint: 0x2f5bff, opacity: 0.14 });
    scene.add(floor);
    cloudLayers.push({ mesh: floor, speed: 0.06, span: 52 });
    scene.add(glow(30, [0, -7, -14], 0x2f5bff, 0.28));
    const badgeStage = document.querySelector('[data-anchor="team-badge"]');
    if (badgeStage && available.has('studio-badge')) getModel('studio-badge').then(m => {
      if (!m) return;
      const rig = pinTo(badgeStage, { fill: 0.9 });
      rig.add(m);
      presenter(rig, { sway: 0.7, tilt: 0.3 });
      const key = new T.PointLight(0x5b8cff, 1.4, 30, 1.6);
      camera.add(key); key.position.set(-2, 2, 2); scene.add(camera);
    });
    return { bloom: [0.26, 0.35, 0.86], keys: { hero: { pos: [0, 0, 12], look: [0, 0.2, 0] }, members: { pos: [0, -3.5, 12], look: [0, -4.5, 0], dim: 0.7 } } };
  }

  function buildLost() {
    scene.fog = new T.FogExp2(0x050506, 0.03);
    scene.add(stars(LOW ? 900 : 1600, [-30, 30, -14, 14, -40, 4], 0.1));
    const X = brandMark(1.75, 4);
    sideAnchor(X, [3.2, 0.2, -1], [0, 2.2, -2]);
    scene.add(X);
    spinners.push(() => { X.rotation.y = Math.sin(clock * 0.4) * 0.3 + pointer.sx * 0.3; });
    return { bloom: [0.28, 0.35, 0.86], keys: { hero: { pos: [0, 0, 11], look: [0, 0.2, 0] } } };
  }

  const onResize = [];
  const reveal = { pixel: 0, shift: 0, box: [0, 0, 1, 1] }; // intro pixel-resolve (uv box), driven by the home wordmark
  let clock = 0;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const builders = { home: buildHome, 'long-island': buildLongIsland, creative: buildCreative, brooklyn: buildBrooklyn, team: buildTeam, lost: buildLost };
  const world = (builders[kind] || buildLost)();

  // ---------- post ----------
  const composer = new T.EffectComposer(renderer);
  composer.addPass(new T.RenderPass(scene, camera));
  const bloom = new T.UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), ...world.bloom);
  composer.addPass(bloom);
  const finish = new T.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uShift: { value: 0 }, uTime: { value: 0 }, uPixel: { value: 0 }, uRes: { value: new T.Vector2(1, 1) }, uBox: { value: new T.Vector4(0, 0, 1, 1) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uShift; uniform float uTime; uniform float uPixel; uniform vec2 uRes; uniform vec4 uBox; varying vec2 vUv;
      void main(){
        vec2 uv = vUv;
        if (uPixel > 1.0 && uv.x > uBox.x && uv.y > uBox.y && uv.x < uBox.z && uv.y < uBox.w) { vec2 cells = uRes / uPixel; uv = (floor(uv * cells) + 0.5) / cells; }
        vec2 d = uv - 0.5;
        vec2 o = vec2(uShift, uShift * 0.25) * (0.35 + length(d));
        vec4 c = texture2D(tDiffuse, uv);
        c.r = texture2D(tDiffuse, uv + o).r;
        c.b = texture2D(tDiffuse, uv - o).b;
        float v = smoothstep(0.92, 0.3, length(d * vec2(1.0, 0.85)));
        c.rgb *= mix(0.62, 1.0, v);
        float n = fract(sin(dot(vUv * 1000.0 + uTime, vec2(12.9898, 78.233))) * 43758.5453);
        c.rgb += (n - 0.5) * 0.028;
        gl_FragColor = c;
      }`,
  });
  composer.addPass(finish);

  // ---------- scroll -> camera ----------
  const beats = [...document.querySelectorAll('[data-beat]')].filter(el => world.keys[el.dataset.beat]);
  const keysFor = () => beats.map(el => {
    const name = el.dataset.beat;
    return Object.assign({ dim: 1 }, world.keys[name], portrait() && world.mobileKeys && world.mobileKeys[name] ? world.mobileKeys[name] : {});
  });
  let keys = keysFor();
  let centers = [];
  function measure() {
    const y = scrollY;
    centers = beats.map(el => { const r = el.getBoundingClientRect(); return r.top + y + r.height / 2; });
  }
  function targetF() {
    if (beats.length < 2) return 0;
    const vc = scrollY + innerHeight / 2;
    if (vc <= centers[0]) return 0;
    for (let i = 0; i < centers.length - 1; i++) {
      if (vc < centers[i + 1]) {
        const t = (vc - centers[i]) / (centers[i + 1] - centers[i]);
        return i + t;
      }
    }
    return centers.length - 1;
  }
  const ease = t => t * t * (3 - 2 * t);
  const tmpA = new T.Vector3(), tmpB = new T.Vector3(), look = new T.Vector3();
  function applyCamera(f) {
    const i = Math.min(Math.floor(f), keys.length - 1), j = Math.min(i + 1, keys.length - 1), t = ease(f - i);
    const A = keys[i] || { pos: [0, 0, 12], look: [0, 0, 0], dim: 1 }, B = keys[j] || A;
    tmpA.fromArray(A.pos); tmpB.fromArray(B.pos);
    camera.position.lerpVectors(tmpA, tmpB, t);
    tmpA.fromArray(A.look); tmpB.fromArray(B.look);
    look.lerpVectors(tmpA, tmpB, t);
    if (!reduce) {
      camera.position.x += pointer.sx * 0.35;
      camera.position.y += pointer.sy * 0.2;
    }
    camera.lookAt(look);
    const dim = A.dim + (B.dim - A.dim) * t;
    canvas.style.opacity = (dim * intro).toFixed(3);
  }

  // ---------- smooth scroll ----------
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href*="#"]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || url.hash.length < 2) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70 });
      history.replaceState(null, '', url.hash);
    });
  }

  if (!reduce) {
    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      pointer.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / innerHeight) * 2 - 1);
    }, { passive: true });
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.fov = portrait() ? 50 : 38;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setSize(innerWidth, innerHeight);
    renderer.getDrawingBufferSize(finish.uniforms.uRes.value);
    const scale = renderer.getPixelRatio() * innerHeight / 2 / Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    scene.traverse(o => { if (o.userData.star || (o.material && o.material.uniforms && o.material.uniforms.uScale)) o.material.uniforms.uScale.value = scale; });
    keys = keysFor();
    measure();
    onResize.forEach(fn => fn());
  }
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); });
  addEventListener('load', measure);
  resize();

  // ---------- loop ----------
  let f = targetF(), last = performance.now(), lastScroll = scrollY, velocity = 0, running = true, shown = false, intro = 0;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (lenis) lenis.raf(now);
    clock += reduce ? 0 : dt;
    intro = Math.min(1, intro + dt / 1.2);
    const tf = targetF();
    f = reduce ? Math.round(tf) : f + (tf - f) * (1 - Math.exp(-dt * 7));
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
    const v = (scrollY - lastScroll) / dt;
    lastScroll = scrollY;
    velocity += (v - velocity) * (1 - Math.exp(-dt * 10));
    finish.uniforms.uShift.value = reduce ? 0 : Math.max(-0.009, Math.min(0.009, velocity * 0.0000075)) + reveal.shift;
    finish.uniforms.uPixel.value = reveal.pixel * renderer.getPixelRatio();
    finish.uniforms.uBox.value.set(...reveal.box);
    finish.uniforms.uTime.value = clock;
    cloudLayers.forEach(l => { l.mesh.position.x = Math.sin(clock * l.speed * 0.1) * l.span * 0.12; });
    scene.traverse(o => { if (o.userData.star) o.material.uniforms.uTime.value = clock; });
    sweepTime.value = clock;
    applyCamera(f);
    spinners.forEach(fn => fn(f, dt, reduce ? 0 : velocity));
    placeAnchors();
    composer.render(dt);
    if (!shown) { shown = true; body.classList.add('world-ready'); }
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
})();
