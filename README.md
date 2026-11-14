# DACOMP - Diretório Acadêmico Alan Turing 🐺

Website oficial do **Diretório Acadêmico Alan Turing (DACOMP)** da Universidade Federal de Uberlândia (**UFU**).

Representando estudantes dos cursos de Computação da FACOM/UFU, conectando pessoas, promovendo integração e transformando a vida acadêmica.

---

## 📌 Sobre o DACOMP

O **DACOMP** é a entidade de representação estudantil dos cursos de Computação da **Faculdade de Computação (FACOM) da UFU**.

Nossas frentes de atuação incluem:

- 🎓 **Representação Estudantil:** Defesa dos interesses e direitos dos discentes nos órgãos colegiados da UFU.
- 🤝 **Integração & Recepção:** Acolhimento de calouros, eventos de integração e fortalecimento da comunidade acadêmica.
- 💡 **Ações Acadêmicas & Profissionais:** Workshops, aulões, hackathons, semanas acadêmicas e conexão com o mercado de tecnologia.
- 📍 **Espaço Físico & Apoio:** Gestão da vivência do DACOMP no Campus Santa Mônica.

---

## 🛠️ Tecnologias Utilizadas

- **[React 19](https://react.dev/)** — Biblioteca para interfaces reativas e modernas
- **[Vite](https://vitejs.dev/)** — Build tool e servidor de desenvolvimento ultra rápido
- **[TypeScript / JavaScript](https://www.typescriptlang.org/)** — Tipagem estática e suporte a JSX
- **[Lucide React](https://lucide.dev/)** — Conjunto moderno de ícones vetoriais
- **CSS3 Moderno** — Layouts responsivos e animações customizadas
- **[Supabase](https://supabase.com/)** — Auth, PostgreSQL, Row Level Security e Edge Functions (Deno)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- Gerenciador de pacotes `npm`
- Um projeto Supabase com as migrações e funções aplicadas (veja abaixo)

### Passo a passo

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/Sistemas-DACOMP/site-dacomp.git
   cd site-dacomp
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   ```bash
   cp .env.example .env.local
   ```

   Preencha `.env.local` com a URL e a **publishable key** do projeto Supabase
   (Dashboard → Project Settings → API):

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   > **Nunca** coloque a `service_role`/secret key no `.env.local` nem no
   > frontend. Ela é usada apenas pelas Edge Functions e por scripts locais.

4. **Inicie o servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

5. **Acesse no navegador:**
   Abra [http://localhost:5173](http://localhost:5173).

---

## 🗄️ Configuração do Backend Supabase

O backend está versionado em `supabase/`:

- `supabase/migrations/` — tabelas, funções, RLS, auditoria e rate limit;
- `supabase/functions/login/` — login por matrícula, usuário ou e-mail;
- `supabase/functions/create-member/` — cadastro exclusivo de administradores;
- `supabase/functions/manage-member/` — funções, status, exclusão e reset de senha;
- `supabase/config.toml` — configuração de Auth, cadastro público desativado,
  política de senha e JWT curto.

### Aplicar em um projeto

```bash
npx supabase@latest login
npx supabase@latest link --project-ref SEU_PROJECT_REF
npx supabase@latest db push
```

Publique as funções (a de login não exige JWT do gateway; a autorização é
feita internamente):

```bash
npx supabase@latest functions deploy login register \
  --no-verify-jwt --use-api

npx supabase@latest functions deploy create-member manage-member \
  --use-api
```

Configure os secrets das funções:

```bash
npx supabase@latest secrets set \
  "LOGIN_HASH_SALT=uma-string-aleatoria-longa" \
  "APP_ORIGINS=https://seu-site.com,http://localhost:5173"
```

Aplique as configurações de Auth:

```bash
npx supabase@latest config push
```

> O plano Free não permite `auth.sessions.timebox` (recurso Pro). Por isso o
> projeto usa JWT de 15 minutos com renovação automática e rotação de refresh
> token; o checkbox “manter sessão” controla apenas a persistência no
> navegador (`localStorage` × `sessionStorage`).

### Primeiro administrador

O sistema **não tem cadastro público**. O primeiro administrador deve ser
criado pelo responsável pela implantação. Duas opções:

1. Pelo **Dashboard → Authentication → Users → Add user**, com o User Metadata:

   ```json
   {
     "nome": "Nome Completo",
     "matricula": "12411BSI224",
     "username": "usuario",
     "role": "admin",
     "must_change_password": true
   }
   ```

2. Pelo script local [`scripts/seed-admin.mjs`](scripts/seed-admin.mjs),
   passando a service role key **apenas em variáveis de ambiente**:

   ```bash
   SUPABASE_URL=... \
   SUPABASE_SECRET_KEY=... \
   ADMIN_NOME="Nome Completo" \
   ADMIN_MATRICULA="12411BSI224" \
   ADMIN_USERNAME="usuario" \
   ADMIN_EMAIL="email@ufu.br" \
   ADMIN_PASSWORD="SenhaForte@2026" \
   node scripts/seed-admin.mjs
   ```

   O script não imprime a senha. A conta entra com
   `must_change_password = true` e o administrador deve trocá-la no primeiro
   acesso.

Depois disso, o cadastro de contas é feito pelo próprio painel administrativo.

### Scripts operacionais

| Script | Uso |
| :--- | :--- |
| `scripts/seed-admin.mjs` | Cria o primeiro administrador (uma vez). |
| `scripts/set-must-change.mjs` | Altera a flag `must_change_password` de um perfil por e-mail (operação administrativa). |

Ambos leem `SUPABASE_URL` e `SUPABASE_SECRET_KEY` do ambiente. **Não commite a
secret key** e não a coloque no frontend.

---

## 📦 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local com Hot Module Replacement (HMR). |
| `npm run build` | Compila o TypeScript e gera o build otimizado de produção na pasta `dist/`. |
| `npm run preview` | Pré-visualiza localmente a versão compilada em `dist/`. |

---

## 🔐 Autenticação e Áreas Restritas

A autenticação é feita pelo **Supabase Auth**. Estudantes podem se cadastrar
publicamente e começam como **aluno**; a promoção para **membro** ou
**administrador** é feita manualmente por um administrador.

### Rotas

| Rota | Quem acessa | Descrição |
| :--- | :--- | :--- |
| `/` | Público | Página institucional. |
| `/login` | Público | Entrada com matrícula, usuário ou e-mail. |
| `/registrar` | Público | Cadastro de aluno. A conta começa sem acesso aos painéis. |
| `/perfil` | Autenticado | Dados da conta, troca de senha e botões dos painéis. |
| `/painel-membro` | Membro ou admin | Painel interno do membro. |
| `/admin` | Admin | Gestão de contas e histórico administrativo. |
| `/cadastro` | Admin | Cadastro de novos membros. |

### Perfis

- **Aluno (`aluno`)** — cadastro público. Acessa apenas o próprio perfil e a
  troca de senha; não vê os painéis internos. Pode ser promovido manualmente
  por um administrador.
- **Membro (`membro`)** — integrante do DA. Acessa `/perfil` e
  `/painel-membro`, onde pode publicar e editar os **avisos da gestão**
  (gestão geral). Não gerencia contas.
- **Administrador (`admin`)** — acesso total: painel administrativo, criação e
  edição de contas, alteração de funções, ativação/desativação, reset de senha,
  exclusão e avisos da gestão. Todas as ações são validadas novamente na Edge
  Function.

O botão **“Abrir Painel do Membro”** aparece somente no perfil; não há link no
menu público.

### Cadastro público (aluno)

Qualquer pessoa pode criar uma conta em `/registrar`. A Edge Function
`register` cria o usuário no Supabase Auth e o perfil já nasce com
`role = 'aluno'` — **qualquer papel enviado pelo cliente é ignorado**. O
cadastro público do Supabase Auth continua desativado (`enable_signup = false`);
o endpoint público é a Edge Function.

- Rate limit de 10 cadastros por IP por hora.
- Matrícula, usuário e e-mail precisam ser únicos.
- A conta entra com e-mail auto-confirmado e pode fazer login imediatamente.
- O aluno **não** acessa painéis; um administrador precisa mudar manualmente a
  função para `membro` ou `admin`.

### Cadastro de contas pelo administrador

O administrador informa **nome completo, matrícula, nome de usuário, e-mail,
função e senha temporária**. A função pode ser **Aluno**, **Membro do DA** ou
**Administrador**. O formulário exige a confirmação de autorização para criar a
conta.

- A matrícula aceita o formato alfanumérico da UFU (ex.: `12411BSI224`), com ou
  sem separadores; é normalizada para maiúsculas e letras/números.
- A senha inicial é gerada automaticamente (opcionalmente) e deve ser entregue
  por um canal seguro.
- No primeiro acesso, o membro é obrigado a definir uma nova senha antes de
  abrir os painéis.
- O hash da senha é feito pelo **Supabase Auth**; o frontend nunca armazena a
  senha em texto puro.
- Contas recém-criadas entram com `must_change_password = true`.

### Login

O login aceita qualquer um dos identificadores abaixo, sem diferenciar
maiúsculas de minúsculas no usuário e no e-mail:

- Matrícula, com ou sem pontuação (`12411BSI224` ou `12411-BSI-224`)
- Nome de usuário
- E-mail

A Edge Function `login` resolve o identificador para o e-mail cadastrado e
autentica no Supabase Auth. As mensagens de erro são genéricas para não revelar
se uma conta existe.

### Medidas de segurança implementadas

- **Supabase Auth** para hash de senha, sessões, refresh token e política de
  senha (mínimo 10 caracteres, maiúscula, minúscula, número e símbolo).
- **JWT curto (15 minutos)** com renovação automática.
- **Row Level Security (RLS)**: um membro lê apenas o próprio perfil; somente
  administradores leem todos os perfis e o histórico de auditoria. O cliente não
  tem permissão de escrita direta em `profiles`.
- **Edge Functions com service role** para criar/alterar contas, sempre
  verificando o JWT do chamador e se ele é um administrador ativo.
- **Cadastro público controlado**: o signup do Supabase Auth fica desativado
  (`enable_signup = false`); o endpoint público `register` sempre cria
  `aluno`, ignora qualquer papel enviado pelo cliente e limita a 10 cadastros
  por IP por hora.
- **Avisos da gestão** protegidos por RLS: apenas membros/admins ativos podem
  ler, criar, editar e excluir.
- **Rate limiting** com hashes de IP/identificador: 5 falhas por identificador
  em 15 minutos ou 20 por IP, além do rate limit do próprio Auth.
- **Mensagens de erro genéricas** e tentativa fictícia de login para reduzir
  enumeração.
- **Troca de senha com reautenticação** da senha atual
  (`secure_password_change = true`).
- **Redirecionamento seguro** com validação do parâmetro `?next=`, aceitando
  apenas caminhos internos.
- **CORS restrito** por `APP_ORIGINS` nas Edge Functions.
- **Histórico administrativo** em `audit_log`, legível apenas por admins.
- **Cabeçalhos de segurança** em `public/_headers` para hosts compatíveis (CSP,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `X-Frame-Options`).

### Observações de produção

- O plano Free do Supabase **pausa o projeto após ~7 dias de inatividade**.
  Para manter o login disponível, configure um ping periódico ou use um plano
  pago. O projeto atual está em `us-west-2`; para menor latência no Brasil,
  `sa-east-1` é a região recomendada.
- Faça backup/exportação periódica do banco. O plano Free não oferece PITR.
- Atualize `site_url` e `additional_redirect_urls` no `supabase/config.toml`
  para o domínio de produção e rode `supabase config push`.
- Inclua o domínio de produção em `APP_ORIGINS` (secrets das Edge Functions).
- Nunca versione `.env.local`, `.supabase-db-password`,
  `.supabase-access-token` ou a service role key.

---

## 🚀 Deploy e rotas SPA

O roteamento usa a History API. O servidor precisa devolver o `index.html`
para rotas desconhecidas. O projeto inclui:

- `public/_redirects` — fallback para Netlify e Cloudflare Pages;
- `public/_headers` — cabeçalhos de segurança para hosts compatíveis.

Exemplo de fallback no Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

No GitHub Pages, que não oferece rewrites, o acesso direto a `/login`,
`/perfil` e outras rotas pode retornar 404; a navegação interna pela aplicação
continua funcionando. Para um deploy institucional, prefira um host com
rewrite de SPA.

### Vercel

O arquivo `vercel.json` já configura:

- rewrite de SPA para `/index.html`;
- cabeçalhos de segurança (CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options`).

Passos:

1. Importe o repositório na Vercel. O preset **Vite** detecta
   `npm run build` e a saída `dist/`.
2. Em **Settings → Environment Variables**, cadastre:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Depois do primeiro deploy, acrescente o domínio da Vercel ao
   `APP_ORIGINS` das Edge Functions e ao `site_url`/redirect URLs do Supabase:

   ```bash
   npx supabase@latest secrets set \
     "APP_ORIGINS=https://seu-site.vercel.app,http://localhost:5173"
   ```

   Atualize `supabase/config.toml` (`site_url` e
   `additional_redirect_urls`) e rode `npx supabase@latest config push`.

> A CSP em `vercel.json` e em `public/_headers` referencia a URL do projeto
> Supabase. Se o projeto for recriado em outro ref, atualize os dois arquivos.

---

## 🛡️ Skills de segurança

O projeto inclui skills de revisão de segurança em [`.claude/skills/`](.claude/skills/),
baixadas do **Trail of Bits Skills Marketplace**:

- `sharp-edges` — APIs e configurações propensas a erro, com foco em
  autenticação, sessão e criptografia;
- `constant-time-analysis` — análise de vazamentos por tempo;
- `differential-review` — revisão de segurança de diffs;
- `supply-chain-risk-auditor` — auditoria de dependências e cadeia de
  suprimentos.

Consulte [`.claude/skills/ATTRIBUTION.md`](.claude/skills/ATTRIBUTION.md) para
autoria, licença (CC BY-SA 4.0) e escopo dos arquivos incluídos.

---

## 🏛️ Diretório Acadêmico da Computação – Alan Turing (DACOMP UFU)

Universidade Federal de Uberlândia — Campus Santa Mônica, Uberlândia - MG.
