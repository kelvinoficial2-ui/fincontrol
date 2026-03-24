// ============================================================
//  mensal.js — Dashboard Mensal completo
// ============================================================

function renderMensal(monthIndex) {
  var income  = getIncomeSummary(monthIndex);
  var debts   = getDebtSummary(monthIndex);
  var invest  = getInvestmentTotal(monthIndex);
  var saldo   = income - debts.total;
  var neg     = saldo < 0;
  var ratio   = income > 0 ? debts.total / income : 0;

  // Título
  document.getElementById('mensalTitle').textContent = MONTH_FULL[monthIndex];
  document.getElementById('mensalYear').textContent  = new Date().getFullYear();

  // ── Linha 1: Receita · Despesas · Saldo ─────────────────
  document.getElementById('mensalIncome').textContent    = formatCurrency(income);
  document.getElementById('mensalDebtTotal').textContent = formatCurrency(debts.total);

  var saldoEl   = document.getElementById('mensalSaldo');
  var saldoCard = document.getElementById('mensalSaldoCard');
  saldoEl.textContent = (neg ? '-' : '') + formatCurrency(saldo);
  saldoEl.className   = 'card-value' + (neg ? ' negative-value' : '');
  if (saldoCard) saldoCard.className = 'card balance' + (neg ? ' negative' : '');

  // ── Linha 2: Pago · Resta · Investimento ────────────────
  document.getElementById('mensalPaid').textContent      = formatCurrency(debts.paid);
  document.getElementById('mensalRemaining').textContent = formatCurrency(debts.remaining);
  renderMensalInvestCard(invest, monthIndex);

  // ── Barra pagamento dívidas ──────────────────────────────
  var pctPago = debts.total > 0 ? Math.round((debts.paid / debts.total) * 100) : 0;
  var pBar    = document.getElementById('mensalPayBar');
  var pLbl    = document.getElementById('mensalPayLabel');
  if (pBar) pBar.style.width  = pctPago + '%';
  if (pLbl) pLbl.textContent  = pctPago + '% das dívidas pagas';

  // ── Saúde Financeira ─────────────────────────────────────
  renderMensalHealth(income, debts.total, saldo);

  // ── Ranking de ofensores ─────────────────────────────────
  renderMensalRanking(monthIndex);

  // ── Listas ───────────────────────────────────────────────
  renderMensalDebtList(monthIndex);
  renderMensalIncomeList(monthIndex);
  renderMensalInvestList(monthIndex);
}

// ── Card Investimento ──────────────────────────────────────

function renderMensalInvestCard(invested, monthIndex) {
  var goal    = INVESTMENT_GOAL;
  var reached = invested >= goal;
  var over    = invested > goal;
  var pct     = goal > 0 ? Math.round((invested / goal) * 100) : 0;
  var overPct = over ? Math.round(((invested - goal) / goal) * 100) : 0;

  var card  = document.getElementById('mensalInvestCard');
  var label = document.getElementById('mensalInvestLabel');
  var val   = document.getElementById('mensalInvest');
  var sub   = document.getElementById('mensalInvestSub');
  var bar   = document.getElementById('mensalInvestBar');
  var pctEl = document.getElementById('mensalInvestPct');

  if (card)  card.className  = 'card investment' + (reached ? ' goal-reached' : '');
  if (label) label.textContent = over   ? '+' + overPct + '% acima da meta 🚀'
                                : reached ? '✓ Meta atingida!'
                                : '◈ Investimento';
  if (val)   val.textContent   = formatCurrency(invested);
  if (sub)   sub.textContent   = over    ? '+' + formatCurrency(invested - goal) + ' além da meta'
                                : reached ? formatCurrency(invested) + ' / ' + formatCurrency(goal)
                                : 'Faltam ' + formatCurrency(goal - invested) + ' para R$ 100';
  if (pctEl) pctEl.textContent = pct + '%';
  if (bar)   bar.style.width   = Math.min(pct, 100) + '%';
}

// ── Saúde Financeira ───────────────────────────────────────

function renderMensalHealth(income, expense, balance) {
  var el = document.getElementById('mensalHealth');
  if (!el) return;

  if (income === 0 && expense === 0) {
    el.className = 'health-bar empty';
    el.innerHTML = '<div class="health-dot"></div><div class="health-info"><span class="health-label">Sem dados</span><span class="health-msg">Adicione receitas e dívidas do mês</span></div>';
    return;
  }

  var ratio = income > 0 ? expense / income : 999;
  var cls, label, msg;

  if (balance < 0) {
    cls = 'health-bar critical'; label = '🔴 Crítico';
    msg = 'Dívidas superam receita em ' + formatCurrency(Math.abs(balance));
  } else if (ratio >= 0.8) {
    cls = 'health-bar warning'; label = '🟡 Atenção';
    msg = 'Dívidas em ' + Math.round(ratio * 100) + '% da sua receita';
  } else {
    cls = 'health-bar healthy'; label = '🟢 Saudável';
    msg = 'Você está guardando ' + Math.round((1 - ratio) * 100) + '% da sua receita';
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

// ── Ranking ────────────────────────────────────────────────

function renderMensalRanking(monthIndex) {
  var section = document.getElementById('mensalRankingSection');
  var list    = document.getElementById('mensalRankingList');
  if (!list) return;

  var debts = getDebts(monthIndex);
  if (!debts.length) { if (section) section.style.display = 'none'; return; }
  if (section) section.style.display = 'block';

  var map = {};
  debts.forEach(function(t) {
    var key    = t.credorId || ('__' + t.desc);
    var credor = t.credorId ? getCredorById(t.credorId) : null;
    if (!map[key]) map[key] = { label: credor ? credor.nome : t.desc, logo: credor ? credor.logo : null, total: 0, paid: 0 };
    map[key].total += t.amount;
    if (t.paid) map[key].paid += t.amount;
  });

  var sorted = Object.values(map).sort(function(a, b) { return b.total - a.total; });
  var max    = sorted[0].total;
  var medals = ['🥇','🥈','🥉'];

  list.innerHTML = sorted.map(function(item, i) {
    var pct      = Math.round((item.total / max) * 100);
    var paidPct  = item.total > 0 ? Math.round((item.paid / item.total) * 100) : 0;
    var logoHTML = item.logo
      ? '<img src="' + item.logo + '" alt="' + item.label + '" class="ranking-logo">'
      : '<div class="ranking-logo-fallback">?</div>';

    return '<div class="ranking-item">' +
        '<div class="ranking-pos">' + (medals[i] || ('#' + (i+1))) + '</div>' +
        logoHTML +
        '<div class="ranking-info">' +
          '<div class="ranking-name">' + item.label + '</div>' +
          '<div class="ranking-bar-track">' +
            '<div class="ranking-bar-fill" style="width:' + pct + '%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="ranking-right">' +
          '<div class="ranking-total">' + formatCurrency(item.total) + '</div>' +
          (item.paid > 0 ? '<div class="ranking-paid-badge">' + paidPct + '% pago</div>' : '') +
        '</div>' +
      '</div>';
  }).join('');
}

// ── Lista de Dívidas ───────────────────────────────────────

function renderMensalDebtList(monthIndex) {
  var list  = document.getElementById('mensalDebtList');
  if (!list) return;
  var debts = getDebts(monthIndex);

  if (!debts.length) {
    list.innerHTML = '<div class="empty-state"><span class="emoji">📋</span>Nenhuma dívida neste mês.</div>';
    return;
  }

  list.innerHTML = debts.map(function(t) {
    var credor   = t.credorId ? getCredorById(t.credorId) : null;
    var label    = credor ? credor.nome + (t.desc ? ' — ' + t.desc : '') : t.desc;
    var logoHTML = credor
      ? '<img src="' + credor.logo + '" alt="' + credor.nome + '" class="tx-credor-logo">'
      : '<div class="tx-icon expense">↓</div>';

    return '<div class="debt-item' + (t.paid ? ' paid' : '') + '">' +
        logoHTML +
        '<div class="tx-info">' +
          '<div class="tx-desc">' + label + '</div>' +
          '<div class="tx-date">Vence dia ' + String(t.day).padStart(2,'0') + '</div>' +
        '</div>' +
        '<div class="debt-amount' + (t.paid ? ' paid' : '') + '">' + formatCurrency(t.amount) + '</div>' +
        '<div class="debt-status-badge ' + (t.paid ? 'paid' : 'pending') + '">' +
          (t.paid ? '✓ Pago' : '⏳ Pendente') +
        '</div>' +
      '</div>';
  }).join('');
}

// ── Lista de Receitas ──────────────────────────────────────

function renderMensalIncomeList(monthIndex) {
  var list    = document.getElementById('mensalIncomeList');
  if (!list) return;
  var incomes = getIncomes(monthIndex);

  if (!incomes.length) {
    list.innerHTML = '<div class="empty-state"><span class="emoji">💰</span>Nenhuma receita neste mês.</div>';
    return;
  }

  list.innerHTML = incomes.map(function(t) {
    return '<div class="debt-item">' +
        '<div class="tx-icon income">↑</div>' +
        '<div class="tx-info">' +
          '<div class="tx-desc">' + t.desc + '</div>' +
          '<div class="tx-date">Dia ' + String(t.day).padStart(2,'0') + '</div>' +
        '</div>' +
        '<div class="income-amount">+' + formatCurrency(t.amount) + '</div>' +
      '</div>';
  }).join('');
}

// ── Lista de Investimentos ─────────────────────────────────

function renderMensalInvestList(monthIndex) {
  var list  = document.getElementById('mensalInvestList');
  if (!list) return;
  var items = getInvestments(monthIndex);

  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><span class="emoji">📈</span>Nenhum aporte neste mês.</div>';
    return;
  }

  list.innerHTML = items.map(function(t) {
    var pct = Math.round((t.amount / INVESTMENT_GOAL) * 100);
    return '<div class="debt-item">' +
        '<div class="tx-icon investment">◈</div>' +
        '<div class="tx-info">' +
          '<div class="tx-desc">' + t.desc + '</div>' +
          '<div class="tx-date">Dia ' + String(t.day).padStart(2,'0') + '</div>' +
        '</div>' +
        '<div class="invest-item-pct">' + pct + '% da meta</div>' +
        '<div class="invest-item-amount">+' + formatCurrency(t.amount) + '</div>' +
      '</div>';
  }).join('');
}
