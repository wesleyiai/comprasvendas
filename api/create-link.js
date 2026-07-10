const crypto = require('crypto');

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

    res.status(200).json({ url: data.url });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao comunicar com a InfinitePay' });
  }
};
