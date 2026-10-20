#!/usr/bin/env node
// Gera o par de chaves VAPID das notificações push. Rode no SEU computador:
//   node scripts/generate-vapid.mjs
// A chave pública vai para o Worker como variável; a PRIVADA é segredo e nunca deve
// ir para o Git, para o chat ou para o navegador.
import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pub = publicKey.export({ format: 'jwk' });
const priv = privateKey.export({ format: 'jwk' });
const b64 = (value) => Buffer.from(value, 'base64url');
const publicRaw = Buffer.concat([Buffer.from([4]), b64(pub.x), b64(pub.y)]).toString('base64url');

console.log('VAPID_PUBLIC_KEY  (pode ficar visível):');
console.log(publicRaw);
console.log('\nVAPID_PRIVATE_KEY (SEGREDO, guarde só na Cloudflare):');
console.log(priv.d);
console.log('\nPróximos passos: veja a seção "Notificações push" do DEPLOY.md.');
