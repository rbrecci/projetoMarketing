const API = '/api';

let chartInstance = null;

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.erro || data.error || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function showError(msg) {
  const el = document.getElementById('dash-erro');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('dash-erro').classList.add('hidden');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderCards(totalColetas, totalSites, totalTemas) {
  const wrap = document.getElementById('cards-resumo');
  wrap.innerHTML = `
    <div class="stat-card"><span>Total de coletas</span><strong>${totalColetas}</strong></div>
    <div class="stat-card"><span>Sites cadastrados</span><strong>${totalSites}</strong></div>
    <div class="stat-card"><span>Temas cadastrados</span><strong>${totalTemas}</strong></div>
  `;
}

function renderTable(rows) {
  const tbody = document.querySelector('#tabela-coletas tbody');
  tbody.innerHTML = '';
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">Nenhuma coleta ainda. Use Cadastro para coletar dados.</td></tr>';
    return;
  }
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(r.nome_tema)}</td>
      <td>${escapeHtml(r.nome_site)}</td>
      <td><a href="${encodeURI(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.url)}</a></td>
      <td>${escapeHtml(r.titulo_pagina)}</td>
      <td>${escapeHtml(String(r.quantidade_links))}</td>
      <td>${escapeHtml(String(r.quantidade_imagens))}</td>
      <td>${escapeHtml(r.data_coleta)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderChart(rows) {
  const canvas = document.getElementById('chart-links');
  const labels = rows.map((r, i) => {
    const dataCurta = String(r.data_coleta || '').replace('T', ' ').slice(0, 16);
    return `${r.nome_site} (${dataCurta || '#' + (i + 1)})`;
  });
  const data = rows.map((r) => Number(r.quantidade_links) || 0);

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Quantidade de links',
          data,
          backgroundColor: 'rgba(110, 231, 255, 0.55)',
          borderColor: 'rgba(167, 139, 250, 0.9)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#eef2ff' } },
      },
      scales: {
        x: {
          ticks: { color: '#a7b0d8', maxRotation: 45, minRotation: 0 },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#a7b0d8' },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
      },
    },
  });
}

async function carregarDashboard() {
  hideError();
  document.getElementById('dash-loading').classList.remove('hidden');
  document.getElementById('dash-content').classList.add('hidden');

  const [coletas, sites, temas] = await Promise.all([
    fetchJson(`${API}/coletas`),
    fetchJson(`${API}/sites`),
    fetchJson(`${API}/temas`),
  ]);

  renderCards(coletas.length, sites.length, temas.length);
  renderTable(coletas);
  renderChart(coletas);

  document.getElementById('dash-loading').classList.add('hidden');
  document.getElementById('dash-content').classList.remove('hidden');
}

document.getElementById('btn-pdf').addEventListener('click', async () => {
  const btn = document.getElementById('btn-pdf');
  btn.disabled = true;
  try {
    const res = await fetch(`${API}/relatorio/pdf`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.erro || `Erro HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    showError(e.message || 'Falha ao gerar PDF.');
  } finally {
    btn.disabled = false;
  }
});

window.addEventListener('DOMContentLoaded', () => {
  carregarDashboard().catch((e) => {
    document.getElementById('dash-loading').classList.add('hidden');
    showError(e.message || 'Erro ao carregar dashboard.');
  });
});
