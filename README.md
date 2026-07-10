# Compras e Vendas - Sertão

Portal de acesso ao grupo de WhatsApp **Compras e Vendas - Sertão**. Front-end estático com visual escuro/tecnológico e fundo 3D (Three.js).

## Fluxo

1. Tela inicial com apresentação do grupo.
2. Usuário compartilha o site no WhatsApp (1 única etapa).
3. Tela de acesso com duas opções, deixadas explícitas para o usuário:
   - **Pagar R$ 2,00 (Pix ou cartão)**: o botão gera um link de checkout hospedado pela InfinitePay (`api/create-link.js`) e redireciona o cliente pra lá. Depois de pagar, a InfinitePay redireciona de volta pro site com os dados da transação na URL; o front chama `api/check-payment.js`, que confere o pagamento direto na InfinitePay (nunca confia nos parâmetros da URL sozinhos) e só então libera o acesso — automático, sem autodeclaração.
   - **Aguardar 1 hora e entrar de graça**: um contador regressivo visível na mesma tela; ao chegar a zero, o link do grupo é liberado sem cobrança.
4. O acesso é liberado assim que o pagamento é confirmado (caminho pago) ou quando o contador de 1 hora chegar a zero (caminho grátis) — o que ocorrer primeiro.

> A tela deixa as duas opções claras lado a lado ("pague e entre agora" ou "aguarde e entre grátis"). Quem paga sabe exatamente pelo que está pagando — pular a espera.

## Rodar localmente

```bash
npx serve .
```

Isso serve só o front-end estático. Pra testar o pagamento de verdade é preciso rodar via Vercel (ver abaixo), porque `api/*.js` são funções serverless — não funcionam com `npx serve`.

## Configuração

Edite as constantes no topo de `js/main.js`:

- `GROUP_INVITE_URL` — link de convite do grupo do WhatsApp.
- `SHARE_TEXT` — texto pré-preenchido ao compartilhar.
- `FREE_WAIT_SECONDS` — duração da espera gratuita (hoje 1 hora = `60 * 60`).

O valor cobrado (`AMOUNT_CENTS`, hoje 200 = R$ 2,00) fica em `api/create-link.js`, do lado do servidor — o front nunca envia o valor, então ninguém consegue manipular o preço pelo navegador.

## Pagamento automático (InfinitePay)

O acesso pago é liberado automaticamente via integração com a [InfinitePay Checkout](https://www.infinitepay.io/checkout). Pra funcionar:

1. **Importe este repositório na Vercel** (necessário — GitHub Pages só serve arquivos estáticos, não roda as funções em `api/`). A Vercel detecta `index.html`/`css`/`js` como site estático e `api/*.js` como funções serverless automaticamente, sem precisar de `vercel.json`.
2. Em *Project Settings → Environment Variables* na Vercel, adicione:
   - `INFINITEPAY_HANDLE` — sua InfiniteTag (o `@handle`, sem o `$`).
3. Redeploy. O domínio da Vercel passa a ser o link a divulgar (ou aponte seu domínio próprio pra ele).

Arquivos envolvidos:

- `api/create-link.js` — gera o link de checkout (`POST https://api.checkout.infinitepay.io/links`) com o valor fixo e um `order_nsu` único; devolve a `url` pro front redirecionar o cliente.
- `api/check-payment.js` — quando o cliente volta do checkout (`?order_nsu=...&transaction_nsu=...&slug=...` na URL), confere o pagamento de verdade (`POST https://api.checkout.infinitepay.io/payment_check`) antes de liberar o acesso.
- `api/webhook-infinitepay.js` — recebe a notificação que a InfinitePay dispara quando um pagamento é confirmado; só serve de log/backup nos logs da Vercel, não é o que libera o acesso no site.

## Estrutura

```
index.html
css/style.css               # tema visual
js/main.js                  # lógica do fluxo (gate de compartilhamento, pagamento, links)
js/three-bg.js               # fundo 3D (Three.js via CDN)
assets/logo.png              # logo do grupo
api/create-link.js           # gera o link de checkout da InfinitePay
api/check-payment.js         # confirma o pagamento server-side
api/webhook-infinitepay.js   # log/backup do webhook de pagamento confirmado
```
