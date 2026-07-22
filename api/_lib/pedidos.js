// Guarda o telefone do cliente atrelado ao order_nsu, direto na VM do bot
// (compras-bot) — o site roda em funções serverless na Vercel, sem disco
// próprio. Mesmo padrão usado pelo site do WCurrículos (ver
// api/_lib/pedidos.js em sitewcurriculos), reaproveitando a mesma rota
// genérica /pedido/:orderNsu que já roda no bot.

const BASE_URL = process.env.GRUPO_BOT_BASE_URL;
const SECRET = process.env.GRUPO_BOT_WEBHOOK_SECRET;

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

async function salvarPedido(orderNsu, pedido) {
  if (!BASE_URL || !SECRET) {
    console.error('GRUPO_BOT_BASE_URL/GRUPO_BOT_WEBHOOK_SECRET não configurados — pedido não persistido.');
    return;
  }
  const { signal, cancel } = withTimeout(5000);
  try {
    await fetch(`${BASE_URL}/pedido/${encodeURIComponent(orderNsu)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
      body: JSON.stringify(pedido),
      signal,
    });
  } finally {
    cancel();
  }
}

async function buscarPedido(orderNsu) {
  if (!BASE_URL || !SECRET) return null;
  const { signal, cancel } = withTimeout(5000);
  try {
    const resp = await fetch(`${BASE_URL}/pedido/${encodeURIComponent(orderNsu)}`, {
      headers: { Authorization: `Bearer ${SECRET}` },
      signal,
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (err) {
    return null;
  } finally {
    cancel();
  }
}

module.exports = { salvarPedido, buscarPedido };
