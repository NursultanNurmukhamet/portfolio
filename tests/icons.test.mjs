// Offline checks for the shared SVG vocabulary and top-level public frontend.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import vm from 'node:vm';

const dist=new URL('../dist/',import.meta.url);
const read=name=>readFileSync(new URL(name,dist),'utf8');
const names=['arrow-up-right','arrow-down-right','arrow-down-left','arrow-up-left',
  'arrow-down','arrow-up','arrow-left','arrows-vertical','asterisk','close','plus','pause','play'];
const sandbox={window:{}};
vm.runInNewContext(read('icons.js'),sandbox,{filename:'icons.js',timeout:1000});
const icon=sandbox.window.portfolioIcon;

test('every whitelisted icon is decorative SVG referencing an existing sprite symbol',()=>{
  assert.equal(typeof icon,'function');
  const symbolIds=[...read('assets/icons.svg').matchAll(/<symbol\b[^>]*\bid=["']([^"']+)["']/g)].map(match=>match[1]);
  assert.equal(new Set(symbolIds).size,symbolIds.length,'sprite symbol IDs must be unique');
  assert.deepEqual([...symbolIds].sort(),names.map(name=>`icon-${name}`).sort());
  for(const name of names){
    const markup=icon(name);
    assert.match(markup,/^<svg\b/);
    assert.match(markup,/\bclass="ui-icon"/);
    assert.match(markup,/\bviewBox="0 0 24 24"/);
    assert.match(markup,/\baria-hidden="true"/);
    assert.match(markup,/\bfocusable="false"/);
    const href=markup.match(/<use\b[^>]*\bhref="([^"]+)"/);
    assert.ok(href,`${name}: SVG must contain a sprite reference`);
    assert.equal(href[1],`assets/icons.svg#icon-${name}`);
    assert.ok(symbolIds.includes(href[1].split('#')[1]),`${name}: missing sprite symbol`);
    assert.match(markup,/<\/use><\/svg>$/);
  }
});

test('unknown names and HTML injection cannot generate icon markup',()=>{
  for(const name of ['unknown','',null,undefined,{},'<svg onload="alert(1)">',
    'arrow-up-right"><script>alert(1)</script>','../arrow-up-right']){
    // VM errors belong to a different realm; verify the error name, not its constructor.
    assert.throws(()=>icon(name),{name:'TypeError',message:'Unknown interface icon'});
  }
});

test('top-level frontend HTML and JavaScript contain no emoji or decorative text glyphs',()=>{
  // Only top-level public source files: no recursion into demos, vendor or licenses.
  const files=readdirSync(dist,{withFileTypes:true})
    .filter(entry=>entry.isFile()&&/\.(?:html|js)$/.test(entry.name))
    .map(entry=>entry.name).sort();
  assert.ok(files.includes('index.html')&&files.includes('contact.js')&&files.includes('icons.js'));
  const forbidden=/\p{Emoji_Presentation}|[\u2190-\u21ff\u2300-\u23ff\u2500-\u25ff\u2600-\u27bf\u2b00-\u2bff\u2161\u00d7\ufe0f]/gu;
  assert.deepEqual([...('\u00a9 2026').matchAll(forbidden)],[],'ordinary copyright text is allowed');
  const violations=[];
  for(const file of files){
    const source=read(file);
    for(const match of source.matchAll(forbidden)){
      const line=source.slice(0,match.index).split('\n').length;
      const point=`U+${match[0].codePointAt(0).toString(16).toUpperCase().padStart(4,'0')}`;
      violations.push(`${file}:${line} ${point}`);
    }
  }
  assert.deepEqual(violations,[],'use SVG geometry instead of OS-dependent text glyphs');
});

test('index loads the icon helper before each classic script that consumes it',()=>{
  const scripts=[...read('index.html').matchAll(/<script\b([^>]*)>/gi)]
    .map(match=>({attributes:match[1],src:match[1].match(/\bsrc=["']([^"']+)["']/i)?.[1]}));
  const helper=scripts.findIndex(script=>script.src==='icons.js');
  assert.ok(helper>=0,'icons.js must be loaded');
  assert.equal(scripts.filter(script=>script.src==='icons.js').length,1);
  for(const src of ['icons.js','app.js','gallery.js','contact.js']){
    const index=scripts.findIndex(script=>script.src?.split(/[?#]/)[0]===src);
    assert.ok(index>=0,`${src} must be loaded`);
    if(src!=='icons.js')assert.ok(helper<index,`icons.js must precede ${src}`);
    assert.match(scripts[index].attributes,/\bdefer\b/i,`${src} must preserve deferred execution order`);
    assert.doesNotMatch(scripts[index].attributes,/\basync\b/i,`${src} must not race the helper`);
  }
});
