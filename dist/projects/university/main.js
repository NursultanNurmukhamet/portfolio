(() => {
  const languageButtons = [...document.querySelectorAll('[data-set-lang]')];
  function setLanguage(language) {
    if (!['ru', 'en'].includes(language)) return;
    document.documentElement.lang = language;
    languageButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.setLang === language)));
    document.title = language === 'ru' ? 'Университет — Нурсултан Нурмухамет' : 'University — Nursultan Nurmukhamet';
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(null, '', url);
  }
  languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.setLang)));
  if (new URLSearchParams(location.search).get('lang') === 'en') setLanguage('en');

  const dialog = document.querySelector('.certificate-dialog');
  let lastFocus;
  document.querySelectorAll('.certificate-open').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !dialog.showModal) return;
    event.preventDefault();
    lastFocus = link;
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    lastFocus?.focus({preventScroll:true});
  });

})();
