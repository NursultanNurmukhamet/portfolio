(() => {
  'use strict';
  // Drawn covers for the two inventory items without a photo of their own (MetaCrypt and
  // ULMusic), plus the AgentF match screenshots shown in the shared preview dialog.
  // home.js renders a cover with window.portfolioProjects.cover(demo).
  const demos = [
    {cover:'metacrypt',number:'04',coverTitle:'META<br>CRYPT',subtitle:'REACT / TYPESCRIPT / WEB CRYPTO',footer:'EXIF / XMP / IPTC'},
    {cover:'listen',number:'05',coverTitle:'UL<br>MUSIC',subtitle:'PYTHON / AIOGRAM / YT-DLP / FFMPEG',footer:'MUSIC / AUDIO / VIDEO'}
  ];
  const agentMatches=[
    {file:'assets/agentf/match-total-attack.png',opponent:'Total Attack United',score:'2:1',width:1200,height:647},
    {file:'assets/agentf/match-benchmark.png',opponent:'The Benchmark FC',score:'2:0',width:1204,height:650},
    {file:'assets/agentf/match-fort-knox.png',opponent:'Fort Knox Athletic',score:'2:0',width:1200,height:647}
  ];
  const personalVisuals={
    metacrypt:"<div class=\"personal-cover-art\" aria-hidden=\"true\"><svg class=\"lab-vault\" viewBox=\"0 0 360 230\" fill=\"none\" focusable=\"false\"><g stroke=\"currentColor\" stroke-width=\"1.4\"><path opacity=\".28\" d=\"m72 77 142-34 76 49-143 35Zm0 35 142-34 76 49-143 35Zm0 35 142-34 76 49-143 35Z\"/><g class=\"lab-lock\"><rect x=\"135\" y=\"102\" width=\"90\" height=\"71\" rx=\"10\" fill=\"var(--cover-fill)\"/><path d=\"M152 101V84a28 28 0 0 1 56 0v17\" stroke-width=\"6\"/><circle cx=\"180\" cy=\"130\" r=\"7\" fill=\"currentColor\"/><path d=\"M180 137v13\" stroke-width=\"4\"/></g><path d=\"M50 52v-9h9m242 0h9v9M50 184v9h9m242 0h9v-9\" opacity=\".55\"/></g></svg></div>",
    listen:"<div class=\"personal-cover-art\" aria-hidden=\"true\"><svg class=\"lab-audio\" viewBox=\"0 0 360 230\" fill=\"none\" focusable=\"false\"><g class=\"lab-wave\" stroke=\"currentColor\" stroke-width=\"6\" stroke-linecap=\"round\"><path d=\"M55 103v24m16-40v56m16-70v84m16-54v24m16-58v92m16-80v68m16-46v24m16-75v126m16-101v76m16-49v22m16-58v94m16-108v122m16-89v56m16-40v24m16-27v30m16-59v88\"/></g><path d=\"M103 186h153\" stroke=\"currentColor\" opacity=\".3\"/><circle cx=\"142\" cy=\"186\" r=\"5\" fill=\"currentColor\"/><path d=\"m165 33 28 15-28 15Z\" stroke=\"currentColor\" stroke-width=\"1.5\"/></svg></div>"
  };
  function cover(demo) {
    return `<div class="paper-cover cover-${demo.cover}"><div class="paper-topline"><span>PERSONAL PROJECT</span><span>${demo.number}</span></div><p class="paper-title" lang="en">${demo.coverTitle}</p><p class="paper-subtitle">${demo.subtitle}</p>${personalVisuals[demo.cover]||''}<div class="paper-foot"><span>${demo.footer}</span><span class="paper-number">${demo.number}</span></div></div>`;
  }
  let lastFocus=null;
  // AgentF evidence: the preview shows a WebP copy, the link opens the unaltered PNG.
  function openMatches(matchTrigger){
    if(typeof document==='undefined')return;
    const dialog=document.querySelector('.preview-dialog');
    if(!dialog)return;
    lastFocus=matchTrigger;
    document.querySelector('#preview-title').textContent='AgentF / Три победы над ботами';
    dialog.querySelector('.preview-toolbar p').textContent='SapaTech · AWS Agentic Football Cup · победы в отдельных матчах';
    dialog.classList.add('matches-preview');
    dialog.querySelector('.preview-document').innerHTML=agentMatches.map((match,index)=>
      '<figure class="match-evidence"><a href="'+match.file+'" target="_blank" rel="noopener noreferrer" aria-label="Открыть полный скриншот: SapaTech '+match.score+' '+match.opponent+'"><img src="'+match.file.replace(/\.png$/,'.webp')+'" width="'+match.width+'" height="'+match.height+'" alt="Скриншот победы SapaTech над '+match.opponent+', счёт '+match.score+'" loading="lazy"></a><figcaption><span>0'+(index+1)+' / SAPATECH</span><strong>'+match.score+'</strong><span>'+match.opponent+'</span></figcaption></figure>').join('');
    document.body.classList.add('preview-open');dialog.showModal();
  }
  if(typeof document!=='undefined'){
    const dialog=document.querySelector('.preview-dialog');
    if(dialog){
      dialog.querySelector('.preview-close').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
      dialog.addEventListener('close',()=>{document.body.classList.remove('preview-open');if(lastFocus&&!lastFocus.closest('[inert]'))lastFocus.focus({preventScroll:true});lastFocus=null;});
    }
  }
  window.portfolioProjects=Object.freeze({demos,agentMatches,cover,openMatches});
})();
