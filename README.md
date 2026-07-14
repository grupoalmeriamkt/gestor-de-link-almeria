# Gestor de Links Rastreáveis — Grupo Almeria

Infraestrutura própria de links curtos e rastreáveis (estilo Bitly), especializada em
campanhas, parceiros, banners, captura de leads e redirecionamento **configurável** para
WhatsApp. O número e a mensagem podem mudar a qualquer momento **sem trocar o link público**,
com versionamento e atribuição histórica corretos.

```
https://go.seudominio.com/r/concierge   →  servidor decide o destino atual
```

## Arquitetura

- **Next.js 15 (App Router) + TypeScript estrito**
- **Supabase** PostgreSQL, Auth e Row Level Security
- **Tailwind CSS + shadcn-style UI** (primitivos próprios, sem dependência de rede)
- **React Hook Form + Zod** (validação cliente e servidor)
- **Recharts** (dashboard)
- **Upstash Redis** (rate limiting opcional — no-op se ausente)
- **Vercel** (deploy)

### Camadas

| Camada | Local |
|---|---|
| Regras puras (testáveis) | `src/lib/services/*` (template, whatsapp, slug, metrics, availability, versioning, user-agent, crypto, click-code) |
| Acesso ao banco / server | `src/lib/server/*` (tracking, events, links, audit, analytics, test-runner, auth) |
| Clientes Supabase | `src/lib/supabase/*` (`client` browser, `server` RLS, `admin` service-role só no servidor) |
| Validação | `src/lib/validation.ts` (Zod) |
| Rotas públicas | `/r/[slug]`, `/l/[slug]`, `/unavailable`, `/api/leads`, `/api/track/event`, `/api/banner/impression/[id]`, `/api/health` |
| Painel | `/admin/*` |
| API admin | `/api/admin/*` |

### Princípios-chave

- O link público **nunca** embute o número do WhatsApp — o servidor resolve em runtime.
- Toda alteração crítica cria uma **nova versão** (`link_versions`); cada clique guarda a versão ativa.
- O clique é registrado **antes** do redirect.
- Testes (`?test=1`) são gravados com `is_test = true` e **excluídos das métricas** por padrão.
- `whatsapp_redirected` = abertura/tentativa de abertura, **não** confirma mensagem enviada.
- IP nunca é salvo em texto puro — apenas `HMAC_SHA256(IP_HASH_SECRET, ip)`.

## Configuração local

```bash
pnpm install
cp .env.example .env.local   # preencha as variáveis
pnpm dev
```

### Variáveis de ambiente

Veja [`.env.example`](./.env.example). Obrigatórias: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SECRET`,
`SESSION_COOKIE_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_REDIRECT_DOMAIN`.
`UPSTASH_*` são opcionais (sem elas o rate limit permite tudo).

## Migrations

Todo o sistema vive num **schema dedicado `links`** (isolado do `public`, que pode hospedar
outro app no mesmo projeto Supabase). As migrations estão em `supabase/migrations/` (`0001`→`0005`),
ou use o consolidado `supabase/migrations/_all_in_one.sql`.

1. **SQL Editor** → cole `_all_in_one.sql` → Run. (ou `0001`→`0005` em ordem / `supabase db push`.)
2. **Exponha o schema no PostgREST**: Dashboard → **Project Settings → API → Exposed schemas**
   → adicione `links` (mantendo `public`, `graphql_public`). **Sem esse passo o app não enxerga as tabelas.**

Tabelas (schema `links`): `profiles, partners, campaigns, placements, tracked_links, link_versions,
sessions, clicks, events, leads, test_runs, conversions, audit_logs, system_settings`.

> Se você já aplicou a versão antiga (schema `public`) por engano: rode `supabase/diagnostico.sql`,
> depois `supabase/rollback_public.sql` e então o `_all_in_one.sql` da versão `links`.

## Primeiro admin

Não há trigger em `auth.users` (para não interferir em outros apps do mesmo projeto). O perfil é
criado pela aplicação **no primeiro login**: crie o usuário no Supabase Auth (Dashboard →
Authentication → Add user), faça login em `/login`, e o **primeiro** a logar vira `admin`. Os
seguintes nascem `operator` (ajuste o `role` em `links.profiles`).

## Fluxo completo (critério de aceite)

1. `/admin/partners` → criar **Parceiro X**
2. `/admin/campaigns` → criar campanha (ligada ao parceiro)
3. `/admin/placements` → criar posicionamento (ligado à campanha)
4. `/admin/links/new` → criar link: slug `concierge`, destino WhatsApp, número `5561999999999`,
   mensagem com variáveis, modo *captura simples* → **Criar**
5. Abrir `https://SEU_DOMINIO/r/concierge` → registra clique → landing pede nome → salva lead →
   monta mensagem → abre WhatsApp
6. Editar o link, trocar o número → cria **v2**; o mesmo `/r/concierge` passa a usar o novo número
7. Editar a mensagem → cria **v3**; novos cliques usam a nova mensagem; cliques antigos seguem
   ligados às versões antigas
8. `?test=1` no link → clique de teste que **não** aparece nas métricas do dashboard

### Alterar número / mensagem
`/admin/links/[id]/edit` → salvar. Qualquer campo versionado gera nova versão + auditoria.

### Testar
`/admin/links/[id]/test` → **Executar teste** roda a simulação (número, template, variáveis,
URL final, versão ativa) sem abrir o WhatsApp e sem contaminar métricas.

## Pixel de impressão (parceiro)

Cada link expõe um pixel na tela de detalhes:

```html
<img src="https://SEU_APP/api/banner/impression/LINK_ID" width="1" height="1" alt="" style="display:none" />
```

A ausência do pixel nunca quebra o funcionamento do link.

## Testes

```bash
pnpm test        # unitários (template, whatsapp, slug, métricas, click-code, availability)
pnpm typecheck   # TS estrito
pnpm build       # build de produção
```

## Deploy (Vercel)

1. `vercel link` e configure as variáveis de ambiente (mesmas do `.env.example`).
2. `vercel --prod`.
3. Aponte o domínio de redirect (ex.: `go.seudominio.com`) para o projeto.
4. Aplique as migrations no Supabase de produção.

## RLS / segurança

- RLS ativo em todas as tabelas. O fluxo público roda no servidor com a **service role**
  (ignora RLS); nenhuma policy para `anon`.
- Staff autenticado lê o painel; `admin`/`operator` escrevem; `analyst` só lê.
- Rate limiting nas rotas públicas; validação Zod no cliente **e** no servidor; sanitização;
  headers de segurança; nenhum dado pessoal em query string.

## Limitações conhecidas

- `wa.me` não confirma envio da mensagem — apenas abertura. Confirmação real exige integração
  futura com WhatsApp Cloud API (eventos `whatsapp_message_received`, etc. já previstos).
- Geolocalização usa headers do Vercel Edge (país/estado/cidade aproximados).
- Exportação CSV e alguns rankings do dashboard são pontos de evolução (base já modelada).

## Decisões técnicas

- Número + template guardados separados; URL do WhatsApp gerada em runtime.
- Sentinela interna na resolução de template para remover variáveis vazias sem quebrar
  pontuação (`src/lib/services/template.ts`).
- Versão ativa via `tracked_links.current_version` + `link_versions.version_number`.
- UI shadcn escrita à mão para não depender de rede no ambiente de build.
