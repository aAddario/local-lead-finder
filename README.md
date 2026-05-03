# Local Lead Finder

Ferramenta interna para prospecção local via OpenStreetMap. Encontra empresas sem site cadastrado, calcula score de oportunidade e organiza leads em pipeline.

## O que faz

- **Busca** empresas locais por cidade/bairro, raio e categoria usando a Overpass API (OpenStreetMap)
- **Geocodifica** endereços via Nominatim
- **Calcula score** de oportunidade (0–100) com base em critérios como ausência de site, presença de telefone, nicho de ticket alto e dados completos
- **Remove duplicados** automaticamente
- **Organiza leads** em tabela, mapa e kanban (mini-CRM)
- **Exporta CSV** para planilhas externas
- **Gera mensagem de abordagem** copiável para WhatsApp

## Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [SQLite](https://github.com/WiseLibs/better-sqlite3) (banco local)
- [Leaflet](https://leafletjs.com/) (mapas)
- [TanStack Table](https://tanstack.com/table) (tabela de leads)
- APIs públicas: [Overpass](https://overpass-api.de/) + [Nominatim](https://nominatim.org/)

## Rodando localmente

```bash
# Clone
git clone https://github.com/aAddario/local-lead-finder.git
cd local-lead-finder

# Instale as dependências
npm install

# Rode em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

> **Nota:** O comando `npm run dev` precisa ficar rodando no terminal. Não feche a janela do terminal enquanto estiver usando o projeto. Se precisar rodar em background, use:
> ```bash
> nohup npm run dev &
> ```

## Build para produção

```bash
npm run build
npm start
```

## Estrutura

```
src/
├── app/           # Rotas do Next.js (/, /search, /leads, /map, /kanban)
├── components/    # Componentes React reutilizáveis
├── lib/           # Lógica de negócio (db, overpass, geo, score, etc.)
└── types/         # Tipos TypeScript
```

## Categorias suportadas

Clínicas, Dentistas, Restaurantes, Cafés, Salões de beleza, Estéticas, Pet shops, Oficinas, Lojas de móveis, Academias, Escritórios locais.

## Score de oportunidade

| Critério | Pontos |
|----------|--------|
| Sem site cadastrado | +35 |
| Com telefone público | +20 |
| Nicho de ticket alto | +15 |
| Endereço claro | +10 |
| Parece negócio local (não franquia) | +10 |
| Nome comercial claro | +10 |
| Possui site | −30 |
| Possível franquia/rede | −25 |
| Dados muito incompletos | −20 |
| Categoria com potencial menor | −15 |

## Aviso

Esta ferramenta usa APIs públicas (OpenStreetMap / Overpass / Nominatim). Use com moderação e respeite os limites de requisição das plataformas. Não faz scraping do Google Maps.

## Licença

Uso interno/pessoal.
