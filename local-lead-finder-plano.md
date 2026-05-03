# Local Lead Finder — Plano de Construção

## Visão geral

Criar uma aplicação web para uso próprio que encontre empresas locais com sinais de presença digital fraca, principalmente empresas sem site cadastrado, com poucas informações públicas ou com contato pouco estruturado.

O objetivo é gerar uma lista priorizada de possíveis leads para venda de:

- Site institucional
- Landing page
- Automação de WhatsApp
- Chatbot de atendimento
- Sistema simples de agendamento
- Melhoria de presença digital
- Captação e resposta de reviews

A ferramenta deve ser pensada como um sistema interno de prospecção local, não como um scraper de Google Maps.

A fonte principal de dados deve ser o OpenStreetMap via Overpass API. O Google Maps pode ser usado apenas como validação manual ou, no futuro, via API oficial, se necessário.

---

# 1. Nome do projeto

Sugestões de nome:

- Local Lead Finder
- Local Prospect Finder
- Mapa de Leads
- LeadRadar Local
- Prospecta Local
- Radar Local
- Business Gap Finder

Nome recomendado para o MVP:

**Local Lead Finder**

---

# 2. Objetivo principal

A aplicação deve responder à seguinte pergunta:

> Quais empresas em uma determinada cidade, bairro ou área provavelmente não têm site, têm poucas informações públicas e podem ser boas oportunidades para vender soluções digitais?

O foco não é apenas listar empresas, mas ajudar a priorizar quais valem mais a pena abordar.

---

# 3. Escopo do MVP

A primeira versão deve ter:

```txt
Entrada:
- Cidade, bairro ou coordenadas
- Raio de busca
- Categorias de negócios
- Filtros: sem site, com telefone, ignorar franquias, priorizar nichos de ticket alto

Processamento:
- Buscar empresas via OpenStreetMap/Overpass API
- Normalizar dados
- Remover duplicados
- Calcular score de oportunidade

Saída:
- Tabela de leads
- Mapa com pins
- Exportação CSV
- Status do lead
- Observações manuais
- Mensagem de abordagem copiável
```

---

# 4. Stack recomendada

## Frontend

- Next.js com App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Leaflet ou MapLibre para mapa
- TanStack Table para tabela de leads

## Backend

Pode ser feito de duas formas:

### Opção simples

- API Routes do próprio Next.js
- SQLite como banco local

### Opção mais escalável

- FastAPI ou backend separado
- Supabase/Postgres

## Recomendação para o MVP

Começar com:

```txt
Next.js + TypeScript + Tailwind + shadcn/ui + SQLite + Overpass API
```

Depois, se o projeto ficar útil, migrar para Supabase/Postgres.

---

# 5. Fontes de dados

## Fonte principal

- OpenStreetMap via Overpass API

## Geocodificação

- Nominatim para converter cidade/bairro em latitude e longitude

## Validação manual

- Google Maps
- Google Search
- Instagram
- Facebook
- Site oficial, se existir

## Importante

Não fazer scraping do Google Maps.

A aplicação deve ser feita para uso próprio e volume moderado. Evitar buscas agressivas ou automações que violem termos de plataformas.

---

# 6. Fluxo principal da aplicação

```txt
1. Usuário acessa a tela de busca
2. Informa cidade, bairro ou coordenadas
3. Escolhe raio de busca
4. Escolhe categorias de negócios
5. Aplica filtros desejados
6. Sistema usa Nominatim para pegar coordenadas
7. Sistema converte coordenadas + raio em bounding box
8. Sistema consulta Overpass API
9. Sistema normaliza os resultados
10. Sistema calcula score de cada lead
11. Sistema remove duplicados
12. Sistema exibe tabela e mapa
13. Usuário salva leads interessantes
14. Usuário marca status, adiciona notas e copia mensagem de abordagem
```

---

# 7. Páginas da aplicação

## `/`

Dashboard geral.

Deve mostrar:

- Total de leads salvos
- Leads sem site
- Leads com telefone
- Leads ótimos
- Leads contatados
- Leads fechados
- Últimas buscas realizadas
- Nichos com mais oportunidades

---

## `/search`

Tela de busca por área.

Campos:

```txt
Cidade ou bairro:
Exemplo: Patos PB, Natal RN, João Pessoa PB

Raio:
1 km, 3 km, 5 km, 10 km

Categorias:
[ ] Clínicas
[ ] Dentistas
[ ] Restaurantes
[ ] Cafés
[ ] Salões de beleza
[ ] Estéticas
[ ] Pet shops
[ ] Oficinas
[ ] Lojas de móveis
[ ] Academias
[ ] Escritórios locais

Filtros:
[ ] Apenas empresas sem site
[ ] Apenas empresas com telefone
[ ] Ignorar possíveis franquias
[ ] Priorizar nichos de ticket alto
```

A tela deve ter:

- Botão de buscar
- Loading state
- Empty state
- Tratamento de erro
- Aviso sobre uso moderado da API

---

## `/leads`

Tabela de leads.

Colunas:

```txt
Score
Classificação
Nome
Categoria
Telefone
Site
Endereço
Cidade
Status
Observações
Fonte
Ações
```

Ações por lead:

```txt
- Salvar lead
- Editar status
- Adicionar observação
- Copiar mensagem de abordagem
- Abrir busca no Google
- Abrir busca no Instagram
- Abrir localização no mapa
- Exportar CSV
```

---

## `/map`

Visualização dos leads no mapa.

Funcionalidades:

- Mostrar pins dos leads encontrados
- Cor dos pins baseada no score
- Popup com informações rápidas
- Botão para abrir detalhes do lead

Cores sugeridas:

```txt
Verde: ótimo lead
Amarelo: bom lead
Cinza: verificar manualmente
Vermelho: baixo potencial ou descartado
```

---

## `/kanban`

Mini-CRM para acompanhar os contatos.

Colunas:

```txt
Novo
Verificar
Contatado
Respondeu
Reunião
Proposta enviada
Fechado
Descartado
```

Deve permitir arrastar leads entre colunas ou alterar status manualmente.

---

# 8. Modelo de dados

Criar tabela `Lead`.

Campos:

```txt
id
name
category
phone
website
address
city
lat
lng
score
scoreLabel
status
notes
source
rawTags
createdAt
updatedAt
```

## Descrição dos campos

### `id`

Identificador único.

### `name`

Nome da empresa.

### `category`

Categoria legível, derivada das tags do OpenStreetMap.

### `phone`

Telefone principal, vindo de `phone` ou `contact:phone`.

### `website`

Site principal, vindo de `website` ou `contact:website`.

### `address`

Endereço montado a partir das tags disponíveis.

### `city`

Cidade identificada.

### `lat` e `lng`

Coordenadas do lead.

### `score`

Pontuação de oportunidade entre 0 e 100.

### `scoreLabel`

Classificação textual:

```txt
Ótimo lead
Bom lead
Verificar manualmente
Baixo potencial
```

### `status`

Status dentro do funil.

### `notes`

Observações manuais.

### `source`

Fonte dos dados. Inicialmente: `openstreetmap`.

### `rawTags`

JSON com as tags originais do OpenStreetMap.

---

# 9. Categorias iniciais

Começar com nichos que têm potencial de venda maior.

## Nichos recomendados

```txt
1. Clínicas médicas pequenas
2. Clínicas odontológicas
3. Estéticas
4. Salões de beleza premium
5. Oficinas mecânicas
6. Pet shops
7. Restaurantes locais
8. Academias pequenas
9. Lojas de móveis planejados
10. Escritórios de advocacia pequenos
```

## Raciocínio

Os melhores leads geralmente são negócios que:

- Têm ticket médio maior
- Dependem de agendamento ou atendimento
- Precisam passar confiança
- Dependem de indicação local
- Têm potencial de captar clientes pela internet
- Podem se beneficiar de automação ou site simples

Exemplos:

```txt
Clínica sem site + WhatsApp desorganizado = oportunidade forte.

Restaurante local sem site = oportunidade média.

Loja muito pequena sem telefone = oportunidade fraca.
```

---

# 10. Tags do OpenStreetMap a consultar

Buscar e normalizar as seguintes tags:

```txt
name
phone
contact:phone
website
contact:website
addr:street
addr:housenumber
addr:city
addr:postcode
addr:neighbourhood
amenity
shop
office
healthcare
brand
operator
opening_hours
```

---

# 11. Query Overpass base

Exemplo de query para buscar empresas dentro de uma bounding box:

```txt
[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|fast_food|clinic|dentist|doctors"](SOUTH,WEST,NORTH,EAST);
  way["amenity"~"restaurant|cafe|fast_food|clinic|dentist|doctors"](SOUTH,WEST,NORTH,EAST);
  relation["amenity"~"restaurant|cafe|fast_food|clinic|dentist|doctors"](SOUTH,WEST,NORTH,EAST);

  node["shop"~"beauty|hairdresser|car_repair|clothes|furniture|pet"](SOUTH,WEST,NORTH,EAST);
  way["shop"~"beauty|hairdresser|car_repair|clothes|furniture|pet"](SOUTH,WEST,NORTH,EAST);
  relation["shop"~"beauty|hairdresser|car_repair|clothes|furniture|pet"](SOUTH,WEST,NORTH,EAST);

  node["office"~"lawyer|company|estate_agent"](SOUTH,WEST,NORTH,EAST);
  way["office"~"lawyer|company|estate_agent"](SOUTH,WEST,NORTH,EAST);
  relation["office"~"lawyer|company|estate_agent"](SOUTH,WEST,NORTH,EAST);

  node["healthcare"](SOUTH,WEST,NORTH,EAST);
  way["healthcare"](SOUTH,WEST,NORTH,EAST);
  relation["healthcare"](SOUTH,WEST,NORTH,EAST);
);
out center tags;
```

Substituir:

```txt
SOUTH = latitude mínima
WEST = longitude mínima
NORTH = latitude máxima
EAST = longitude máxima
```

---

# 12. Normalização dos dados

Criar funções para:

## Nome

Usar `tags.name`.

Se não existir nome, descartar ou marcar como dado incompleto.

## Telefone

Prioridade:

```txt
1. contact:phone
2. phone
```

## Site

Prioridade:

```txt
1. contact:website
2. website
```

## Categoria

Gerar categoria legível a partir de:

```txt
amenity
shop
office
healthcare
```

Exemplos:

```txt
amenity=dentist => Dentista
amenity=restaurant => Restaurante
shop=hairdresser => Salão de beleza
shop=car_repair => Oficina
healthcare=clinic => Clínica
```

## Endereço

Montar usando:

```txt
addr:street
addr:housenumber
addr:neighbourhood
addr:city
addr:postcode
```

## Coordenadas

Para `node`, usar `lat` e `lon`.

Para `way` e `relation`, usar `center.lat` e `center.lon`.

---

# 13. Remoção de duplicados

Remover duplicados usando uma combinação de:

```txt
nome normalizado + coordenada aproximada
```

Normalização do nome:

- lowercase
- remover acentos
- remover pontuação
- remover espaços extras

Coordenada aproximada:

- arredondar latitude e longitude para 4 ou 5 casas decimais

---

# 14. Score do lead

Criar uma função `calculateLeadScore(lead)` que retorna pontuação de 0 a 100 e os motivos da pontuação.

## Regras positivas

```txt
+35 pontos: não tem site
+20 pontos: tem telefone
+15 pontos: nicho de ticket alto
+10 pontos: tem endereço claro
+10 pontos: parece negócio local
+10 pontos: tem nome comercial claro
```

## Regras negativas

```txt
-30 pontos: já tem site
-25 pontos: parece franquia ou grande rede
-20 pontos: dados muito incompletos
-15 pontos: categoria pouco interessante
```

## Classificação

```txt
80 a 100: Ótimo lead
60 a 79: Bom lead
40 a 59: Verificar manualmente
0 a 39: Baixo potencial
```

## Motivos do score

Além da pontuação, a função deve retornar uma lista de motivos.

Exemplo:

```txt
Score: 87/100
Classificação: Ótimo lead
Motivos:
- Não tem site cadastrado
- Tem telefone público
- Nicho de ticket alto
- Endereço parece completo
- Parece negócio local
```

Isso é importante porque ajuda a decidir rápido se vale abordar a empresa.

---

# 15. Identificação de franquias ou grandes redes

Criar uma heurística simples para reduzir score de possíveis franquias.

## Sinais de franquia

- Campo `brand` preenchido
- Campo `operator` preenchido com rede conhecida
- Nome contém marcas muito conhecidas
- Muitas unidades com nome igual na mesma cidade

## Lista inicial de termos para possível franquia

```txt
McDonald's
Burger King
Subway
Cacau Show
O Boticário
Drogasil
Pague Menos
Americanas
Magazine Luiza
Casas Bahia
Renner
Riachuelo
```

A lista pode ser expandida depois.

---

# 16. Status do lead

Status possíveis:

```txt
Novo
Verificar
Contatado
Respondeu
Reunião
Proposta enviada
Fechado
Descartado
```

O status inicial deve ser `Novo`.

---

# 17. Mensagem de abordagem

Criar uma função para gerar uma mensagem copiável.

Modelo base:

```txt
Olá, tudo bem? Vi que a [EMPRESA] aparece nas buscas locais, mas não encontrei um site oficial com informações claras sobre os serviços.

Eu trabalho criando páginas e automações simples para negócios locais melhorarem o atendimento e a captação de clientes.

Posso te mostrar uma ideia rápida de como isso ficaria para a sua empresa?
```

## Versão mais curta

```txt
Olá, tudo bem? Vi a [EMPRESA] nas buscas locais e percebi que não encontrei um site oficial com informações claras.

Trabalho criando páginas simples e automações para negócios locais. Posso te mostrar uma ideia rápida de como ficaria para vocês?
```

## Versão para WhatsApp

```txt
Olá! Tudo bem?

Vi a [EMPRESA] nas buscas locais e percebi que talvez vocês ainda não tenham um site oficial com informações claras dos serviços.

Eu trabalho criando sites simples, bonitos e automações para WhatsApp para negócios locais.

Posso te mandar uma ideia rápida de como isso poderia ficar para vocês?
```

A aplicação deve ter botão:

```txt
Copiar mensagem
```

---

# 18. Ações úteis por lead

Cada lead deve ter ações rápidas:

```txt
- Copiar mensagem de abordagem
- Abrir busca no Google
- Abrir busca no Instagram
- Abrir localização no mapa
- Marcar como contatado
- Marcar como descartado
- Adicionar observação
- Editar telefone/site manualmente
```

## Links de busca

### Google

Gerar URL com:

```txt
https://www.google.com/search?q=NOME+EMPRESA+CIDADE
```

### Instagram

Gerar URL com:

```txt
https://www.instagram.com/explore/search/keyword/?q=NOME%20EMPRESA
```

Ou abrir busca simples no Google:

```txt
NOME EMPRESA CIDADE Instagram
```

---

# 19. Exportação CSV

Criar botão para exportar leads.

Colunas do CSV:

```txt
name
category
phone
website
address
city
lat
lng
score
scoreLabel
status
notes
source
createdAt
```

---

# 20. Dashboard

A página inicial deve mostrar cards de métricas:

```txt
Total de leads
Leads sem site
Leads com telefone
Ótimos leads
Leads contatados
Leads fechados
Taxa de resposta
```

Também pode mostrar:

```txt
Top categorias com mais oportunidades
Últimos leads adicionados
Últimas buscas feitas
Bairros com mais leads sem site
```

---

# 21. Design e interface

A interface deve ser moderna, limpa e agradável.

## Direção visual

- Fundo claro ou dark mode opcional
- Cards com bordas arredondadas
- Soft shadows
- Boa hierarquia visual
- Score com destaque
- Badges coloridas para status
- Layout responsivo
- Mapa visualmente limpo
- Tabela organizada e fácil de filtrar

## Componentes úteis

- Cards de métricas
- Badge de score
- Badge de status
- Tabela filtrável
- Modal de detalhes do lead
- Sheet lateral para editar lead
- Toast para ação copiada/salva
- Skeleton loading
- Empty state bonito

---

# 22. Ideias que podem deixar o projeto mais bacana

## 22.1 Score visual

Exemplo de card:

```txt
🔥 87/100 — Ótima oportunidade
Clínica São Lucas
Motivo: sem site, tem telefone, nicho de ticket alto
```

---

## 22.2 Explicação automática do motivo

Não mostrar só o score. Mostrar os motivos:

```txt
Motivos:
- Não encontrei site cadastrado
- Possui telefone público
- Categoria com alto potencial comercial
- Endereço parece completo
```

---

## 22.3 Mini diagnóstico do lead

Para cada lead, gerar um diagnóstico simples:

```txt
Lead: Clínica Odonto X
Problema provável: sem site institucional e sem página clara de serviços.
Oferta sugerida: landing page + WhatsApp com triagem + captação de avaliações.
```

---

## 22.4 Modo garimpo por bairro

Permitir comparar bairros.

Exemplo:

```txt
Centro de Patos
Manaíra
Ponta Negra
Tirol
Lagoa Nova
```

A aplicação poderia mostrar:

```txt
Bairro com mais leads ótimos
Categoria mais promissora por bairro
Quantidade de empresas sem site por região
```

---

## 22.5 Funil de prospecção

Criar uma visão kanban:

```txt
Novos → Verificar → Contatados → Responderam → Reunião → Fechados → Descartados
```

Isso transforma a ferramenta em um mini-CRM.

---

## 22.6 Botão de proposta rápida

Depois de selecionar um lead, a ferramenta pode gerar uma sugestão de oferta:

```txt
Empresa: Clínica Exemplo
Problema: não tem site oficial cadastrado
Oferta sugerida: landing page institucional + botão de WhatsApp + seção de serviços + formulário de contato
Mensagem recomendada: abordagem curta por WhatsApp
```

---

## 22.7 Exportação para Google Sheets

No MVP, CSV é suficiente.

No futuro, integrar com Google Sheets para mandar os leads direto para uma planilha.

---

## 22.8 Enriquecimento manual

Permitir que você edite manualmente:

```txt
Telefone
WhatsApp
Instagram
Site
Observações
Status
Valor potencial
```

---

# 23. Cuidados técnicos

## Overpass API

- Evitar buscas muito grandes
- Usar timeout razoável
- Ter tratamento de erro
- Mostrar aviso se a consulta for pesada
- Cachear resultados quando possível

## Nominatim

- Usar de forma moderada
- Cachear geocodificações
- Tratar erro quando cidade/bairro não for encontrado

## Dados incompletos

OpenStreetMap pode não ter todos os dados.

A ferramenta deve tratar isso como sinal de oportunidade, mas não como verdade absoluta.

Exemplo:

```txt
Se não tem site no OSM, isso não prova que a empresa não tem site.
Significa apenas que não há site cadastrado na fonte usada.
```

Por isso, a aplicação deve usar termos como:

```txt
Possivelmente sem site
Site não encontrado na fonte
Verificar manualmente
```

---

# 24. Ordem recomendada de desenvolvimento

## Etapa 1 — Base do projeto

- Criar projeto Next.js
- Configurar TypeScript
- Configurar Tailwind
- Configurar shadcn/ui
- Criar layout principal
- Criar navegação

## Etapa 2 — Tela de busca

- Criar formulário de busca
- Campos de cidade/bairro
- Campo de raio
- Seleção de categorias
- Filtros básicos

## Etapa 3 — Integração com Nominatim

- Criar função de geocodificação
- Transformar cidade/bairro em coordenadas
- Tratar erro de localização não encontrada

## Etapa 4 — Bounding box

- Criar função para converter latitude, longitude e raio em bounding box
- Testar com cidades pequenas e bairros

## Etapa 5 — Integração com Overpass API

- Criar query dinâmica
- Buscar nodes, ways e relations
- Retornar dados brutos
- Tratar erro e timeout

## Etapa 6 — Normalização

- Criar normalizador de leads
- Unificar telefone
- Unificar site
- Gerar endereço
- Gerar categoria
- Extrair coordenadas

## Etapa 7 — Score

- Criar função de score
- Retornar pontuação
- Retornar label
- Retornar motivos do score

## Etapa 8 — Tabela de resultados

- Mostrar leads encontrados
- Adicionar filtros por score, categoria e status
- Adicionar ordenação
- Adicionar ações rápidas

## Etapa 9 — Banco de dados

- Configurar SQLite
- Criar tabela Lead
- Salvar leads selecionados
- Atualizar status e observações

## Etapa 10 — Mapa

- Criar mapa com Leaflet
- Mostrar pins
- Mostrar popup com informações do lead
- Colorir pins por score

## Etapa 11 — Kanban

- Criar visão por status
- Permitir alterar status
- Opcional: drag and drop

## Etapa 12 — Exportação CSV

- Criar botão de exportação
- Exportar leads salvos ou resultados atuais

## Etapa 13 — Polimento

- Loading states
- Empty states
- Toasts
- Melhorar design
- Responsividade
- Tratamento de erros

---

# 25. Critério de sucesso do MVP

O MVP estará bom quando permitir:

```txt
1. Buscar uma cidade ou bairro
2. Escolher um nicho
3. Encontrar empresas possivelmente sem site
4. Ordenar por score
5. Salvar leads interessantes
6. Copiar mensagem de abordagem
7. Marcar status do contato
8. Exportar a lista
```

A versão inicial não precisa ser perfeita. Ela precisa ajudar a encontrar oportunidades mais rápido do que fazer tudo manualmente.

---

# 26. Ideia de evolução com IA

Depois que o MVP funcionar, adicionar IA para gerar:

- Diagnóstico do lead
- Oferta recomendada
- Mensagem personalizada
- Mini proposta comercial
- Ideia de landing page para aquele negócio
- Argumentos de venda

Exemplo:

```txt
Empresa: Studio Belleza
Categoria: Salão de beleza
Problema provável: sem site cadastrado e sem informações estruturadas de serviços.
Oferta recomendada: landing page com serviços, botão WhatsApp, galeria, localização e captação de reviews.
Mensagem: abordagem curta e amigável pelo WhatsApp.
```

---

# 27. Prompt direto para usar com Codex

Use este prompt quando for iniciar o projeto no Codex:

```md
Leia o arquivo `local-lead-finder-plano.md` inteiro antes de começar.

Com base nesse plano, crie a aplicação web descrita nele.

Objetivo: construir um MVP funcional chamado Local Lead Finder, uma ferramenta interna de prospecção local que encontra empresas com sinais de presença digital fraca usando OpenStreetMap/Overpass API como fonte principal.

Requisitos principais:

- Use Next.js com App Router
- Use TypeScript
- Use Tailwind CSS
- Use shadcn/ui
- Use SQLite para o banco local
- Use Leaflet para o mapa
- Use TanStack Table para a tabela
- Não faça scraping do Google Maps
- Use Nominatim apenas para geocodificar cidade/bairro
- Use Overpass API para buscar empresas
- Crie as páginas `/`, `/search`, `/leads`, `/map` e `/kanban`
- Implemente score de oportunidade de 0 a 100
- Mostre os motivos do score
- Permita salvar leads
- Permita editar status e observações
- Permita copiar mensagem de abordagem
- Permita exportar CSV
- Adicione loading states, empty states e tratamento de erros
- Crie uma interface moderna, limpa, responsiva e bem organizada

Comece criando a estrutura do projeto, os modelos de dados, os componentes principais e a tela de busca. Depois implemente a integração com Nominatim e Overpass API, normalização dos dados, score dos leads, tabela, mapa, kanban e exportação CSV.

Siga o plano do arquivo como fonte principal de verdade. Quando houver dúvida de implementação, escolha a opção mais simples e funcional para o MVP.
```

---

# 28. Prompt alternativo mais curto

```md
Leia o arquivo `local-lead-finder-plano.md` e implemente o MVP descrito nele.

Construa uma aplicação Next.js + TypeScript + Tailwind + shadcn/ui chamada Local Lead Finder.

Ela deve buscar empresas locais via OpenStreetMap/Overpass API, usando Nominatim para geocodificação, calcular score de oportunidade para empresas possivelmente sem site ou com presença digital fraca, exibir os resultados em tabela e mapa, salvar leads em SQLite, permitir status/observações, copiar mensagem de abordagem e exportar CSV.

Não use scraping do Google Maps. Siga o plano do arquivo como referência principal e implemente primeiro uma versão simples, funcional e bem organizada.
```
