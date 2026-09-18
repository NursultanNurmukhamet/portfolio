// Only manages the client-side challenge. The Worker must still verify every token.
window.createPortfolioVerification=({container,sitekey,isVisible,onState})=>{
  let phase='idle',token='',widget=null,loading=false,pendingReset=false;
  let script=null,loadTimer=null,checkTimer=null,loadAttempt=0;
  const clearCheck=()=>{clearTimeout(checkTimer);checkTimer=null;};
  const state=(next,code='')=>{phase=next;onState({phase,code});};
  const fail=code=>{token='';clearCheck();state('failed',code);};
  const checking=()=>{clearCheck();state('checking');checkTimer=setTimeout(()=>fail('timeout'),45000);};
  const callbacks={
    callback:value=>{if(pendingReset)return;clearCheck();token=value;state('ready');},
    'error-callback':code=>{if(!pendingReset)fail(/^\d{3,6}$/.test(String(code))?String(code):'unknown');return true;},
    'expired-callback':()=>{if(!pendingReset)fail('expired');},
    'timeout-callback':()=>{if(!pendingReset)fail('110620');},
    'unsupported-callback':()=>{if(!pendingReset)fail('unsupported');}
  };
  function ensure(){
    if(!isVisible()||loading||(!pendingReset&&(phase==='ready'||phase==='checking')))return;
    if(!sitekey){fail('configuration');return;}
    if(!window.turnstile?.render){
      loading=true;state('loading');
      const attempt=++loadAttempt;
      script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
      const failed=()=>{if(attempt!==loadAttempt)return;loadAttempt++;loading=false;clearTimeout(loadTimer);script?.remove();script=null;fail('load');};
      script.onerror=failed;
      script.onload=()=>{
        if(attempt!==loadAttempt)return;
        loading=false;clearTimeout(loadTimer);state('idle');
        if(!window.turnstile?.render){fail('initialization');return;}
        ensure(); // The visitor may have gone back while the script loaded.
      };
      loadTimer=setTimeout(failed,25000);document.head.append(script);return;
    }
    if(widget!==null&&!pendingReset)return;
    pendingReset=false;checking();
    try{
      if(widget===null){
        widget=window.turnstile.render(container,{
          sitekey,action:'portfolio_lead',theme:'light',size:'flexible',
          'response-field':false,retry:'never','refresh-expired':'manual','refresh-timeout':'manual',
          ...callbacks
        });
        if(widget===undefined||widget===null){widget=null;fail('initialization');}
      }else window.turnstile.reset(widget);
    }catch{fail('initialization');}
  }
  function invalidate(){token='';pendingReset=true;clearCheck();state('idle');}
  return {
    get token(){return token;},
    get phase(){return phase;},
    ensure,
    invalidate,
    retry(){invalidate();ensure();}
  };
};
