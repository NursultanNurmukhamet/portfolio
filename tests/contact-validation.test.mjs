import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../dist/contact.js',import.meta.url),'utf8');
const start=source.indexOf('  const leadValidation=Object.freeze({');
const end=source.indexOf('  function validationMessage(',start);
assert.ok(start>=0&&end>start);
const sandbox={window:{}};
vm.runInNewContext(source.slice(start,end),sandbox);
const v=sandbox.window.portfolioLeadValidation;

test('client validation accepts practical names, contacts and phone numbers',()=>{
  for(const name of ['Алия','Nursultan Nurmukhamet','О’Коннор','Анна-Мария'])assert.equal(v.name(name),'');
  for(const contact of ['name@example.com','@NurmukhametNursultan','https://t.me/NurmukhametNursultan'])assert.equal(v.contact(contact),'');
  for(const phone of ['', '+7 (700) 022-53-39','1234567'])assert.equal(v.phone(phone),'');
});

test('client validation gives bounded input errors before a form is sent',()=>{
  for(const name of ['','A','Нурсултан 7','<script>'])assert.match(v.name(name),/имя/i);
  for(const contact of ['hello','@abc','https://bad.test/name','mail@invalid'])assert.match(v.contact(contact),/email|Telegram/i);
  for(const phone of ['12','+7 abc','+1234567890123456'])assert.match(v.phone(phone),/номер/i);
});
