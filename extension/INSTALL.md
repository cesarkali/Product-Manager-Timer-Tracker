# PMTT Timer — Extensão do Chrome

Cronômetro do PMTT no navegador: controle o timer pelo popup, vincule tickets do
Movidesk e issues do Jira ao registro em andamento com um clique, e receba
sugestões de categoria ao navegar (regras por domínio).

## Como instalar (uma vez)

1. Gere o build (na raiz do repositório):

   ```
   npm run ext:build
   ```

   O resultado fica em `extension/dist/`. O build lê o `.env` da raiz — a
   extensão aponta para o **mesmo ambiente Firebase** (produção ou homolog) que
   estiver ativo ali. O console do build mostra qual projeto foi usado.

2. No Chrome, abra `chrome://extensions`.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e escolha a pasta `extension/dist`.
5. Clique no ícone da extensão (fixe na barra, se quiser) e **entre com o mesmo
   e-mail/senha do PMTT**. O login fica salvo.

## Depois de instalar

- **Popup** (ícone na barra): iniciar/trocar categoria (atalhos 1–9, como no
  app), pausar, parar, descartar, descrição, tasks vinculadas e comentários.
  O badge do ícone mostra o tempo decorrido — verde rodando, âmbar pausado.
- **Widget no Movidesk/Jira**: uma pílula flutuante no canto inferior direito
  de `bitz.movidesk.com` e `bitzsoftwares.atlassian.net`. Com um ticket aberto,
  o widget detecta o número pela URL e oferece **"Vincular ao timer"**; no
  Movidesk também há o atalho **"Criou task no Jira?"** — adicionar a chave da
  task marca o registro como *task criada* no PMTT (mesma regra do app).
- **Opções** (engrenagem no popup): URL do PMTT publicado, ligar/desligar o
  widget, templates de comentário e as **regras por domínio** (ex.: "estou em
  `bitz.movidesk.com` → sugerir categoria *Suporte*"). A sugestão chega como
  notificação do Chrome com botão de um clique; a troca nunca é automática.

## Atualizar a extensão

Depois de qualquer mudança no código (ou troca de ambiente no `.env`):

```
npm run ext:build
```

e em `chrome://extensions` clique no ícone de **recarregar** (↻) do PMTT Timer.
Durante o desenvolvimento, `npm run ext:watch` rebuilda sozinho a cada save
(ainda é preciso recarregar em `chrome://extensions`).

## Se o login falhar com erro de rede/permissão

A API key do Firebase pode ter restrição de referrer HTTP. Verifique em
Google Cloud Console → APIs & Services → Credentials → a API key do projeto:
se houver restrição por site, adicione a origem da extensão
(`chrome-extension://<id-da-extensão>/*` — o id aparece em `chrome://extensions`).
Nas configurações padrão do Firebase não há restrição e nada precisa ser feito.

## O que a extensão NÃO faz

- Não altera nada nas `firestore.rules` nem no formato dos dados — ela escreve
  no mesmo documento `activeTimer/current` e nos mesmos `timeEntries` que o app
  web, com os mesmos campos.
- Não coleta histórico de navegação: a permissão `tabs` é usada apenas para
  comparar a URL da aba ativa com as regras que você mesmo cadastrar.
