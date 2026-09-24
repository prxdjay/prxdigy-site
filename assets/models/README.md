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
