(function () {
  function initAboutCompany(root) {
    if (!root) return;

    const countItems = root.querySelectorAll("[data-count]");
    if (!countItems.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const animateCount = (item) => {
      if (item.dataset.counted) return;
      item.dataset.counted = "true";
      const target = Number(item.dataset.count);
      if (reduceMotion) {
        item.textContent = String(target);
        return;
      }
      const started = window.performance.now();
      const tick = (now) => {
        const progress = Math.min((now - started) / 950, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        item.textContent = String(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              observer.unobserve(entry.target);
            }
          }),
        { threshold: 0.35 },
      );
      countItems.forEach((item) => observer.observe(item));
    } else {
      countItems.forEach(animateCount);
    }

    const checkCountVisibility = () =>
      countItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          animateCount(item);
        }
      });

    window.addEventListener("scroll", checkCountVisibility, { passive: true });
    checkCountVisibility();
  }

  window.PrimeAXAbout = { init: initAboutCompany };
})();
