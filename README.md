# Compras e Vendas - Sertão

Portal de acesso ao grupo de WhatsApp **Compras e Vendas - Sertão**. Front-end estático com visual escuro/tecnológico e fundo 3D (Three.js), mais 2 funções serverless (Vercel) que integram com o Mercado Pago para cobrar Pix de verdade.

## Fluxo

1. Tela inicial com apresentação do grupo.
2. Usuário compartilha o site no WhatsApp (1 única etapa).
3. Tela de acesso com duas opções, deixadas explícitas para o usuário — nenhuma delas é enganosa:
   - **Pagar R$ 2,00 via Pix** e entrar na hora: o site gera uma cobrança real na API do Mercado Pago (QR Code + copia-e-cola) e consulta o status periodicamente até o pagamento ser aprovado de fato.
   - **Aguardar 10 minutos e entrar de graça**: um contador regressivo visível na mesma tela: ao chegar a zero, o link do grupo é liberado sem cobrança.
4. O acesso é liberado assim que uma das duas condições ocorrer primeiro: o Mercado Pago confirma o pagamento (`status: approved`) ou o contador de 10 minutos chega a zero.

> A tela deixa as duas opções claras lado a lado ("pague e entre agora" ou "aguarde e entre grátis"). Quem paga sabe exatamente pelo que está pagando — pular a espera — e ninguém é levado a pagar por algo que teria de graça sem saber.

## Hospedagem (Vercel)

Este projeto precisa rodar na Vercel (ou outro host com serverless functions), porque as rotas em `api/` fazem chamadas autenticadas ao Mercado Pago usando um Access Token que **não pode** ficar no código do front-end.

1. Importe o repositório na Vercel.
2. Em **Project Settings → Environment Variables**, adicione:
   - `MP_ACCESS_TOKEN` — o Access Token de produção da sua conta Mercado Pago (Painel do Desenvolvedor → Suas integrações → Credenciais de produção).
3. Faça o deploy. As rotas `/api/create-pix` e `/api/check-payment` ficam disponíveis automaticamente.

## Rodar localmente

```bash
npx vercel dev
```

(`npx serve .` ainda funciona para navegar no visual, mas as chamadas a `/api/*` só respondem via `vercel dev`, que roda as functions localmente.)

## Configuração

Edite as constantes no topo de `js/main.js`:

- `GROUP_INVITE_URL` — link de convite do grupo do WhatsApp.
- `SHARE_TEXT` — texto pré-preenchido ao compartilhar.
- `POLL_INTERVAL_MS` — intervalo de consulta do status do pagamento.
- `FREE_WAIT_SECONDS` — duração da espera gratuita (hoje 10 minutos = `10 * 60`).

O valor cobrado (R$ 2,00) e a descrição da cobrança ficam em `api/create-pix.js`.

## Estrutura

```
index.html
css/style.css          # tema visual
js/main.js             # lógica do fluxo (gate de compartilhamento, pagamento, links)
js/three-bg.js          # fundo 3D (Three.js via CDN)
assets/logo.png         # logo do grupo
api/create-pix.js       # cria a cobrança Pix no Mercado Pago
api/check-payment.js    # consulta o status real do pagamento
```
