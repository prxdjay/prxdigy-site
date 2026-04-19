const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbz7x0d230bs_ybXRV9nvEF358S6veuCljHXKPvPLKs4RYew9gu3EIYKz1sw_R5K-soHvg/exec';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("intakeForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      timestamp: new Date().toISOString(),
      name: form.name.value,
      phone: form.phone.value,
      instagram: form.instagram.value,
      project: form.project.value,
      budget: form.budget.value,
      package: form.package.value,
      timeframe: form.timeframe.value
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify(data),
        mode: "no-cors"
      });

      form.reset();

      alert("We’ll reach out shortly if it’s a fit. For faster response, text 631-870-9243.");

    } catch (error) {
      alert("Something went wrong. Try again.");
      console.error(error);
    }
  });
});
