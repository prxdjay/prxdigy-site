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

Load with Three.js's `GLTFLoader` against the already-vendored `assets/vendor/three/three.min.js`
(the vendored build doesn't include loader addons — pull `GLTFLoader.js` in alongside it, same
self-hosted pattern as everything else in `assets/vendor/`). Inspect the actual geometry/materials
before treating these as finished — they were never QA'd against a browser render in the previous
attempt, only exported as posters.
