# 3D brand models

Pre-built chrome PRXDIGY assets recovered from an earlier local build attempt (never
previously committed to this repo — pulled from the asset library zip, source paths
originally under `C:\Users\prxdj\.codex\worktrees\5539\prxdigy-site\assets\models\`).

| File | Size | Content |
| --- | --- | --- |
| `prxdigy-wordmark.glb` | 144KB | Chrome "PRXDIGY" wordmark with the red X, valid glTF 2.0 |
| `prxdigy-x.glb` | 48KB | Standalone chrome + red X sculpture, valid glTF 2.0 |

Static fallback renders (for `<noscript>`, `prefers-reduced-motion`, and no-WebGL paths) are
at `assets/public/wordmark-3d-poster.png` and `assets/public/x-3d-poster.png`.

Load with `THREE.GLTFLoader`, now vendored at `assets/vendor/three/GLTFLoader.js` (r134, matching
the vendored `three.min.js` — legacy global-script build, not the ES module version, since this
site loads everything as plain `<script>` tags).

**Verified by an actual headless render** (not just file validity) — both load and render
correctly, matching their poster images:

| Model | Meshes | Triangles | Notes |
| --- | --- | --- | --- |
| `prxdigy-wordmark.glb` | 2 | 5,476 | Bounding box `[10.07, 0.25, 2.48]` |
| `prxdigy-x.glb` | 1 | 1,836 | Bounding box `[2.55, 0.25, 2.48]` |

Both are cheap (well under 10k tris combined) and safe for real-time use.

**The gotcha that would silently break Phase 0:** both models lie flat — thin on Y (0.25),
extended in X/Z. They are not oriented to face a camera looking down -Z the way a "standing"
wordmark normally would. A naive placement (add to scene, point camera along Z) renders as a
near-invisible edge-on sliver — confirmed by testing it directly. Rotate the object (roughly 90°
about X, camera looking down at the XZ plane) or place the camera above looking down, then adjust
from there. Verify with a real render before treating any placement as final, not just a poster
comparison.

**Fidelity vs. the approved 2D wordmark (`assets/public/wordmark.webp`) — tested directly.**
The GLB's embedded materials are legitimate PBR chrome (metallic 0.96, roughness 0.22) and red
enamel (metallic 0.76, roughness 0.24) — real values, not placeholders. But rendered with only
ambient + directional lights (no environment map), metallic materials have nothing to reflect and
read as dull gray plastic. Adding a proper environment map is most of the fix:

```js
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
```

(`RoomEnvironment.js` is the legacy global-script build, same import pattern as `GLTFLoader.js` —
pull it from the same three.js release, not yet vendored here.)

That single change took the render from flat gray to genuinely glossy chrome with a real
specular X — confirmed side by side. **What it does not fix:** the 2D original has sharp,
multi-facet beveled edges (several distinct bevel planes per letter stroke) and a marbled/veined
red interior; the GLB's ~5,400-triangle geometry is a simpler single-bevel extrusion, so it reads
as smoother, less "cut-gem," even with correct lighting. Closing that last gap means more bevel
segments in the source geometry — real remodeling work, not a render setting, and not something
this environment has tooling for (no Blender here). Treat the environment-lit render as the
realistic real-time target; flag the remaining facet gap to the user rather than claiming a
geometry fix that wasn't done.

**`prxdigy-x.glb` specifically has a real geometry defect, confirmed by user feedback and then by
inspecting the mesh.** The standalone X's silhouette has stray notches and jagged, stepped edges —
not a style choice. Checked the accessor data: 1,114 vertices for a single 4-pointed X shape, where
a clean vector X needs on the order of 50-100. That vertex count is the signature of a shape
extruded from a jagged/anti-aliased raster trace rather than a clean path — probably auto-traced
from a PNG at some point in the pipeline.

**Fix: don't use `prxdigy-x.glb` for the standalone X moment.** Build it directly in Three.js
instead — see `assets/models/procedural-x.js`, a hand-authored 8-point star `THREE.Shape` (tips
at 45°/135°/225°/315°, waist points between), extruded with `bevelSegments: 6` and the exact same
chrome-red PBR values as the wordmark's "inner red enamel" material (not a guessed hex — a hand-
picked color rendered pink/washed-out in testing). Tested and confirmed clean: symmetric, sharp
tips, proper bevels, no stray geometry. `prxdigy-wordmark.glb` does not have this problem — its
geometry is fine, only its lighting needed the environment-map fix above; keep using the real GLB
for the wordmark.

**Glow recipe, tested and calibrated against `assets/public/creative-projects-ident.mp4`
(the PCP video's chrome/glow, which was already correct).** On top of the environment-map fix
above, add restrained bloom — `assets/vendor/three/postprocessing/{EffectComposer,RenderPass,
ShaderPass,UnrealBloomPass}.js` + `assets/vendor/three/shaders/{CopyShader,LuminosityShader,
LuminosityHighPassShader}.js`, same legacy global-script pattern as everything else:

```js
const composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));
composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(W, H), 0.18, 0.3, 0.9));
// render via composer.render(), not renderer.render()
```

Strength 0.18 / radius 0.3 / threshold 0.9 are deliberately conservative — tested higher strength
and lower threshold first, both blew the chrome out to flat white fast. This is a glow accent on
the ruby-red specifically, not a general bloom over the whole scene. Full before/after comparison
renders were sent directly to the user during this session, not just described.
