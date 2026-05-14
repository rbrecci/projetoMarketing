const express = require('express');
const { getDb } = require('../database');
const { scrapePage } = require('../scraper');

const router = express.Router();

const listQuery = `
SELECT
  temas.nome_tema,
  sites.nome_site,
  sites.url,
  coletas.titulo_pagina,
  coletas.quantidade_links,
  coletas.quantidade_imagens,
  coletas.data_coleta
FROM coletas
INNER JOIN sites ON coletas.id_site = sites.id_site
INNER JOIN temas ON sites.id_tema = temas.id_tema
ORDER BY coletas.data_coleta DESC
`;

const oneRowQuery = `
SELECT
  temas.nome_tema,
  sites.nome_site,
  sites.url,
  coletas.titulo_pagina,
  coletas.quantidade_links,
  coletas.quantidade_imagens,
  coletas.data_coleta
FROM coletas
INNER JOIN sites ON coletas.id_site = sites.id_site
INNER JOIN temas ON sites.id_tema = temas.id_tema
WHERE coletas.id_coleta = ?
`;

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.all(listQuery);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/:id_site', async (req, res) => {
  const idSite = Number(req.params.id_site);
  if (!Number.isInteger(idSite) || idSite < 1) {
    return res.status(400).json({ erro: 'id_site inválido.' });
  }

  try {
    const db = getDb();
    const site = await db.get('SELECT * FROM sites WHERE id_site = ?', [idSite]);
    if (!site) {
      return res.status(404).json({ erro: 'Site não encontrado.' });
    }

    const dados = await scrapePage(site.url);
    const info = await db.run(
      `INSERT INTO coletas (id_site, titulo_pagina, quantidade_links, quantidade_imagens, palavras_chave)
       VALUES (?, ?, ?, ?, ?)`,
      [
        idSite,
        dados.titulo_pagina,
        dados.quantidade_links,
        dados.quantidade_imagens,
        dados.palavras_chave,
      ]
    );

    const row = await db.get(oneRowQuery, [info.lastID]);
    res.status(201).json(row);
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ erro: e.message || 'Erro ao coletar dados.' });
  }
});

module.exports = router;
