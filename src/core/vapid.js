// Ключи VAPID для Web Push создаются в браузере создателя пары (WebCrypto, P-256).
// Публичный ключ кладётся в couple.json, закрытый показывается один раз — его вставляют в секрет репозитория VAPID_PRIVATE.
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function generateVapid() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  const pub = b64u(await crypto.subtle.exportKey('raw', kp.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  return { pub, priv: jwk.d };
}
export const urlB64ToBytes = (s) => { const p = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4); return Uint8Array.from(atob(p), (c) => c.charCodeAt(0)); };
