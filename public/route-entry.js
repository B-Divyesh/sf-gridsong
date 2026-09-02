(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  let sameOriginReferrer = false;
  try {
    sameOriginReferrer = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin;
  } catch {
    sameOriginReferrer = false;
  }

  function announceAndFocus() {
    let attempts = 0;
    const findHeading = () => {
      const heading = document.querySelector('h1');
      const status = document.getElementById('route-status');
      if (!heading || !status) {
        if (attempts++ < 10) requestAnimationFrame(findHeading);
        return;
      }
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      status.textContent = `${heading.textContent || 'Page'} loaded`;
    };
    requestAnimationFrame(findHeading);
  }

  if (sameOriginReferrer || navigation?.type === 'back_forward') announceAndFocus();
  window.addEventListener('pageshow', event => { if (event.persisted) announceAndFocus(); });
})();
