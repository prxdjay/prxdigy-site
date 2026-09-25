// Every page opens at the top (a #link still lands on its section). The browser would
// otherwise restore the last scroll position, including on back/forward.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const toTop = () => {
  if (location.hash && location.hash !== '#start-project') return;
  window.scrollTo(0, 0);
  if (window.prxLenis) window.prxLenis.scrollTo(0, { immediate: true, force: true });
};
toTop();
window.addEventListener('load', toTop);
window.addEventListener('pageshow', event => { if (event.persisted) toTop(); });

const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
if (menuButton && navigation) {
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    navigation.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

const results = document.querySelector('.results-grid');
if (results && !motionReduced.matches && 'IntersectionObserver' in window) {
  // Counts up once, slowly, when the section is properly in view. Each figure starts at 0,
  // is staggered behind the one before it, and eases out so the last digits land heavy.
  const counters = [...results.querySelectorAll('[data-count-to]')];
  counters.forEach(counter => { counter.textContent = `0${counter.dataset.suffix}`; });
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    const duration = 3600, stagger = 450;
    let start;
    function frame(timestamp) {
      if (start === undefined) start = timestamp;
      let running = false;
      counters.forEach((counter, i) => {
        const target = Number(counter.dataset.countTo);
        const progress = Math.min(1, Math.max(0, (timestamp - start - i * stagger) / duration));
        const eased = 1 - (1 - progress) ** 4;
        counter.textContent = `${Math.round(target * eased)}${counter.dataset.suffix}`;
        if (progress < 1) running = true;
      });
      if (running) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, { threshold: 0.45 });
  observer.observe(results);
}

// Spotify: the player is added as its section comes near, so nothing loads from Spotify on
// pages or scroll positions that never reach it. A direct link shows if it is slow or blocked.
document.querySelectorAll('.embed-shell[data-embed-src]').forEach(shell => {
  const mount = () => {
    const frame = document.createElement('iframe');
    frame.title = 'PRXDIGY Studio playlist on Spotify';
    frame.src = shell.dataset.embedSrc;
    frame.width = '100%';
    frame.height = '352';
    frame.frameBorder = '0';
    frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    const ready = () => { shell.classList.remove('is-loading'); shell.classList.add('is-loaded'); };
    frame.addEventListener('load', ready);
    setTimeout(() => { if (!shell.classList.contains('is-loaded')) shell.classList.add('is-fallback'); }, 9000);
    shell.appendChild(frame);
  };
  if (!('IntersectionObserver' in window)) { mount(); return; }
  const watch = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    watch.disconnect();
    mount();
  }, { rootMargin: '900px 0px' });
  watch.observe(shell);
});

// Preserve the existing Google Apps Script booking endpoint and payload.
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbz7x0d230bs_ybXRV9nvEF358S6veuCljHXKPvPLKs4RYew9gu3EIYKz1sw_R5K-soHvg/exec';
const form = document.getElementById('intakeForm');
if (form) {
  const errorSummary = document.getElementById('formErrors');
  const success = document.getElementById('formSuccess');
  const required = ['name', 'phone', 'project', 'budget', 'package', 'timeframe'];
  const field = name => form.elements.namedItem(name);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    let firstInvalid = null;
    const invalidNames = [];
    required.forEach(name => {
      const input = field(name);
      const missing = !input.value.trim();
      const badPhone = name === 'phone' && !missing && input.value.replace(/\D/g, '').length < 7;
      const invalid = missing || badPhone;
      input.setAttribute('aria-invalid', String(invalid));
      if (invalid) {
        if (!firstInvalid) firstInvalid = input;
        invalidNames.push(badPhone ? 'a valid phone number' : input.labels[0].textContent.replace('*', '').trim().toLowerCase());
      }
    });
    const consent = field('consent');
    const noConsent = consent && !consent.checked;
    if (consent) consent.setAttribute('aria-invalid', String(noConsent));
    if (noConsent && !firstInvalid) firstInvalid = consent;
    if (firstInvalid) {
      const parts = [];
      if (invalidNames.length) parts.push(`complete ${invalidNames.join(', ')}`);
      if (noConsent) parts.push('agree to the Privacy Policy and Terms');
      errorSummary.hidden = false;
      errorSummary.textContent = `Please ${parts.join(' and ')} before sending your request.`;
      errorSummary.focus();
      firstInvalid.focus();
      return;
    }
    errorSummary.hidden = true;

    // Spam guards: bots fill the hidden field or submit within a couple of seconds, and a
    // person rarely needs to send twice in a minute. Bots get a quiet "sent" with nothing sent.
    const looksLikeBot = (field('website') && field('website').value) || performance.now() < 2500;
    let lastSent = 0;
    try { lastSent = +sessionStorage.getItem('prx-booking-sent') || 0; } catch (e) { /* storage blocked */ }
    if (!looksLikeBot && Date.now() - lastSent < 60000) {
      errorSummary.hidden = false;
      errorSummary.textContent = 'Your request was just sent. Give it a minute before sending another.';
      errorSummary.focus();
      return;
    }
    if (looksLikeBot) {
      form.hidden = true;
      success.hidden = false;
      return;
    }

    const data = {
      name: field('name').value.trim(),
      phone: field('phone').value.trim(),
      instagram: field('instagram').value.trim(),
      project: field('project').value.trim(),
      budget: field('budget').value,
      package: field('package').value,
      timeframe: field('timeframe').value,
      timestamp: new Date().toISOString(),
      source: 'prxdigystudio.com',
    };
    const submit = form.querySelector('[type="submit"]');
    const original = submit.innerHTML;
    submit.disabled = true;
    submit.textContent = 'Sending request…';
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      try { sessionStorage.setItem('prx-booking-sent', String(Date.now())); } catch (e) { /* storage blocked */ }
      form.hidden = true;
      success.hidden = false;
      success.focus();
      success.scrollIntoView({ behavior: motionReduced.matches ? 'auto' : 'smooth', block: 'center' });
    } catch (error) {
      console.error('Booking request failed:', error);
      submit.disabled = false;
      submit.innerHTML = original;
      errorSummary.hidden = false;
      errorSummary.innerHTML = 'The request could not be sent. Please <a href="sms:+16318709243">text 631-870-9243</a> directly.';
      errorSummary.focus();
    }
  });
  form.querySelectorAll('input, select, textarea').forEach(input => input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    errorSummary.hidden = true;
  }));
}

// Header state, scroll reveals, and the scanline wipe between pages.
const setScrolled = () => document.body.classList.toggle('is-scrolled', window.scrollY > 40);
setScrolled();
window.addEventListener('scroll', setScrolled, { passive: true });

const revealables = document.querySelectorAll('[data-reveal]');
if (motionReduced.matches || !('IntersectionObserver' in window)) {
  revealables.forEach(el => el.classList.add('is-in'));
} else {
  const revealer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    revealer.unobserve(entry.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  revealables.forEach(el => revealer.observe(el));
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || motionReduced.matches || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || link.target) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.protocol.indexOf('http') !== 0) return;
  if (url.pathname === location.pathname && url.hash) return;
  event.preventDefault();
  document.body.classList.add('is-leaving');
  setTimeout(() => { location.href = url.href; }, 420);
});
window.addEventListener('pageshow', () => document.body.classList.remove('is-leaving'));

// Blended videos stay hidden until real frames are playing, so no black box flashes first.
document.querySelectorAll('video.reveal-on-play').forEach(video => {
  const show = () => video.classList.add('is-playing');
  // Browsers that can't play the file get the still frame instead of an empty spot.
  const fail = () => { if (!video.classList.contains('is-playing')) video.parentElement.classList.add('video-failed'); };
  if (!video.canPlayType('video/mp4; codecs="avc1.42E01E"')) fail();
  video.addEventListener('error', fail);
  setTimeout(fail, 6000);
  video.addEventListener('playing', show);
  if (motionReduced.matches) video.addEventListener('loadeddata', show);
  if (video.readyState >= 3 && !video.paused) show();
});

// Pause/play for the looping videos; reduced-motion visitors start paused.
document.querySelectorAll('.media-toggle').forEach(button => {
  const video = document.getElementById(button.dataset.media);
  if (!video) return;
  const sync = () => {
    const paused = video.paused;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    button.classList.toggle('is-paused', paused);
  };
  if (motionReduced.matches) { video.removeAttribute('autoplay'); video.pause(); }
  button.addEventListener('click', () => { if (video.paused) video.play(); else video.pause(); });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  sync();
});

// Photo reel: auto-drifts with a mouse; on touch screens it becomes a swipeable strip.
const reelTrack = document.querySelector('.reel-track');
if (reelTrack && window.matchMedia('(hover: none)').matches) {
  reelTrack.closest('.reel').classList.add('is-touch');
  reelTrack.querySelectorAll('[aria-hidden="true"].reel-item').forEach(item => item.remove());
}

// Gallery tiles: tap toggles the same lift/caption state a mouse gets on hover.
document.querySelectorAll('.gallery-grid figure').forEach(tile => {
  tile.addEventListener('click', () => {
    const on = !tile.classList.contains('is-active');
    tile.parentElement.querySelectorAll('.is-active').forEach(other => other.classList.remove('is-active'));
    tile.classList.toggle('is-active', on);
  });
});

// Start a Project: every "#start-project" link opens the fast-contact panel (a native dialog, so
// focus is trapped and Esc closes it). Capture phase so smooth-scroll never grabs these links.
const startPanel = document.getElementById('start-project');
if (startPanel && typeof startPanel.showModal === 'function') {
  let opener = null;
  const open = trigger => {
    opener = trigger || document.activeElement;
    startPanel.showModal();
    document.body.classList.add('start-open');
    const first = startPanel.querySelector('.start-option');
    if (first) first.focus();
  };
  const close = () => startPanel.close();
  startPanel.addEventListener('close', () => {
    document.body.classList.remove('start-open');
    if (opener && opener.focus) opener.focus();
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href$="#start-project"]');
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    open(link);
  }, true);
  startPanel.querySelector('[data-start-close]').addEventListener('click', close);
  startPanel.addEventListener('click', event => { if (event.target === startPanel) close(); });
  if (location.hash === '#start-project') open();
}
