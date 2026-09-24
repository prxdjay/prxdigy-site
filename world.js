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
  function stars(count, box, redShare = 0.1) {
    const g = new T.BufferGeometry();
    const p = new Float32Array(count * 3), s = new Float32Array(count), ph = new Float32Array(count), c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = rand(box[0], box[1]); p[i * 3 + 1] = rand(box[2], box[3]); p[i * 3 + 2] = rand(box[4], box[5]);
      s[i] = 0.05 + Math.pow(Math.random(), 7) * 0.32;
      ph[i] = Math.random() * 6.283;
      const red = Math.random() < redShare;
      c[i * 3] = red ? 1 : 0.85 + Math.random() * 0.15;
      c[i * 3 + 1] = red ? 0.35 : 0.88 + Math.random() * 0.12;
      c[i * 3 + 2] = red ? 0.32 : 1;
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

  function loadGLB(url) {
    // Previews that can't serve .glb embed it as base64 (window.PRX_GLB[url basename]).
    const inline = window.PRX_GLB && window.PRX_GLB[url.split('/').pop()];
    if (inline) {
      const bytes = Uint8Array.from(atob(inline), ch => ch.charCodeAt(0));
      return new Promise((res, rej) => new T.GLTFLoader().parse(bytes.buffer, '', g => res(g.scene), rej));
    }
    return new Promise((res, rej) => new T.GLTFLoader().load(url, g => res(g.scene), undefined, rej));
  }

  function visibleAt(dist) {
    const h = 2 * dist * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    return { h, w: h * camera.aspect };
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
    loadGLB(ASSETS + 'models/prxdigy-wordmark.glb').then(obj => {
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
      wordmark.userData.born = clock;
      body.classList.add('world-wordmark');
    }).catch(() => body.classList.add('no-wordmark'));

    function fitWordmark() {
      const inner = wordmark.userData.inner;
      if (!inner) return;
      const vis = visibleAt(13);
      const target = Math.min(vis.w * (portrait() ? 0.86 : 0.6), 9.2);
      inner.scale.setScalar(target / inner.userData.width);
    }

    // violet cloud sea + light bloom passing through
    const n = LOW ? 70 : 130;
    const clouds1 = cloudField({ count: n, center: [0, -10, -6], spread: [46, 7, 26], size: [5, 11], tint: 0x6f5cff, opacity: 0.26 });
    const clouds2 = cloudField({ count: n, center: [0, -13, -2], spread: [46, 6, 22], size: [5, 12], tint: 0x9d8cff, opacity: 0.22, tex: cloudTexB });
    const clouds3 = cloudField({ count: Math.round(n * 0.6), center: [0, -7.5, -10], spread: [60, 4, 20], size: [6, 13], tint: 0x5a46e0, opacity: 0.18 });
    [clouds1, clouds2, clouds3].forEach((m, i) => { scene.add(m); cloudLayers.push({ mesh: m, speed: [0.14, -0.1, 0.07][i], span: 46 }); });
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
    const X = makeX(5.4, 3);
    const ring = makeRing(3.9, 0.26, 0.42);
    mon.add(X, ring);
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
      if (inner) {
        inner.rotation.y = Math.sin(clock * 0.3) * 0.07 + pointer.sx * 0.14;
        inner.rotation.x = -pointer.sy * 0.08 - Math.min(f, 1.2) * 0.35;
        const born = Math.min(1, (clock - wordmark.userData.born) / 1.4);
        const e = 1 - Math.pow(1 - born, 3);
        wordmark.position.y = 0.95 - (1 - e) * 0.6;
        inner.visible = true;
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
    const ceil1 = cloudField({ count: n, center: [0, 7.2, -8], spread: [44, 2.4, 22], size: [4, 9], tint: 0x5e6dff, opacity: 0.22 });
    const ceil2 = cloudField({ count: n, center: [0, 8.4, -12], spread: [50, 2, 18], size: [5, 10], tint: 0x8f86ff, opacity: 0.2, tex: cloudTexB });
    [ceil1, ceil2].forEach((m, i) => { scene.add(m); cloudLayers.push({ mesh: m, speed: [0.08, -0.06][i], span: 44 }); });
    const dust = stars(LOW ? 260 : 520, [-22, 22, -14, 8, -30, 6], 0.55);
    dust.material.uniforms.uFade.value = 0.5;
    scene.add(dust);

    const stamp = new T.Group();
    const X = makeX(3.3, 4);
    stamp.add(X, makeRing(2.35, 0.2, 0.34));
    scene.add(stamp);
    sideAnchor(stamp, [3.1, 0.2, -1], [0, 2.6, -3]);
    const light = new T.PointLight(0xff2a1a, 2, 14, 1.8);
    stamp.add(light); light.position.set(0, -0.4, 2.4);
    const halo = glow(10, [0, 0, -1.2], 0xff3020, 0.32);
    stamp.add(halo);

    spinners.push(f => {
      stamp.rotation.y = Math.sin(clock * 0.3) * 0.12 + pointer.sx * 0.2 + f * 0.35;
      stamp.rotation.x = -pointer.sy * 0.1;
    });
    return {
      bloom: [0.26, 0.35, 0.86],
      keys: {
        hero: { pos: [0, 0, 11], look: [0, 0.6, 0] },
        listen: { pos: [0.4, -3.2, 11], look: [0.6, -1.6, 0], dim: 0.55 },
        gallery: { pos: [0.4, -6, 11], look: [0.6, -4.5, 0], dim: 0.35 },
        services: { pos: [0, -8, 11], look: [0, -7, 0], dim: 0.3 },
        story: { pos: [0, -9.5, 11], look: [0, -8.5, 0], dim: 0.3 },
        book: { pos: [0, -11, 11], look: [0, -10, 0], dim: 0.16 },
      },
      mobileKeys: {
        hero: { pos: [0, -0.5, 13], look: [0, -0.4, 0] },
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
    const glass = new T.MeshStandardMaterial({ color: 0x0b0b0e, metalness: 0.35, roughness: 0.04, transparent: true, opacity: 0.5, envMapIntensity: 1.8, depthWrite: false, side: T.DoubleSide });
    const bottom = new T.Mesh(half(-1), glass);
    const band = new T.Mesh(new T.TorusGeometry(R * 1.01, 0.05, 16, 96), chrome());
    band.rotation.x = Math.PI / 2;
    const inner = new T.Group();
    const X = makeX(1.05, 5);
    inner.add(X, makeRing(0.72, 0.07, 0.1));
    inner.position.set(0, -H * 0.9, 0);
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
    const light = new T.PointLight(0xff2a1a, 1.6, 12, 1.8);
    light.position.set(0, 0, 2.2);
    holder.add(light);
    holder.add(glow(9, [0, 0, -1.6], 0xff3020, 0.28));

    spinners.push(f => {
      cap.rotation.x = f * 0.9 + Math.sin(clock * 0.35) * 0.08 + pointer.sy * 0.12;
      holder.rotation.y = -0.35 + pointer.sx * 0.2 + Math.sin(clock * 0.25) * 0.06;
      cap.userData.inner.rotation.y = -cap.rotation.x * 0.2;
    });
    return {
      bloom: [0.26, 0.35, 0.86],
      keys: {
        hero: { pos: [0, 0, 12], look: [0, -0.4, 0], dim: 0.8 },
        results: { pos: [0, -6.2, 10], look: [0, -6.2, 0] },
        capabilities: { pos: [0.4, -9, 10], look: [0.6, -8, 0], dim: 0.25 },
        work: { pos: [0.2, -11, 10], look: [0.3, -10.4, 0], dim: 0.35 },
        process: { pos: [0, -12.5, 10], look: [0, -12, 0], dim: 0.35 },
        contact: { pos: [0, -6.4, 9], look: [0, -6.2, 0], dim: 0.7 },
      },
      mobileKeys: {
        hero: { pos: [0, 0, 12], look: [0, -0.2, 0], dim: 0.6 },
        results: { pos: [0, -6, 10], look: [0, -7.6, 0] },
        contact: { pos: [0, -6.2, 10], look: [0, -7.4, 0], dim: 0.6 },
      },
    };
  }

  function buildBrooklyn() {
    scene.fog = new T.FogExp2(0x040410, 0.03);
    renderer.setClearColor(0x04040a, 1);
    const dust = stars(LOW ? 320 : 700, [-24, 24, -14, 10, -30, 6], 0.05);
    dust.material.uniforms.uFade.value = 0.55;
    scene.add(dust);

    const inst = new T.Group();
    const L = 2.7, per = LOW ? 70 : 120;
    const a = cloudField({ count: per, line: [[-L, -L * 1.2, 0], [L, L * 1.2, 0]], size: [0.7, 1.7], tint: 0x8f7dff, opacity: 0.34, jitter: 0.22 });
    const b = cloudField({ count: per, line: [[-L, L * 1.2, 0.1], [L, -L * 1.2, 0.1]], size: [0.7, 1.7], tint: 0xa596ff, opacity: 0.34, jitter: 0.22, tex: cloudTexB });
    const beamT = cloudField({ count: Math.round(per * 0.6), line: [[-6, 4.2, -1.5], [6, 4.2, -1.5]], size: [0.8, 1.8], tint: 0x7d70ff, opacity: 0.22, jitter: 0.18 });
    const beamB = cloudField({ count: Math.round(per * 0.6), line: [[-6, -4.2, -1.5], [6, -4.2, -1.5]], size: [0.8, 1.8], tint: 0x7d70ff, opacity: 0.2, jitter: 0.18, tex: cloudTexB });
    inst.add(a, b, beamT, beamB, glow(7, [0, 0, -0.4], 0xece6ff, 0.55), glow(18, [0, 0, -2], 0x6a58ff, 0.3));
    scene.add(inst);
    sideAnchor(inst, [3.3, 0.2, -2.5], [0, 2.2, -4]);

    spinners.push(f => {
      inst.rotation.y = Math.sin(clock * 0.2) * 0.08 + pointer.sx * 0.15 + f * 0.12;
      inst.rotation.x = -pointer.sy * 0.08;
      const s = 1 + Math.sin(clock * 0.8) * 0.012;
      inst.scale.setScalar(s);
    });
    return {
      bloom: [0.3, 0.4, 0.8],
      keys: {
        hero: { pos: [0, 0, 11], look: [0, 0.3, 0] },
        installation: { pos: [1.4, 0, 7.5], look: [2.3, 0.1, -2.5], dim: 0.75 },
        room: { pos: [0.6, -4, 11], look: [0.8, -3, 0], dim: 0.35 },
        detail: { pos: [0.4, -6.5, 11], look: [0.6, -5.5, 0], dim: 0.3 },
        links: { pos: [0, -3, 12], look: [0, -2, 0], dim: 0.55 },
      },
      mobileKeys: {
        installation: { pos: [0, 1, 8], look: [0, 1.6, -4], dim: 0.7 },
      },
    };
  }

  function buildLost() {
    scene.fog = new T.FogExp2(0x050506, 0.03);
    scene.add(stars(LOW ? 900 : 1600, [-30, 30, -14, 14, -40, 4], 0.1));
    const X = makeX(2.4, 4);
    sideAnchor(X, [3.2, 0.2, -1], [0, 2.2, -2]);
    scene.add(X);
    spinners.push(() => { X.rotation.y = Math.sin(clock * 0.4) * 0.3 + pointer.sx * 0.3; });
    return { bloom: [0.28, 0.35, 0.86], keys: { hero: { pos: [0, 0, 11], look: [0, 0.2, 0] } } };
  }

  const onResize = [];
  let clock = 0;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const builders = { home: buildHome, 'long-island': buildLongIsland, creative: buildCreative, brooklyn: buildBrooklyn, lost: buildLost };
  const world = (builders[kind] || buildLost)();

  // ---------- post ----------
  const composer = new T.EffectComposer(renderer);
  composer.addPass(new T.RenderPass(scene, camera));
  const bloom = new T.UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), ...world.bloom);
  composer.addPass(bloom);
  const finish = new T.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uShift: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uShift; uniform float uTime; varying vec2 vUv;
      void main(){
        vec2 d = vUv - 0.5;
        vec2 o = vec2(uShift, uShift * 0.25) * (0.35 + length(d));
        vec4 c = texture2D(tDiffuse, vUv);
        c.r = texture2D(tDiffuse, vUv + o).r;
        c.b = texture2D(tDiffuse, vUv - o).b;
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
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70 });
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
    finish.uniforms.uShift.value = reduce ? 0 : Math.max(-0.009, Math.min(0.009, velocity * 0.0000075));
    finish.uniforms.uTime.value = clock;
    cloudLayers.forEach(l => { l.mesh.position.x = Math.sin(clock * l.speed * 0.1) * l.span * 0.12; });
    scene.traverse(o => { if (o.userData.star) o.material.uniforms.uTime.value = clock; });
    sweepTime.value = clock;
    spinners.forEach(fn => fn(f));
    applyCamera(f);
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
