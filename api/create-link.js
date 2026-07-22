const crypto = require('crypto');
const { salvarPedido } = require('./_lib/pedidos');

const AMOUNT_CENTS = 200;
const DESCRIPTION = 'Acesso ao grupo Compras e Vendas - Sertão';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const handle = process.env.INFINITEPAY_HANDLE;
  if (!handle) {
    res.status(500).json({ error: 'INFINITEPAY_HANDLE não configurado no servidor' });
    return;
  }

  const telefone = String((req.body && req.body.telefone) || '').replace(/\D/g, '');
  if (!/^\d{11}$/.test(telefone)) {
    res.status(400).json({ error: 'Telefone inválido — informe DDD + número com 11 dígitos.' });
    return;
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const orderNsu = crypto.randomUUID();

  try {
    const ipRes = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle,
        items: [{ quantity: 1, price: AMOUNT_CENTS, description: DESCRIPTION }],
        order_nsu: orderNsu,
        redirect_url: `${origin}/`,
        webhook_url: `${origin}/api/webhook-infinitepay`,
      }),
    });

    const data = await ipRes.json();

    if (!ipRes.ok || !data.url) {
      res.status(ipRes.status || 502).json({ error: data.message || 'Erro ao criar link de pagamento' });
      return;
    }

    // Best-effort: se o navegador do cliente fechar antes de voltar do
    // checkout, esse telefone salvo é o que permite ao check-payment.js (ou
    // ao webhook da InfinitePay) mandar a confirmação + convite do grupo por
    // WhatsApp mesmo assim.
    try {
      await salvarPedido(orderNsu, { telefone, paid: false, createdAt: new Date().toISOString() });
    } catch (err) {
      console.error('Falha ao salvar pedido:', err);
    }

    res.status(200).json({ url: data.url });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao comunicar com a InfinitePay' });
  }
};
