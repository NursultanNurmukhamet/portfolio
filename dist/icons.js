(() => {
  // Explicit geometry: operating systems must not substitute emoji artwork.
  const names = new Set(['arrow-up-right', 'arrow-down-right', 'arrow-down-left',
    'arrow-up-left', 'arrow-down', 'arrow-up', 'arrow-left', 'arrows-vertical',
    'asterisk', 'close', 'plus', 'pause', 'play']);
  window.portfolioIcon = name => {
    if (!names.has(name)) throw new TypeError('Unknown interface icon');
    return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-${name}"></use></svg>`;
  };
})();
