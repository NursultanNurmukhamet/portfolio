(() => {
  const config=window.PORTFOLIO_CONTACTS||{};
  const form=document.querySelector('#lead-form');
  const steps=[...form.querySelectorAll('.lead-step')];
  const indicators=[...document.querySelectorAll('.lead-steps li')];
  const back=form.querySelector('.lead-back');
  const next=form.querySelector('.lead-next');
  const result=document.querySelector('.lead-result');
  const status=document.querySelector('.lead-status');
  const message=document.querySelector('#lead-message');
  let step=0,sending=false,lastSent=false,lastSaved=false,requestId='',requestSignature='';
  const cloud=typeof config.cloudEndpoint==='string'&&config.cloudEndpoint.startsWith('https://');
  const endpoint=cloud?config.cloudEndpoint:typeof config.formEndpoint==='string'?config.formEndpoint:'';
  const live=!!endpoint;
  const consent=document.querySelector('#lead-consent');
  consent.disabled=!live;consent.closest('label').hidden=!live;
  if(live){
    document.querySelector('.lead-privacy').textContent='После отправки описание задачи и контакт передаются Нурсултану в личный Telegram. Не добавляйте пароли и закрытые данные.';
    document.querySelector('#contact-pending').textContent='Личные контакты пока не добавлены. Обращение можно отправить через форму.';
  }
  const challenge=document.createElement('div');challenge.className='lead-challenge';challenge.hidden=true;
  const challengeSlot=document.createElement('div');
  const challengeStatus=document.createElement('p');challengeStatus.className='lead-challenge-status';challengeStatus.setAttribute('role','status');
  const challengeRetry=document.createElement('button');challengeRetry.type='button';challengeRetry.className='lead-challenge-retry';challengeRetry.textContent='Повторить проверку';challengeRetry.hidden=true;
  challenge.append(challengeSlot,challengeStatus,challengeRetry);
  steps[2].append(challenge);
  const verification=cloud?window.createPortfolioVerification({
    container:challengeSlot,sitekey:config.turnstileSiteKey,
    isVisible:()=>step===2&&!form.hidden&&!steps[2].hidden,
    onState:({phase,code})=>{
      challenge.dataset.state=phase;
      if(code)challenge.dataset.errorCode=code;else delete challenge.dataset.errorCode;
      challengeRetry.hidden=phase!=='failed';
      challengeRetry.disabled=sending;
      const hints={
        load:'Не удалось загрузить проверку. Проверьте соединение и разрешите challenges.cloudflare.com в блокировщике для этого сайта.',
        configuration:'Проверка ещё настраивается. Сообщите владельцу сайта об ошибке.',
        initialization:'Не удалось запустить проверку. Нажмите «Повторить проверку».',
        expired:'Срок проверки истёк. Пройдите её ещё раз перед отправкой.',
        retry:'Для следующей попытки понадобится новая проверка. Она запустится только по кнопке «Повторить проверку».',
        timeout:'Проверка не завершилась за 45 секунд. Нажмите «Повторить проверку».',
        unsupported:'Этот браузер не поддерживает проверку. Попробуйте открыть сайт в обычном Chrome, Edge или Firefox.',
        '110200':'Адрес сайта не разрешён в настройках защиты. Сообщите владельцу сайта.',
        '110600':'Время проверки истекло. Повторите её; если ошибка остаётся, проверьте дату и время устройства.',
        '110620':'Время ожидания истекло. Нажмите «Повторить проверку».',
        '200100':'Проверьте правильность даты и времени на устройстве.',
        '200500':'Не загрузилось окно проверки. Проверьте, не блокируется ли challenges.cloudflare.com.'
      };
      challengeStatus.textContent=phase==='ready'?'Проверка пройдена. Можно отправлять заявку.':phase==='loading'?'Загружаем защитную проверку…':phase==='checking'?'Выполняется защитная проверка…':phase==='failed'?`${hints[code]||'Cloudflare не смог подтвердить проверку. Попробуйте ещё раз. Если ошибка повторяется — откройте сайт в обычном браузере без режима автоматизации.'} ${/^\d+$/.test(code)?`Код: ${code}. `:''}Введённые данные остаются в форме.`:'';
    }
  }):null;
  challengeRetry.addEventListener('click',()=>{if(!sending){status.textContent='';verification?.retry();}});
  if(cloud){
    consent.closest('label').querySelector('span').textContent='Согласен на сохранение описания задачи и моих контактов, включая указанный телефон, в Cloudflare и передачу Нурсултану в Telegram.';
    document.querySelector('.lead-privacy').textContent='Описание и указанные контакты, включая телефон, сохраняются в Cloudflare на 30 дней и отправляются Нурсултану в Telegram. Не добавляйте пароли и закрытые данные.';
    const notice=document.createElement('details');notice.className='lead-data-notice';
    const title=document.createElement('summary');title.textContent='Подробнее о данных';
    const explanation=document.createElement('p');explanation.textContent='Доступ к заявкам есть у владельца портфолио. Номер обращения, его цифровой отпечаток и статус хранятся до 90 дней для защиты от повторов. После очистки данные могут оставаться в истории восстановления Cloudflare ещё до 7 дней. Сообщения в Telegram остаются до удаления владельцем. Turnstile проверяет запрос на спам; IP-адрес используется для проверки и ограничения обращений, но в нашей базе сохраняется только его временный хеш.';
    notice.append(title,explanation);document.querySelector('.lead-privacy').after(notice);
  }
  function prepareChallenge(){
    if(!cloud)return;
    challenge.hidden=false;
    verification.ensure();
  }
  function resetChallenge(){verification?.invalidate();}
  const approved=[];
  // Whitelisted protocols: configuration is never interpolated into HTML.
  if(typeof config.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) approved.push({type:'email',label:config.email,url:`mailto:${config.email}`});
  if(typeof config.telegram==='string'&&/^https:\/\/t\.me\/[a-zA-Z0-9_]+\/?$/.test(config.telegram)) approved.push({type:'telegram',label:'Telegram',url:config.telegram});
  const makeLink=(contact,forMessage=false)=>{
    const link=document.createElement('a');
    link.textContent=forMessage?(contact.type==='email'?'Открыть письмо':'Открыть Telegram'):contact.label;
    if(forMessage||contact.type==='telegram'){
      const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');
      arrow.innerHTML=window.portfolioIcon('arrow-up-right');link.append(' ',arrow);
    }
    link.href=contact.url;
    if(forMessage&&contact.type==='email')link.href+=`?subject=${encodeURIComponent('Задача для обсуждения')}&body=${encodeURIComponent(message.value)}`;
    if(contact.type==='telegram'){link.target='_blank';link.rel='noopener noreferrer';}
    return link;
  };
  approved.forEach(contact=>document.querySelector('#direct-contact-links').append(makeLink(contact)));
  document.querySelector('#contact-pending').hidden=approved.length>0;
  function showStep(index,focus=false){
    step=index;form.hidden=false;result.hidden=true;status.textContent='';
    steps.forEach((part,i)=>part.hidden=i!==index);
    indicators.forEach((indicator,i)=>{if(i===index)indicator.setAttribute('aria-current','step');else indicator.removeAttribute('aria-current');});
    back.hidden=index===0;
    next.innerHTML=`${index===2?(live?'Отправить заявку':'Собрать сообщение'):'Дальше'} <span aria-hidden="true">${window.portfolioIcon('arrow-up-right')}</span>`;
    if(index===1)verification?.warmup();
    if(index===2)prepareChallenge();
    if(focus)steps[index].querySelector('input,textarea').focus({preventScroll:true});
  }
  function validCurrent(){
    for(const field of steps[step].querySelectorAll('input:not([type=hidden]),textarea')){
      if(field.disabled)continue;
      const value=field.value.trim();
      if(field.name==='phone'){
        const phone=value.replace(/\u00a0/g,' '),digits=phone.replace(/[^0-9]/g,'');
        field.setCustomValidity(phone&&(!/^\+?[0-9 ()-]+$/.test(phone)||phone.length>32||digits.length<7||digits.length>15)?'Укажите номер: от 7 до 15 цифр. Можно использовать +, пробелы, скобки и дефисы.':'');
      }else field.setCustomValidity((field.required||value)&&value.length<(field.minLength>0?field.minLength:1)?'Добавьте, пожалуйста, чуть больше информации.':'');
      if(!field.reportValidity())return false;
    }return true;
  }
  form.addEventListener('input',event=>{if(event.target.matches('input,textarea'))event.target.setCustomValidity('');});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(sending)return;
    if(!validCurrent())return;
    if(step<2){showStep(step+1,true);return;}
    if(cloud&&!verification.token){status.textContent=verification.phase==='failed'?'Нажмите «Повторить проверку» над кнопкой отправки.':'Дождитесь защитной проверки перед отправкой.';prepareChallenge();return;}
    const values=new FormData(form);
    const phone=String(values.get('phone')||'').trim().replace(/\u00a0/g,' ');
    message.value=`Здравствуйте, Нурсултан! Хочу обсудить задачу.\n\nПроблема / Problem:\n${String(values.get('problem')).trim()}\n\nЖелаемый результат / Desired outcome:\n${String(values.get('outcome')).trim()}\n\nМеня зовут / Name: ${String(values.get('name')).trim()}${phone?`\nТелефон / Phone: ${phone}`:''}\nTelegram / Email: ${String(values.get('contact')).trim()}`;
    let uncertain=false;lastSent=false;lastSaved=false;
    if(live){
      const fields={problem:String(values.get('problem')).trim(),outcome:String(values.get('outcome')).trim(),name:String(values.get('name')).trim(),contact:String(values.get('contact')).trim()};
      if(phone)fields.phone=phone;
      const signature=JSON.stringify(fields);
      if(!requestId||signature!==requestSignature){requestId=crypto.randomUUID();requestSignature=signature;}
      const payload={requestId,...fields,consent:consent.checked,website:String(values.get('website')||'')};
      if(cloud)payload.turnstileToken=verification.token;
      const controls=[...form.querySelectorAll('input,textarea,button')].map(element=>({element,disabled:element.disabled}));
      sending=true;controls.forEach(({element})=>element.disabled=true);next.setAttribute('aria-busy','true');status.textContent='Отправляем заявку…';
      let response,data;
      try{
        response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',signal:AbortSignal.timeout(22000),body:JSON.stringify(payload)});
        data=await response.json();
      }catch{uncertain=true;}
      finally{sending=false;controls.forEach(({element,disabled})=>element.disabled=disabled);next.removeAttribute('aria-busy');verification?.invalidate();}
      if(response?.ok&&data?.ok===true){lastSaved=cloud&&data.accepted===true;lastSent=cloud?data.delivery==='sent':true;}
      else if(uncertain||data?.ambiguous){uncertain=true;}
      else{
        if(cloud)verification.requireRetry();
        const errors={
          rate_limited:'Слишком много обращений. Подождите 10 минут — новую проверку пока проходить не нужно.',
          verification_expired:'Подтверждение истекло или уже использовано. Нажмите «Повторить проверку», затем отправьте заявку.',
          verification_failed:'Сервер отклонил подтверждение защиты. Нажмите «Повторить проверку». Если ошибка повторится, сообщите владельцу сайта.',
          verification_unavailable:'Сервис проверки временно недоступен. Заявка не сохранена. Попробуйте позже — повторять проверку прямо сейчас не нужно.',
          verification_configuration:'Ошибка настройки защиты на сервере. Заявка не сохранена. Сообщите владельцу сайта — повторная проверка не поможет.'
        };
        status.textContent=errors[data?.error]||'Заявка не отправлена. Проверьте связь или попробуйте позже — введённый текст сохранён в форме.';
        requestId='';return;
      }
    }
    form.hidden=true;result.hidden=false;
    const sendLinks=document.querySelector('#lead-send-links');sendLinks.replaceChildren();approved.forEach(contact=>sendLinks.append(makeLink(contact,true)));
    result.querySelector('h3').textContent=lastSent?'Заявка доставлена.':lastSaved?'Заявка принята.':uncertain?'Доставка не подтверждена.':'Текст обращения готов.';
    result.querySelector('p').textContent=lastSent?'Telegram подтвердил доставку Нурсултану. Контакт для ответа указан в сообщении.':lastSaved?'Обращение сохранено в облаке. Уведомление в Telegram обрабатывается отдельно — повторно отправлять заявку не нужно.':uncertain?'Заявка могла быть принята. Автоматически повторять отправку не будем, чтобы не создать дубль. Сохраните текст обращения.':'Сообщение ещё не отправлено. Скопируйте его и отправьте удобным способом.';
    document.querySelector('#edit-message').textContent=lastSent||lastSaved?'Новая задача':'Изменить';
    status.textContent=lastSent?'Отправлено в личный Telegram.':lastSaved?`Номер обращения: ${requestId}`:uncertain?'Статус доставки неизвестен. Повторной отправки не было.':'Готово к копированию. Ничего не отправлено.';
    result.querySelector('h3').focus({preventScroll:true});
  });
  back.addEventListener('click',()=>showStep(Math.max(0,step-1),true));
  document.querySelector('#edit-message').addEventListener('click',()=>{if(lastSent||lastSaved){form.reset();message.value='';requestId='';requestSignature='';}lastSent=false;lastSaved=false;if(cloud)resetChallenge();showStep(0,true);});
  document.querySelector('#copy-message').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(message.value);status.textContent='Сообщение скопировано. Теперь его можно отправить удобным способом.';}
    catch{message.focus();message.select();status.textContent='Автокопирование недоступно. Выделенный текст можно скопировать вручную.';}
  });
  document.querySelector('.contact-start').addEventListener('click',event=>{
    if(sending){event.preventDefault();return;}
    if(!result.hidden){if(cloud)resetChallenge();showStep(0);}
    steps[step].querySelector('input,textarea').focus({preventScroll:true});
  });
  // No browser persistence or analytics. Only an explicitly configured backend
  // receives the consented form; no Telegram token or recipient is in the page.
  showStep(0);
})();
