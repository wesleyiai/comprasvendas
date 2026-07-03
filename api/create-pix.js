const crypto = require('crypto');

const AMOUNT = 2;
const DESCRIPTION = 'Acesso ao grupo Compras e Vendas - Sertão';
const PAYER_EMAIL = 'acesso-grupo@comprasvendas-sertao.com.br';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no servidor' });
    return;
  }

  try {
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: AMOUNT,
        description: DESCRIPTION,
        payment_method_id: 'pix',
        payer: { email: PAYER_EMAIL },
      }),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      res.status(mpRes.status).json({ error: data.message || 'Erro ao criar cobrança Pix' });
      return;
    }

    const txData = data.point_of_interaction && data.point_of_interaction.transaction_data;
    if (!txData || !txData.qr_code) {
      res.status(502).json({ error: 'Mercado Pago não retornou o QR Code' });
      return;
    }

    res.status(200).json({
      id: data.id,
      status: data.status,
      qr_code: txData.qr_code,
      qr_code_base64: txData.qr_code_base64,
    });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao comunicar com o Mercado Pago' });
  }
};
