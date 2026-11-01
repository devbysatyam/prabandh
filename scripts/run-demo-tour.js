// Script to be injected into page to run the automated demo tour
window.__runPrabandhTour = async function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const smoothScrollTo = async (y, duration = 1200) => {
    const startY = window.scrollY;
    const diff = y - startY;
    const start = performance.now();
    return new Promise((resolve) => {
      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        window.scrollTo(0, startY + diff * ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  };

  const clickTab = (text) => {
    const btn = Array.from(document.querySelectorAll('nav button, [role="tab"]')).find((b) =>
      b.innerText.includes(text),
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  };

  console.log('Starting Tour...');
  await sleep(1500);

  // 1. Intake screen
  const textarea = document.querySelector('textarea');
  if (textarea) {
    const textToType =
      'hey i want to make a celebration of 150 guest birthday party in new delhi mayur vihar on 15/01/2027 budget is 50000';
    textarea.focus();
    for (let i = 0; i < textToType.length; i += 4) {
      textarea.value = textToType.slice(0, i + 4);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(35);
    }
    await sleep(1000);

    const fillBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('Fill Form From Description'),
    );
    if (fillBtn) {
      fillBtn.style.outline = '3px solid #f97316';
      await sleep(500);
      fillBtn.click();
      await sleep(1500);
    }
  }

  // 2. Launch Sample Celebration for full 9-section richness
  const sampleBtn = Array.from(document.querySelectorAll('button')).find((b) =>
    b.innerText.includes('Explore Interactive Sample'),
  );
  if (sampleBtn) {
    sampleBtn.style.outline = '3px solid #ea580c';
    await sleep(600);
    sampleBtn.click();
    await sleep(1800);
  }

  // 3. Overview Tab
  clickTab('Overview');
  await sleep(1000);
  await smoothScrollTo(document.body.scrollHeight * 0.5, 1500);
  await sleep(1000);
  await smoothScrollTo(0, 1200);
  await sleep(800);

  // 4. Budget Tab
  clickTab('Budget');
  await sleep(1200);
  await smoothScrollTo(document.body.scrollHeight * 0.45, 1500);
  await sleep(1000);
  await smoothScrollTo(0, 1000);
  await sleep(800);

  // 5. Analytics Tab
  clickTab('Analytics');
  await sleep(1500);
  await smoothScrollTo(document.body.scrollHeight * 0.4, 1500);
  await sleep(1200);
  await smoothScrollTo(document.body.scrollHeight * 0.75, 1500);
  await sleep(1200);
  await smoothScrollTo(0, 1200);
  await sleep(800);

  // 6. Vendors Tab
  clickTab('Vendors');
  await sleep(1200);
  await smoothScrollTo(document.body.scrollHeight * 0.35, 1200);
  await sleep(800);
  await smoothScrollTo(0, 1000);
  await sleep(800);

  // 7. Venues Tab
  clickTab('Venues');
  await sleep(1200);
  await smoothScrollTo(document.body.scrollHeight * 0.3, 1000);
  await sleep(800);
  await smoothScrollTo(0, 800);
  await sleep(800);

  // 8. Guests Tab
  clickTab('Guest List');
  await sleep(1200);
  await smoothScrollTo(document.body.scrollHeight * 0.3, 1000);
  await sleep(800);
  await smoothScrollTo(0, 800);
  await sleep(800);

  // 9. Day-of Schedule
  clickTab('Day-of Schedule');
  await sleep(1200);
  await smoothScrollTo(document.body.scrollHeight * 0.35, 1200);
  await sleep(800);
  await smoothScrollTo(0, 1000);
  await sleep(800);

  // 10. Dark Mode
  const themeBtn = document.querySelector('button[aria-label="Toggle theme"]');
  if (themeBtn) {
    themeBtn.style.outline = '3px solid #f59e0b';
    await sleep(600);
    themeBtn.click();
    await sleep(1500);
    clickTab('Analytics');
    await sleep(1200);
    await smoothScrollTo(document.body.scrollHeight * 0.3, 1200);
    await sleep(800);
    await smoothScrollTo(0, 1000);
    await sleep(800);
    clickTab('Overview');
    await sleep(1500);
  }

  console.log('Tour completed successfully!');
  return 'Tour completed';
};
