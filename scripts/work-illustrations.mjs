// Draws the seven "work system" pictures for the inventory: schematic interfaces in the
// site's own palette, with no real data, names or addresses. Each one is an HTML page
// rendered by headless Chrome at 2x and saved as a 1200x900 WebP (the card box is 4:3).
//
//   node scripts/work-illustrations.mjs            # writes dist/assets/inventory/work-*.webp
//   node scripts/work-illustrations.mjs --check    # fails if any picture is missing or stale
//
// Chrome: CHROME env var, else the usual Windows / macOS / Linux locations.
import {mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve, dirname} from 'node:path';
import {tmpdir} from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist/assets/inventory');
const fonts = pathToFileURL(resolve(root, 'dist/assets')).href;
const W = 1200, H = 900;

const require = createRequire(import.meta.url);
function loadSharp() {
  const wranglerRequire = createRequire(require.resolve('../cloudflare/node_modules/wrangler/package.json'));
  return createRequire(wranglerRequire.resolve('miniflare/package.json'))('sharp');
}
function chromePath() {
  const candidates = [process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  const found = candidates.find(path => existsSync(path));
  if (!found) throw new Error('Chrome not found; set CHROME=/path/to/chrome');
  return found;
}

/* ---------- shared look ---------- */
const base = `
@font-face{font-family:Manrope;src:url('${fonts}/manrope.ttf');font-weight:400 600}
@font-face{font-family:Manrope;src:url('${fonts}/manrope-bold.ttf');font-weight:700 900}
:root{--bg:#0a0d12;--bg-2:#10151d;--bg-3:#161d27;--line:#263040;--line-2:#3a4657;--text:#e4e9f0;--dim:#a3aebd;--mute:#8692a4;
  --accent:#d5ff65;--ok:#3ddc84;--warn:#ffb2c9;--info:#7cc4ff;--violet:#b49bf6;
  --sans:Manrope,sans-serif;--mono:"JetBrains Mono","Cascadia Code",Consolas,monospace}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:var(--bg);color:var(--text);font-family:var(--sans);
  background-image:linear-gradient(#ffffff07 1px,transparent 1px),linear-gradient(90deg,#ffffff07 1px,transparent 1px);background-size:60px 60px}
.glow{position:absolute;inset:0;background:radial-gradient(520px circle at 82% 18%,var(--glow,#d5ff6526),transparent 65%)}
.win{position:absolute;left:90px;top:120px;width:1020px;height:690px;border:1px solid var(--line-2);border-radius:18px;background:var(--bg-2);box-shadow:0 60px 120px -40px #000;overflow:hidden}
.bar{display:flex;align-items:center;gap:10px;height:54px;padding:0 20px;border-bottom:1px solid var(--line);font:600 15px var(--mono);color:var(--mute);letter-spacing:.06em;text-transform:uppercase}
.bar i{width:11px;height:11px;border-radius:50%;background:var(--line-2)}
.bar i:first-child{background:var(--warn)}.bar i:nth-child(2){background:#ffd27a}.bar i:nth-child(3){background:var(--ok);margin-right:8px}
.bar b{margin-left:auto;font-weight:600;color:var(--dim)}
.tag{display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border:1px solid var(--line-2);border-radius:6px;font:600 14px var(--mono);color:var(--dim);letter-spacing:.04em}
.tag.ok{color:var(--ok);border-color:#3ddc8466}.tag.ac{color:#0a0d12;background:var(--accent);border-color:var(--accent)}
.tag.info{color:var(--info);border-color:#7cc4ff66}.tag.vi{color:var(--violet);border-color:#b49bf666}
.dot{width:9px;height:9px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 4px #3ddc8422}
.line{height:12px;border-radius:6px;background:var(--line)}
.line.s{background:var(--line-2)}
.card{border:1px solid var(--line);border-radius:12px;background:var(--bg-3);padding:18px}
.label{font:600 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}
.num{font:800 56px/1 var(--sans);letter-spacing:-.04em;color:var(--accent)}
.stamp{position:absolute;left:34px;top:52px;font:600 16px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.stamp em{font-style:normal;color:var(--accent);margin-right:14px}
`;

const page = (title, glow, css, body) => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>${base}${css}</style></head>
<body style="--glow:${glow}"><div class="glow"></div><p class="stamp"><em>//</em>${title}</p><div class="win">${body}</div></body></html>`;

/* ---------- the seven pictures ---------- */
const PICTURES = {
  'work-hr-portal': {
    alt: 'Схема HR-портала: профиль сотрудника, календарь отпуска и единый вход',
    html: page('рабочие системы · hr-портал', '#d5ff6526', `
      .lay{display:grid;grid-template-columns:230px 1fr;height:636px}
      .side{border-right:1px solid var(--line);padding:22px 18px;display:grid;gap:10px;align-content:start}
      .side .line{height:14px}.side .line.on{background:var(--accent);width:70%}
      .main{padding:26px 30px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 1fr;gap:18px}
      .profile{grid-column:1/-1;display:grid;grid-template-columns:96px 1fr auto;gap:22px;align-items:center}
      .avatar{width:96px;height:96px;border-radius:50%;background:conic-gradient(from 200deg,var(--accent),var(--ok),var(--info),var(--accent));padding:4px}
      .avatar i{display:block;width:100%;height:100%;border-radius:50%;background:var(--bg-3)}
      .cal{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:14px}
      .cal i{height:44px;border-radius:6px;background:var(--bg-2);border:1px solid var(--line)}
      .cal i.on{background:#d5ff6533;border-color:var(--accent)}
      .req{display:grid;gap:10px;margin-top:14px}
      .req div{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg-2)}
      .req .line{flex:1}`, `
      <div class="bar"><i></i><i></i><i></i>portal / cabinet<b>SAML SSO · TOTP</b></div>
      <div class="lay">
        <div class="side"><span class="line on"></span><span class="line"></span><span class="line" style="width:80%"></span><span class="line" style="width:60%"></span><span class="line" style="width:85%"></span><span class="line" style="width:50%"></span></div>
        <div class="main">
          <div class="profile"><div class="avatar"><i></i></div><div style="display:grid;gap:12px"><span class="line s" style="width:60%;height:18px"></span><span class="line" style="width:40%"></span></div><span class="tag ok"><i class="dot"></i>вход выполнен</span></div>
          <div class="card"><p class="label">отпуск · ноябрь</p><div class="cal">${Array.from({length:35},(_,i)=>`<i class="${i>=9&&i<=18?'on':''}"></i>`).join('')}</div></div>
          <div class="card"><p class="label">заявки</p><div class="req"><div><span class="tag ac">новая</span><span class="line"></span></div><div><span class="tag">согласование</span><span class="line"></span></div><div><span class="tag ok">готово</span><span class="line"></span></div><div><span class="tag info">обучение</span><span class="line"></span></div></div></div>
        </div>
      </div>`)
  },
  'work-edo-sign': {
    alt: 'Схема документооборота: документ с электронной подписью и маршрут согласования',
    html: page('рабочие системы · документооборот', '#3ddc8426', `
      .lay{display:grid;grid-template-columns:1fr 360px;height:636px}
      .doc{margin:30px;background:#f3f5f8;border-radius:8px;padding:38px 42px;position:relative;color:#1a2230;display:grid;gap:14px;align-content:start}
      .doc .line{background:#cfd6e0}.doc .line.t{background:#1a2230;height:16px;width:55%}
      .seal{position:absolute;right:38px;bottom:36px;width:190px;height:190px;border-radius:50%;border:3px solid var(--ok);display:grid;place-items:center;text-align:center;color:#167a48;font:700 13px/1.4 var(--mono);letter-spacing:.1em;text-transform:uppercase;transform:rotate(-12deg);background:#3ddc8414}
      .seal::before{content:"";position:absolute;inset:12px;border:1px dashed var(--ok);border-radius:50%}
      .seal b{font:800 30px var(--sans);letter-spacing:-.02em;color:#167a48}
      .route{padding:30px 26px;border-left:1px solid var(--line);display:grid;gap:0;align-content:start}
      .step{display:grid;grid-template-columns:28px 1fr;gap:14px;align-items:center;padding:14px 0}
      .step i{width:28px;height:28px;border-radius:50%;border:2px solid var(--line-2);background:var(--bg-3)}
      .step.done i{background:var(--ok);border-color:var(--ok)}.step.now i{border-color:var(--accent);box-shadow:0 0 0 5px #d5ff6533}
      .step span{display:grid;gap:8px}
      .join{height:26px;width:2px;background:var(--line-2);margin-left:13px}
      .hash{margin-top:auto;font:500 13px/1.6 var(--mono);color:var(--mute);word-break:break-all}
      .hash b{color:var(--ok);font-weight:600}`, `
      <div class="bar"><i></i><i></i><i></i>documents / sign<b>NCALayer · KalkanCrypt</b></div>
      <div class="lay">
        <div class="doc"><span class="line t"></span><span class="line" style="width:90%"></span><span class="line" style="width:85%"></span><span class="line" style="width:92%"></span><span class="line" style="width:60%"></span><span class="line" style="width:88%;margin-top:14px"></span><span class="line" style="width:80%"></span><span class="line" style="width:40%"></span>
          <div class="seal"><div><b>ЭЦП</b><br>подпись<br>проверена</div></div></div>
        <div class="route">
          <div class="step done"><i></i><span><span class="line s" style="width:70%"></span><span class="line" style="width:45%"></span></span></div><div class="join"></div>
          <div class="step done"><i></i><span><span class="line s" style="width:60%"></span><span class="line" style="width:50%"></span></span></div><div class="join"></div>
          <div class="step now"><i></i><span><span class="tag ac">на подписи</span></span></div><div class="join"></div>
          <div class="step"><i></i><span><span class="line s" style="width:65%"></span><span class="line" style="width:40%"></span></span></div>
          <p class="hash"><b>sha256</b> 9f2a 7c41 e08b 55d3 1a6e c7f0 2b9d 48e1<br><b>архив</b> append-only · проверка ежедневно</p>
        </div>
      </div>`)
  },
  'work-learning': {
    alt: 'Схема платформы обучения: курсы, прогресс и PDF-сертификат с QR-кодом',
    html: page('рабочие системы · обучение', '#7cc4ff26', `
      .lay{display:grid;grid-template-columns:1fr 330px;height:636px}
      .courses{padding:28px 30px;display:grid;grid-template-rows:auto auto 1fr;gap:18px;align-content:start}
      .row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
      .course{padding:16px;display:grid;gap:12px}
      .course .cover{height:70px;border-radius:8px;background:linear-gradient(135deg,var(--bg-2),var(--line))}
      .course:nth-child(2) .cover{background:linear-gradient(135deg,#d5ff6533,#d5ff6511)}
      .course:nth-child(3) .cover{background:linear-gradient(135deg,#7cc4ff33,#7cc4ff11)}
      .bar2{height:8px;border-radius:4px;background:var(--line);overflow:hidden}.bar2 i{display:block;height:100%;background:var(--accent)}
      .exam{display:grid;gap:12px}
      .q{display:grid;grid-template-columns:22px 1fr;gap:12px;align-items:center;padding:10px 14px;border:1px solid var(--line);border-radius:8px;background:var(--bg-2)}
      .q i{width:22px;height:22px;border-radius:50%;border:2px solid var(--line-2)}.q.ok i{background:var(--ok);border-color:var(--ok)}
      .cert{margin:28px 26px;background:#f6f7f9;border-radius:10px;padding:26px;color:#1a2230;display:grid;gap:12px;align-content:start;position:relative;border-top:8px solid var(--accent)}
      .cert .line{background:#cfd6e0}.cert .t{font:800 22px/1.1 var(--sans);letter-spacing:-.02em}
      .qr{width:92px;height:92px;margin-top:10px;background:
        repeating-linear-gradient(90deg,#1a2230 0 8px,transparent 8px 16px),repeating-linear-gradient(#1a2230 0 8px,transparent 8px 16px);background-blend-mode:multiply;opacity:.85;border:6px solid #f6f7f9;outline:2px solid #1a2230}
      .tg{position:absolute;right:20px;bottom:22px}`, `
      <div class="bar"><i></i><i></i><i></i>learning / courses<b>KZ · RU · EN</b></div>
      <div class="lay">
        <div class="courses">
          <div class="row">
            <div class="card course"><div class="cover"></div><span class="line s" style="width:80%"></span><div class="bar2"><i style="width:100%"></i></div></div>
            <div class="card course"><div class="cover"></div><span class="line s" style="width:65%"></span><div class="bar2"><i style="width:62%"></i></div></div>
            <div class="card course"><div class="cover"></div><span class="line s" style="width:72%"></span><div class="bar2"><i style="width:18%"></i></div></div>
          </div>
          <p class="label">итоговый экзамен · 18 / 20</p>
          <div class="exam"><div class="q ok"><i></i><span class="line" style="width:75%"></span></div><div class="q ok"><i></i><span class="line" style="width:60%"></span></div><div class="q"><i></i><span class="line" style="width:82%"></span></div><div class="q ok"><i></i><span class="line" style="width:55%"></span></div></div>
        </div>
        <div class="cert"><p class="label" style="color:#5b6675">сертификат · PDF</p><p class="t">Курс пройден</p><span class="line" style="width:70%"></span><span class="line" style="width:50%"></span><div class="qr"></div><span class="tag ok tg"><i class="dot"></i>QR-проверка</span></div>
      </div>`)
  },
  'work-auto-crm': {
    alt: 'Схема Telegram-каталога автомобилей и панели CRM с аналитикой',
    html: page('рабочие системы · каталог и crm', '#b49bf626', `
      .lay{display:grid;grid-template-columns:330px 1fr;height:636px}
      .phone{margin:26px auto;width:270px;height:584px;border:2px solid var(--line-2);border-radius:34px;background:var(--bg);padding:18px 14px;display:grid;gap:12px;align-content:start}
      .msg{padding:12px;border-radius:14px;background:var(--bg-3);display:grid;gap:8px;max-width:92%}
      .msg.me{justify-self:end;background:#d5ff6522;border:1px solid #d5ff6555}
      .car{height:88px;border-radius:10px;background:linear-gradient(160deg,var(--line-2),var(--bg-2));position:relative;overflow:hidden}
      .car::after{content:"";position:absolute;left:18px;right:18px;bottom:16px;height:34px;border-radius:14px 22px 6px 6px/14px 18px 6px 6px;background:var(--violet);box-shadow:0 10px 0 -4px var(--bg)}
      .btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}.btns span{text-align:center;padding:9px;border-radius:8px;background:var(--bg-2);border:1px solid var(--line-2);font:600 12px var(--mono);color:var(--dim)}
      .panel{padding:28px 30px;display:grid;grid-template-rows:auto 1fr;gap:18px;border-left:1px solid var(--line)}
      .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
      .kpis .card{display:grid;gap:8px}.kpis .num{font-size:44px}
      .chart{display:flex;align-items:flex-end;gap:14px;height:100%;padding:18px 18px 0;border:1px solid var(--line);border-radius:12px;background:var(--bg-3)}
      .chart i{flex:1;border-radius:6px 6px 0 0;background:var(--line-2)}.chart i.on{background:var(--violet)}`, `
      <div class="bar"><i></i><i></i><i></i>catalog bot / admin<b>Go · Next.js · Redis</b></div>
      <div class="lay">
        <div class="phone"><div class="msg"><div class="car"></div><span class="line s" style="width:70%"></span><span class="line" style="width:45%"></span><div class="btns"><span>в избранное</span><span>менеджеру</span></div></div><div class="msg me"><span class="line" style="width:120px"></span></div><div class="msg"><span class="line s" style="width:160px"></span><span class="line" style="width:110px"></span></div></div>
        <div class="panel">
          <div class="kpis"><div class="card"><p class="label">просмотры</p><p class="num">2 410</p></div><div class="card"><p class="label">избранное</p><p class="num">318</p></div><div class="card"><p class="label">заявки</p><p class="num" style="color:var(--violet)">64</p></div></div>
          <div class="chart">${[32,48,40,60,55,72,66,88,78,95,84,100].map((h,i)=>`<i class="${i>8?'on':''}" style="height:${h}%"></i>`).join('')}</div>
        </div>
      </div>`)
  },
  'work-support': {
    alt: 'Схема службы поддержки: очередь обращений, Telegram-бот, API и одна база данных',
    html: page('рабочие системы · поддержка', '#7cc4ff26', `
      .lay{display:grid;grid-template-columns:1fr 340px;height:636px}
      .queue{padding:26px 30px;display:grid;gap:12px;align-content:start}
      .tk{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--bg-3)}
      .tk .id{font:600 14px var(--mono);color:var(--mute)}.tk .line{height:12px}
      .tk.hot{border-color:#ffb2c966}
      .arch{border-left:1px solid var(--line);padding:30px 26px;display:grid;grid-template-rows:auto auto auto auto;gap:18px;align-content:start}
      .nodes{display:grid;gap:14px;align-content:start}
      .node{padding:14px 16px;border:1px solid var(--line-2);border-radius:10px;background:var(--bg-3);font:600 14px var(--mono);color:var(--text);display:flex;justify-content:space-between}
      .node small{color:var(--mute);font-weight:500}
      .fan{height:40px;position:relative;margin:-4px 0}.fan::before{content:"";position:absolute;left:50%;top:0;width:2px;height:100%;background:var(--line-2)}
      .db{padding:16px;border-radius:10px;background:#7cc4ff1a;border:1px solid #7cc4ff66;text-align:center;font:600 14px var(--mono);color:var(--info)}`, `
      <div class="bar"><i></i><i></i><i></i>support / inbox<b>FastAPI · Flask</b></div>
      <div class="lay">
        <div class="queue">
          <p class="label">обращения · сегодня</p>
          <div class="tk hot"><span class="id">#4821</span><span class="line s" style="width:75%"></span><span class="tag" style="color:var(--warn);border-color:#ffb2c966">новое</span></div>
          <div class="tk"><span class="id">#4820</span><span class="line s" style="width:60%"></span><span class="tag info">в работе</span></div>
          <div class="tk"><span class="id">#4819</span><span class="line s" style="width:82%"></span><span class="tag info">в работе</span></div>
          <div class="tk"><span class="id">#4818</span><span class="line" style="width:55%"></span><span class="tag ok">решено</span></div>
          <div class="tk"><span class="id">#4817</span><span class="line" style="width:68%"></span><span class="tag ok">решено</span></div>
          <div class="tk"><span class="id">#4816</span><span class="line" style="width:48%"></span><span class="tag ok">решено</span></div>
        </div>
        <div class="arch">
          <p class="label">три процесса · одна база</p>
          <div class="nodes"><div class="node">bot<small>Telegram</small></div><div class="node">api<small>интеграции</small></div><div class="node">web<small>операторы</small></div></div>
          <div class="fan"></div>
          <div class="db">PostgreSQL</div>
        </div>
      </div>`)
  },
  'work-booking': {
    alt: 'Схема бронирования переговорных: сетка недели с занятыми слотами и напоминания',
    html: page('рабочие системы · бронирование', '#d5ff6526', `
      .lay{display:grid;grid-template-columns:1fr 300px;height:636px}
      .week{padding:26px 30px;display:grid;grid-template-columns:70px repeat(5,1fr);grid-auto-rows:54px;gap:6px;align-content:start}
      .week .h{font:600 13px var(--mono);color:var(--mute);letter-spacing:.06em;display:flex;align-items:center;justify-content:center;text-transform:uppercase}
      .week .t{font:500 13px var(--mono);color:var(--mute);display:flex;align-items:center}
      .slot{border:1px solid var(--line);border-radius:8px;background:var(--bg-3)}
      .slot.b{background:#d5ff6522;border-color:#d5ff6566}
      .slot.me{background:var(--accent);border-color:var(--accent)}
      .slot.o{background:#7cc4ff1f;border-color:#7cc4ff55}
      .side{border-left:1px solid var(--line);padding:28px 24px;display:grid;gap:14px;align-content:start}
      .rem{padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--bg-3);display:grid;gap:8px}
      .rem b{font:600 14px var(--mono);color:var(--text)}.rem span{font:500 13px var(--mono);color:var(--mute)}
      .rem.on{border-color:var(--accent)}.rem.on b{color:var(--accent)}`, `
      <div class="bar"><i></i><i></i><i></i>rooms / week<b>Telegram WebApp</b></div>
      <div class="lay">
        <div class="week">
          <span></span><span class="h">пн</span><span class="h">вт</span><span class="h">ср</span><span class="h">чт</span><span class="h">пт</span>
          ${['09','10','11','12','13','14','15','16','17'].map((t,r)=>`<span class="t">${t}:00</span>`+[0,1,2,3,4].map(c=>{const k=(r*5+c)%7;const cls=(r===2&&c===1)||(r===3&&c===1)?'me':k===0||k===4?'b':k===2?'o':'';return `<span class="slot ${cls}"></span>`;}).join('')).join('')}
        </div>
        <div class="side">
          <p class="label">напоминания</p>
          <div class="rem on"><b>через 15 минут</b><span>переговорная · 11:00</span></div>
          <div class="rem"><b>завтра 09:30</b><span>подтвердить бронь</span></div>
          <div class="rem"><b>health</b><span class="tag ok" style="margin-top:4px"><i class="dot"></i>бот и сервер живы</span></div>
        </div>
      </div>`)
  },
  'work-feedback': {
    alt: 'Схема сбора обратной связи: веб-форма, из которой сообщение уходит в Telegram-чат проекта',
    html: page('рабочие системы · обратная связь', '#3ddc8426', `
      .lay{display:grid;grid-template-columns:1fr 90px 1fr;height:636px;align-items:stretch;padding:28px 30px}
      .form{padding:26px;display:grid;gap:14px}
      .field{height:46px;border:1px solid var(--line-2);border-radius:8px;background:var(--bg-2)}
      .field.area{height:120px}
      .file{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px dashed var(--line-2);border-radius:8px;font:600 13px var(--mono);color:var(--mute)}
      .send{padding:14px;border-radius:8px;background:var(--accent);color:#0a0d12;text-align:center;font:800 15px var(--sans)}
      .arrow{display:grid;place-items:center;height:100%}
      .arrow i{width:60px;height:2px;background:var(--ok);position:relative}.arrow i::after{content:"";position:absolute;right:-2px;top:-7px;border:8px solid transparent;border-left:10px solid var(--ok)}
      .chat{padding:22px;display:grid;gap:12px;align-content:start;background:var(--bg)}
      .form{align-content:start}
      .field.area{height:150px}
      .chat .label{margin-bottom:4px}
      .m{padding:12px 14px;border-radius:12px;background:var(--bg-3);display:grid;gap:8px;max-width:90%}
      .m.in{border:1px solid #3ddc8455;background:#3ddc8414}
      .thread{margin-left:22px;padding-left:12px;border-left:2px solid var(--line-2);display:grid;gap:10px}
      .shield{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}`, `
      <div class="bar"><i></i><i></i><i></i>feedback / forms<b>CSRF · rate limit · whitelist</b></div>
      <div class="lay">
        <div class="card form"><p class="label">форма проекта</p><div class="field"></div><div class="field"></div><div class="field area"></div><div class="file"><span class="tag">файл</span>вложение до 50 МБ</div><div class="send">Отправить</div></div>
        <div class="arrow"><i></i></div>
        <div class="card chat"><p class="label">telegram · чат проекта · тред</p><div class="m in"><span class="line s" style="width:85%"></span><span class="line" style="width:60%"></span><span class="tag ok" style="margin-top:4px"><i class="dot"></i>доставлено</span></div><div class="thread"><div class="m"><span class="line" style="width:70%"></span></div><div class="m"><span class="line" style="width:50%"></span></div><div class="m"><span class="line s" style="width:62%"></span><span class="line" style="width:38%"></span></div></div><div class="shield"><span class="tag">проект A</span><span class="tag">проект B</span><span class="tag ac">+ новый</span></div></div>
      </div>`)
  }
};

/* ---------- render ---------- */
const check = process.argv.includes('--check');
const stale = [];
const scriptTime = statSync(fileURLToPath(import.meta.url)).mtimeMs;
for (const name of Object.keys(PICTURES)) {
  const target = resolve(out, name + '.webp');
  if (!existsSync(target) || statSync(target).mtimeMs < scriptTime) stale.push(name);
}
if (check) {
  if (stale.length) { console.error('work illustrations missing or older than the script:', stale.join(', ')); process.exit(1); }
  console.log('work illustrations: up to date'); process.exit(0);
}

const sharp = loadSharp();
const chrome = chromePath();
const work = resolve(tmpdir(), 'portfolio-work-illustrations');
rmSync(work, {recursive: true, force: true});
mkdirSync(work, {recursive: true});
mkdirSync(out, {recursive: true});
for (const [name, picture] of Object.entries(PICTURES)) {
  const html = resolve(work, name + '.html');
  const png = resolve(work, name + '.png');
  writeFileSync(html, picture.html);
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
    `--window-size=${W},${H}`, `--screenshot=${png}`, '--default-background-color=0a0d12ff',
    '--user-data-dir=' + resolve(work, 'profile'), pathToFileURL(html).href], {stdio: 'ignore', timeout: 60_000});
  const buffer = await sharp(readFileSync(png)).resize(W, H, {kernel: 'lanczos3'}).webp({quality: 84, effort: 6}).toBuffer();
  writeFileSync(resolve(out, name + '.webp'), buffer);
  console.log(name, (buffer.length / 1024 | 0) + 'K', `${W}x${H}`, JSON.stringify(picture.alt));
}
rmSync(work, {recursive: true, force: true});
