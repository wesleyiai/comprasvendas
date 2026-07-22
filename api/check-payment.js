const { salvarPedido, buscarPedido } = require('./_lib/pedidos');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const handle = process.env.INFINITEPAY_HANDLE;
  if (!handle) {
    res.status(500).json({ error: 'INFINITEPAY_HANDLE não configurado no servidor' });
    return;
  }

  const { order_nsu, transaction_nsu, slug } = req.query;
  if (!order_nsu || !transaction_nsu || !slug) {
    res.status(400).json({ error: 'Parâmetros order_nsu, transaction_nsu e slug são obrigatórios' });
    return;
  }

  try {
    const ipRes = await fetch('https://api.checkout.infinitepay.io/payment_check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, order_nsu, transaction_nsu, slug }),
    });

    const data = await ipRes.json();

    if (!ipRes.ok) {
      res.status(ipRes.status).json({ error: data.message || 'Erro ao consultar pagamento' });
      return;
    }

    const paid = Boolean(data.paid);

    if (paid) {
      const pedido = await buscarPedido(order_nsu);
      if (pedido && !pedido.paid) {
        try {
          await salvarPedido(order_nsu, { ...pedido, paid: true, paidAt: new Date().toISOString() });
        } catch (err) {
          console.error('Falha ao atualizar pedido:', err);
        }
      }
      await notificarBotGrupo(order_nsu);
    }

    res.status(200).json({
      paid,
      amount: data.amount,
      paid_amount: data.paid_amount,
      capture_method: data.capture_method,
    });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao comunicar com a InfinitePay' });
  }
};

// Avisa o bot (VM compras-bot) que o pagamento foi confirmado, pra ele mandar
// a confirmação + convite do grupo por WhatsApp. Best-effort e com timeout
// curto — se o bot estiver fora do ar, o webhook da InfinitePay
// (api/webhook-infinitepay.js) tenta de novo em paralelo.
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
    console.error('Falha ao notificar bot do grupo (segue via webhook da InfinitePay):', err.message);
  } finally {
    clearTimeout(timeout);
  }
}
