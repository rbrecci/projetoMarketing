const API = '/api';

const urlRegex =
  /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+([\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+)?$/;

function validateUrl(url) {
  return urlRegex.test(String(url).trim());
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.erro || data.error || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function setFeedback(el, text, type) {
  el.textContent = text || '';
  el.classList.remove('ok', 'error');
  if (type) el.classList.add(type);
}

async function carregarTemasSelect() {
  const select = document.getElementById('select-tema');
  select.innerHTML = '';
  const temas = await fetchJson(`${API}/temas`);
  if (!temas.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Cadastre um tema primeiro';
    select.appendChild(opt);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  temas.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = String(t.id_tema);
    opt.textContent = t.nome_tema;
    select.appendChild(opt);
  });
}

function linhaSite(site) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${escapeHtml(site.nome_site)}</td>
    <td><a href="${encodeURI(site.url)}" target="_blank" rel="noopener">${escapeHtml(site.url)}</a></td>
    <td>${escapeHtml(site.nome_tema)}</td>
    <td>
      <button type="button" class="btn btn-sm btn-primary btn-coletar" data-id="${site.id_site}">
        Coletar Dados
      </button>
      <span class="muted coleta-status" data-status-for="${site.id_site}"></span>
    </td>
  `;
  return tr;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function carregarSites() {
  const tbody = document.querySelector('#tabela-sites tbody');
  const loading = document.getElementById('sites-loading');
  loading.classList.remove('hidden');
  tbody.innerHTML = '';

  try {
    const sites = await fetchJson(`${API}/sites`);
    sites.forEach((s) => tbody.appendChild(linhaSite(s)));
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Falha ao carregar sites: ${escapeHtml(e.message)}</td></tr>`;
  } finally {
    loading.classList.add('hidden');
  }
}

document.getElementById('form-tema').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = ev.target;
  const msg = document.getElementById('msg-tema');
  setFeedback(msg, 'Salvando…', null);

  const body = {
    nome_tema: form.nome_tema.value.trim(),
    descricao: form.descricao.value.trim(),
  };

  try {
    await fetchJson(`${API}/temas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    form.reset();
    setFeedback(msg, 'Tema salvo com sucesso.', 'ok');
    await carregarTemasSelect();
  } catch (e) {
    setFeedback(msg, e.message, 'error');
  }
});

document.getElementById('form-site').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = ev.target;
  const msg = document.getElementById('msg-site');
  const url = form.url.value.trim();

  if (!validateUrl(url)) {
    setFeedback(msg, 'URL inválida. Use http:// ou https:// com formato válido.', 'error');
    return;
  }

  setFeedback(msg, 'Salvando…', null);

  const body = {
    nome_site: form.nome_site.value.trim(),
    url,
    id_tema: Number(form.id_tema.value),
  };

  try {
    await fetchJson(`${API}/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    form.reset();
    setFeedback(msg, 'Site salvo com sucesso.', 'ok');
    await carregarSites();
  } catch (e) {
    setFeedback(msg, e.message, 'error');
  }
});

document.querySelector('#tabela-sites tbody').addEventListener('click', async (ev) => {
  const btn = ev.target.closest('.btn-coletar');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  const statusEl = document.querySelector(`[data-status-for="${id}"]`);
  btn.disabled = true;
  if (statusEl) {
    statusEl.textContent = ' Coletando…';
    statusEl.classList.remove('ok', 'error');
  }

  try {
    await fetchJson(`${API}/coletas/${id}`, { method: 'POST' });
    if (statusEl) {
      statusEl.textContent = ' Sucesso';
      statusEl.classList.add('ok');
    }
  } catch (e) {
    if (statusEl) {
      statusEl.textContent = ` Erro: ${e.message}`;
      statusEl.classList.add('error');
    }
  } finally {
    btn.disabled = false;
  }
});

(async function init() {
  try {
    await carregarTemasSelect();
    await carregarSites();
  } catch (e) {
    document.getElementById('msg-site').textContent = `Não foi possível contatar a API: ${e.message}`;
    document.getElementById('msg-site').classList.add('error');
  }
})();
