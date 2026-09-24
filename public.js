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

// Spotify embed: branded loading state, and a plain link if the player never arrives.
document.querySelectorAll('.embed-shell').forEach(shell => {
  const frame = shell.querySelector('iframe');
  if (!frame) return;
  const ready = () => shell.classList.add('is-loaded');
  frame.addEventListener('load', ready);
  window.addEventListener('message', event => { if (event.origin === 'https://open.spotify.com') ready(); });
  setTimeout(() => { if (!shell.classList.contains('is-loaded')) shell.classList.add('is-fallback'); }, 9000);
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
    if (firstInvalid) {
      errorSummary.hidden = false;
      errorSummary.textContent = `Please complete ${invalidNames.join(', ')} before sending your request.`;
      errorSummary.focus();
      firstInvalid.focus();
      return;
    }
    errorSummary.hidden = true;

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
