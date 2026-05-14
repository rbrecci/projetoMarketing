const axios = require('axios');
const cheerio = require('cheerio');

const urlRegex =
  /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+([\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+)?$/;

function validateUrl(url) {
  return urlRegex.test(String(url).trim());
}

function extractKeywords($) {
  const metaKw = $('meta[name="keywords"]').attr('content');
  if (metaKw && metaKw.trim()) {
    return metaKw.trim();
  }

  const bodyText = $('body').text() || '';
  const cleaned = bodyText
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const words = cleaned.split(' ').filter(Boolean);
  return words.slice(0, 10).join(' ');
}

async function scrapePage(url) {
  if (!validateUrl(url)) {
    const err = new Error('URL inválida. Use http:// ou https:// com formato válido.');
    err.status = 400;
    throw err;
  }

  let html;
  try {
    const res = await axios.get(url, {
      timeout: 20000,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      validateStatus: () => true,
    });

    if (res.status >= 400) {
      const err = new Error(`Falha ao acessar o site (HTTP ${res.status}).`);
      err.status = 400;
      throw err;
    }

    html = res.data;
  } catch (e) {
    if (e.status === 400) throw e;
    const msg =
      e.code === 'ECONNABORTED'
        ? 'Tempo esgotado ao conectar ao site.'
        : e.message || 'Site inacessível ou erro de rede.';
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }

  const $ = cheerio.load(html);

  const titulo_pagina = $('title').first().text().trim() || '(sem título)';
  const quantidade_links = $('a[href]').length;
  const quantidade_imagens = $('img').length;
  const palavras_chave = extractKeywords($);

  return {
    titulo_pagina,
    quantidade_links,
    quantidade_imagens,
    palavras_chave,
  };
}

module.exports = { scrapePage, validateUrl, urlRegex };
