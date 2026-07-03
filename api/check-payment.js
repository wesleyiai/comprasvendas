module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no servidor' });
    return;
  }

  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: 'Parâmetro id é obrigatório' });
    return;
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const data = await mpRes.json();

    if (!mpRes.ok) {
      res.status(mpRes.status).json({ error: data.message || 'Erro ao consultar pagamento' });
      return;
    }

    res.status(200).json({ status: data.status, status_detail: data.status_detail });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao comunicar com o Mercado Pago' });
  }
};
