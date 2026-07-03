# Compras e Vendas - Sertão

Portal de acesso ao grupo de WhatsApp **Compras e Vendas - Sertão**. Site estático com visual escuro/tecnológico e fundo 3D (Three.js), publicado via GitHub Pages.

## Fluxo

1. Tela inicial com apresentação do grupo.
2. Usuário completa 2 etapas de compartilhamento (status do WhatsApp + 1 amigo).
3. Verificação simulada com contagem regressiva de 20s.
4. Botão final libera o link de convite do grupo.

> A "verificação" é um gate de UX (clique + timer) — o WhatsApp não expõe uma API para confirmar compartilhamentos reais.

## Rodar localmente

Como o fundo 3D usa um `<script type="module">`, é preciso servir os arquivos por HTTP (não abrir o `index.html` direto):

```bash
npx serve .
```

## Configuração

Edite as constantes no topo de `js/main.js`:

- `GROUP_INVITE_URL` — link de convite do grupo do WhatsApp.
- `COUNTDOWN_SECONDS` — duração da verificação.
- `SHARE_TEXT` — texto pré-preenchido ao compartilhar.

## Estrutura

```
index.html
css/style.css      # tema visual
js/main.js         # lógica do fluxo (gate, contagem, links)
js/three-bg.js      # fundo 3D (Three.js via CDN)
assets/logo.png     # logo do grupo
```
