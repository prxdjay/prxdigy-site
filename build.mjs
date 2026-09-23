import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { site } from './site-config.mjs';

const A = '/assets/public/';
const instagram = site.instagram.href;
const sms = site.text.href;
const destinations = site.destinations;

function header(active = '') {
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="header-inner wrap">
      <a class="brand" href="/" aria-label="PRXDIGY home"><img src="${A}wordmark.webp" alt="PRXDIGY" width="1200" height="400"></a>
      <nav class="site-nav" id="primary-nav" aria-label="Primary navigation">
        ${destinations.map(item => `<a href="${item.href}"${active === item.href ? ' aria-current="page"' : ''}>${item.label}</a>`).join('')}
        <a href="/#contact">Contact</a>
      </nav>
      <a class="header-cta" href="/#contact" aria-label="Start a Project"><span class="header-cta-full">Start a Project</span><span class="header-cta-short" aria-hidden="true">Start</span><span aria-hidden="true">↗</span></a>
      <button class="menu-toggle" type="button" aria-label="Open navigation" aria-controls="primary-nav" aria-expanded="false"><span></span><span></span></button>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer" id="footer">
    <div class="wrap footer-top">
      <div class="footer-identity"><a href="/" aria-label="PRXDIGY home"><img src="${A}wordmark.webp" alt="PRXDIGY" width="1200" height="400"></a><p>Music. Content. Direction. Growth.</p></div>
      <nav aria-label="Footer destinations"><span class="footer-label">Explore</span>${destinations.map(item => `<a href="${item.href}">${item.label}</a>`).join('')}</nav>
      <div class="footer-contact"><span class="footer-label">Connect</span><a href="${instagram}" target="_blank" rel="noopener noreferrer">Instagram ${site.instagram.label}</a><a href="${sms}">Text ${site.text.label}</a></div>
    </div>
    <div class="wrap footer-bottom"><span>© ${new Date().getFullYear()} PRXDIGY</span><div><a href="/privacy.html">Privacy Policy</a><a href="/terms.html">Terms &amp; Conditions</a></div><span>Built for the work.</span></div>
  </footer>`;
}

function page({ title, description, path, og, active, body, className = '', schema = '' }) {
  const url = `${site.origin}${path}`;
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title><meta name="description" content="${description}">
  <link rel="canonical" href="${url}"><meta name="theme-color" content="#101011">
  <meta property="og:type" content="website"><meta property="og:site_name" content="PRXDIGY"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${site.origin}${A}${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${site.origin}${A}${og}">
  <link rel="icon" href="/assets/favicon.ico"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/public.css"><script src="/public.js" defer></script>
${schema ? `  <script type="application/ld+json">${schema}</script>` : ''}
</head><body class="${className}">${header(active)}<main id="main">${body}</main>${footer()}</body></html>\n`;
}

const contactActions = (context = '', id = '') => `<div class="action-row"${id ? ` id="${id}"` : ''}><a class="button button-light" href="${instagram}" target="_blank" rel="noopener noreferrer">DM ${site.instagram.label}<span aria-hidden="true">↗</span></a><a class="button button-outline" href="${sms}">Text ${site.text.label}<span aria-hidden="true">↗</span></a></div>${context ? `<p class="contact-context">${context}</p>` : ''}`;

const home = page({
  title: 'PRXDIGY — Music, Content, Direction & Growth',
  description: 'PRXDIGY brings recording studios, creative production, campaigns, and growth under one name. Explore Long Island, Creative Projects, and Brooklyn.',
  path: '/', og: 'og-home.jpg', className: 'page-home',
  schema: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'PRXDIGY', url: site.origin, sameAs: [instagram], telephone: '+1-631-870-9243' }),
  body: `<section class="hero home-hero">
    <div class="wrap hero-grid"><div class="hero-copy"><p class="eyebrow"><span class="eyebrow-line"></span> One creative company / New York</p><img class="hero-wordmark" src="${A}wordmark.webp" alt="PRXDIGY" width="1200" height="400"><h1>Music. Content.<br>Direction. <em>Growth.</em></h1><p class="hero-description">One creative company built to move artists, brands, and ideas forward.</p><div class="action-row"><a class="button button-light" href="#destinations">Explore PRXDIGY <span aria-hidden="true">↓</span></a><a class="text-link" href="${instagram}" target="_blank" rel="noopener noreferrer">DM on Instagram <span aria-hidden="true">↗</span></a></div></div>
    <div class="home-hero-visual"><img src="${A}studio-mic.webp" alt="Microphone inside PRXDIGY Studio" width="1800" height="1226" fetchpriority="high"><div class="hero-visual-note"><span>01 / 03</span><span>Make the work. Move the work.</span></div></div></div>
  </section>
  <section class="section destinations" id="destinations"><div class="wrap"><div class="section-heading"><p class="eyebrow">01 / Find your direction</p><h2>One name.<br><em>Three ways in.</em></h2><p>Choose the space or team that fits what you're building.</p></div>
    <div class="destination-grid">
      <a class="destination destination-li" href="${destinations[0].href}"><div class="destination-image"><img src="${A}studio-sign.webp" alt="PRXDIGY Studio sign inside the Long Island room" width="1400" height="1056" loading="lazy"></div><div class="destination-content"><span class="destination-index">01 / PRXDIGY Studio</span><span class="status">${destinations[0].status}</span><h3>Long Island</h3><p>Recording, mixing, production, content, and creative direction.</p><span class="destination-action">Enter Long Island <span aria-hidden="true">↗</span></span></div></a>
      <a class="destination destination-creative" href="${destinations[1].href}"><div class="destination-image"><img src="${A}production-wide.webp" alt="Performers in a PRXDIGY creative production" width="1400" height="933" loading="lazy"><img class="destination-creative-logo" src="${A}creative-logo.webp" alt="PRXDIGY Creative Projects" width="900" height="600" loading="lazy"></div><div class="destination-content"><span class="destination-index">02 / PRXDIGY</span><span class="status status-neutral">Creative division</span><h3>Creative Projects</h3><p>Social media growth, content, campaigns, creative direction, and artist development.</p><span class="destination-action">Explore Creative Projects <span aria-hidden="true">↗</span></span></div></a>
      <a class="destination destination-brooklyn" href="${destinations[2].href}"><div class="destination-image abstract-image"><span class="abstract-orbit"></span><img src="${A}studio-logo.webp" alt="PRXDIGY Studio" width="650" height="650" loading="lazy"></div><div class="destination-content"><span class="destination-index">03 / PRXDIGY Studio</span><span class="status">${destinations[2].status}</span><h3>Brooklyn</h3><p>A new PRXDIGY studio location. Full location details are on the way.</p><span class="destination-action">Brooklyn Information <span aria-hidden="true">↗</span></span></div></a>
    </div></div></section>
  <section class="brand-statement section"><div class="wrap statement-grid"><p class="eyebrow">02 / The company</p><div><h2>From the first take<br>to the <em>public release.</em></h2><div class="statement-columns"><p><strong>PRXDIGY</strong> is the umbrella for the work.</p><p><strong>Studio</strong> is where records and content are physically made.</p><p><strong>Creative Projects</strong> builds strategy, campaigns, growth, and the larger creative system around them.</p></div></div></div></section>
  <section class="contact-section section" id="contact"><div class="wrap contact-grid"><div><p class="eyebrow">03 / Let's talk</p><h2>Not sure where your<br>project <em>belongs?</em></h2></div><div><p>Tell us what you're building. We'll point you in the right direction.</p>${contactActions()}</div></div></section>`
});

const studioServices = [
  ['Recording', 'Tracked with attention to tone, take, and performance.'],
  ['Mix & Master', 'Polished, streaming-ready records that translate across systems.'],
  ['Beat Production', "Custom production built around the artist's sound."],
  ['Content / Reels', 'Performance clips, rollout content, and supporting visual assets.'],
  ['Creative Direction', 'World-building, rollout vision, and a cohesive release identity.'],
  ['Songwriting', 'Top-lines, hooks, and full records, written with or for the artist.'],
];

const longIsland = page({
  title: 'PRXDIGY Studio Long Island — Recording, Mixing & Production',
  description: 'PRXDIGY Studio Long Island is now booking recording, mixing, beat production, content, creative direction, and songwriting. Apply to book a session.',
  path: '/studio/long-island/', og: 'og-long-island.jpg', active: destinations[0].href, className: 'page-studio',
  body: `<section class="hero division-hero studio-hero"><div class="wrap division-hero-grid"><div class="division-hero-copy"><img class="studio-hero-logo" src="${A}studio-logo.webp" alt="PRXDIGY Studio" width="650" height="650"><p class="eyebrow"><span class="status">${destinations[0].status}</span> / Long Island</p><h1>The room where<br>the work <em>moves.</em></h1><p class="hero-description">Recording, mixing, production, content, and creative direction for artists ready to build.</p><div class="action-row"><a class="button button-light" href="#book">Apply to Book <span aria-hidden="true">↓</span></a><a class="button button-outline" href="${sms}">Text PRXDIGY <span aria-hidden="true">↗</span></a><a class="text-link" href="${instagram}" target="_blank" rel="noopener noreferrer">DM on Instagram <span aria-hidden="true">↗</span></a></div></div><div class="division-hero-image"><img src="${A}studio-mic.webp" alt="Studio microphone lit in the Long Island room" width="1800" height="1226" fetchpriority="high"><span class="image-caption">PRXDIGY Studio / Long Island</span></div></div></section>
  <section class="section listening-section"><div class="wrap listening-grid"><div><p class="eyebrow">01 / The sound</p><h2>Listen to<br><em>the work.</em></h2><p>The records speak louder than the room.</p></div><div class="spotify-frame"><iframe title="PRXDIGY Studio playlist on Spotify" src="https://open.spotify.com/embed/playlist/1gKUydEemsUPCpqJVEd2NQ?utm_source=generator" width="100%" height="352" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></div></div></section>
  <section class="section room-gallery"><div class="wrap"><div class="section-heading"><p class="eyebrow">02 / Inside the room</p><h2>Where the records<br><em>get made.</em></h2><p>Real details from the Long Island studio.</p></div><div class="gallery-grid"><figure class="gallery-main"><img src="${A}studio-sign.webp" alt="PRXDIGY Studio emblem in the Long Island room" width="1400" height="1056" loading="lazy"><figcaption>The room has its own point of view.</figcaption></figure><figure><img src="${A}studio-keys.webp" alt="Keyboard used for production in the studio" width="1400" height="769" loading="lazy"><figcaption>Built around the sound.</figcaption></figure><figure><img src="${A}studio-guitar.webp" alt="Guitar in the red-lit studio" width="1200" height="775" loading="lazy"><figcaption>Space to find the next idea.</figcaption></figure></div></div></section>
  <section class="section services-section"><div class="wrap"><div class="section-heading"><p class="eyebrow">03 / What we do</p><h2>Every part of<br><em>the record.</em></h2><p>From the first idea to the final detail.</p></div><div class="service-list">${studioServices.map(([name, description], i) => `<div class="service-row"><span>${String(i + 1).padStart(2, '0')}</span><h3>${name}</h3><p>${description}</p></div>`).join('')}</div></div></section>
  <section class="section room-story"><div class="wrap story-grid"><div class="story-image"><img src="${A}studio-ceiling.webp" alt="Atmospheric lighting across the studio ceiling" width="1400" height="762" loading="lazy"></div><div class="story-copy"><p class="eyebrow">04 / The atmosphere</p><h2>The room is<br><em>everything.</em></h2><p>The room sets the tone. The work finishes it. Starlight ceiling, red light, low glow—every detail is there to help you settle in and perform at your best.</p><img src="${A}studio-couch.webp" alt="PRXDIGY Studio detail in red light" width="1400" height="841" loading="lazy"></div></div></section>
  <section class="section booking-section" id="book"><div class="wrap booking-grid"><div class="booking-intro"><p class="eyebrow">05 / Book the room</p><h2>Ready to<br><em>lock in?</em></h2><p>Tell us what you're building. If it fits, we'll reach out to plan the session.</p><p class="booking-note">Prefer to talk first? <a href="${sms}">Text PRXDIGY</a> or <a href="${instagram}" target="_blank" rel="noopener noreferrer">DM on Instagram</a>.</p></div><div class="booking-panel"><form id="intakeForm" novalidate><div class="form-error-summary" id="formErrors" role="alert" tabindex="-1" hidden></div><div class="form-field"><label for="name">Name <span aria-hidden="true">*</span></label><input id="name" name="name" type="text" autocomplete="name" required></div><div class="form-pair"><div class="form-field"><label for="phone">Phone <span aria-hidden="true">*</span></label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div><div class="form-field"><label for="instagram">Instagram</label><input id="instagram" name="instagram" type="text" placeholder="@" autocomplete="off"></div></div><div class="form-field"><label for="project">What are you working on? <span aria-hidden="true">*</span></label><textarea id="project" name="project" rows="4" required></textarea></div><div class="form-pair"><div class="form-field"><label for="budget">Budget range <span aria-hidden="true">*</span></label><select id="budget" name="budget" required><option value="">Select a range</option><option value="under-500">Under $500</option><option value="500-1500">$500 – $1,500</option><option value="1500-5000">$1,500 – $5,000</option><option value="5000-plus">$5,000+</option></select></div><div class="form-field"><label for="package">Package interest <span aria-hidden="true">*</span></label><select id="package" name="package" required><option value="">Select an area</option><option value="recording">Recording Session</option><option value="mix-master">Mix &amp; Master</option><option value="beats">Beat Production</option><option value="content">Content / Reels</option><option value="creative">Creative Direction</option><option value="songwriting">Songwriting</option><option value="full">Full Rollout</option></select></div></div><div class="form-field"><label for="timeframe">Timeframe <span aria-hidden="true">*</span></label><select id="timeframe" name="timeframe" required><option value="">Select a timeframe</option><option value="asap">ASAP — this week</option><option value="2-weeks">Next 2 weeks</option><option value="month">Within a month</option><option value="flexible">Flexible</option></select></div><button class="button button-light form-submit" type="submit">Apply to Book <span aria-hidden="true">↗</span></button><p class="form-disclaimer">By submitting this form, you agree to receive text messages from PRXDIGY STUDIO regarding your booking. Message &amp; data rates may apply. Reply STOP to opt out. See our <a href="/privacy.html">Privacy Policy</a> and <a href="/terms.html">Terms &amp; Conditions</a>.</p></form><div class="form-success" id="formSuccess" role="status" tabindex="-1" hidden><span aria-hidden="true">✓</span><h3>Request received.</h3><p>We'll reach out shortly if it's a fit. For a faster response, <a href="${sms}">text ${site.text.label}</a>.</p></div></div></div></section>`
});

const creativeCapabilities = [
  ['Social Media Growth and Content', 'We create the content systems, rollout assets, and publishing rhythm that help brands and artists stay visible.'],
  ['Campaigns and Creative Direction', 'We shape the concept, identity, positioning, and creative world around a project.'],
  ['Artist Development and Music Production', 'We support the music, writing, production, engineering, visuals, and release strategy behind the artist.'],
  ['Production, Editing, Scheduling, and Rollout', 'We plan, shoot, edit, schedule, publish, and refine the work across the full campaign.'],
];
const processSteps = ['Brand reset', 'Creative direction', 'Competitive positioning', 'Content strategy', 'Concept and production', 'Editing, scheduling, and rollout', 'Growth tracking and refinement'];
const support = ['Writers', 'Producers', 'Engineers', 'Studio spaces', 'Visual production', 'Release support', 'Creative and industry relationships'];

const creative = page({
  title: 'PRXDIGY Creative Projects — Content, Campaigns & Growth',
  description: 'PRXDIGY Creative Projects builds strategy, content, campaigns, music, visuals, and rollout systems that help artists and brands grow.',
  path: '/creative-projects/', og: 'og-creative.jpg', active: destinations[1].href, className: 'page-creative',
  body: `<section class="hero division-hero creative-hero"><div class="wrap division-hero-grid"><div class="division-hero-copy"><img class="creative-hero-logo" src="${A}creative-logo.webp" alt="PRXDIGY Creative Projects" width="900" height="600"><p class="eyebrow">PRXDIGY / Creative Projects</p><h1>Creative direction<br>for projects that<br>need to <em>move.</em></h1><p class="hero-description">We build the strategy, content, music, visuals, and rollout that help artists and brands grow.</p><div class="action-row"><a class="button button-light" href="#creative-contact">Start a Creative Project <span aria-hidden="true">↓</span></a><a class="text-link" href="${instagram}" target="_blank" rel="noopener noreferrer">DM on Instagram <span aria-hidden="true">↗</span></a></div></div><div class="division-hero-image creative-hero-image"><img src="${A}production-wide.webp" alt="A filmed performance during a PRXDIGY creative production" width="1400" height="933" fetchpriority="high"><span class="image-caption">Concept / Production / Rollout</span></div></div></section>
  <section class="section results-section" id="results"><div class="wrap"><p class="eyebrow">01 / Verified 2026 totals</p><h2>Results</h2><div class="results-grid">${site.results.map(item => `<div class="result"><div class="result-number"><span class="sr-only">${item.value}${item.suffix}</span><span aria-hidden="true" data-count-to="${item.value}" data-suffix="${item.suffix}">${item.value}${item.suffix}</span></div><p>${item.label}</p></div>`).join('')}</div></div></section>
  <section class="section creative-services"><div class="wrap"><div class="section-heading"><p class="eyebrow">02 / What we do</p><h2>More than content.<br><em>We build momentum.</em></h2><p>One connected team across strategy, creation, and the release.</p></div><div class="capability-list">${creativeCapabilities.map(([name, description], i) => `<div class="capability"><span>${String(i + 1).padStart(2, '0')}</span><h3>${name}</h3><p>${description}</p></div>`).join('')}</div></div></section>
  <section class="section selected-work"><div class="wrap"><div class="section-heading"><p class="eyebrow">03 / In practice</p><h2>Selected work</h2><p>Anonymous glimpses into the production behind the work.</p></div><div class="work-grid"><figure class="work-item"><div class="work-image"><img src="${A}production-wide.webp" alt="Dance performers on the set of an anonymous artist visual" width="1400" height="933" loading="lazy"></div><figcaption><span>01 / Artist rollout</span><h3>A visual world built around the release.</h3><p>Performance content, production, and rollout assets.</p></figcaption></figure><figure class="work-item"><div class="work-image portrait"><img src="${A}production-performance.webp" alt="Vocal performance filmed during an anonymous creative production" width="850" height="1511" loading="lazy"></div><figcaption><span>02 / Visual production</span><h3>Make the moment feel like the music.</h3><p>Concept, shoot direction, editing, and social-ready content.</p></figcaption></figure></div></div></section>
  <section class="section process-section"><div class="wrap process-grid"><div class="process-heading"><p class="eyebrow">04 / How it connects</p><h2>The full<br><em>package.</em></h2><p>We can help shape the idea, define the direction, create the content, release the work, and measure what happens next.</p></div><div><ol class="process-list">${processSteps.map((step, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${step}</li>`).join('')}</ol><div class="support-list"><p>Connected capabilities</p><ul>${support.map(item => `<li>${item}</li>`).join('')}</ul></div><p class="process-close">From the first idea to the public release.</p></div></div></section>
  <section class="section contact-section creative-contact" id="creative-contact"><div class="wrap contact-grid"><div><p class="eyebrow">05 / Make the next move</p><h2>Ready to build<br>something that <em>moves?</em></h2></div><div><p>Tell us what you're building, and we'll map the next move.</p><a class="creative-start-link" href="#creative-contact-options">Start a Creative Project <span aria-hidden="true">↓</span></a>${contactActions('Choose Instagram or text, and we’ll help map the next step.', 'creative-contact-options')}</div></div></section>`
});

const brooklyn = page({
  title: 'PRXDIGY Studio Brooklyn — Now Open',
  description: 'PRXDIGY Studio Brooklyn is now open. Reach out for sessions, availability, and location information while the full location page is being documented.',
  path: '/studio/brooklyn/', og: 'og-brooklyn.jpg', active: destinations[2].href, className: 'page-brooklyn',
  body: `<section class="brooklyn-page"><div class="wrap brooklyn-grid"><div class="brooklyn-copy"><img class="brooklyn-logo" src="${A}studio-logo.webp" alt="PRXDIGY Studio" width="650" height="650"><p class="eyebrow"><span class="status">${destinations[2].status}</span> / Brooklyn</p><h1>Brooklyn is open.<br><em>The full experience</em><br>is being documented.</h1><p class="hero-description">For sessions, availability, and location information, reach out directly.</p><div class="action-row"><a class="button button-light" href="${instagram}" target="_blank" rel="noopener noreferrer">DM ${site.instagram.label}<span aria-hidden="true">↗</span></a><a class="button button-outline" href="${sms}">Text ${site.text.label}<span aria-hidden="true">↗</span></a></div><p class="brooklyn-note">Full location page in progress.</p></div><div class="brooklyn-abstract" aria-hidden="true"><div class="brooklyn-ring"></div><img src="${A}wordmark.webp" alt="" width="1200" height="400"><span>BK / NY</span></div></div><div class="wrap brooklyn-next"><p>Explore another part of PRXDIGY</p><a href="${destinations[0].href}">Explore Long Island <span aria-hidden="true">↗</span></a><a href="${destinations[1].href}">Explore Creative Projects <span aria-hidden="true">↗</span></a></div></section>`
});

const notFound = page({
  title: 'Page Not Found — PRXDIGY', description: 'This PRXDIGY page could not be found. Explore our studios and Creative Projects.', path: '/404.html', og: 'og-home.jpg', className: 'page-404',
  body: `<section class="not-found section"><div class="wrap"><p class="eyebrow">404 / Page not found</p><h1>Wrong turn.<br><em>Right company.</em></h1><p>That page isn't here. Find the part of PRXDIGY you need.</p><div class="action-row"><a class="button button-light" href="/">Back to PRXDIGY <span aria-hidden="true">↗</span></a><a class="text-link" href="${destinations[0].href}">Explore Long Island <span aria-hidden="true">↗</span></a></div></div></section>`
});

const files = [
  ['index.html', home],
  ['studio/long-island/index.html', longIsland],
  ['creative-projects/index.html', creative],
  ['studio/brooklyn/index.html', brooklyn],
  ['404.html', notFound],
  ['sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', ...destinations.map(item => item.href)].map(path => `<url><loc>${site.origin}${path}</loc></url>`).join('')}</urlset>\n`],
  ['robots.txt', `User-agent: *\nAllow: /\nDisallow: /portal/\nSitemap: ${site.origin}/sitemap.xml\n`],
];
for (const [name, contents] of files) {
  await mkdir(name.substring(0, name.lastIndexOf('/')) || '.', { recursive: true });
  await writeFile(name, contents, 'utf8');
  console.log(`Built ${name}`);
}

// Keep the existing legal policy text, while giving both pages the shared shell
// and the current public business number. The markers make repeated builds safe.
for (const name of ['privacy.html', 'terms.html']) {
  let html = await readFile(name, 'utf8');
  html = html.replace('href="styles.css"', 'href="/public.css"');
  if (!html.includes('src="/public.js"')) html = html.replace('</body>', '<script src="/public.js" defer></script>\n</body>');
  html = html.replaceAll('sms:+18884958012', sms).replaceAll('+1 (888) 495-8012', site.text.label);
  const sharedHeader = `<!-- PUBLIC HEADER START -->\n${header()}\n<!-- PUBLIC HEADER END -->`;
  const sharedFooter = `<!-- PUBLIC FOOTER START -->\n${footer()}\n<!-- PUBLIC FOOTER END -->`;
  if (html.includes('<!-- PUBLIC HEADER START -->')) html = html.replace(/<!-- PUBLIC HEADER START -->[\s\S]*?<!-- PUBLIC HEADER END -->/, sharedHeader);
  else html = html.replace(/<!-- TEXTURE OVERLAYS -->[\s\S]*?<\/nav>/, sharedHeader);
  if (html.includes('<!-- PUBLIC FOOTER START -->')) html = html.replace(/<!-- PUBLIC FOOTER START -->[\s\S]*?<!-- PUBLIC FOOTER END -->/, sharedFooter);
  else html = html.replace(/<!-- FOOTER -->[\s\S]*?<\/footer>/, sharedFooter);
  await writeFile(name, html, 'utf8');
  console.log(`Updated ${name}`);
}
