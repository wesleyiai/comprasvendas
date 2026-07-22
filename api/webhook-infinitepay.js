const { salvarPedido, buscarPedido } = require('./_lib/pedidos');

// Não é usado para liberar o acesso no site (isso continua sendo feito por
// api/check-payment.js quando o cliente volta do checkout) — mas, como esse
// webhook é chamado direto pela InfinitePay independente do navegador do
// cliente ainda estar aberto, também aproveitamos pra marcar o pedido como
// pago e avisar o bot a mandar a confirmação + convite do grupo, mesmo que o
// cliente nunca volte ao site.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  console.log('InfinitePay webhook:', JSON.stringify(req.body));

  try {
    const orderNsu = req.body && (req.body.order_nsu || req.body.orderNsu);
    if (orderNsu) {
      const pedido = await buscarPedido(orderNsu);
      if (pedido && !pedido.paid) {
        await salvarPedido(orderNsu, { ...pedido, paid: true, paidAt: new Date().toISOString() });
      }
      await notificarBotGrupo(orderNsu);
    }
  } catch (err) {
    console.error('Falha ao processar webhook da InfinitePay:', err);
  }

  res.status(200).json({ received: true });
};

async function notificarBotGrupo(orderNsu) {
  const url = process.env.GRUPO_BOT_WEBHOOK_URL;
  const secret = process.env.GRUPO_BOT_WEBHOOK_SECRET;
  if (!url || !secret) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ order_nsu: orderNsu }),
      signal: controller.signal,
    });
  } catch (err) {
    console.error('Falha ao notificar bot do grupo (segue via retorno do cliente ao site):', err.message);
  } finally {
    clearTimeout(timeout);
  }
}
