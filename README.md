# PRXDIGY public website

Static GitHub Pages site for `prxdigystudio.com`. The public pages live at `/`, `/studio/long-island/`, `/creative-projects/`, and `/studio/brooklyn/`. The private Supabase staff portal remains under `/portal/` and has its own CSS and JavaScript.

## Build

Run `node build.mjs` from the repository root. The script writes the public HTML, `404.html`, `sitemap.xml`, and `robots.txt`. It also applies the shared public navigation and current contact number to the existing legal pages while preserving their policy text.

There are no production npm dependencies. GitHub Pages serves the generated files directly from the repository root. `CNAME` and the existing hosting provider stay in place.

## Editing public content

- `site-config.mjs` owns the destination order, location statuses, Instagram, text number, and 2026 results.
- `build.mjs` owns the four page bodies, shared header/footer, titles, and metadata.
- `public.css` owns the public design and responsive behavior.
- `public.js` owns the mobile menu, one-time results animation, and Long Island application submission.
- `assets/public/` contains optimized web media. Originals remain untouched.
- Brooklyn photography is intentionally unset in `site-config.mjs` until authentic location images and details are supplied.

The Long Island application keeps the existing Google Apps Script endpoint and submission payload. The browser sends its POST with `no-cors`, so it can confirm that the request was sent by the browser but cannot inspect the endpoint's response. The existing SMS consent, policy links, field names, and success/failure actions remain. Do not replace the endpoint without verifying the new backend.

## Media provenance

All files below are optimized, metadata-free derivatives. The existing public `assets/*.png` images are the approved Long Island site media already in this repository.

| Optimized files | Approved source |
| --- | --- |
| `wordmark.webp` | Supplied `PRXDIGY-standalone-wordmark.png` |
| `creative-logo.webp` | Approved Creative Projects full logo PNG |
| `studio-logo.webp` | Existing `assets/logo.png` |
| `studio-mic.webp`, `studio-sign.webp`, `studio-keys.webp`, `studio-couch.webp`, `studio-guitar.webp`, `studio-ceiling.webp` | Existing `assets/mic-closeup.png`, `vocal-booth.png`, `keys-session.png`, `red-room.png`, `logo-wall.png`, `neon-light.png` respectively |
| `production-wide.webp` | Still from an approved Creative Projects reel; source time 3 s |
| `production-performance.webp` | Still from an approved Creative Projects intro reel; source time 5 s |
| `og-home.jpg`, `og-long-island.jpg`, `og-creative.jpg`, `og-brooklyn.jpg` | Social preview derivatives of the approved media and logos above |
| `studio-keyboard.webp` | Existing `assets/star-ceiling.png` (engineer's hand on a red-lit keyboard) |
| `studio-desk-detail.webp` | Existing `assets/environment.png` (astronaut figurine + ashtray, red-lit desk) |
| `studio-ambient.webp` | Existing `assets/couch-red.png` (blurred bokeh, mic silhouette against studio lights) |
| `creative-projects-ident.mp4`, `creative-projects-poster.jpg` | Compressed from the supplied PCP brand reveal video (source `.mov`, not served to browsers) |
| `wordmark-3d-poster.png`, `x-3d-poster.png` | Static fallback renders of `assets/models/*.glb`, recovered from an earlier local build attempt |
| `prxdigy-x-original.png` | Current flat/vector red X asset (distinct from the 3D chrome X model) |
| `lifted/studio-*.webp` | Brighter alternate exposure treatments of the same studio photography — candidates for use against a very dark 3D scene where the standard exposure would go muddy |
| `brooklyn-x-installation.webp` | Real Brooklyn location photo — neon violet X-shaped light installation on the ceiling |
| `brooklyn-studio-wide.webp`, `brooklyn-studio-wide-alt.webp` | Real Brooklyn location photos — wide shots of the work room under the X installation |
| `brooklyn-desk-detail.webp`, `brooklyn-gear-detail.webp` | Real Brooklyn location photos — monitor/desk setup and studio gear detail |
| `cloud-transition.mp4`, `cloud-transition-poster.jpg` | Compressed from a supplied reference clip of a violet fog/cloud wipe with a light bloom passing through — reference for the descent-through-clouds scroll beat |
| `wordmark-glitch-dark.webp`, `wordmark-glitch-light-a.webp`, `wordmark-glitch-light-b.webp` | A distressed/glitch-stencil "PRXDIGY X" wordmark treatment — a third brand exploration alongside the chrome GLB and the circular stamp. Not yet approved as canon; still "review brand fit" |
| `wordmark-glitch-reveal.mp4`, `-poster.jpg` | Compressed from a supplied motion reference: the glitch wordmark snapping into place via motion blur. Useful as a transition technique reference regardless of which wordmark treatment is chosen |
| `studio-stamp-wide.webp` | Widescreen crop of the circular PRXDIGY STUDIO stamp (existing `assets/logo.png`/`studio-logo.webp` is the square crop) |

The two Creative Projects work images ship with generic filenames and no artist or track metadata. No source `.mov` is served to browsers.

`assets/hero-bg.png` is a byte-identical duplicate of `assets/neon-light.png` — not a distinct asset, not used.

## Deployment

The established setup uses GitHub Pages from `main` at the repository root and the checked-in `CNAME`. Merge or push the verified build to `main` to deploy. Verify the four public routes, both legal pages, `/portal/`, and `/404.html` after Pages completes publishing. No DNS changes are needed.

## Staff portal

Do not route public requests through the portal or change its authentication and Supabase configuration. See [`portal/README.md`](portal/README.md) for its separate setup and access controls.
