# Vendored redesign libraries

Self-hosted (no CDN, no npm dependency) so they're permanently available for the site
redesign. Not wired into any page yet — drop the `<script>` tags below into `build.mjs`'s
`page()` template (or a specific page) when the redesign actually uses them, so the current
live site isn't shipping unused JS in the meantime.

| Library | Version | Path | Use |
| --- | --- | --- | --- |
| GSAP core | 3.12.5 | `assets/vendor/gsap/gsap.min.js` | Animation engine |
| GSAP ScrollTrigger | 3.12.5 | `assets/vendor/gsap/ScrollTrigger.min.js` | Scroll-driven animation |
| Lenis | 1.1.13 | `assets/vendor/lenis/lenis.min.js` | Smooth scroll |
| Three.js | r134 | `assets/vendor/three/three.min.js` | 3D/WebGL, required by Vanta |
| Vanta.js | 0.5.24 | `assets/vendor/vanta/vanta.*.min.js` | Animated 3D backgrounds (fog, net, waves, globe, birds, rings, halo, topology) |

All MIT licensed.

## Include order

```html
<script src="/assets/vendor/three/three.min.js" defer></script>
<script src="/assets/vendor/vanta/vanta.fog.min.js" defer></script>
<script src="/assets/vendor/gsap/gsap.min.js" defer></script>
<script src="/assets/vendor/gsap/ScrollTrigger.min.js" defer></script>
<script src="/assets/vendor/lenis/lenis.min.js" defer></script>
```

Vanta effects each need Three.js loaded first. Only include the specific `vanta.*.min.js`
file(s) actually used per page — don't load all of them everywhere.

## Not vendored (React-only, no npm build in this repo)

- **fancy components** — github.com/danielpetho/fancy — creative interaction/animation
  components, installed via shadcn CLI into a React project. This site is vanilla HTML/JS, so
  these aren't drop-in; source is copy-per-component anyway (shadcn-style), not a package.
  If the redesign moves to React, revisit.
- **react-bits** — github.com/DavidHDev/react-bits — same deal, React components.

## Not site dependencies (standalone tools, not embedded in this repo)

- **Ditto** — github.com/ion-design/ditto.site — deterministic website cloner. Useful for
  pulling reference/inspo sites into clean code during the redesign. Run separately, frontend
  only (no backend/auth/payments cloned).
- **Agent-Reach** — github.com/Panniantong/Agent-Reach — web-reading/research agent (Twitter,
  XiaoHongShu, Facebook, etc.). Useful for competitive/trend research during the redesign.
  Run separately; use a secondary account for any logins per the repo's own caveat.
