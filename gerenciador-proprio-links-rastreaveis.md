# Gerenciador Próprio de Links Rastreáveis

## Especificação completa para implementação com Claude Code

Este documento é a fonte principal de verdade para o desenvolvimento de um gerenciador próprio de links rastreáveis, semelhante ao Bitly, porém especializado em campanhas, parceiros, banners, captura de leads, atribuição e redirecionamento configurável para WhatsApp.

O sistema deverá permitir que um link seja publicado uma única vez em um site parceiro e continue sob controle total do administrador. O número do WhatsApp, a mensagem, o destino, o formulário, a campanha, o status e as regras poderão ser alterados pelo painel sem que o endereço público precise ser substituído.

Exemplo de link público:

```text
https://go.seudominio.com/concierge
```

O link acima poderá inicialmente redirecionar para um número e, posteriormente, para outro número, mantendo o mesmo slug e o mesmo endereço publicado.

---

# 1. Visão geral

## 1.1 Objetivo de negócio

O objetivo é criar uma infraestrutura própria para:

1. Publicar links curtos e rastreáveis em banners, sites parceiros, QR Codes, campanhas e materiais externos.
2. Medir quantas pessoas clicaram.
3. Identificar a origem configurada do clique.
4. Capturar UTMs, referrer, dispositivo, navegador, localização aproximada e sessão.
5. Capturar dados voluntariamente informados pelo usuário, como nome, telefone, email e interesse.
6. Redirecionar para um número de WhatsApp configurável.
7. Montar uma mensagem de WhatsApp configurável e personalizada.
8. Alterar o número e a mensagem a qualquer momento sem trocar o link divulgado.
9. Testar todo o fluxo sem contaminar as métricas oficiais.
10. Consultar desempenho por parceiro, campanha, banner, link e período.
11. Preservar histórico de versões para auditoria e atribuição correta.
12. Preparar o sistema para integração futura com WhatsApp Cloud API, CRM e conversões.

## 1.2 Princípio central

O link público nunca deverá depender diretamente de um número de WhatsApp ou de uma mensagem fixa.

A URL pública aponta primeiro para o nosso domínio:

```text
https://go.seudominio.com/r/concierge
```

O servidor consulta a configuração atual no banco e decide o que fazer.

A configuração pode ser modificada a qualquer momento:

```text
Número atual: 5561999999999
Mensagem atual: Olá, vim do site Parceiro X e quero falar com o concierge.
```

Depois de uma alteração:

```text
Número novo: 5561888888888
Mensagem nova: Olá, vim pelo parceiro X e quero atendimento personalizado.
```

O link público continua o mesmo:

```text
https://go.seudominio.com/r/concierge
```

## 1.3 Limite técnico do WhatsApp

Com um redirect tradicional para `wa.me`, o sistema consegue medir:

1. Clique no link.
2. Visualização da página intermediária.
3. Início de formulário.
4. Envio do formulário.
5. Redirecionamento para o WhatsApp.

O sistema não consegue confirmar, usando apenas `wa.me`, se a pessoa realmente enviou a mensagem dentro do WhatsApp.

Para confirmar mensagem recebida, início de conversa, resposta do concierge e conversão, será necessária uma integração futura com WhatsApp Cloud API ou provedor equivalente com webhooks.

O painel deve deixar claro que:

```text
whatsapp_redirected
```

significa abertura ou tentativa de abertura do WhatsApp, não confirmação de mensagem enviada.

---

# 2. Stack recomendada

Utilizar a stack atual do projeto quando ela já existir.

Caso o projeto seja novo, utilizar:

```text
Next.js
TypeScript estrito
App Router
Supabase PostgreSQL
Supabase Auth
Supabase Row Level Security
Tailwind CSS
Shadcn UI
React Hook Form
Zod
Recharts
Vercel
Vercel Edge Functions ou Route Handlers
Upstash Redis opcional para rate limiting
```

## 2.1 Regras de arquitetura

1. Não usar `any` sem justificativa técnica documentada.
2. Não expor `SUPABASE_SERVICE_ROLE_KEY` no frontend.
3. Não misturar regra de negócio com componentes visuais.
4. Não duplicar lógica de templates, WhatsApp, tracking ou analytics.
5. Manter tipos compartilhados entre frontend e backend.
6. Validar no cliente para experiência e novamente no servidor para segurança.
7. Centralizar criação de eventos.
8. Centralizar geração de código de clique.
9. Centralizar geração da URL do WhatsApp.
10. Centralizar substituição de variáveis.
11. Registrar logs estruturados.
12. Criar migrations versionadas.
13. Criar testes para regras críticas.

---

# 3. Conceitos do domínio

## 3.1 Partner

Empresa, site ou organização onde a campanha será publicada.

Exemplo:

```text
Site Parceiro X
```

## 3.2 Campaign

Campanha comercial ou institucional.

Exemplo:

```text
Concierge Julho 2026
```

## 3.3 Placement

Posição, banner, página ou área de publicação dentro do parceiro.

Exemplo:

```text
Banner principal da home
```

## 3.4 Tracked Link

Link público rastreável.

Exemplo:

```text
https://go.seudominio.com/r/concierge
```

## 3.5 Link Version

Snapshot da configuração de um link em determinado momento.

Deve registrar, entre outros itens:

1. Número do WhatsApp.
2. Mensagem.
3. Tipo de destino.
4. URL externa.
5. Modo de redirecionamento.
6. Campos do formulário.
7. Status.
8. Datas.
9. Configuração completa em JSON.

## 3.6 Click

Registro de um acesso a um link.

Cada clique possui um identificador interno e um código curto público.

Exemplo:

```text
CK72DA
```

## 3.7 Session

Identificador anônimo first party usado para diferenciar sessões e calcular cliques únicos.

## 3.8 Event

Evento que representa uma etapa da jornada.

## 3.9 Lead

Pessoa que forneceu voluntariamente algum dado no formulário.

## 3.10 Conversion

Resultado comercial registrado manualmente ou por integração futura.

## 3.11 Test Run

Execução de teste que não deve contaminar as métricas oficiais.

---

# 4. Perfis de usuário

## 4.1 Administrador

Pode:

1. Criar e editar usuários.
2. Criar parceiros.
3. Criar campanhas.
4. Criar posicionamentos.
5. Criar links.
6. Alterar número do WhatsApp.
7. Alterar mensagem.
8. Alterar destino.
9. Pausar e reativar links.
10. Consultar analytics.
11. Consultar leads.
12. Exportar dados.
13. Consultar auditoria.
14. Executar testes.
15. Configurar o sistema.

## 4.2 Operador

Pode:

1. Consultar links.
2. Consultar leads.
3. Consultar analytics.
4. Testar links.
5. Alterar status de lead.
6. Adicionar observações.

Não pode alterar configurações críticas, salvo permissão explícita.

## 4.3 Analista

Pode:

1. Consultar analytics.
2. Consultar campanhas.
3. Exportar dados.
4. Visualizar links.

Não pode alterar número, mensagem ou destino.

---

# 5. Escopo funcional

## 5.1 Cadastro e autenticação

O painel deve possuir autenticação.

Requisitos:

1. Login por email e senha.
2. Recuperação de senha.
3. Controle de perfil.
4. Controle de função.
5. Controle de acesso por rota.
6. Sessão segura.
7. Logout.
8. Registro de login e ações sensíveis.

## 5.2 Gestão de parceiros

Campos:

| Campo | Tipo | Obrigatório |
|---|---:|---:|
| id | UUID | Sim |
| name | text | Sim |
| domain | text | Não |
| contact_name | text | Não |
| contact_email | text | Não |
| contact_phone | text | Não |
| status | enum | Sim |
| notes | text | Não |
| created_at | timestamptz | Sim |
| updated_at | timestamptz | Sim |

Ações:

1. Criar.
2. Editar.
3. Arquivar.
4. Reativar.
5. Visualizar campanhas.
6. Visualizar links.
7. Visualizar métricas.
8. Exportar dados.

## 5.3 Gestão de campanhas

Campos:

| Campo | Tipo | Obrigatório |
|---|---:|---:|
| id | UUID | Sim |
| partner_id | UUID | Sim |
| name | text | Sim |
| description | text | Não |
| objective | text | Não |
| budget | numeric | Não |
| status | enum | Sim |
| starts_at | timestamptz | Não |
| ends_at | timestamptz | Não |
| created_at | timestamptz | Sim |
| updated_at | timestamptz | Sim |

Ações:

1. Criar.
2. Editar.
3. Duplicar.
4. Arquivar.
5. Reativar.
6. Visualizar posicionamentos.
7. Visualizar links.
8. Visualizar métricas.

## 5.4 Gestão de posicionamentos

Campos:

| Campo | Tipo | Obrigatório |
|---|---:|---:|
| id | UUID | Sim |
| campaign_id | UUID | Sim |
| name | text | Sim |
| partner_page | text | Não |
| position_name | text | Não |
| description | text | Não |
| dimensions | text | Não |
| reference_url | text | Não |
| status | enum | Sim |
| created_at | timestamptz | Sim |
| updated_at | timestamptz | Sim |

Exemplo:

```text
Campanha: Concierge Julho
Posicionamento: Banner principal da home
Página: https://parceiro.com.br
Dimensão: 1440x480
```

## 5.5 Gestão de links

Cada link deve possuir:

| Campo | Tipo |
|---|---|
| name | text |
| slug | text único |
| description | text |
| partner_id | UUID |
| campaign_id | UUID |
| placement_id | UUID |
| destination_type | enum |
| redirect_mode | enum |
| whatsapp_number | text |
| whatsapp_message_template | text |
| external_url | text |
| capture_enabled | boolean |
| capture_name | boolean |
| capture_phone | boolean |
| capture_email | boolean |
| capture_interest | boolean |
| name_required | boolean |
| phone_required | boolean |
| email_required | boolean |
| interest_required | boolean |
| landing_title | text |
| landing_description | text |
| button_text | text |
| unavailable_title | text |
| unavailable_description | text |
| status | enum |
| starts_at | timestamptz |
| ends_at | timestamptz |
| created_by | UUID |
| created_at | timestamptz |
| updated_at | timestamptz |

Ações:

1. Criar.
2. Editar.
3. Duplicar.
4. Pausar.
5. Reativar.
6. Arquivar.
7. Copiar link.
8. Abrir link.
9. Testar link.
10. Gerar QR Code.
11. Alterar número do WhatsApp.
12. Alterar mensagem.
13. Alterar destino.
14. Consultar histórico.
15. Consultar métricas.
16. Exportar dados.

---

# 6. Tipos de destino

## 6.1 WhatsApp

Redireciona para:

```text
https://wa.me/NUMERO?text=MENSAGEM_CODIFICADA
```

## 6.2 URL externa

Redireciona para uma página configurável.

## 6.3 Landing page interna

Exibe uma página interna antes de qualquer ação.

## 6.4 Página indisponível

Exibida quando o link está:

1. Pausado.
2. Expirado.
3. Arquivado.
4. Fora do período.
5. Inexistente.

---

# 7. Modos de redirecionamento

## 7.1 Direct

Fluxo:

```text
Clique
→ registro
→ montagem da mensagem
→ evento whatsapp_redirected
→ WhatsApp
```

## 7.2 Capture Simple

Fluxo:

```text
Clique
→ registro
→ página intermediária
→ nome
→ lead
→ mensagem personalizada
→ WhatsApp
```

## 7.3 Capture Complete

Fluxo:

```text
Clique
→ registro
→ página intermediária
→ nome, telefone, email e interesse
→ lead
→ mensagem personalizada
→ WhatsApp
```

## 7.4 External Redirect

Fluxo:

```text
Clique
→ registro
→ evento external_redirected
→ URL externa
```

## 7.5 Custom Landing

Fluxo:

```text
Clique
→ registro
→ landing page
→ ação configurada
```

---

# 8. Configuração editável do WhatsApp

Esta é uma funcionalidade obrigatória e crítica.

Cada link deve possuir uma seção chamada:

```text
Configuração do WhatsApp
```

Campos obrigatórios:

| Campo | Descrição |
|---|---|
| Country code | Código do país |
| Area code | DDD |
| Phone number | Número |
| Full normalized number | Número internacional normalizado |
| Message template | Template da mensagem |
| Message preview | Pré visualização |
| Final URL preview | URL final |
| Test button | Teste sem contaminar métricas |

O número deve ser armazenado em formato internacional, sem espaços, parênteses, hífens ou sinais.

Exemplo:

```text
5561999999999
```

Nunca armazenar somente a URL final do WhatsApp.

Armazenar separadamente:

```text
whatsapp_number
whatsapp_message_template
```

A URL final deve ser gerada em tempo de execução.

## 8.1 Alteração do número

Quando o administrador alterar o número:

1. Validar o número.
2. Criar uma nova versão do link.
3. Preservar a versão anterior.
4. Atualizar a configuração ativa.
5. Registrar auditoria.
6. Manter o mesmo slug.
7. Manter o mesmo link público.
8. Garantir que novos cliques usem o novo número.
9. Garantir que cliques antigos continuem ligados à versão antiga.

## 8.2 Alteração da mensagem

Quando o administrador alterar a mensagem:

1. Validar o template.
2. Criar uma nova versão.
3. Preservar o template anterior.
4. Atualizar a configuração ativa.
5. Registrar auditoria.
6. Aplicar a nova mensagem apenas aos novos cliques.
7. Manter a associação histórica dos cliques antigos.

## 8.3 Variáveis disponíveis

```text
{{nome}}
{{telefone}}
{{email}}
{{interesse}}
{{parceiro}}
{{campanha}}
{{banner}}
{{click_id}}
{{data}}
{{origem}}
{{utm_source}}
{{utm_medium}}
{{utm_campaign}}
{{utm_content}}
{{utm_term}}
```

## 8.4 Exemplo de template

```text
Olá, meu nome é {{nome}}. Vim do site {{parceiro}} e quero falar com o concierge. Código: {{click_id}}
```

## 8.5 Exemplo final

```text
Olá, meu nome é Alex. Vim do site Parceiro X e quero falar com o concierge. Código: CK72DA
```

## 8.6 Regras para variáveis vazias

Uma variável sem valor deve ser removida de forma limpa.

Evitar:

```text
Olá, meu nome é . Vim do site .
```

Resultado esperado:

```text
Olá. Vim do site Parceiro X e quero falar com o concierge.
```

Criar uma função centralizada para:

1. Resolver variáveis.
2. Remover espaços duplicados.
3. Corrigir pontuação.
4. Aplicar `encodeURIComponent`.
5. Gerar a URL final.

---

# 9. Fluxo público de clique

## 9.1 Entrada

Rota pública recomendada:

```text
GET /r/[slug]
```

Exemplo:

```text
GET /r/concierge
```

## 9.2 Processamento

Ao receber a requisição:

1. Buscar o link pelo slug.
2. Verificar se existe.
3. Verificar status.
4. Verificar data inicial.
5. Verificar data final.
6. Verificar modo de teste.
7. Buscar a versão ativa.
8. Gerar `click_id`.
9. Gerar `click_code`.
10. Criar ou recuperar sessão.
11. Ler UTMs.
12. Ler referrer.
13. Ler user agent.
14. Classificar dispositivo.
15. Classificar navegador.
16. Classificar sistema operacional.
17. Obter localização aproximada quando disponível.
18. Gerar hash do IP.
19. Detectar bot ou preview.
20. Registrar clique.
21. Registrar evento `link_clicked`.
22. Escolher fluxo de destino.

## 9.3 Redirecionamento direto

Quando `redirect_mode = direct`:

1. Montar contexto.
2. Resolver template.
3. Gerar URL.
4. Registrar `whatsapp_redirected`.
5. Atualizar `redirected_at`.
6. Executar redirect HTTP.

## 9.4 Página intermediária

Quando houver captura:

1. Registrar `landing_viewed`.
2. Renderizar formulário.
3. Enviar dados ao backend.
4. Validar.
5. Criar lead.
6. Registrar `lead_submitted`.
7. Resolver template.
8. Registrar `whatsapp_redirected`.
9. Abrir WhatsApp.

---

# 10. Página intermediária

A página deve ser:

1. Mobile first.
2. Muito rápida.
3. Acessível.
4. Sem dependências pesadas.
5. Com carregamento mínimo.
6. Sem distrações.
7. Com CTA claro.
8. Com identidade configurável.

Campos configuráveis:

| Campo | Configurável | Obrigatório configurável |
|---|---:|---:|
| Nome | Sim | Sim |
| Telefone | Sim | Sim |
| Email | Sim | Sim |
| Interesse | Sim | Sim |
| Consentimento | Sim | Sim |

Conteúdo configurável:

```text
landing_title
landing_description
button_text
success_message
privacy_text
```

Exemplo:

```text
Fale com nosso concierge

Para começarmos, como podemos chamar você?

[ Nome ]

[ Continuar para o WhatsApp ]
```

## 10.1 Eventos da página

Registrar:

```text
landing_viewed
form_started
lead_submitted
whatsapp_redirected
```

O evento `form_started` deve ser disparado apenas na primeira interação real com algum campo.

---

# 11. Rastreamento e atribuição

## 11.1 Dados do clique

Registrar:

| Campo | Descrição |
|---|---|
| click_code | Código público curto |
| tracked_link_id | Link |
| link_version_id | Versão ativa |
| session_id | Sessão |
| referrer | Página anterior |
| utm_source | Origem |
| utm_medium | Meio |
| utm_campaign | Campanha |
| utm_content | Conteúdo |
| utm_term | Termo |
| device_type | Dispositivo |
| browser | Navegador |
| operating_system | Sistema |
| country | País |
| region | Estado |
| city | Cidade |
| ip_hash | Hash |
| user_agent | User agent |
| is_bot | Bot |
| is_test | Teste |
| clicked_at | Data do clique |
| redirected_at | Data do redirect |

## 11.2 Fonte de atribuição

A origem primária deve ser a configuração interna do link:

```text
partner_id
campaign_id
placement_id
```

UTMs e referrer são camadas adicionais.

Não depender apenas de `document.referrer`, pois navegadores, aplicativos e políticas de privacidade podem removê-lo.

## 11.3 Sessão e clique único

Criar cookie first party:

```text
glr_session
```

Requisitos:

1. Valor aleatório.
2. Sem dados pessoais.
3. `HttpOnly` quando possível.
4. `Secure` em produção.
5. `SameSite=Lax`.
6. Expiração configurável.

Definição inicial de clique único:

```text
Uma sessão única por link em uma janela de 24 horas.
```

A regra deve ficar centralizada e documentada.

## 11.4 IP

Nunca salvar IP puro.

Gerar:

```text
HMAC_SHA256(IP_HASH_SECRET, ip)
```

Utilizar o hash apenas para:

1. Controle de abuso.
2. Deduplicação aproximada.
3. Detecção de padrões.
4. Segurança.

## 11.5 Bots e previews

Tentar identificar:

1. Bots.
2. Crawlers.
3. WhatsApp preview.
4. Facebook preview.
5. LinkedIn preview.
6. Slack preview.
7. Telegram preview.
8. Monitoramento automático.

Marcar com:

```text
is_bot = true
```

Não excluir definitivamente. Permitir análise separada.

---

# 12. Eventos

Eventos iniciais:

```text
banner_impression
link_clicked
landing_viewed
form_started
lead_submitted
whatsapp_redirected
external_redirected
conversion_registered
```

Eventos futuros:

```text
whatsapp_message_received
whatsapp_conversation_started
concierge_replied
sale_completed
```

Schema mínimo:

| Campo | Tipo |
|---|---|
| id | UUID |
| event_name | text |
| tracked_link_id | UUID |
| click_id | UUID |
| session_id | UUID |
| metadata | jsonb |
| is_test | boolean |
| created_at | timestamptz |

## 12.1 Serviço central de eventos

Criar um serviço único:

```text
trackEvent()
```

Responsabilidades:

1. Validar nome do evento.
2. Validar payload.
3. Associar link.
4. Associar clique.
5. Associar sessão.
6. Marcar teste.
7. Salvar metadata.
8. Registrar erro sem interromper o redirect quando possível.

---

# 13. Impressão de banner

Clique e impressão são métricas diferentes.

Para calcular CTR real, o parceiro precisa instalar um pixel ou script.

## 13.1 Endpoint

```text
GET /api/banner/impression/[link_id]
```

O endpoint deve:

1. Validar o link.
2. Gerar ou recuperar sessão.
3. Registrar `banner_impression`.
4. Retornar um pixel transparente ou resposta apropriada.
5. Aplicar cache control compatível com rastreamento.
6. Aplicar rate limiting.
7. Tentar detectar bot.

## 13.2 Exemplo de pixel

```html
<img
  src="https://go.seudominio.com/api/banner/impression/LINK_ID"
  width="1"
  height="1"
  alt=""
  style="display:none"
/>
```

## 13.3 Exemplo de script

```html
<script>
  fetch("https://go.seudominio.com/api/banner/impression/LINK_ID", {
    method: "GET",
    mode: "no-cors",
    credentials: "include"
  });
</script>
```

O sistema deve gerar esse snippet automaticamente no painel.

---

# 14. Modo de teste

O modo de teste é obrigatório.

## 14.1 Formas de ativação

Opção simples:

```text
https://go.seudominio.com/r/concierge?test=1
```

Opção recomendada para produção:

```text
https://go.seudominio.com/r/concierge?test_token=TOKEN_SEGURO
```

O token deve:

1. Ser temporário.
2. Estar associado ao link.
3. Ter expiração.
4. Ser revogável.
5. Ser criado pelo painel.

## 14.2 Regras

1. Marcar clique com `is_test = true`.
2. Marcar eventos com `is_test = true`.
3. Marcar lead com metadata de teste.
4. Excluir testes das métricas por padrão.
5. Permitir filtro para incluir testes.
6. Exibir aviso visual no modo de teste.
7. Evitar confusão entre produção e teste.

## 14.3 Tela de teste

A tela deve validar:

| Verificação | Resultado |
|---|---|
| Link existe | Sucesso ou erro |
| Slug válido | Sucesso ou erro |
| Status | Sucesso ou erro |
| Período | Sucesso ou erro |
| Versão ativa | Sucesso ou erro |
| Número válido | Sucesso ou erro |
| Template válido | Sucesso ou erro |
| Variáveis | Sucesso ou erro |
| URL final | Sucesso ou erro |
| Página intermediária | Sucesso ou erro |
| Formulário | Sucesso ou erro |
| Lead | Sucesso ou erro |
| Eventos | Sucesso ou erro |
| Redirect | Sucesso ou erro |
| Mobile | Sucesso ou erro |
| Desktop | Sucesso ou erro |

Ações:

```text
Simular mensagem
Simular URL
Abrir página
Executar teste completo
Copiar resultado
Limpar dados de teste
```

---

# 15. Dashboard

## 15.1 Métricas principais

| Métrica | Definição |
|---|---|
| Impressões | banner_impression |
| Cliques totais | link_clicked |
| Cliques únicos | sessão única por link em 24h |
| Leads | lead_submitted |
| WhatsApp redirects | whatsapp_redirected |
| Redirects externos | external_redirected |
| Conversões | conversion_registered |
| CTR | cliques únicos ÷ impressões |
| Taxa de captura | leads ÷ cliques únicos |
| Taxa de WhatsApp | whatsapp_redirected ÷ cliques únicos |
| Taxa de conversão | conversões ÷ cliques únicos |

## 15.2 Filtros

```text
Período
Parceiro
Campanha
Posicionamento
Link
Dispositivo
Navegador
Sistema operacional
País
Estado
Cidade
UTM source
UTM medium
UTM campaign
Evento
Modo de teste
Bot
```

## 15.3 Visualizações

1. Série temporal de cliques.
2. Série temporal de leads.
3. Série temporal de redirects.
4. Funil.
5. Ranking de parceiros.
6. Ranking de campanhas.
7. Ranking de posicionamentos.
8. Ranking de links.
9. Distribuição por dispositivo.
10. Distribuição por cidade.
11. Distribuição por dia da semana.
12. Distribuição por horário.
13. Origem UTM.
14. Referrer.
15. Comparativo entre campanhas.

## 15.4 Regras

1. Testes excluídos por padrão.
2. Bots excluídos por padrão, com opção para incluir.
3. Todos os cards devem respeitar filtros.
4. Exportação deve respeitar filtros.
5. Datas devem respeitar o timezone configurado.
6. Exibir estado vazio.
7. Exibir erro de carregamento.
8. Exibir última atualização.

---

# 16. Gestão de leads

Campos:

| Campo | Tipo |
|---|---|
| id | UUID |
| click_id | UUID |
| tracked_link_id | UUID |
| name | text |
| phone | text |
| email | text |
| interest | text |
| consent | boolean |
| status | enum |
| notes | text |
| metadata | jsonb |
| created_at | timestamptz |
| updated_at | timestamptz |

Status recomendados:

```text
new
contacted
qualified
converted
lost
invalid
test
```

Ações:

1. Pesquisar.
2. Filtrar.
3. Ordenar.
4. Abrir detalhes.
5. Alterar status.
6. Adicionar observação.
7. Copiar telefone.
8. Abrir WhatsApp.
9. Exportar CSV.
10. Visualizar jornada do clique.
11. Visualizar versão do link.
12. Visualizar UTMs.
13. Visualizar eventos.

---

# 17. Histórico de versões

Sempre criar uma nova versão quando houver alteração em:

1. Número do WhatsApp.
2. Mensagem.
3. Tipo de destino.
4. URL externa.
5. Modo de redirecionamento.
6. Campos de captura.
7. Obrigatoriedade dos campos.
8. Conteúdo da landing page.
9. Status.
10. Datas.
11. Página de indisponibilidade.

## 17.1 Snapshot

Salvar:

```json
{
  "whatsapp_number": "5561999999999",
  "whatsapp_message_template": "Olá, vim do site {{parceiro}}.",
  "destination_type": "whatsapp",
  "redirect_mode": "capture_simple",
  "capture": {
    "name": true,
    "phone": false,
    "email": false,
    "interest": false
  },
  "required": {
    "name": true,
    "phone": false,
    "email": false,
    "interest": false
  },
  "landing": {
    "title": "Fale com nosso concierge",
    "description": "Para começarmos, como podemos chamar você?",
    "button_text": "Continuar para o WhatsApp"
  },
  "status": "active"
}
```

## 17.2 Associação com clique

Cada clique deve guardar:

```text
link_version_id
```

Isso garante histórico confiável.

---

# 18. Auditoria

Criar `audit_logs`.

Campos:

| Campo | Tipo |
|---|---|
| id | UUID |
| user_id | UUID |
| action | text |
| entity_type | text |
| entity_id | UUID |
| field_name | text |
| old_value | jsonb |
| new_value | jsonb |
| ip_hash | text |
| user_agent | text |
| created_at | timestamptz |

Registrar:

1. Criação de link.
2. Alteração de número.
3. Alteração de mensagem.
4. Alteração de destino.
5. Pausa.
6. Reativação.
7. Arquivamento.
8. Alteração de campanha.
9. Alteração de parceiro.
10. Alteração de permissões.
11. Exportações sensíveis.
12. Exclusões.

---

# 19. Banco de dados

## 19.1 Tabelas

```text
profiles
partners
campaigns
placements
tracked_links
link_versions
sessions
clicks
events
leads
test_runs
conversions
audit_logs
system_settings
```

## 19.2 Enums sugeridos

```sql
create type user_role as enum (
  'admin',
  'operator',
  'analyst'
);

create type entity_status as enum (
  'active',
  'paused',
  'archived'
);

create type destination_type as enum (
  'whatsapp',
  'external_url',
  'internal_landing'
);

create type redirect_mode as enum (
  'direct',
  'capture_simple',
  'capture_complete',
  'custom_landing'
);

create type lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
  'invalid',
  'test'
);
```

## 19.3 tracked_links

```sql
create table tracked_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  partner_id uuid references partners(id),
  campaign_id uuid references campaigns(id),
  placement_id uuid references placements(id),
  destination_type destination_type not null,
  redirect_mode redirect_mode not null,
  whatsapp_number text,
  whatsapp_message_template text,
  external_url text,
  capture_enabled boolean not null default false,
  capture_name boolean not null default true,
  capture_phone boolean not null default false,
  capture_email boolean not null default false,
  capture_interest boolean not null default false,
  name_required boolean not null default false,
  phone_required boolean not null default false,
  email_required boolean not null default false,
  interest_required boolean not null default false,
  landing_title text,
  landing_description text,
  button_text text,
  unavailable_title text,
  unavailable_description text,
  status entity_status not null default 'active',
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 19.4 link_versions

```sql
create table link_versions (
  id uuid primary key default gen_random_uuid(),
  tracked_link_id uuid not null references tracked_links(id) on delete cascade,
  version_number integer not null,
  whatsapp_number text,
  whatsapp_message_template text,
  destination_type destination_type,
  redirect_mode redirect_mode,
  external_url text,
  configuration_snapshot jsonb not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (tracked_link_id, version_number)
);
```

## 19.5 sessions

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb
);
```

## 19.6 clicks

```sql
create table clicks (
  id uuid primary key default gen_random_uuid(),
  click_code text not null unique,
  tracked_link_id uuid not null references tracked_links(id),
  link_version_id uuid references link_versions(id),
  session_id uuid references sessions(id),
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  device_type text,
  browser text,
  operating_system text,
  country text,
  region text,
  city text,
  ip_hash text,
  user_agent text,
  is_bot boolean not null default false,
  is_test boolean not null default false,
  clicked_at timestamptz not null default now(),
  redirected_at timestamptz
);
```

## 19.7 events

```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  tracked_link_id uuid references tracked_links(id),
  click_id uuid references clicks(id),
  session_id uuid references sessions(id),
  metadata jsonb,
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);
```

## 19.8 leads

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  click_id uuid references clicks(id),
  tracked_link_id uuid not null references tracked_links(id),
  name text,
  phone text,
  email text,
  interest text,
  consent boolean not null default false,
  status lead_status not null default 'new',
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 19.9 test_runs

```sql
create table test_runs (
  id uuid primary key default gen_random_uuid(),
  tracked_link_id uuid not null references tracked_links(id),
  created_by uuid references profiles(id),
  token_hash text,
  expires_at timestamptz,
  status text not null,
  results jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
```

## 19.10 conversions

```sql
create table conversions (
  id uuid primary key default gen_random_uuid(),
  tracked_link_id uuid references tracked_links(id),
  click_id uuid references clicks(id),
  lead_id uuid references leads(id),
  conversion_type text,
  value numeric,
  currency text default 'BRL',
  metadata jsonb,
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);
```

## 19.11 Índices

Criar índices para:

```text
tracked_links.slug
tracked_links.partner_id
tracked_links.campaign_id
tracked_links.placement_id
tracked_links.status
link_versions.tracked_link_id
clicks.click_code
clicks.tracked_link_id
clicks.link_version_id
clicks.session_id
clicks.clicked_at
clicks.is_test
clicks.is_bot
clicks.utm_source
clicks.utm_campaign
events.event_name
events.tracked_link_id
events.click_id
events.created_at
events.is_test
leads.tracked_link_id
leads.click_id
leads.created_at
leads.status
```

---

# 20. RLS e segurança

## 20.1 Tabelas administrativas

Ativar RLS em:

```text
profiles
partners
campaigns
placements
tracked_links
link_versions
leads
conversions
audit_logs
system_settings
```

## 20.2 Rotas públicas

As rotas públicas não devem permitir consultas genéricas ao banco.

Elas podem apenas:

1. Resolver configuração pública necessária.
2. Criar clique.
3. Criar evento.
4. Criar lead.
5. Executar redirect.

## 20.3 Proteções

1. Rate limiting.
2. Validação Zod.
3. Sanitização.
4. CSRF quando aplicável.
5. Headers de segurança.
6. CORS restrito quando aplicável.
7. IP hash.
8. Proteção contra spam.
9. Limite de tamanho de payload.
10. Logs de erro.
11. Não expor service role.
12. Não expor dados pessoais em URLs.
13. Não colocar telefone capturado em query string.
14. Não colocar email em query string.
15. Não colocar nome em logs sem necessidade.

---

# 21. Rate limiting

Aplicar rate limiting em:

```text
GET /r/[slug]
POST /api/track/click
POST /api/track/event
POST /api/leads
GET /api/banner/impression/[id]
POST /api/admin/links/[id]/test
```

Regras iniciais sugeridas:

| Rota | Limite |
|---|---:|
| Redirect | 60 por minuto por IP hash |
| Lead | 10 por minuto por IP hash |
| Impression | 120 por minuto por IP hash |
| Event | 120 por minuto por sessão |
| Teste admin | 30 por minuto por usuário |

Valores devem ser configuráveis.

---

# 22. Rotas

## 22.1 Públicas

```text
GET /r/[slug]
GET /l/[slug]
POST /api/track/click
POST /api/track/event
POST /api/leads
GET /api/redirect/[slug]
GET /api/banner/impression/[id]
```

## 22.2 Administrativas

```text
/admin
/admin/dashboard
/admin/links
/admin/links/new
/admin/links/[id]
/admin/links/[id]/edit
/admin/links/[id]/test
/admin/partners
/admin/campaigns
/admin/placements
/admin/leads
/admin/analytics
/admin/audit
/admin/settings
```

## 22.3 API administrativa

```text
GET /api/admin/links
POST /api/admin/links
GET /api/admin/links/[id]
PATCH /api/admin/links/[id]
POST /api/admin/links/[id]/duplicate
POST /api/admin/links/[id]/pause
POST /api/admin/links/[id]/activate
POST /api/admin/links/[id]/archive
POST /api/admin/links/[id]/test
GET /api/admin/links/[id]/versions
GET /api/admin/links/[id]/analytics
GET /api/admin/analytics
GET /api/admin/leads
PATCH /api/admin/leads/[id]
GET /api/admin/exports
```

---

# 23. Serviços internos

Criar módulos separados.

## 23.1 linksService

Responsável por:

1. CRUD.
2. Slug.
3. Status.
4. Datas.
5. Duplicação.
6. Versionamento.
7. Snapshot.
8. Validação.

## 23.2 trackingService

Responsável por:

1. Sessão.
2. Clique.
3. UTMs.
4. Referrer.
5. Device.
6. Browser.
7. Sistema operacional.
8. Geolocalização aproximada.
9. IP hash.
10. Bot detection.

## 23.3 eventService

Responsável por:

1. Registro de eventos.
2. Validação.
3. Metadata.
4. Modo de teste.
5. Tratamento de falha.

## 23.4 whatsappService

Responsável por:

1. Normalização do número.
2. Validação.
3. Resolução de template.
4. Limpeza de variáveis vazias.
5. Codificação.
6. Geração da URL.
7. Preview.

## 23.5 leadsService

Responsável por:

1. Validação.
2. Criação.
3. Atualização.
4. Status.
5. Observações.
6. Exportação.

## 23.6 analyticsService

Responsável por:

1. Métricas.
2. Funil.
3. Filtros.
4. Agregações.
5. Clique único.
6. CTR.
7. Taxas.
8. Rankings.
9. Exportação.

## 23.7 auditService

Responsável por:

1. Logs de alteração.
2. Before e after.
3. Usuário.
4. Entidade.
5. Campo.
6. IP hash.

## 23.8 testService

Responsável por:

1. Gerar token.
2. Expiração.
3. Simulação.
4. Execução completa.
5. Resultados.
6. Limpeza de testes.

---

# 24. Interface administrativa

## 24.1 Criação de link

Dividir em etapas:

1. Identificação.
2. Parceiro e campanha.
3. Posicionamento.
4. Destino.
5. WhatsApp.
6. Captura de dados.
7. Rastreamento.
8. Período.
9. Teste.
10. Publicação.

## 24.2 Pré visualização lateral

Exibir em tempo real:

```text
Link público
Status
Número do WhatsApp
Mensagem final
URL final
Campos do formulário
Página intermediária
Parceiro
Campanha
Posicionamento
Período
```

## 24.3 Tela de detalhes do link

Exibir:

1. Link público.
2. Botão copiar.
3. QR Code.
4. Status.
5. Parceiro.
6. Campanha.
7. Posicionamento.
8. Número atual.
9. Mensagem atual.
10. Versão atual.
11. Métricas.
12. Histórico.
13. Teste.
14. Pixel de impressão.
15. Snippet.
16. Últimas alterações.

## 24.4 Estados

Toda tela deve possuir:

```text
loading
empty
error
success
forbidden
expired
paused
archived
not_found
```

---

# 25. Validações

## 25.1 Slug

Regras:

1. Único.
2. Minúsculo.
3. Sem espaços.
4. Caracteres permitidos: letras, números e hífen.
5. Tamanho entre 3 e 80.
6. Lista de slugs reservados.

Exemplos reservados:

```text
admin
api
login
logout
settings
dashboard
r
l
test
health
```

## 25.2 Número do WhatsApp

Regras:

1. Formato internacional.
2. Apenas dígitos na persistência.
3. Código do país obrigatório.
4. DDD obrigatório quando aplicável.
5. Quantidade plausível de dígitos.
6. Preview formatado.
7. Não publicar link WhatsApp sem número válido.

## 25.3 Mensagem

Regras:

1. Obrigatória para destino WhatsApp.
2. Tamanho máximo configurável.
3. Variáveis permitidas.
4. Rejeitar variável desconhecida.
5. Preview obrigatório antes de publicar.
6. Codificação correta.

## 25.4 URL externa

Regras:

1. HTTPS em produção.
2. URL válida.
3. Bloquear esquemas perigosos.
4. Opcionalmente validar domínio permitido.

## 25.5 Datas

Regras:

1. `ends_at` não pode ser anterior a `starts_at`.
2. Link expirado deve mostrar indisponibilidade.
3. Timezone deve ser configurável.

## 25.6 Formulário

Regras:

1. Campo obrigatório precisa estar ativado.
2. Email válido.
3. Telefone normalizado.
4. Nome com limite.
5. Interesse com limite.
6. Consentimento quando necessário.

---

# 26. Performance

Metas iniciais:

| Item | Meta |
|---|---:|
| Redirect sem captura | p95 inferior a 300 ms |
| Página intermediária | LCP inferior a 2,5 s |
| Registro de evento | Não bloquear redirect quando falhar |
| Dashboard | Carregar resumo em até 2 s em volume inicial |

Boas práticas:

1. Índices.
2. Queries agregadas.
3. Cache de configuração de link.
4. Invalidação após edição.
5. Edge quando fizer sentido.
6. Não carregar bundle administrativo em rota pública.
7. Lazy load de gráficos.
8. Paginação.
9. CSV em streaming para volume alto.

---

# 27. Observabilidade

Implementar:

1. Logs estruturados.
2. Correlation ID.
3. Error boundary.
4. Registro de falha de redirect.
5. Registro de falha de evento.
6. Registro de falha de lead.
7. Métricas de latência.
8. Health check.
9. Alertas futuros.

Rota recomendada:

```text
GET /api/health
```

---

# 28. Variáveis de ambiente

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_REDIRECT_DOMAIN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
IP_HASH_SECRET=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

DEFAULT_TIMEZONE=America/Sao_Paulo
DEFAULT_COUNTRY_CODE=55

TEST_TOKEN_SECRET=
SESSION_COOKIE_SECRET=
```

Criar:

```text
.env.example
```

Nunca versionar segredos reais.

---

# 29. Testes

## 29.1 Unitários

Testar:

1. Normalização de número.
2. Validação de número.
3. Validação de slug.
4. Substituição de variáveis.
5. Remoção de variável vazia.
6. Codificação da mensagem.
7. Geração da URL.
8. Geração de click code.
9. IP hash.
10. Cálculo de clique único.
11. Cálculo de CTR.
12. Cálculo de taxa de captura.
13. Cálculo de taxa de WhatsApp.
14. Expiração.
15. Status.

## 29.2 Integração

Testar:

1. Criar parceiro.
2. Criar campanha.
3. Criar posicionamento.
4. Criar link.
5. Criar versão inicial.
6. Registrar clique.
7. Registrar evento.
8. Criar lead.
9. Redirecionar.
10. Alterar número.
11. Criar nova versão.
12. Alterar mensagem.
13. Criar nova versão.
14. Teste não contaminar métrica.
15. Link pausado.
16. Link expirado.
17. URL externa.
18. RLS.

## 29.3 End to end

Fluxo obrigatório:

```text
Criar parceiro
→ criar campanha
→ criar posicionamento
→ criar link
→ configurar número
→ configurar mensagem
→ publicar
→ clicar
→ registrar
→ capturar nome
→ criar lead
→ montar mensagem
→ abrir WhatsApp
→ alterar número
→ usar o mesmo link
→ confirmar novo número
→ alterar mensagem
→ usar o mesmo link
→ confirmar nova mensagem
→ conferir versões
→ executar teste
→ confirmar que métricas oficiais não mudaram
```

---

# 30. Critérios de aceite

O projeto só deve ser considerado concluído quando:

1. O administrador consegue criar um link.
2. O slug é único.
3. O link registra clique.
4. O clique está associado ao parceiro.
5. O clique está associado à campanha.
6. O clique está associado ao posicionamento.
7. UTMs são registradas.
8. Referrer é registrado quando disponível.
9. Dispositivo é identificado.
10. Sessão é criada.
11. IP não é salvo em texto puro.
12. Link direto abre o WhatsApp.
13. Link com captura exibe formulário.
14. Lead é salvo.
15. Mensagem usa variáveis.
16. Número pode ser alterado pelo painel.
17. Mensagem pode ser alterada pelo painel.
18. O link público permanece o mesmo.
19. Novos cliques usam o novo número.
20. Novos cliques usam a nova mensagem.
21. Cliques antigos preservam a versão antiga.
22. Histórico de versões funciona.
23. Auditoria funciona.
24. Modo de teste funciona.
25. Testes não contaminam métricas.
26. Dashboard respeita filtros.
27. Exportação respeita filtros.
28. Link pausado não redireciona.
29. Link expirado não redireciona.
30. QR Code funciona.
31. Pixel de impressão funciona.
32. CTR só é calculado quando houver impressão.
33. O painel diferencia redirect de mensagem enviada.
34. RLS está ativo.
35. Service role não aparece no frontend.
36. README está completo.
37. Migrations estão versionadas.
38. Testes críticos passam.

---

# 31. Sequência de implementação

## Fase 1

1. Analisar projeto atual.
2. Mapear padrões.
3. Criar migrations.
4. Criar tipos.
5. Criar autenticação e permissões.
6. Criar parceiros.
7. Criar campanhas.
8. Criar posicionamentos.
9. Criar links.
10. Criar versionamento.

## Fase 2

1. Criar serviço de tracking.
2. Criar sessão.
3. Criar clique.
4. Criar eventos.
5. Criar redirect.
6. Criar WhatsApp service.
7. Criar página intermediária.
8. Criar leads.

## Fase 3

1. Criar dashboard.
2. Criar filtros.
3. Criar exportações.
4. Criar modo de teste.
5. Criar QR Code.
6. Criar pixel.
7. Criar auditoria.

## Fase 4

1. Testes.
2. Segurança.
3. Performance.
4. Observabilidade.
5. Documentação.
6. Deploy.
7. Configuração de domínio.
8. Validação end to end.

---

# 32. Entregáveis esperados do Claude Code

Ao finalizar, o Claude Code deve apresentar:

1. Resumo do que foi desenvolvido.
2. Arquitetura final.
3. Lista de arquivos criados.
4. Lista de arquivos modificados.
5. Lista de migrations.
6. Lista de rotas.
7. Lista de endpoints.
8. Variáveis de ambiente.
9. Instruções de instalação.
10. Instruções de execução local.
11. Instruções de testes.
12. Instruções de deploy.
13. Instruções de domínio.
14. Instruções de RLS.
15. Instruções de criação do primeiro admin.
16. Instruções para criar primeiro parceiro.
17. Instruções para criar primeira campanha.
18. Instruções para criar primeiro link.
19. Instruções para alterar número.
20. Instruções para alterar mensagem.
21. Instruções para testar.
22. Limitações conhecidas.
23. Decisões técnicas.
24. Pontos futuros.

---

# 33. Funcionalidades futuras

Não implementar no MVP sem necessidade, mas preparar a arquitetura para:

1. WhatsApp Cloud API.
2. Webhooks de mensagem.
3. Distribuição entre atendentes.
4. Inbox interno.
5. CRM.
6. Conversão automática.
7. Integração com Meta Ads.
8. Integração com Google Ads.
9. Integração com GA4.
10. Webhooks outbound.
11. Domínios customizados.
12. A/B test de número.
13. A/B test de mensagem.
14. A/B test de landing page.
15. Regras por horário.
16. Regras por geolocalização.
17. Rotação de número.
18. Limite de capacidade por atendente.
19. Templates por idioma.
20. API pública.
21. White label.
22. Multi tenant.
23. Consentimento avançado.
24. Retenção configurável.
25. Exclusão ou anonimização de dados.

---

# 34. Decisões importantes

## 34.1 O número e a mensagem são configurações, não parte do link

O endereço público não deve conter o telefone definitivo nem depender dele.

## 34.2 Cada alteração crítica cria uma versão

Sem versionamento, a análise histórica ficaria incorreta.

## 34.3 O clique é registrado antes do redirect

Caso contrário, parte dos acessos pode ser perdida.

## 34.4 Testes são armazenados separadamente

Isso evita distorção dos indicadores.

## 34.5 Origem interna é mais confiável que referrer

Parceiro, campanha e posicionamento devem ser definidos na criação do link.

## 34.6 Abertura do WhatsApp não é mensagem enviada

O painel deve comunicar essa distinção.

## 34.7 Dados pessoais são capturados apenas com ação do usuário

O sistema não deve afirmar que consegue descobrir nome ou telefone apenas pelo clique.

---

# 35. Instrução final para o Claude Code

Antes de escrever código:

1. Leia este documento por completo.
2. Analise o repositório.
3. Identifique o que já existe.
4. Preserve convenções adequadas.
5. Proponha um plano objetivo de implementação.
6. Não recrie infraestrutura existente sem necessidade.
7. Não altere módulos não relacionados.
8. Implemente em etapas.
9. Execute migrations.
10. Execute testes.
11. Valide o fluxo completo.
12. Documente decisões.
13. Não declare conclusão antes de cumprir os critérios de aceite.

O requisito mais importante é:

```text
O administrador deve conseguir alterar o número do WhatsApp e a mensagem pelo painel, mantendo o mesmo link público, com versionamento e rastreamento histórico corretos.
```
