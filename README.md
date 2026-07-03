# Compras e Vendas - Sertão

Portal de acesso ao grupo de WhatsApp **Compras e Vendas - Sertão**. Front-end estático com visual escuro/tecnológico e fundo 3D (Three.js).

## Fluxo

1. Tela inicial com apresentação do grupo.
2. Usuário compartilha o site no WhatsApp (1 única etapa).
3. Tela de acesso com duas opções, deixadas explícitas para o usuário — nenhuma delas é enganosa:
   - **Pagar R$ 2,00 via Pix** com uma chave aleatória estática (botão de copiar) e entrar na hora, tocando em "Já paguei, entrar no grupo". Isso é uma autodeclaração: como a chave é estática (sem ID de transação nem webhook), o site não tem como verificar automaticamente qual pagamento é de qual visitante — por isso não existe nenhum texto de "verificando..." fingindo checar algo que não pode ser checado. A conferência real, se houver, é manual (extrato bancário).
   - **Aguardar 10 minutos e entrar de graça**: um contador regressivo visível na mesma tela; ao chegar a zero, o link do grupo é liberado sem cobrança.
4. O acesso é liberado assim que a pessoa tocar em "Já paguei" (caminho pago) ou quando o contador de 10 minutos chegar a zero (caminho grátis) — o que ocorrer primeiro.

> A tela deixa as duas opções claras lado a lado ("pague e entre agora" ou "aguarde e entre grátis"). Quem paga sabe exatamente pelo que está pagando — pular a espera — e ninguém é levado a pagar por algo que teria de graça sem saber, nem enganado por uma falsa verificação automática.

## Rodar localmente

```bash
npx serve .
```

Site 100% estático — não depende de nenhuma função serverless nem variável de ambiente.

## Configuração

Edite as constantes no topo de `js/main.js`:

- `GROUP_INVITE_URL` — link de convite do grupo do WhatsApp.
- `SHARE_TEXT` — texto pré-preenchido ao compartilhar.
- `PIX_KEY` — chave Pix aleatória exibida na tela de pagamento.
- `FREE_WAIT_SECONDS` — duração da espera gratuita (hoje 10 minutos = `10 * 60`).

O valor cobrado (R$ 2,00) é apenas texto em `index.html` — como a chave é estática, não há cobrança automatizada.

## Estrutura

```
index.html
css/style.css          # tema visual
js/main.js             # lógica do fluxo (gate de compartilhamento, pagamento, links)
js/three-bg.js          # fundo 3D (Three.js via CDN)
assets/logo.png         # logo do grupo
```

## Sobre a pasta `api/`

`api/create-pix.js` e `api/check-payment.js` ficaram no repositório de uma versão anterior que integrava com a API do Mercado Pago (cobrança dinâmica com verificação real por transação). Não são mais chamados pelo front-end atual. Se um dia quiser verificação automática de verdade em vez da autodeclaração, é essa integração que precisa voltar a ser usada (exige importar o projeto na Vercel e configurar `MP_ACCESS_TOKEN`).
