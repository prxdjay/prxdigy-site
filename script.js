/* ==========================================================
   PRXDIGY STUDIO
   ========================================================== */

// Reveal on scroll
const revealEls = document.querySelectorAll('.section-header, .proof-card, .service-row, .vibe-panel, .vibe-text, .exclusive-panel, .intake-form');
revealEls.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 50);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => io.observe(el));

// Smooth scroll for nav anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ==========================================================
   FORM HANDLING
   ==========================================================
   BACKEND CONNECTION:
   To connect this form to Google Sheets via Apps Script:
     1. Create a new Google Sheet
     2. Extensions → Apps Script → paste a doPost handler (see README)
     3. Deploy as Web App (execute as: Me, access: Anyone)
     4. Replace WEBHOOK_URL below with your deployed URL
   Other options: Zapier, Make.com, Formspree, n8n — just swap WEBHOOK_URL.
   ========================================================== */

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzhpmMidqAipSZYgnfBhyVV_DPG8LxxWEVGGiW7YAWiDchUFltfBut5eReJ0jO2sZU5/exec';

const form = document.getElementById('intakeForm');
const successEl = document.getElementById('formSuccess');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Clear errors
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  // Validate required fields
  const required = ['name', 'phone', 'project', 'budget', 'package', 'timeframe'];
  let hasError = false;
  required.forEach(id => {
    const field = document.getElementById(id);
    if (!field.value.trim()) {
      field.classList.add('error');
      hasError = true;
    }
  });

  if (hasError) {
    const firstError = form.querySelector('.error');
    if (firstError) firstError.focus();
    return;
  }

  // Collect data
  const data = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    instagram: form.instagram.value.trim(),
    project: form.project.value.trim(),
    budget: form.budget.value,
    package: form.package.value,
    timeframe: form.timeframe.value,
    timestamp: new Date().toISOString(),
    source: 'prxdigystudio.com'
  };

  const submitBtn = form.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span>SENDING...</span>';
  submitBtn.disabled = true;

  try {
    if (WEBHOOK_URL) {
      // Submit to your backend (Google Apps Script / Zapier / n8n / etc.)
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', // needed for Google Apps Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      // Dev mode — no webhook set, just log
      console.log('[PRXDIGY] Form submitted (no webhook configured):', data);
      await new Promise(r => setTimeout(r, 600));
    }

    // Show success
    form.hidden = true;
    successEl.hidden = false;
    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (err) {
    console.error('Submit error:', err);
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    alert('Something went wrong. Please text 631-870-9243 directly.');
  }
});

// Clear error on input
form.querySelectorAll('input, textarea, select').forEach(field => {
  field.addEventListener('input', () => field.classList.remove('error'));
});
