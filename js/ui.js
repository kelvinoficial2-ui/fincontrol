// ============================================================
//  ui.js — Renderização e manipulação do DOM
// ============================================================

function buildMonthButtons(activeMonth, onSelect) {
  var grid = document.getElementById('monthsGrid');
  grid.innerHTML = '';
  MONTHS.forEach(function(m, i) {
    var btn = document.createElement('button');
    btn.className = 'month-btn' + (i === activeMonth ? ' active' : '');
    btn.id = 'month-' + i;
    btn.textContent = m;
    btn.onclick = function() { onSelect(i); };
    grid.appendChild(btn);
  });
}

function setActiveMonthButton(index) {
  document.querySelectorAll('.month-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  var btn = document.getElementById('month-' + index);
  if (btn) btn.classList.add('active');
}

function updateMonthDots() {
  MONTHS.forEach(function(_, i) {
    var btn = document.getElementById('month-' + i);
    if (!btn) return;
    if (hasData(i)) btn.classList.add('has-data');
    else btn.classList.remove('has-data');
  });
}

// ── Cards de resumo ────────────────────────────────────────

function updateSummaryCards(monthIndex) {
  var s = getSummary(monthIndex);
  document.getElementById('totalIncome').textContent  = formatCurrency(s.income);
  document.getElementById('totalExpense').textContent = formatCurrency(s.expense);
  renderBalanceCard(s.balance);
  renderInvestmentCard(s.investment);
  renderHealthStatus(s);
}

function renderInvestmentCard(invested) {
  var goal    = INVESTMENT_GOAL;
  var pct     = Math.min((invested / goal) * 100, 100);
  var reached = invested >= goal;
  var over    = invested > goal;
  var overPct = over ? Math.round(((invested - goal) / goal) * 100) : 0;

  var card  = document.getElementById('investmentCard');
  var label = document.getElementById('investmentLabel');
  var val   = document.getElementById('totalInvestment');
  var sub   = document.getElementById('investmentSub');
  var bar   = document.getElementById('investmentBar');

  if (!card) return;

  card.className = 'card investment' + (reached ? ' goal-reached' : '');

  if (label) {
    label.textContent = over
      ? '+' + overPct + '% acima da meta'
      : reached
        ? '✓ Meta atingida!'
        : '◈ Investimentos · Meta: ' + formatCurrency(goal);
  }
  if (val) val.textContent = formatCurrency(invested);
  if (sub) {
    sub.textContent = reached
      ? formatCurrency(invested) + ' / ' + formatCurrency(goal)
      : 'Faltam ' + formatCurrency(goal - invested) + ' para a meta';
  }
  if (bar) bar.style.width = pct + '%';
}

// ── Saldo (negativo fica vermelho) ─────────────────────────

function renderBalanceCard(balance) {
  var el   = document.getElementById('totalBalance');
  var card = document.getElementById('balanceCard');
  if (!el) return;

  var negative = balance < 0;
  el.textContent = (negative ? '-' : '') + formatCurrency(balance);
  if (card) {
    card.className = 'card balance' + (negative ? ' negative' : '');
  }
  el.className = 'card-value' + (negative ? ' negative-value' : '');
}

// ── Status de Saúde Financeira ─────────────────────────────

function renderHealthStatus(s) {
  var el = document.getElementById('healthStatus');
  if (!el) return;

  // Sem dados
  if (s.income === 0 && s.expense === 0) {
    el.className = 'health-bar empty';
    el.innerHTML =
      '<div class="health-dot"></div>' +
      '<div class="health-info">' +
        '<span class="health-label">Sem dados</span>' +
        '<span class="health-msg">Adicione seus lançamentos do mês</span>' +
      '</div>';
    return;
  }

  var ratio  = s.income > 0 ? s.expense / s.income : 999;
  var status, label, msg, cls;

  if (s.balance < 0) {
    status = 'critical'; cls = 'health-bar critical';
    label  = '🔴 Crítico';
    msg    = 'Suas despesas superam sua receita em ' + formatCurrency(Math.abs(s.balance));
  } else if (ratio >= 0.8) {
    status = 'warning'; cls = 'health-bar warning';
    label  = '🟡 Atenção';
    msg    = 'Suas despesas estão em ' + Math.round(ratio * 100) + '% da sua receita';
  } else {
    status = 'healthy'; cls = 'health-bar healthy';
    label  = '🟢 Saudável';
    msg    = 'Você está guardando ' + Math.round((1 - ratio) * 100) + '% da sua receita';
  }

  el.className = cls;
  el.innerHTML =
    '<div class="health-dot"></div>' +
    '<div class="health-info">' +
      '<span class="health-label">' + label + '</span>' +
      '<span class="health-msg">' + msg + '</span>' +
    '</div>' +
    '<div class="health-gauge">' +
      '<div class="health-gauge-fill" style="width:' + Math.min(ratio * 100, 100) + '%"></div>' +
    '</div>';
}

// ── Ranking de Ofensores ───────────────────────────────────

function renderRanking(monthIndex) {
  var txs     = getTransactions(monthIndex);
  var section = document.getElementById('rankingSection');
  var list    = document.getElementById('rankingList');
  var period  = document.getElementById('rankingPeriod');

  if (period) period.textContent = MONTH_FULL[monthIndex];

  // Filtra só despesas
  var expenses = txs.filter(function(t) { return t.type === 'expense'; });

  if (!expenses.length) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  // Agrupa por credor (ou descrição se não tiver credor)
  var map = {};
  expenses.forEach(function(t) {
    var key   = t.credorId || ('__' + t.desc);
    var label = t.credorId
      ? (getCredorById(t.credorId) ? getCredorById(t.credorId).nome : t.desc)
      : t.desc;
    var logo  = t.credorId && getCredorById(t.credorId)
      ? getCredorById(t.credorId).logo
      : null;

    if (!map[key]) map[key] = { label: label, logo: logo, total: 0 };
    map[key].total += t.amount;
  });

  // Ordena por total desc
  var sorted = Object.values(map).sort(function(a, b) { return b.total - a.total; });

  // Máximo para calcular a barra
  var max = sorted[0].total;

  // Medalhas para top 3
  var medals = ['🥇', '🥈', '🥉'];

  list.innerHTML = sorted.map(function(item, i) {
    var pct    = Math.round((item.total / max) * 100);
    var medal  = medals[i] || '';
    var logoHTML = item.logo
      ? '<img src="' + item.logo + '" alt="' + item.label + '" class="ranking-logo">'
      : '<div class="ranking-logo-fallback">?</div>';

    return '<div class="ranking-item">' +
        '<div class="ranking-pos">' + (medal || ('#' + (i + 1))) + '</div>' +
        logoHTML +
        '<div class="ranking-info">' +
          '<div class="ranking-name">' + item.label + '</div>' +
          '<div class="ranking-bar-track">' +
            '<div class="ranking-bar-fill" style="width:' + pct + '%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="ranking-total">' + formatCurrency(item.total) + '</div>' +
      '</div>';
  }).join('');
}

// ── Lista de transações ────────────────────────────────────

function renderTransactions(monthIndex) {
  var list = document.getElementById('transactionList');
  var txs  = getTransactions(monthIndex);

  document.getElementById('transactionTitle').textContent =
    'Lançamentos — ' + MONTH_FULL[monthIndex];

  if (!txs.length) {
    list.innerHTML =
      '<div class="empty-state">' +
        '<span class="emoji">📂</span>' +
        'Nenhum lançamento neste mês.<br>Adicione sua primeira transação →' +
      '</div>';
    return;
  }

  var iconMap = { income: '↑', expense: '↓', investment: '◈' };

  list.innerHTML = txs.map(function(t) {
    var credor = t.credorId ? getCredorById(t.credorId) : null;
    var iconHTML = credor
      ? '<img src="' + credor.logo + '" alt="' + credor.nome + '" class="tx-credor-logo">'
      : '<div class="tx-icon ' + t.type + '">' + (iconMap[t.type] || '·') + '</div>';
    var label = credor ? credor.nome + ' — ' + t.desc : t.desc;

    return '<div class="transaction-item">' +
        iconHTML +
        '<div class="tx-info">' +
          '<div class="tx-desc">' + label + '</div>' +
          '<div class="tx-date">Dia ' + String(t.day).padStart(2,'0') + ' · ' + MONTH_FULL[monthIndex] + '</div>' +
        '</div>' +
        '<div class="tx-amount ' + t.type + '">' +
          (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount) +
        '</div>' +
        '<button class="tx-delete" onclick="App.remove(' + t.id + ')" title="Remover">✕</button>' +
      '</div>';
  }).join('');
}

// ── Preview logo no formulário ─────────────────────────────

function updateCredorLogoPreview(credorId) {
  var box = document.getElementById('credorLogoBox');
  var img = document.getElementById('credorLogo');
  if (!box || !img) return;
  if (!credorId) {
    box.classList.remove('has-logo');
    img.src = '';
    return;
  }
  var credor = getCredorById(credorId);
  if (credor) {
    img.src = credor.logo;
    box.classList.add('has-logo');
  } else {
    box.classList.remove('has-logo');
    img.src = '';
  }
}

function setTypeActive(type) {
  ['income','expense','investment'].forEach(function(t) {
    var btn = document.getElementById('btn-' + t);
    if (btn) btn.className = 'type-btn ' + t + (t === type ? ' active' : '');
  });
}

function shakeInput(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '#ff6b6b';
  setTimeout(function() { el.style.borderColor = ''; }, 1200);
}