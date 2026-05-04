# Local Lead Finder

Ferramenta interna para prospecção local usando dados públicos do OpenStreetMap. O app ajuda a encontrar empresas locais, priorizar oportunidades, validar presença digital, gerar mensagens de abordagem e organizar o funil até proposta.

> Uso pessoal/interno. Não faz scraping do Google Maps e não automatiza contato em massa.

## Visão geral

Local Lead Finder funciona como uma pequena máquina de prospecção local:

- busca empresas por país, cidade/mercado, raio e categoria;
- consulta geocodificação via Nominatim e empresas via Overpass/OpenStreetMap;
- normaliza dados, remove duplicados e salva leads em SQLite local;
- calcula score de oportunidade de 0 a 100;
- explica motivos positivos e negativos do score;
- gera diagnóstico automático do lead;
- gera mensagens de abordagem por nicho;
- permite validação manual rápida;
- analisa site existente de forma simples;
- gera proposta comercial copiável;
- organiza leads em mini-CRM e campanhas;
- exporta CSV com campos comerciais úteis.

## Funcionalidades

### Busca de leads

- Seleção de país e cidade/mercado por preset, sem precisar digitar local livremente.
- Controle de raio: 1 km, 3 km, 5 km ou 10 km.
- Filtros por categoria, sem site, com telefone, ignorar franquias e priorizar alto ticket.
- Resultados com lista, cards, mapa e exportação.

### Score de oportunidade

O score final vai de 0 a 100 e considera:

- presença digital;
- facilidade de contato;
- potencial comercial;
- qualidade dos dados;
- prioridade de abordagem.

Labels:

| Faixa | Label |
| --- | --- |
| 80-100 | Ótimo lead |
| 60-79 | Bom lead |
| 40-59 | Verificar manualmente |
| 0-39 | Baixo potencial |

Critérios principais:

| Critério | Pontos |
| --- | ---: |
| Não possui site cadastrado | +30 |
| Telefone público disponível | +20 |
| Nicho de alto ticket | +15 |
| Endereço completo ou claro | +10 |
| Parece negócio local | +10 |
| Nome comercial claro | +10 |
| Possui algum canal de contato | +10 |
| Possui site cadastrado | -30 |
| Parece franquia ou rede grande | -25 |
| Dados muito incompletos | -20 |
| Categoria de menor potencial | -15 |

Cada lead mostra:

- score total;
- label;
- explicação automática;
- motivos positivos;
- motivos negativos.

### Validação manual rápida

Cada card de lead inclui ações para:

- buscar no Google;
- buscar no Instagram;
- buscar no Facebook;
- abrir WhatsApp quando houver telefone;
- marcar como `tem site`;
- marcar como `site ruim`;
- marcar como `sem site confirmado`;
- marcar como `bom lead`;
- descartar.

Essas ações atualizam o lead no banco.

Campos de validação:

- `hasVerifiedWebsite`
- `websiteStatus`
- `instagramUrl`
- `facebookUrl`
- `validationStatus`
- `lastCheckedAt`

### Mini-CRM

Status disponíveis:

- Novo
- Verificar
- Verificado
- Contato enviado
- Respondeu
- Reunião marcada
- Proposta enviada
- Fechado
- Perdido
- Descartado

Campos comerciais:

- `firstContactAt`
- `lastContactAt`
- `nextActionAt`
- `estimatedValue`
- `offerType`
- `contactChannel`
- `contactHistory`

Canais:

- WhatsApp
- Instagram
- Ligação
- E-mail
- Presencial

A tela `/kanban` permite mover leads entre colunas por drag and drop ou seletor de status.

### Mensagens por nicho

O app gera mensagens diferentes por categoria:

- clínica médica;
- clínica odontológica;
- estética;
- salão de beleza;
- restaurante;
- oficina mecânica;
- pet shop;
- academia;
- loja local;
- escritório de advocacia;
- genérico.

Cada lead tem botões para copiar:

- mensagem curta;
- mensagem profissional;
- mensagem informal;
- mensagem personalizada.

### Diagnóstico do lead

Cada lead mostra uma seção `Diagnóstico do lead` com:

- problema provável;
- oportunidade;
- solução sugerida;
- oferta recomendada;
- nível de prioridade.

O diagnóstico é baseado em regras locais. Não usa IA externa.

### Análise de site

Quando o lead tem site, o botão `Analisar site` faz uma leitura simples da página principal via `fetch`.

A análise verifica sinais como:

- site carregou corretamente;
- link ou botão de WhatsApp;
- CTA claro;
- seção de serviços/produtos;
- formulário de contato;
- meta viewport;
- título;
- descrição;
- sinais de site antigo ou incompleto.

Resultado:

| Faixa | Label |
| --- | --- |
| 0-39 | Site ruim |
| 40-69 | Site mediano |
| 70-100 | Site bom |

Não há scraping agressivo. É uma checagem simples da página principal.

### Propostas

Cada lead pode gerar uma proposta copiável com:

- nome da empresa;
- problema identificado;
- solução sugerida;
- itens inclusos;
- prazo sugerido;
- faixa de valor sugerida;
- mensagem final.

Faixas usadas:

- landing page simples: R$ 500 a R$ 900;
- site institucional: R$ 900 a R$ 1.800;
- site + automação simples: R$ 1.500 a R$ 3.000;
- pacote completo: R$ 3.000+.

### Campanhas

Rotas:

- `/campaigns`
- `/campaigns/[id]`

Campanhas agrupam leads por objetivo comercial.

Cada campanha possui:

- nome;
- cidade;
- nicho;
- objetivo;
- oferta principal;
- leads vinculados;
- métricas.

Métricas:

- total de leads;
- leads verificados;
- contatos enviados;
- respostas;
- reuniões;
- propostas enviadas;
- fechamentos.

### Exportação CSV

O CSV inclui:

- nome;
- categoria;
- cidade;
- endereço;
- telefone;
- site;
- score;
- label do score;
- status;
- diagnóstico resumido;
- oferta recomendada;
- canal de contato;
- último contato;
- próxima ação;
- observações.

Escopos disponíveis:

- todos os leads;
- apenas ótimos leads;
- apenas leads sem site;
- apenas leads verificados;
- apenas leads de uma campanha.

## Rotas principais

| Rota | Uso |
| --- | --- |
| `/` | Dashboard com métricas, gráficos simples e exportações |
| `/search` | Buscar leads por país, cidade, raio e categoria |
| `/leads` | Lista de leads salvos com filtros e ações |
| `/map` | Mapa dos leads salvos |
| `/kanban` | Mini-CRM em colunas |
| `/campaigns` | Lista e criação de campanhas |
| `/campaigns/[id]` | Detalhe da campanha e leads vinculados |

## Stack

- [Next.js 15](https://nextjs.org/) com App Router
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [SQLite](https://github.com/WiseLibs/better-sqlite3) via `better-sqlite3`
- [Leaflet](https://leafletjs.com/) para mapa
- [TanStack Table](https://tanstack.com/table) para tabela
- [Lucide React](https://lucide.dev/) para ícones
- APIs públicas: [Nominatim](https://nominatim.org/) e [Overpass](https://overpass-api.de/)

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse:

```text
http://localhost:3000
```

O comando `npm run dev` precisa ficar rodando enquanto você usa o app.

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run start      # servidor de produção após build
npm run lint       # ESLint
npm run typecheck  # TypeScript sem emitir arquivos
```

## Banco de dados

O banco local fica em:

```text
local-lead-finder.sqlite
```

As migrações são aplicadas automaticamente na inicialização do app. O SQLite usa WAL, então arquivos `local-lead-finder.sqlite-wal` e `local-lead-finder.sqlite-shm` podem aparecer durante uso local.

## Estrutura

```text
src/
├── app/
│   ├── api/              # APIs internas
│   ├── campaigns/        # páginas de campanhas
│   ├── kanban/           # mini-CRM
│   ├── leads/            # leads salvos
│   ├── map/              # mapa
│   └── search/           # busca
├── components/           # UI reutilizável
├── lib/                  # regras de negócio
│   ├── csv.ts
│   ├── db.ts
│   ├── diagnosis.ts
│   ├── outreach.ts
│   ├── proposal.ts
│   ├── score.ts
│   └── website-analysis.ts
└── types/                # tipos compartilhados
```

## Categorias suportadas

Clínicas, dentistas, restaurantes, cafés, salões de beleza, estéticas, pet shops, oficinas, lojas de móveis, academias e escritórios locais.

## Limites e cuidados

- Use com moderação para respeitar limites de Nominatim e Overpass.
- Não usa scraping do Google Maps.
- Não automatiza disparo de mensagens.
- A análise de site é simples e pode falhar em páginas bloqueadas por CORS, bot protection ou timeout.
- O score é uma heurística comercial. Ele ajuda a priorizar, mas validação manual ainda é necessária.

## Licença

Uso interno/pessoal.
