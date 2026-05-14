const express = require('express');
const PDFDocument = require('pdfkit');
const { getDb } = require('../database');

const router = express.Router();

const reportQuery = `
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

router.get('/pdf', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.all(reportQuery);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio.pdf"');

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      bufferPages: true,
      info: { Title: 'Relatório de Coletas — DataSocial' },
    });

    doc.pipe(res);

    const geradoEm = new Date().toLocaleString('pt-BR');

    doc.fontSize(18).text('Relatório de Coletas — DataSocial', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Gerado em: ${geradoEm}`, { align: 'right' });
    doc.moveDown(1.5);

    if (!rows.length) {
      doc.fontSize(11).text('Nenhuma coleta registrada.', { align: 'center' });
    } else {
      doc.fontSize(9).font('Helvetica-Bold').text('Dados das coletas (INNER JOIN)', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica');

      rows.forEach((r, idx) => {
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
        }

        doc.fontSize(10).font('Helvetica-Bold').text(`Registro ${idx + 1}`);
        doc.font('Helvetica').fontSize(9);
        doc.text(`Tema: ${r.nome_tema || ''}`);
        doc.text(`Site: ${r.nome_site || ''}`);
        doc.text(`URL: ${r.url || ''}`);
        doc.text(`Título da página: ${r.titulo_pagina || ''}`);
        doc.text(
          `Links: ${r.quantidade_links ?? ''}  |  Imagens: ${r.quantidade_imagens ?? ''}  |  Data: ${r.data_coleta || ''}`
        );
        doc.moveDown();
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#cccccc');
        doc.moveDown(0.5);
      });
    }

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#444444')
        .text(`Página ${i + 1} de ${range.count}`, 40, doc.page.height - 45, {
          align: 'center',
          width: doc.page.width - 80,
        });
      doc.fillColor('#000000');
    }

    doc.flushPages();
    doc.end();
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ erro: e.message });
    }
  }
});

module.exports = router;
