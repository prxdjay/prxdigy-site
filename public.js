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
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    const counters = [...results.querySelectorAll('[data-count-to]')];
    const duration = 1150;
    let start;
    function frame(timestamp) {
      if (start === undefined) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      counters.forEach(counter => {
        const target = Number(counter.dataset.countTo);
        counter.textContent = `${Math.round(target * eased)}${counter.dataset.suffix}`;
      });
      if (progress < 1 && !motionReduced.matches) requestAnimationFrame(frame);
      else counters.forEach(counter => { counter.textContent = `${counter.dataset.countTo}${counter.dataset.suffix}`; });
    }
    requestAnimationFrame(frame);
  }, { threshold: 0.25 });
  observer.observe(results);
}

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
