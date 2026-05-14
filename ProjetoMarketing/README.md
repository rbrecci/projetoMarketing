# DataSocial: Coletor de Dados de Marketing Digital

Sistema web fullstack (Node.js + Express + SQLite via `sqlite3`) para cadastro de temas e sites, coleta automática de dados via scraping (Axios + Cheerio), dashboard com gráficos e exportação de relatório em PDF.

> A especificação permite `better-sqlite3` ou `sqlite3`. Este projeto usa **`sqlite3`** para facilitar a instalação no Windows (binários pré-compilados na maioria dos casos).

## Requisitos

- Node.js 18 ou superior (recomendado LTS)
- npm

## Como executar

```bash
npm install
npm start
```

O servidor sobe em `http://localhost:3000`. Abra essa URL no navegador.

Em ambientes com Bash (Git Bash, Linux, macOS), também é possível usar:

```bash
chmod +x start.sh
./start.sh
```

## Estrutura principal

- `server/` — API Express, banco (`database.js`), scraper e rotas
- `public/` — front-end estático (HTML/CSS/JS)
- `database/dados.db` — SQLite criado automaticamente na primeira execução

## Documentação

- `docs/SCRUM.md` — backlog, sprints e 5W2H
- `docs/DIAGRAMA.md` — fluxo do sistema

## Tema acadêmico

Redes Sociais e Marketing Digital.
