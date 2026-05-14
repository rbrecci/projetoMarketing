const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.all('SELECT * FROM temas ORDER BY id_tema');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome_tema, descricao } = req.body || {};
    if (!nome_tema || !String(nome_tema).trim()) {
      return res.status(400).json({ erro: 'Nome do tema é obrigatório.' });
    }
    const db = getDb();
    const info = await db.run('INSERT INTO temas (nome_tema, descricao) VALUES (?, ?)', [
      String(nome_tema).trim(),
      descricao != null ? String(descricao) : null,
    ]);
    const row = await db.get('SELECT * FROM temas WHERE id_tema = ?', [info.lastID]);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;
