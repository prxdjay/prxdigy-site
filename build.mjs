import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { site } from './site-config.mjs';

// `node build.mjs` writes the live site. `node build.mjs --preview <dir>` writes a flat,
// relative-path copy (index.html, long-island.html, ...) for sharing a preview.
const previewAt = process.argv.indexOf('--preview');
const PREVIEW = previewAt > -1 ? process.argv[previewAt + 1] : null;
const flat = { '/': 'index.html', '/studio/long-island/': 'long-island.html', '/creative-projects/': 'creative-projects.html', '/studio/brooklyn/': 'brooklyn.html', '/team/': 'team.html' };
const L = href => {
  if (!PREVIEW || !href.startsWith('/')) return href;
  const [path, hash = ''] = href.split('#');
  if (path in flat) return flat[path] + (hash ? `#${hash}` : '');
  return path.slice(1) + (hash ? `#${hash}` : '');
};
const ROOT = PREVIEW ? '' : '/';
const A = `${ROOT}assets/public/`;
const instagram = site.instagram.href;
const sms = site.text.href;
const destinations = site.destinations;
const ext = 'target="_blank" rel="noopener noreferrer"';
const arrow = '<span aria-hidden="true">↗</span>';
const down = '<span aria-hidden="true">↓</span>';

function header(active = '') {
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="header-inner wrap">
      <a class="brand" href="${L('/')}" aria-label="PRXDIGY home"><img src="${A}wordmark.webp" alt="PRXDIGY" width="1200" height="400"></a>
      <a class="header-cta start-link" href="#start-project" aria-haspopup="dialog"><span class="start-dot" aria-hidden="true"></span><span class="header-cta-full">Start a Project</span><span class="header-cta-short">Start</span></a>
      <nav class="site-nav" id="primary-nav" aria-label="Primary navigation">
        ${site.nav.map((item, i) => `<a href="${L(item.href)}"${active === item.href ? ' aria-current="page"' : ''}><span class="nav-index">0${i + 1}</span>${item.label}</a>`).join('')}
      </nav>
      <button class="menu-toggle" type="button" aria-label="Open navigation" aria-controls="primary-nav" aria-expanded="false"><span></span><span></span></button>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer" id="footer">
    <div class="wrap footer-top">
      <div class="footer-identity"><a href="${L('/')}" aria-label="PRXDIGY home"><img src="${A}wordmark.webp" alt="PRXDIGY" width="1200" height="400"></a><p>Music. Content. Direction. Growth.</p></div>
      <nav aria-label="Footer destinations"><span class="footer-label">Explore</span>${destinations.map(item => `<a href="${L(item.href)}">${item.label}</a>`).join('')}</nav>
      <div class="footer-contact"><span class="footer-label">Connect</span><a href="${instagram}" ${ext}>Instagram ${site.instagram.label}</a><a href="${sms}">Text ${site.text.label}</a></div>
    </div>
    <div class="wrap footer-bottom"><p class="footer-business">© ${new Date().getFullYear()} ${site.business.name} · ${site.business.location} · <a href="mailto:${site.business.email}">${site.business.email}</a></p><nav class="footer-legal" aria-label="Legal">${site.legal.map(item => `<a href="${L(item.href)}">${item.label.replace('&', '&amp;')}</a>`).join('')}</nav></div>
  </footer>
  ${startPanel()}`;
}

// Finalized GLB models (see assets/models/README.md). Only files that exist are announced to
// world.js, and a page only reserves room for a model it can actually show.
const MODELS = ['uad-sphere', 'fuji-xh2s', 'tlm-103', 'prxdigy-x-final', 'studio-badge', 'creative-emblem', 'prxdigy-logo-3d'];
const hasModel = name => existsSync(`assets/models/${name}.glb`);
const modelList = MODELS.filter(hasModel).join(',');

// Start a Project: the fast-contact panel every "Start a Project" link opens.
function startPanel() {
  return `<dialog class="start-panel" id="start-project" aria-labelledby="start-title">
    <div class="start-inner">
      <button class="start-close" type="button" data-start-close aria-label="Close Start a Project">✕</button>
      <p class="eyebrow"><span class="eyebrow-line"></span>Fast contact</p>
      <h2 id="start-title">Start a Project</h2>
      <p class="start-lede">Pick the fastest way to reach PRXDIGY.</p>
      <ul class="start-options" role="list">
        <li><a class="start-option start-option-primary" href="${instagram}" ${ext}>${igIcon}<span><strong>DM on Instagram</strong><small>${site.instagram.label}</small></span>${arrow}</a></li>
        <li><a class="start-option" href="${sms}"><span class="start-glyph" aria-hidden="true">✆</span><span><strong>Text us</strong><small>${site.text.label}</small></span>${arrow}</a></li>
        <li><a class="start-option" href="mailto:${site.business.email}?subject=New%20project"><span class="start-glyph" aria-hidden="true">@</span><span><strong>Email</strong><small>${site.business.email}</small></span>${arrow}</a></li>
        <li><a class="start-option" href="${L('/studio/long-island/#book')}"><span class="start-glyph" aria-hidden="true">●</span><span><strong>Book the Long Island room</strong><small>Apply to book a session</small></span>${arrow}</a></li>
      </ul>
    </div>
  </dialog>`;
}

// The 3D world: one fixed canvas behind the page, plus the script chain world.js needs.
const V = `${ROOT}assets/vendor/`;
const worldScripts = ['three/three.min.js', 'three/GLTFLoader.js', 'three/meshopt_decoder.js', 'three/RoomEnvironment.js', 'three/objects/Reflector.js',
  'three/shaders/CopyShader.js', 'three/shaders/LuminosityShader.js', 'three/shaders/LuminosityHighPassShader.js',
  'three/postprocessing/EffectComposer.js', 'three/postprocessing/RenderPass.js', 'three/postprocessing/ShaderPass.js', 'three/postprocessing/UnrealBloomPass.js',
  'lenis/lenis.min.js'].map(src => `<script src="${V}${src}" defer></script>`).join('');

function page({ title, description, path, og, active, body, className = '', world = 'lost', schema = '' }) {
  const scene = world !== null;
  const url = `${site.origin}${path}`;
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title><meta name="description" content="${description}">
  <link rel="canonical" href="${url}"><meta name="theme-color" content="#050506">
  <meta property="og:type" content="website"><meta property="og:site_name" content="PRXDIGY"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${site.origin}/assets/public/${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${site.origin}/assets/public/${og}">
  <link rel="icon" href="${ROOT}assets/favicon.ico"><link rel="apple-touch-icon" href="${ROOT}assets/apple-touch-icon.png">
  <link rel="preload" href="${ROOT}assets/fonts/bebas-neue-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${ROOT}public.css">
  ${scene ? `${PREVIEW ? '<script>window.PRX_PREVIEW = true;</script>' : ''}${worldScripts}<script src="${ROOT}world.js" defer></script>` : ''}<script src="${ROOT}public.js" defer></script>
${schema ? `  <script type="application/ld+json">${schema}</script>` : ''}
</head><body class="${className}"${scene ? ` data-world="${world}" data-assets="${ROOT}assets/" data-models="${modelList}"` : ''}>
  <div class="world-backdrop" aria-hidden="true"></div>${scene ? '<canvas class="world-canvas" aria-hidden="true"></canvas>' : ''}<div class="world-grain" aria-hidden="true"></div>
  ${header(active)}<main id="main">${body}</main>${footer()}<div class="page-wipe" aria-hidden="true"></div></body></html>\n`;
}

const contactActions = (context = '', id = '') => `<div class="action-row"${id ? ` id="${id}"` : ''}><a class="button button-light" href="${instagram}" ${ext}>DM ${site.instagram.label}${arrow}</a><a class="button button-outline" href="${sms}">Text ${site.text.label}${arrow}</a></div>${context ? `<p class="contact-context">${context}</p>` : ''}`;
const eyebrow = (text, extra = '') => `<p class="eyebrow" data-reveal><span class="eyebrow-line"></span>${extra}${text}</p>`;
// Serves an 800px copy to small screens when one exists next to the full image (name-800.webp).
const img = (file, alt, w, h, attrs = 'loading="lazy" decoding="async"', sizes = '(max-width: 700px) 100vw, 50vw') => {
  const small = file.replace(/\.webp$/, '-800.webp');
  const srcset = small !== file && existsSync(`assets/public/${small}`) ? ` srcset="${A}${small} 800w, ${A}${file} ${w}w" sizes="${sizes}"` : '';
  return `<img src="${A}${file}"${srcset} alt="${alt}" width="${w}" height="${h}" ${attrs}>`;
};
// A headline whose lines reveal one after another, in reading order.
const lines = (...parts) => parts.map((part, i) => `<span class="line" data-reveal="line" style="--i:${i}">${part}</span>`).join('');
const igIcon = '<svg class="ig-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/></svg>';
const igLink = label => `<a class="text-link ig-link" href="${instagram}" ${ext}>${igIcon}${label} ${arrow}</a>`;

// ---------- Home ----------
// Alternates the two studios so neither dominates; each keeps its own light (LI red, BK blue).
const reel = [
  ['v2/li-guitar-strings.webp', 'Guitar strings and bridge under red light', 'LI', 1561, 1008],
  ['v2/bk-room-wide-blue.webp', 'The Brooklyn room under blue LED clouds', 'BK', 1086, 1448],
  ['v2/li-keys-red.webp', 'Keyboard lit red in the Long Island room', 'LI', 1692, 930],
  ['v2/bk-hallway-blue.webp', 'Blue-lit hallway into the Brooklyn studio', 'BK', 1086, 1448],
  ['v2/li-mic-monitor.webp', 'Vocal microphone in front of the monitor', 'LI', 1520, 1035],
  ['brooklyn-desk-detail.webp', 'Monitors at the Brooklyn desk in blue light', 'BK', 1800, 1199],
  ['v2/li-cloud-ceiling.webp', 'Red cloud ceiling in the Long Island room', 'LI', 1700, 925],
  ['brooklyn-studio-wide.webp', 'Wide view of the Brooklyn room in blue light', 'BK', 1800, 1199],
];
const reelItems = hidden => reel.map(([file, alt, tag, w, h]) => `<figure class="reel-item reel-${tag.toLowerCase()}"${hidden ? ' aria-hidden="true"' : ''}>${img(file, hidden ? '' : alt, w, h, 'loading="lazy" decoding="async"', '(max-width: 700px) 60vw, 340px')}<figcaption>${tag === 'LI' ? 'Long Island' : 'Brooklyn'}</figcaption></figure>`).join('');

const home = page({
  title: 'PRXDIGY — Music, Content, Direction & Growth',
  description: 'PRXDIGY brings recording studios, creative production, campaigns, and growth under one name. Explore Long Island, Creative Projects, and Brooklyn.',
  path: '/', og: 'og-home.jpg', className: 'page-home', world: 'home',
  schema: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'PRXDIGY', url: site.origin, sameAs: [instagram], telephone: '+1-631-870-9243' }),
  body: `<section class="beat home-hero" data-beat="sky">
    <img class="hero-mark" src="${A}wordmark-tight.webp" alt="" width="1027" height="246" fetchpriority="high">
    <div class="hud hud-top wrap" aria-hidden="true"><span>PRXDIGY / New York</span><span>Long Island — Brooklyn</span></div>
    <div class="wrap home-hero-grid">
      <div><p class="eyebrow"><span class="eyebrow-line"></span>One creative company / New York</p><h1 class="glitch-title logo-headline">Where <span class="nowrap mark-word"><img class="inline-mark" src="${A}wordmark-tight.webp" alt="PRXDIGY" width="1027" height="246"><span class="apos">’s</span></span> <span class="nowrap">are <em>made.</em></span></h1></div>
      <div class="home-hero-side"><p class="hero-description">One creative company built to move artists, brands, and ideas forward.</p><a class="start-box start-link" href="#start-project" aria-haspopup="dialog"><span class="start-box-kicker"><span class="start-dot" aria-hidden="true"></span>Fast contact</span><span class="start-box-title">Start a Project</span><span class="start-box-arrow" aria-hidden="true">↗</span></a><div class="action-row hero-actions"><a class="button button-light cta-pop" href="#destinations">Explore PRXDIGY ${down}</a>${igLink('DM on Instagram').replace('class="text-link ig-link"', 'class="button button-ig ig-link"')}</div></div>
    </div>
    <div class="scroll-cue" aria-hidden="true"><span></span>Scroll to descend</div>
  </section>
  <section class="beat home-clouds" data-beat="clouds">
    <div class="wrap"><p class="kicker" data-reveal>01 / 03</p><h2 class="mega stack">${lines('Stop in.', 'Lock in.', '<em>Drop it.</em>')}</h2></div>
  </section>
  <section class="beat section destinations" id="destinations" data-beat="split"><div class="wrap"><div class="section-heading">${eyebrow('01 / Find your direction')}<h2 class="stack">${lines('One world.', 'Two studios.', '<em>Three doors.</em>')}</h2><p class="pick-line" data-reveal>Your way in starts here. <strong class="pick">Pick your door.</strong></p></div>
    <div class="destination-grid">
      <a class="destination" href="${L(destinations[0].href)}" data-reveal><div class="destination-image">${img('v2/li-stamp-wall.webp', 'PRXDIGY Studio stamp on the red wall of the Long Island room', 1444, 1089, 'loading="lazy" decoding="async"', '(max-width: 700px) 100vw, 33vw')}</div><div class="destination-content"><span class="destination-index">01 / PRXDIGY Studio</span><span class="status">${destinations[0].status}</span><h3>Long Island</h3><p>Recording, mixing, production, content, and creative direction.</p><span class="destination-action">Enter Long Island ${arrow}</span></div></a>
      <a class="destination destination-creative" href="${L(destinations[1].href)}" data-reveal><div class="destination-image">${img('creative-projects-still.webp', 'PRXDIGY Creative Projects chrome and ruby ident', 1280, 854, 'loading="lazy" decoding="async"', '(max-width: 700px) 100vw, 33vw')}</div><div class="destination-content"><span class="destination-index">02 / PRXDIGY</span><span class="status status-neutral">Creative division</span><h3>Creative Projects</h3><p>Social media growth, content, campaigns, creative direction, and artist development.</p><span class="destination-action">Explore Creative Projects ${arrow}</span></div></a>
      <a class="destination destination-brooklyn" href="${L(destinations[2].href)}" data-reveal><div class="destination-image">${img('v2/bk-desk-x-blue.webp', 'The Brooklyn desk under the glowing blue X', 1086, 1448, 'loading="lazy" decoding="async"', '(max-width: 700px) 100vw, 33vw')}</div><div class="destination-content"><span class="destination-index">03 / PRXDIGY Studio</span><span class="status status-blue">${destinations[2].status}</span><h3>Brooklyn</h3><p>A new PRXDIGY studio location. Full location details are on the way.</p><span class="destination-action">Brooklyn Information ${arrow}</span></div></a>
    </div></div></section>
  <section class="reel" aria-label="Inside the PRXDIGY rooms"><div class="reel-track">${reelItems(false)}${reelItems(true)}</div></section>
  <section class="beat section brand-statement" data-beat="statement"><div class="wrap statement-grid"><div class="panel">${eyebrow('02 / The company')}<h2 data-reveal="glitch">From the first take<br>to the <em>public release.</em></h2><div class="statement-columns" data-reveal><p><strong>PRXDIGY</strong> is the umbrella for the work.</p><p><strong>Studio</strong> is where records and content are physically made.</p><p><strong>Creative Projects</strong> builds strategy, campaigns, growth, and the larger creative system around them.</p></div></div></div></section>`
});

// ---------- Long Island ----------
const studioServices = [
  ['Recording', 'Tracked with attention to tone, take, and performance.'],
  ['Mix & Master', 'Polished, streaming-ready records that translate across systems.'],
  ['Beat Production', "Custom production built around the artist's sound."],
  ['Content / Reels', 'Performance clips, rollout content, and supporting visual assets.'],
  ['Creative Direction', 'World-building, rollout vision, and a cohesive release identity.'],
  ['Songwriting', 'Top-lines, hooks, and full records, written with or for the artist.'],
];
// Red room only: wide, medium, and detail — no repeated angles.
const gallery = [
  ['v2/li-stamp-wall.webp', 'PRXDIGY Studio stamp, guitar, and ceiling lights in the Long Island room', 1444, 1089, 'The room has its own point of view.', 'g-main'],
  ['v2/li-keys-red.webp', 'Keyboard used for production in the studio', 1692, 930, 'Built around the sound.', 'g-wide'],
  ['v2/li-guitar-strings.webp', 'Guitar in the red-lit studio', 1561, 1008, 'Space to find the next idea.', ''],
  ['v2/li-mic-monitor.webp', 'Vocal microphone in front of the session monitor', 1520, 1035, '', ''],
  ['v2/li-pillow-stamp.webp', 'PRXDIGY Studio pillow on the couch', 1618, 972, '', 'g-wide'],
  ['lifted/studio-console-lifted.webp', 'Hands on the keys in red light', 1600, 875, '', 'g-wide'],
];
const liGear = hasModel('uad-sphere') || hasModel('fuji-xh2s');
const playlistUrl = 'https://open.spotify.com/playlist/1gKUydEemsUPCpqJVEd2NQ';
// The preview host blocks third-party iframes, so the shared preview shows a card instead.
const spotifyEmbed = 'https://open.spotify.com/embed/playlist/1gKUydEemsUPCpqJVEd2NQ?utm_source=generator&amp;theme=0';
// Click-to-load: nothing from Spotify (and none of its cookies) loads until the visitor asks for
// the player. The preview host blocks third-party frames, so previews only offer the link.
const spotify = `<div data-reveal><div class="spotify-frame glass embed-shell${PREVIEW ? '' : ' is-idle'}"${PREVIEW ? '' : ` data-embed-src="${spotifyEmbed}"`}><div class="embed-card"><p class="kicker">Spotify / Playlist</p><strong>PRXDIGY Studio</strong><div class="action-row">${PREVIEW ? '' : `<button class="button button-light embed-load" type="button">Load Spotify player ${arrow.replace('↗', '▶')}</button>`}<a class="button button-outline" href="${playlistUrl}" ${ext}>Open in Spotify ${arrow}</a></div>${PREVIEW ? '' : `<p class="embed-note">Loading the player connects to Spotify, which may set its own cookies. <a href="${L('/cookies.html')}">Cookie Policy</a></p>`}</div><a class="embed-fallback" href="${playlistUrl}" ${ext}>Open the playlist on Spotify ${arrow}</a></div></div>`;

const longIsland = page({
  title: 'PRXDIGY Studio Long Island — Recording, Mixing & Production',
  description: 'PRXDIGY Studio Long Island is now booking recording, mixing, beat production, content, creative direction, and songwriting. Apply to book a session.',
  path: '/studio/long-island/', og: 'og-long-island.jpg', active: destinations[0].href, className: 'page-studio', world: 'long-island',
  body: `<section class="beat division-hero studio-hero" data-beat="hero"><div class="wrap division-hero-grid"><div class="division-hero-copy"><img class="division-logo" src="${A}studio-logo-alpha.webp" alt="PRXDIGY Studio" width="650" height="650"><p class="eyebrow"><span class="status">${destinations[0].status}</span> / Long Island</p><h1 class="stack hero-stack">${lines('On Long Island,', 'there are no <em>shortcuts.</em>')}</h1><p class="hero-description">Recording, mixing, production, content, and creative direction for artists ready to build.</p><div class="action-row"><a class="button button-light" href="#book">Apply to Book ${down}</a><a class="button button-outline" href="${sms}">Text PRXDIGY ${arrow}</a>${igLink('DM on Instagram')}</div></div></div></section>
  <section class="beat section listening-section" data-beat="listen"><div class="wrap listening-grid"><div>${eyebrow('01 / The sound')}<h2 data-reveal="glitch">Listen to<br><em>the work.</em></h2><p data-reveal>The records speak louder than the room.</p></div>${spotify}</div></section>
  <section class="beat section room-gallery" data-beat="gallery"><div class="wrap"><div class="section-heading">${eyebrow('02 / Inside the room')}<h2 data-reveal="glitch">Where the records<br><em>get made.</em></h2><p data-reveal>Real details from the Long Island studio.</p></div><div class="gallery-grid">${gallery.map(([file, alt, w, h, cap, cls]) => `<figure class="${cls}" data-reveal tabindex="0">${img(file, alt, w, h)}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`).join('')}</div></div></section>
  <section class="beat section services-section" data-beat="services"><div class="wrap services-grid${liGear ? ' has-stage' : ''}"><div><div class="section-heading">${eyebrow('03 / What we do')}<h2 data-reveal="glitch">Every part of<br><em>the record.</em></h2><p data-reveal>From the first idea to the final detail.</p></div><div class="service-list">${studioServices.map(([name, description], i) => `<div class="service-row" data-reveal><span>${String(i + 1).padStart(2, '0')}</span><h3>${name}</h3><p>${description}</p></div>`).join('')}</div></div>${liGear ? '<div class="model-stage model-stage-tall" data-anchor="li-gear" aria-hidden="true"></div>' : ''}</div></section>
  <section class="beat section room-story" data-beat="story"><div class="wrap story-grid"><div class="story-image" data-reveal>${img('v2/li-cloud-ceiling.webp', 'Red cloud ceiling with glowing light running through it', 1700, 925)}</div><div class="story-copy">${eyebrow('04 / The atmosphere')}<h2 data-reveal="glitch">The room sets the scene.<br>We set the <em>vibe.</em></h2><p data-reveal>The starlight ceiling and red glow make it easy to settle in, but the people make the session. We lock in with you, bounce ideas around, and bring the right energy to every record.</p><div data-reveal>${img('lifted/studio-astronaut-lifted.webp', 'Astronaut figure on the red-lit desk', 1600, 838)}</div></div></div></section>
  <section class="beat section booking-section" id="book" data-beat="book"><div class="wrap booking-grid"><div class="booking-intro">${eyebrow('05 / Book the room')}<h2 data-reveal="glitch">Ready to<br><em>lock in?</em></h2><p>Tell us what you're building. If it fits, we'll reach out to plan the session.</p><p class="booking-note">Prefer to talk first? <a href="${sms}">Text PRXDIGY</a> or <a href="${instagram}" ${ext}>DM on Instagram</a>.</p></div><div class="booking-panel glass"><form id="intakeForm" novalidate><div class="form-error-summary" id="formErrors" role="alert" tabindex="-1" hidden></div><div class="form-field"><label for="name">Name <span aria-hidden="true">*</span></label><input id="name" name="name" type="text" autocomplete="name" required></div><div class="form-pair"><div class="form-field"><label for="phone">Phone <span aria-hidden="true">*</span></label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div><div class="form-field"><label for="instagram">Instagram</label><input id="instagram" name="instagram" type="text" placeholder="@" autocomplete="off"></div></div><div class="form-field"><label for="project">What are you working on? <span aria-hidden="true">*</span></label><textarea id="project" name="project" rows="4" required></textarea></div><div class="form-pair"><div class="form-field"><label for="budget">Budget range <span aria-hidden="true">*</span></label><select id="budget" name="budget" required><option value="">Select a range</option><option value="under-500">Under $500</option><option value="500-1500">$500 – $1,500</option><option value="1500-5000">$1,500 – $5,000</option><option value="5000-plus">$5,000+</option></select></div><div class="form-field"><label for="package">Package interest <span aria-hidden="true">*</span></label><select id="package" name="package" required><option value="">Select an area</option><option value="recording">Recording Session</option><option value="mix-master">Mix &amp; Master</option><option value="beats">Beat Production</option><option value="content">Content / Reels</option><option value="creative">Creative Direction</option><option value="songwriting">Songwriting</option><option value="full">Full Rollout</option></select></div></div><div class="form-field"><label for="timeframe">Timeframe <span aria-hidden="true">*</span></label><select id="timeframe" name="timeframe" required><option value="">Select a timeframe</option><option value="asap">ASAP — this week</option><option value="2-weeks">Next 2 weeks</option><option value="month">Within a month</option><option value="flexible">Flexible</option></select></div><div class="form-consent"><input id="consent" name="consent" type="checkbox" required><label for="consent">I agree to the <a href="${L('/privacy.html')}">Privacy Policy</a> and <a href="${L('/terms.html')}">Terms &amp; Conditions</a>. <span aria-hidden="true">*</span></label></div><button class="button button-light form-submit" type="submit">Apply to Book ${arrow}</button><p class="form-disclaimer">By submitting this form, you agree to receive text messages from PRXDIGY STUDIO regarding your booking. Message &amp; data rates may apply. Reply STOP to opt out. See our <a href="${L('/privacy.html')}">Privacy Policy</a> and <a href="${L('/terms.html')}">Terms &amp; Conditions</a>.</p></form><div class="form-success" id="formSuccess" role="status" tabindex="-1" hidden><span aria-hidden="true">✓</span><h3>Request received.</h3><p>We'll reach out shortly if it's a fit. For a faster response, <a href="${sms}">text ${site.text.label}</a>.</p></div></div></div></section>`
});

// ---------- Creative Projects ----------
const creativeCapabilities = [
  ['Social Media Growth and Content', 'We create the content systems, rollout assets, and publishing rhythm that help brands and artists stay visible.'],
  ['Campaigns and Creative Direction', 'We shape the concept, identity, positioning, and creative world around a project.'],
  ['Artist Development and Music Production', 'We support the music, writing, production, engineering, visuals, and release strategy behind the artist.'],
  ['Production, Editing, Scheduling, and Rollout', 'We plan, shoot, edit, schedule, publish, and refine the work across the full campaign.'],
];
const processSteps = ['Brand reset', 'Creative direction', 'Competitive positioning', 'Content strategy', 'Concept and production', 'Editing, scheduling, and rollout', 'Growth tracking and refinement'];
const support = ['Writers', 'Producers', 'Engineers', 'Studio spaces', 'Visual production', 'Release support', 'Creative and industry relationships', 'Creative Directors'];
const pauseButton = target => `<button class="media-toggle" type="button" data-media="${target}" aria-label="Pause video" aria-pressed="false"><span class="media-toggle-icon" aria-hidden="true"></span></button>`;

const creative = page({
  title: 'PRXDIGY Creative Projects — Content, Campaigns & Growth',
  description: 'PRXDIGY Creative Projects builds strategy, content, campaigns, music, visuals, and rollout systems that help artists and brands grow.',
  path: '/creative-projects/', og: 'og-creative.jpg', active: destinations[1].href, className: 'page-creative', world: 'creative',
  body: `<section class="beat division-hero creative-hero" data-beat="hero"><div class="wrap division-hero-grid"><div class="division-hero-copy"><img class="creative-hero-logo" src="${A}creative-logo.webp" alt="PRXDIGY Creative Projects" width="900" height="600"><p class="eyebrow">PRXDIGY / Creative Projects</p><h1 class="stack hero-stack">${lines('Creative direction:', 'where vision becomes <em>reality.</em>')}</h1><p class="hero-description">We build the strategy, content, music, visuals, and rollout that help artists and brands grow.</p><div class="action-row"><a class="button button-light" href="#creative-contact">Start a Creative Project ${down}</a>${igLink('DM on Instagram')}</div></div><div class="ident-frame"><video id="ident-video" src="${A}creative-projects-ident.mp4" poster="${A}creative-projects-still.webp" autoplay muted loop playsinline preload="metadata" aria-label="PRXDIGY Creative Projects ident"></video>${pauseButton('ident-video')}<span class="image-caption">Concept / Production / Rollout</span></div></div></section>
  <section class="beat section results-section" id="results" data-beat="results"><div class="wrap results-wrap">${eyebrow('01 / Verified 2026 totals')}<h2 data-reveal="glitch">Results</h2><div class="results-grid">${site.results.map(item => `<div class="result" data-reveal><div class="result-number"><span class="sr-only">${item.value}${item.suffix}</span><span aria-hidden="true" data-count-to="${item.value}" data-suffix="${item.suffix}">${item.value}${item.suffix}</span></div><p>${item.label}</p></div>`).join('')}</div></div></section>
  <section class="beat section creative-services" data-beat="capabilities"><div class="wrap"><div class="section-heading">${eyebrow('02 / What we do')}<h2 data-reveal="glitch">More than content.<br><em>We build momentum.</em></h2><p data-reveal>One connected team across strategy, creation, and the release.</p></div><div class="capability-list">${creativeCapabilities.map(([name, description], i) => `<div class="capability" data-reveal><span>${String(i + 1).padStart(2, '0')}</span><h3>${name}</h3><p>${description}</p></div>`).join('')}</div></div></section>
  <section class="beat section selected-work" data-beat="work"><div class="wrap"><div class="section-heading">${eyebrow('03 / In practice')}<h2 data-reveal="glitch">Portfolio picks</h2><p data-reveal>A glimpse into our world.</p></div><div class="work-grid"><figure class="work-item" data-reveal><div class="work-image work-feather">${img('creative-world-still.webp', 'The chrome PRXDIGY logo floating over a violet cloud sea', 1600, 960)}</div><figcaption><span>01 / Artist rollout</span><h3>A visual world built around the release.</h3><p>Performance content, production, and rollout assets.</p></figcaption></figure><figure class="work-item" data-reveal><div class="work-image work-image-invert"><video id="glitch-video" class="reveal-on-play" src="${A}wordmark-glitch-reveal.mp4" autoplay muted loop playsinline preload="auto" aria-label="PRXDIGY wordmark glitch reveal"></video><img class="video-fallback" src="${A}wordmark-glitch-reveal-poster.jpg" alt="" width="1280" height="720" loading="lazy">${pauseButton('glitch-video')}</div><figcaption><span>02 / Visual production</span><h3>Make the moment feel like the music.</h3><p>Concept, shoot direction, editing, and social-ready content.</p></figcaption></figure></div><figure class="work-wide work-glass" data-reveal>${img('creative-pill-shatter.webp', 'The PCP capsule shattering on a wet black floor', 1672, 941, 'loading="lazy" decoding="async"', '100vw')}</figure></div></section>
  <section class="beat section process-section" data-beat="process"><div class="wrap process-grid"><div class="process-heading">${eyebrow('04 / How it connects')}<h2 data-reveal="glitch">The full<br><em>package.</em></h2><p data-reveal>We can help shape the idea, define the direction, create the content, release the work, and measure what happens next.</p></div><div><ol class="process-list">${processSteps.map((step, i) => `<li data-reveal><span>${String(i + 1).padStart(2, '0')}</span>${step}</li>`).join('')}</ol><div class="support-list" data-reveal><p>Connected capabilities</p><ul>${support.map(item => `<li>${item}</li>`).join('')}</ul></div><p class="process-close" data-reveal>From idea to execution, everything is done here.</p></div></div></section>
  <section class="beat section contact-section creative-contact" id="creative-contact" data-beat="contact"><div class="wrap contact-grid"><div class="panel">${eyebrow('05 / Make the next move')}<h2 data-reveal="glitch">Ready for your<br>new <em>team?</em></h2><p class="contact-lede" data-reveal>Tell us what you're building, and we'll map the next move.</p><a class="creative-start-link" href="#creative-contact-options">Start a Creative Project ${down}</a>${contactActions('Choose Instagram or text, and we’ll help map the next step.', 'creative-contact-options')}</div>${hasModel('creative-emblem') ? '<div class="model-stage emblem-stage" data-anchor="creative-emblem" aria-hidden="true"></div>' : ''}</div></section>`
});

// ---------- Brooklyn ----------
// Same structure and pacing as Long Island, in blue. Section labels only — Brooklyn body copy
// is still to come from the approved copy doc.
const bkGallery = [
  ['v2/bk-room-wide-blue.webp', 'The Brooklyn room: desk, booth, and fan under blue LED clouds', 1086, 1448, 'g-main'],
  ['brooklyn-studio-wide.webp', 'Wide view of the Brooklyn room from the desk side', 1800, 1199, 'g-wide'],
  ['brooklyn-desk-detail.webp', 'Monitors and keyboard at the Brooklyn desk', 1800, 1199, 'g-wide'],
];
// Brooklyn copy written from the photos and the Long Island structure — owner to review.
const bkServices = [
  ['Recording', 'Vocals and full sessions tracked through the booth, dialed in for your voice.'],
  ['Mix & Master', 'Records finished to hit right on every speaker, headphone, and phone.'],
  ['Beat Production', 'Beats built from scratch around your sound and where you want to take it.'],
  ['Content', 'Performance clips and session content shot in the room, ready to post.'],
];
const brooklyn = page({
  title: 'PRXDIGY Studio Brooklyn — Now Open',
  description: 'PRXDIGY Studio Brooklyn is open for recording, mixing, beat production, and content. DM or text to book a session.',
  path: '/studio/brooklyn/', og: 'og-brooklyn.jpg', active: destinations[2].href, className: 'page-brooklyn', world: 'brooklyn',
  body: `<section class="beat division-hero brooklyn-hero" data-beat="hero"><div class="wrap division-hero-grid"><div class="division-hero-copy"><img class="division-logo" src="${A}studio-logo-alpha.webp" alt="PRXDIGY Studio" width="650" height="650"><p class="eyebrow"><span class="status status-blue">${destinations[2].status}</span> / Brooklyn</p><h1 class="stack hero-stack">${lines('Brooklyn is where you make it.', 'Everywhere is where it goes.')}</h1><p class="hero-description">For sessions, availability, and location information, reach out directly.</p><div class="action-row"><a class="button button-light" href="${instagram}" ${ext}>DM ${site.instagram.label}${arrow}</a><a class="button button-outline" href="${sms}">Text ${site.text.label}${arrow}</a></div></div></div></section>
  <section class="beat section bk-installation" data-beat="installation"><div class="wrap bk-feature-grid"><div class="section-heading bk-intro${hasModel('tlm-103') ? ' has-mic' : ''}"><div>${eyebrow('01 / The room')}<h2 data-reveal="glitch">Built under<br>the <em>X.</em></h2><p data-reveal>Blue light, a glowing cloud X overhead, and a vocal booth a few steps from the desk. Brooklyn is built so you walk in, settle in, and get straight to the take — no dead time between the idea and the record.</p></div>${hasModel('tlm-103') ? '<figure class="bk-mic"><div class="model-stage bk-mic-stage" data-anchor="bk-mic" aria-hidden="true"></div><figcaption>On vocals / Neumann TLM 103</figcaption></figure>' : ''}</div><figure class="bk-feature" data-reveal>${img('v2/bk-desk-x-blue.webp', 'The Brooklyn desk under the glowing cloud X', 1086, 1448, 'loading="lazy" decoding="async"', '(max-width: 700px) 100vw, 40vw')}<figcaption>Brooklyn / The X</figcaption></figure><figure class="bk-feature bk-feature-alt" data-reveal>${img('v2/bk-hallway-blue.webp', 'The blue-lit hallway into the Brooklyn studio', 1086, 1448, 'loading="lazy" decoding="async"', '(max-width: 700px) 100vw, 30vw')}<figcaption>Brooklyn / The way in</figcaption></figure></div></section>
  <section class="beat section room-gallery bk-gallery" data-beat="room"><div class="wrap"><div class="section-heading">${eyebrow('02 / Inside Brooklyn')}<h2 data-reveal="glitch">Made for<br><em>late sessions.</em></h2><p data-reveal>Every corner of the room, lit the way it looks when you're in session.</p></div><div class="gallery-grid">${bkGallery.map(([file, alt, w, h, cls]) => `<figure class="${cls}" data-reveal tabindex="0">${img(file, alt, w, h)}</figure>`).join('')}</div></div></section>
  <section class="beat section services-section bk-services" data-beat="services"><div class="wrap"><div class="section-heading">${eyebrow('03 / What we do in Brooklyn')}<h2 data-reveal="glitch">Same standard.<br><em>New energy.</em></h2><p data-reveal>The same PRXDIGY process as Long Island, in a room with its own personality.</p></div><div class="service-list">${bkServices.map(([name, description], i) => `<div class="service-row" data-reveal><span>${String(i + 1).padStart(2, '0')}</span><h3>${name}</h3><p>${description}</p></div>`).join('')}</div><div class="bk-book" data-reveal><div><h3>Book Brooklyn</h3><p>Sessions in Brooklyn are booked directly. Send a DM or a text with what you're working on and when you want to come in.</p></div><div class="action-row"><a class="button button-light" href="${instagram}" ${ext}>DM ${site.instagram.label}${arrow}</a><a class="button button-outline" href="${sms}">Text ${site.text.label}${arrow}</a></div></div></div></section>
  <section class="beat bk-links" data-beat="links"><div class="wrap brooklyn-next"><p>Explore another part of PRXDIGY</p><a href="${L(destinations[0].href)}">Explore Long Island ${arrow}</a><a href="${L(destinations[1].href)}">Explore Creative Projects ${arrow}</a></div></section>`
});

// ---------- The Team ----------
// Four equal slots. Every field is a clearly marked placeholder until approved profiles arrive.
const teamSlots = [1, 2, 3, 4];
const team = page({
  title: 'The Team — PRXDIGY',
  description: 'The people behind PRXDIGY studios and Creative Projects.',
  path: '/team/', og: 'og-home.jpg', active: '/team/', className: 'page-team', world: 'team',
  body: `<section class="beat team-hero team-tba" data-beat="hero"><div class="wrap team-hero-grid"><div><p class="eyebrow"><span class="eyebrow-line"></span>PRXDIGY / The Team</p><h1 class="glitch-title">The Team</h1><p class="team-tba-note"><span class="status status-blue">In progress</span></p><p class="hero-description">The roster is being put together. To be announced.</p></div>${hasModel('studio-badge') ? '<div class="model-stage team-badge-stage" data-anchor="team-badge" aria-hidden="true"></div>' : `<img class="team-tba-logo" src="${A}studio-logo-alpha.webp" alt="PRXDIGY Studio" width="650" height="650">`}</div></section>`
});

// ---------- Cookie + Refund policies ----------
// DRAFTS written from the existing Terms and from what the site actually does. The review
// note at the top of each page comes off once the owner approves the wording.
const legalShell = ({ kicker, heading, updated, body, source = 'the existing Terms &amp; Conditions' }) => `<div class="legal-wrap">
  <a href="${L('/')}" class="legal-back">← Back to site</a>
  <span class="legal-kicker">${kicker}</span>
  <h1 class="legal-title">${heading}</h1>
  <p class="legal-updated">Last updated: ${updated}</p>
  <p class="legal-draft" role="note"><strong>Draft for owner review.</strong> This page was drafted from ${source} and should be checked before launch.</p>
  ${body}
  <div class="legal-contact"><p>Questions? Contact ${site.business.name}</p><p>${site.business.location}</p><p>Email: <a href="mailto:${site.business.email}">${site.business.email}</a></p><p>Text: <a href="${sms}">${site.text.label}</a></p></div>
</div>`;

const cookies = page({
  title: 'Cookie Policy — PRXDIGY', description: 'How the PRXDIGY website uses cookies and similar technologies.',
  path: '/cookies.html', og: 'og-home.jpg', className: 'page-legal', world: null,
  body: legalShell({ kicker: '// LEGAL_03', heading: 'Cookie Policy', updated: 'September 2026', source: 'an audit of what the site loads today', body: `
  <p>This Cookie Policy explains how the PRXDIGY website (prxdigystudio.com) uses cookies and similar technologies such as local storage.</p>
  <h2 id="summary">The short version</h2>
  <ul>
    <li>Our public pages do <strong>not</strong> set cookies.</li>
    <li>We do not use analytics, advertising, or tracking pixels.</li>
    <li>The Spotify player on the Long Island page only loads after you choose to load it. Once loaded, Spotify may set its own cookies.</li>
  </ul>
  <h2 id="what">What cookies are</h2>
  <p>Cookies are small text files a website stores in your browser. Similar technologies, like local storage, keep information on your device in the same way.</p>
  <h2 id="ours">What we use</h2>
  <p>Our public pages store nothing on your device. Fonts, images, video, and 3D models are served from our own site, so loading a page does not send your information to font or media providers.</p>
  <p>The private staff portal (<code>/portal/</code>) uses storage that is strictly necessary to keep staff signed in. It is not used by visitors.</p>
  <h2 id="third-party">Third-party services</h2>
  <ul>
    <li><strong>Spotify.</strong> The playlist player on the Long Island page is off until you press “Load Spotify player.” After that, Spotify’s <a href="https://www.spotify.com/legal/cookies-policy/" target="_blank" rel="noopener noreferrer">cookie policy</a> applies to the player.</li>
    <li><strong>Booking form.</strong> When you apply to book, your answers are sent to a Google Apps Script we use to receive requests. The form does not set cookies.</li>
    <li><strong>Links to Instagram, text, and email.</strong> These open other apps or sites, which have their own policies.</li>
    <li><strong>Hosting.</strong> The site is hosted on GitHub Pages, which may keep technical logs (such as IP addresses) for security. See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub’s privacy statement</a>.</li>
  </ul>
  <h2 id="choices">Your choices</h2>
  <p>You can block or delete cookies in your browser settings. Because our pages do not rely on cookies, the site works the same with them blocked; only the Spotify player may not load.</p>
  <h2 id="changes">Changes</h2>
  <p>If we add analytics or other cookies in the future, we will update this page and ask for your consent where the law requires it.</p>` }),
});

const refunds = page({
  title: 'Refund Policy — PRXDIGY', description: 'Refunds, deposits, and cancellations for PRXDIGY studio sessions, beat licenses, and creative projects.',
  path: '/refunds.html', og: 'og-home.jpg', className: 'page-legal', world: null,
  body: legalShell({ kicker: '// LEGAL_04', heading: 'Refund Policy', updated: 'September 2026', body: `
  <p>This Refund Policy covers studio sessions, beat licenses, and creative project deposits purchased from ${site.business.name}. It works alongside our <a href="${L('/terms.html')}">Terms &amp; Conditions</a>.</p>
  <h2 id="sessions">Studio sessions</h2>
  <ul>
    <li>A <strong>non-refundable deposit</strong> is required to lock in a session. The deposit is applied to your session total.</li>
    <li>You can reschedule if you tell us at least <strong>48 hours</strong> before your session. Less notice may forfeit the deposit.</li>
    <li>No-shows forfeit the deposit and any remaining session credit.</li>
    <li>Late arrivals shorten the session; the end time does not move.</li>
    <li>If ${site.business.name} has to cancel (for example, an equipment failure or emergency), you can choose a new time or a refund of what you paid for that session.</li>
  </ul>
  <h2 id="beats">Beat licenses</h2>
  <ul>
    <li>Beats are digital files delivered right after purchase, so <strong>license sales are final</strong>.</li>
    <li>If a file is missing, corrupted, or you were charged twice, contact us within <strong>14 days</strong> and we will send a working file or refund the duplicate charge.</li>
    <li>Exclusive licenses and custom production follow the terms in your written agreement.</li>
  </ul>
  <h2 id="projects">Creative project deposits</h2>
  <ul>
    <li>Creative projects start with a deposit that reserves our time and covers planning and pre-production. Deposits are <strong>non-refundable once work has begun</strong>.</li>
    <li>Payments for work already delivered or completed are non-refundable.</li>
    <li>If ${site.business.name} cannot deliver the agreed work, we will refund the unearned portion of what you paid.</li>
  </ul>
  <h2 id="mixing">Mixing and mastering</h2>
  <p>Packages include up to 2 rounds of revisions within 14 days of delivery, as described in our Terms. Dissatisfaction after the included revisions is handled with additional paid revisions rather than refunds.</p>
  <h2 id="how">How to request a refund</h2>
  <p>Email <a href="mailto:${site.business.email}">${site.business.email}</a> or text ${site.text.label} with your name, the date of purchase, and what went wrong. We reply within 5 business days. Approved refunds go back to the original payment method.</p>` }),
});

const notFound = page({
  title: 'Page Not Found — PRXDIGY', description: 'This PRXDIGY page could not be found. Explore our studios and Creative Projects.', path: '/404.html', og: 'og-home.jpg', className: 'page-404', world: 'lost',
  body: `<section class="beat not-found" data-beat="hero"><div class="wrap"><p class="eyebrow"><span class="eyebrow-line"></span>404 / Page not found</p><h1 class="glitch-title">Wrong turn.<br><em>Right company.</em></h1><p>That page isn't here. Find the part of PRXDIGY you need.</p><div class="action-row"><a class="button button-light" href="${L('/')}">Back to PRXDIGY ${arrow}</a><a class="text-link" href="${L(destinations[0].href)}">Explore Long Island ${arrow}</a></div></div></section>`
});

const out = PREVIEW ? PREVIEW.replace(/\/$/, '') + '/' : '';
const files = PREVIEW ? [
  ['index.html', home], ['long-island.html', longIsland], ['creative-projects.html', creative], ['brooklyn.html', brooklyn], ['team.html', team], ['cookies.html', cookies], ['refunds.html', refunds], ['404.html', notFound],
] : [
  ['index.html', home],
  ['studio/long-island/index.html', longIsland],
  ['creative-projects/index.html', creative],
  ['studio/brooklyn/index.html', brooklyn],
  ['team/index.html', team],
  ['cookies.html', cookies],
  ['refunds.html', refunds],
  ['404.html', notFound],
  ['sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', ...destinations.map(item => item.href), '/team/', '/terms.html', '/privacy.html', '/cookies.html', '/refunds.html'].map(path => `<url><loc>${site.origin}${path}</loc></url>`).join('')}</urlset>\n`],
  ['robots.txt', `User-agent: *\nAllow: /\nDisallow: /portal/\nSitemap: ${site.origin}/sitemap.xml\n`],
];
for (const [name, contents] of files) {
  const target = out + name;
  await mkdir(target.substring(0, target.lastIndexOf('/')) || '.', { recursive: true });
  await writeFile(target, contents, 'utf8');
  console.log(`Built ${target}`);
}

// Keep the existing legal policy text, while giving both pages the shared shell
// and the current public business number. The markers make repeated builds safe.
if (!PREVIEW) for (const name of ['privacy.html', 'terms.html']) {
  let html = await readFile(name, 'utf8');
  html = html.replace('href="styles.css"', 'href="/public.css"');
  if (!html.includes('src="/public.js"')) html = html.replace('</body>', '<script src="/public.js" defer></script>\n</body>');
  html = html.replaceAll('sms:+18884958012', sms).replaceAll('+1 (888) 495-8012', site.text.label);
  const sharedHeader = `<!-- PUBLIC HEADER START -->\n${header(name === 'terms.html' ? '/terms.html' : '')}\n<!-- PUBLIC HEADER END -->`;
  const sharedFooter = `<!-- PUBLIC FOOTER START -->\n${footer()}\n<!-- PUBLIC FOOTER END -->`;
  if (html.includes('<!-- PUBLIC HEADER START -->')) html = html.replace(/<!-- PUBLIC HEADER START -->[\s\S]*?<!-- PUBLIC HEADER END -->/, sharedHeader);
  else html = html.replace(/<!-- TEXTURE OVERLAYS -->[\s\S]*?<\/nav>/, sharedHeader);
  if (html.includes('<!-- PUBLIC FOOTER START -->')) html = html.replace(/<!-- PUBLIC FOOTER START -->[\s\S]*?<!-- PUBLIC FOOTER END -->/, sharedFooter);
  else html = html.replace(/<!-- FOOTER -->[\s\S]*?<\/footer>/, sharedFooter);
  await writeFile(name, html, 'utf8');
  console.log(`Updated ${name}`);
}
