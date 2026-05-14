const express = require('express');
const { getDb } = require('../database');
const { validateUrl } = require('../scraper');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.all(
      `SELECT sites.id_site, sites.nome_site, sites.url, sites.id_tema,
              temas.nome_tema
       FROM sites
       INNER JOIN temas ON sites.id_tema = temas.id_tema
       ORDER BY sites.id_site`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome_site, url, id_tema } = req.body || {};
    if (!nome_site || !String(nome_site).trim()) {
      return res.status(400).json({ erro: 'Nome do site é obrigatório.' });
    }
    if (!url || !String(url).trim()) {
      return res.status(400).json({ erro: 'URL é obrigatória.' });
    }
    if (id_tema == null || Number.isNaN(Number(id_tema))) {
      return res.status(400).json({ erro: 'Tema inválido.' });
    }
    const urlTrim = String(url).trim();
    if (!validateUrl(urlTrim)) {
      return res.status(400).json({ erro: 'URL inválida. Verifique o formato (http/https).' });
    }
    const db = getDb();
    const tema = await db.get('SELECT id_tema FROM temas WHERE id_tema = ?', [Number(id_tema)]);
    if (!tema) {
      return res.status(400).json({ erro: 'Tema não encontrado.' });
    }
    const info = await db.run('INSERT INTO sites (nome_site, url, id_tema) VALUES (?, ?, ?)', [
      String(nome_site).trim(),
      urlTrim,
      Number(id_tema),
    ]);
    const row = await db.get(
      `SELECT sites.id_site, sites.nome_site, sites.url, sites.id_tema, temas.nome_tema
       FROM sites
       INNER JOIN temas ON sites.id_tema = temas.id_tema
       WHERE sites.id_site = ?`,
      [info.lastID]
    );
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;
