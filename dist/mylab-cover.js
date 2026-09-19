(() => {
  // Upgrade only the first gallery slot; preserve its scrolling and focus state.
  const panel = document.querySelector('.gallery-panel');
  if (!panel) return;
  const paper = panel.querySelector('.paper-cover');
  if (!paper) return;
  paper.className = 'paper-cover cover-mylab ml-editorial-cover';
  paper.innerHTML = `<div class="ml-cover-grid" aria-hidden="true"></div>
    <div class="paper-topline"><span>CASE 01</span><span>PERSONAL INFRASTRUCTURE</span></div>
    <p class="ml-cover-wordmark" lang="en">MY<span>LAB</span><b>.</b></p>
    <p class="ml-cover-lead">Моя инфраструктура.<br>От кабеля до кластера.</p>
    <p class="ml-cover-note">От двух GPU и Proxmox до собственной сети, Kubernetes, Grafana и проверяемого архива.</p>
    <div class="ml-cover-stack" aria-label="Технологии">PROXMOX / NETWORK<br>KUBERNETES / OBSERVABILITY</div>
    <div class="paper-foot"><span>ОТКРЫТЬ КАРТУ КЕЙСА</span><span class="ml-cover-arrow" aria-hidden="true"><svg class="ml-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"></path></svg></span></div>`;
  panel.querySelector('.story-meta').innerHTML = 'CASE 01 <span>INFRASTRUCTURE &amp; SYSTEMS</span>';
  panel.querySelector('h3').textContent = 'MyLab';
  panel.querySelector('.english-title').textContent = 'Personal infrastructure lab';
  panel.querySelector('.language-copy[lang="ru"] p').textContent = 'Персональная инфраструктурная лаборатория: вычисления, GPU, сеть, наблюдаемость и проверяемое восстановление.';
  panel.querySelector('.language-copy[lang="en"] p').textContent = 'A personal infrastructure lab spanning compute, GPUs, networking, observability and verified recovery.';
  const action = document.createElement('a');
  action.className = 'preview-trigger';
  action.href = 'mylab.html';
  action.innerHTML = 'Открыть кейс <span aria-hidden="true"><svg class="ml-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"></path></svg></span>';
  panel.querySelector('.preview-trigger').replaceWith(action);
  panel.querySelector('.pdf-caption').textContent = 'WEB CASE / MYLAB';
  panel.querySelector('.pdf-object').setAttribute('aria-label', 'Обложка интерактивного кейса MyLab');
  document.querySelector('[data-slide="0"]')?.setAttribute('aria-label', 'MyLab');
})();
