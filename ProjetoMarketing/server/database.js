const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbDir = path.join(__dirname, '../database');
const dbPath = path.join(dbDir, 'dados.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let rawDb = null;

function wrap(db) {
  return {
    exec(sql) {
      return new Promise((resolve, reject) => {
        db.exec(sql, (err) => (err ? reject(err) : resolve()));
      });
    },
    run(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function onRun(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    get(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
      });
    },
    all(sql, params = []) {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
      });
    },
  };
}

let api = null;

async function initDb() {
  rawDb = await new Promise((resolve, reject) => {
    const d = new sqlite3.Database(dbPath, (err) => (err ? reject(err) : resolve(d)));
  });
  api = wrap(rawDb);

  await api.exec(`
CREATE TABLE IF NOT EXISTS temas (
  id_tema    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_tema  TEXT NOT NULL,
  descricao  TEXT
);

CREATE TABLE IF NOT EXISTS sites (
  id_site   INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_site TEXT NOT NULL,
  url       TEXT NOT NULL,
  id_tema   INTEGER NOT NULL,
  FOREIGN KEY (id_tema) REFERENCES temas(id_tema)
);

CREATE TABLE IF NOT EXISTS coletas (
  id_coleta          INTEGER PRIMARY KEY AUTOINCREMENT,
  id_site            INTEGER NOT NULL,
  titulo_pagina      TEXT,
  quantidade_links   INTEGER,
  quantidade_imagens INTEGER,
  palavras_chave     TEXT,
  data_coleta        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_site) REFERENCES sites(id_site)
);
`);

  const countTemas = await api.get('SELECT COUNT(*) AS c FROM temas');
  if (countTemas.c === 0) {
    const r1 = await api.run(
      'INSERT INTO temas (nome_tema, descricao) VALUES (?, ?)',
      [
        'Instagram Marketing',
        'Estratégias e ferramentas para marketing no Instagram.',
      ]
    );
    const r2 = await api.run(
      'INSERT INTO temas (nome_tema, descricao) VALUES (?, ?)',
      ['SEO e Conteúdo', 'Otimização para mecanismos de busca e produção de conteúdo.']
    );

    await api.run('INSERT INTO sites (nome_site, url, id_tema) VALUES (?, ?, ?)', [
      'Instagram',
      'https://www.instagram.com/',
      r1.lastID,
    ]);
    await api.run('INSERT INTO sites (nome_site, url, id_tema) VALUES (?, ?, ?)', [
      'Later',
      'https://later.com/',
      r1.lastID,
    ]);
    await api.run('INSERT INTO sites (nome_site, url, id_tema) VALUES (?, ?, ?)', [
      'Moz',
      'https://moz.com/',
      r2.lastID,
    ]);
  }
}

function getDb() {
  if (!api) {
    throw new Error('Banco de dados não inicializado.');
  }
  return api;
}

module.exports = { initDb, getDb };
