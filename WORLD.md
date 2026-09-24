# PRXDIGY world bible

One persistent WebGL canvas (`world.js`) sits fixed behind real HTML. Scroll lowers the camera
(negative Y) through the page's beats. Text, links, forms, and SEO stay in the DOM.

## Materials (same everywhere)

| Material | Recipe |
| --- | --- |
| Chrome | GLB "polished chrome" PBR values, high-contrast strip-light environment (dark room, thin bright panels) |
| Ruby | GLB "inner red enamel" values (0.44/0.008/0.013, metal .76, rough .24), raised emissive, restrained bloom |
| Violet cloud | Canvas-generated puff texture, additive, tint `#9d8cff` → white core |
| Stars | Custom point shader, per-star size/twinkle, a few red-tinted |
| Ground | Dark mirror (Reflector) dimmed to wet-black stone |

Post: UnrealBloom (strength ~0.18–0.3, threshold 0.85–0.9) + RGB-split driven by scroll velocity
(the buttermax glitch idea — clean at rest, splits only when you move fast) + faint grain.

## Home — one descent

| Beat (DOM `data-beat`) | Camera | What you see |
| --- | --- | --- |
| `sky` | y 0 | Chrome PRXDIGY wordmark (real GLB) hanging in a starfield. Hero copy lower-left. |
| `clouds` | y −10 | Camera sinks through the violet cloud sea; a light bloom passes through (matches `cloud-transition.mp4`). "Make the work. Move the work." |
| `split` | y −24 | Breaks through onto a black mirror floor. The ruby X monument glows far off in fog. Three division cards (real photos). |
| `statement` | y −26, pushes in | Camera travels toward the X, which sits right of frame. Company statement left. |
| `contact` | y −27, close | X + chrome ring fills the right side, red light pooling on the floor. Contact actions. |

## Division worlds — same materials, own signature object

| Page | Signature object | Notes |
| --- | --- | --- |
| Long Island | Chrome ring + ruby X (the studio stamp, in 3D) under a blue-violet cloud ceiling | Canvas dims to 25% at the booking form — the form is real HTML |
| Creative Projects | Chrome/glass capsule with ruby X (approved pill concept) | PCP ident video is the hero, in the DOM, not WebGL |
| Brooklyn | An X made of glowing violet clouds — the real ceiling installation, rebuilt | Real Brooklyn photos carry the rest |

## Rules

- Standalone X is built in code (`makeX`), never `prxdigy-x.glb` (broken geometry).
- No Chris / "Better Without You" footage anywhere, including the old `production-*.webp` stills.
- `prefers-reduced-motion`: no scroll-camera travel, no smooth scroll, one still frame per page.
- No WebGL: `.no-webgl` shows the 2D wordmark and CSS backgrounds; nothing breaks.
- Mobile: fewer stars/clouds, DPR ≤ 1.5, camera keyframes per aspect ratio.
