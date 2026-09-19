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
    <svg class="ml-cover-art" viewBox="0 0 600 430" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ml-plate" x1="110" y1="90" x2="475" y2="310" gradientUnits="userSpaceOnUse"><stop stop-color="#34496a"/><stop offset="1" stop-color="#131b30"/></linearGradient>
        <linearGradient id="ml-core" x1="235" y1="90" x2="360" y2="210" gradientUnits="userSpaceOnUse"><stop stop-color="#ffad71"/><stop offset="1" stop-color="#ff7048"/></linearGradient>
        <radialGradient id="ml-glow"><stop stop-color="#3157ea" stop-opacity=".4"/><stop offset="1" stop-color="#3157ea" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="300" cy="265" rx="270" ry="165" fill="url(#ml-glow)"/>
      <ellipse cx="300" cy="350" rx="166" ry="27" fill="#050916" opacity=".7"/>
      <g class="ml-cover-machine">
        <path d="M102 271 300 367 498 271v17L300 385 102 288Z" fill="#090f21" stroke="#536581"/>
        <path d="m102 271 198-97 198 97-198 96Z" fill="url(#ml-plate)" stroke="#738cae"/>
        <path d="m148 271 152-74 152 74-152 73Z" stroke="#90abc5" stroke-opacity=".25"/>
        <path d="m170 280 72 35m15 7 16 8m67-1 36-18m13-6 16-8" stroke="#62dfbc" stroke-width="3"/>
        <g class="ml-cover-middle">
          <path d="M102 209 300 305 498 209v17L300 323 102 226Z" fill="#162b66" stroke="#5777da"/>
          <path d="m102 209 198-97 198 97-198 96Z" fill="#21397a" stroke="#9bb9ff"/>
          <path d="m154 209 146-71 146 71-146 71Z" stroke="#648be8"/>
          <path d="M204 191v35m33-51v68m33-84v100m33-113v128m33-113v96m33-80v64m33-48v32" stroke="#4666b4"/>
          <path d="m134 230 18 9m10 5 18 9m10 5 18 9" stroke="#cbff55" stroke-width="4"/>
        </g>
        <g class="ml-cover-top">
          <path d="M102 134 300 230 498 134v17L300 248 102 151Z" fill="#141c30" stroke="#8196b5"/>
          <path d="m102 134 198-97 198 97-198 96Z" fill="url(#ml-plate)" stroke="#bed0e8"/>
          <path d="m151 134 149-73 149 73-149 72Z" stroke="#7e99bd" stroke-dasharray="3 6"/>
          <path d="m227 134 73-36 73 36-73 36Z" fill="url(#ml-core)" stroke="#ffd0a2" stroke-width="2"/>
          <path d="M227 134v12l73 36 73-36v-12l-73 36Z" fill="#bc4d34"/>
          <path d="m267 117 65 32m-49-40 65 32m-81 10 65-32m-49 40 65-32" stroke="#63251c" stroke-opacity=".6" stroke-width="2"/>
          <path d="m175 137 32 16m-16-40 28-13m188 38 20-10m-34 32 14-7" stroke="#62dfbc" stroke-width="3"/>
        </g>
        <path d="M102 153v116m396-116v116M300 248v117" stroke="#93b6e4" stroke-opacity=".45" stroke-dasharray="3 5"/>
      </g>
      <g stroke="#91a8c7" stroke-width="1.2">
        <path d="M236 68 190 44H71M120 217H60v64M429 268h105v-59"/>
        <path class="ml-cover-signal" d="M71 44h119l46 24M60 281v-64h60M429 268h105v-59" stroke="#cbff55" stroke-width="2" stroke-dasharray="7 85"/>
      </g>
      <g fill="#cbff55"><circle cx="71" cy="44" r="4"/><circle cx="60" cy="281" r="4"/><circle cx="534" cy="209" r="4"/></g>
      <g font-family="Manrope,Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="1" fill="#d5e0f1">
        <text x="70" y="30">02 / GPU</text><text x="21" y="304">NETWORK</text><text x="482" y="195">K8S</text>
      </g>
      <text x="300" y="418" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-size="10" letter-spacing="3" fill="#8199bc">BUILD / CONNECT / OBSERVE / RECOVER</text>
    </svg>
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
