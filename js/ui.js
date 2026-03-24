// ============================================================
//  ui.js — Renderização DOM
// ============================================================

// ── Meses grid genérico ────────────────────────────────────

function buildMonthGrid(containerId, activeMonth, onSelect, hasDataFn) {
  var grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';
  MONTHS.forEach(function(m, i) {
    var btn = document.createElement('button');
    btn.className = 'month-btn' + (i === activeMonth ? ' active' : '');
    btn.id = containerId + '-' + i;
    btn.textContent = m;
    if (hasDataFn && hasDataFn(i)) btn.classList.add('has-data');
    btn.onclick = function() { onSelect(i); };
    grid.appendChild(btn);
  });
}

// ── Cards de dívidas ───────────────────────────────────────

function renderDebtCards(monthIndex) {
  var s   = getDebtSummary(monthIndex);
  var pct = s.total > 0 ? Math.round((s.paid / s.total) * 100) : 0;

  document.getElementById('debtTotal').textContent     = formatCurrency(s.total);
  document.getElementById('debtRemaining').textContent = formatCurrency(s.remaining);
  document.getElementById('debtPaid').textContent      = formatCurrency(s.paid);

  var bar   = document.getElementById('paymentBar');
  var label = document.getElementById('paymentLabel');
  if (bar)   bar.style.width  = pct + '%';
  if (label) label.textContent = pct + '% pago';
}

// ── Lista de dívidas ───────────────────────────────────────

function renderDebtList(monthIndex) {
  var list  = document.getElementById('debtList');
  var title = document.getElementById('debtListTitle');
  var debts = getDebts(monthIndex);

  if (title) title.textContent = 'Dívidas — ' + MONTH_FULL[monthIndex];

  if (!debts.length) {
    list.innerHTML =
      '<div class="empty-state">' +
        '<span class="emoji">📋</span>' +
        'Nenhuma dívida cadastrada.<br>Adicione suas dívidas →' +
      '</div>';
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
          '<div class="tx-date">Vence dia ' + String(t.day).padStart(2,'0') + ' · ' + MONTH_FULL[monthIndex] + '</div>' +
        '</div>' +
        '<div class="debt-amount' + (t.paid ? ' paid' : '') + '">' + formatCurrency(t.amount) + '</div>' +
        '<button class="check-btn' + (t.paid ? ' checked' : '') + '" onclick="App.togglePaid(' + t.id + ')" title="' + (t.paid ? 'Marcar como pendente' : 'Marcar como pago') + '">' +
          (t.paid ? '✓' : '○') +
        '</button>' +
        '<button class="tx-delete" onclick="App.removeDebt(' + t.id + ')" title="Remover">✕</button>' +
      '</div>';
  }).join('');
}

// ── Preview credor no form de dívidas ──────────────────────

function updateDebtCredorPreview(credorId) {
  var box = document.getElementById('debtCredorLogoBox');
  var img = document.getElementById('debtCredorLogo');
  if (!box || !img) return;
  if (!credorId) { box.classList.remove('has-logo'); img.src = ''; return; }
  var credor = getCredorById(credorId);
  if (credor) { img.src = credor.logo; box.classList.add('has-logo'); }
  else        { box.classList.remove('has-logo'); img.src = ''; }
}

// ── Shake input ────────────────────────────────────────────

function shakeInput(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '#ff6b6b';
  setTimeout(function() { el.style.borderColor = ''; }, 1200);
}

// ── Receitas ───────────────────────────────────────────────

function renderIncomeCards(monthIndex) {
  var total  = getIncomeSummary(monthIndex);
  var debts  = getDebtSummary(monthIndex);
  var saldo  = total - debts.total;
  var neg    = saldo < 0;

  document.getElementById('incomeTotal').textContent = formatCurrency(total);

  var saldoEl   = document.getElementById('incomeSaldo');
  var saldoCard = document.getElementById('incomeSaldoCard');
  saldoEl.textContent = (neg ? '-' : '') + formatCurrency(saldo);
  saldoEl.className   = 'card-value' + (neg ? ' negative-value' : '');
  if (saldoCard) saldoCard.className = 'card balance' + (neg ? ' negative' : '');
}

function renderIncomeList(monthIndex) {
  var list    = document.getElementById('incomeList');
  var title   = document.getElementById('incomeListTitle');
  var incomes = getIncomes(monthIndex);

  if (title) title.textContent = 'Receitas — ' + MONTH_FULL[monthIndex];

  if (!incomes.length) {
    list.innerHTML =
      '<div class="empty-state">' +
        '<span class="emoji">💰</span>' +
        'Nenhuma receita cadastrada.<br>Adicione suas receitas →' +
      '</div>';
    return;
  }

  list.innerHTML = incomes.map(function(t) {
    return '<div class="debt-item">' +
        '<div class="tx-icon income">↑</div>' +
        '<div class="tx-info">' +
          '<div class="tx-desc">' + t.desc + '</div>' +
          '<div class="tx-date">Dia ' + String(t.day).padStart(2,'0') + ' · ' + MONTH_FULL[monthIndex] + '</div>' +
        '</div>' +
        '<div class="income-amount">+' + formatCurrency(t.amount) + '</div>' +
        '<button class="tx-delete" onclick="App.removeIncome(' + t.id + ')" title="Remover">✕</button>' +
      '</div>';
  }).join('');
}

// ── Investimento ───────────────────────────────────────────

function renderInvestmentGoalCard(monthIndex) {
  var total   = getInvestmentTotal(monthIndex);
  var goal    = INVESTMENT_GOAL;
  var reached = total >= goal;
  var over    = total > goal;
  var pct     = goal > 0 ? Math.round((total / goal) * 100) : 0;
  var overPct = over ? Math.round(((total - goal) / goal) * 100) : 0;

  // Card wrapper
  var card = document.getElementById('investGoalCard');
  if (card) card.className = 'invest-goal-card' + (reached ? ' reached' : over ? ' over' : '');

  // Label
  var label = document.getElementById('investGoalLabel');
  if (label) label.textContent = over
    ? '+' + overPct + '% acima da meta 🚀'
    : reached ? '✓ Meta atingida!' : '◈ Investimento do Mês';

  // Valor
  var val = document.getElementById('investGoalValue');
  if (val) val.textContent = formatCurrency(total);

  // Sub
  var sub = document.getElementById('investGoalSub');
  if (sub) {
    if (over)         sub.textContent = '+' + formatCurrency(total - goal) + ' além da meta mensal';
    else if (reached) sub.textContent = 'Meta de ' + formatCurrency(goal) + ' batida!';
    else              sub.textContent = 'Faltam ' + formatCurrency(goal - total) + ' para a meta';
  }

  // % badge
  var pctEl = document.getElementById('investGoalPct');
  if (pctEl) {
    pctEl.textContent  = pct + '%';
    pctEl.className    = 'invest-goal-pct' + (reached ? ' reached' : '');
  }

  // Barra — escala até 2x a meta para mostrar excesso
  var scale   = goal * 2;
  var barPct  = Math.min((total / scale) * 100, 100);
  var bar     = document.getElementById('investGoalBar');
  if (bar) bar.style.width = barPct + '%';

  // Legenda max
  var maxEl = document.getElementById('investGoalMax');
  if (maxEl) maxEl.textContent = formatCurrency(scale);

  // Título da lista
  var listTitle = document.getElementById('investListTitle');
  if (listTitle) listTitle.textContent = 'Investimentos — ' + MONTH_FULL[monthIndex];
}

function renderInvestmentList(monthIndex) {
  var list  = document.getElementById('investList');
  var items = getInvestments(monthIndex);

  if (!items.length) {
    list.innerHTML =
      '<div class="empty-state">' +
        '<span class="emoji">📈</span>' +
        'Nenhum investimento cadastrado.<br>Adicione seus aportes →' +
      '</div>';
    return;
  }

  var total = getInvestmentTotal(monthIndex);

  list.innerHTML = items.map(function(t) {
    var pct = total > 0 ? Math.round((t.amount / INVESTMENT_GOAL) * 100) : 0;
    return '<div class="debt-item">' +
        '<div class="tx-icon investment">◈</div>' +
        '<div class="tx-info">' +
          '<div class="tx-desc">' + t.desc + '</div>' +
          '<div class="tx-date">Dia ' + String(t.day).padStart(2,'0') + ' · ' + MONTH_FULL[monthIndex] + '</div>' +
        '</div>' +
        '<div class="invest-item-pct">' + pct + '% da meta</div>' +
        '<div class="invest-item-amount">+' + formatCurrency(t.amount) + '</div>' +
        '<button class="tx-delete" onclick="App.removeInvestment(' + t.id + ')" title="Remover">✕</button>' +
      '</div>';
  }).join('');
}

function renderAnnualInvestCard() {
  var total      = 0;
  var goalAnual  = INVESTMENT_GOAL * 12;
  var mesesBatidos = 0;

  for (var i = 0; i < 12; i++) {
    var v = getInvestmentTotal(i);
    total += v;
    if (v >= INVESTMENT_GOAL) mesesBatidos++;
  }

  var pct  = Math.min(Math.round((total / goalAnual) * 100), 999);
  var over = total > goalAnual;

  var totalEl  = document.getElementById('investAnnualTotal');
  var subEl    = document.getElementById('investAnnualSub');
  var pctEl    = document.getElementById('investAnnualPct');
  var barEl    = document.getElementById('investAnnualBar');
  var monthsEl = document.getElementById('investAnnualMonths');
  var card     = document.getElementById('investAnnualCard');

  if (totalEl)  totalEl.textContent  = formatCurrency(total);
  if (subEl)    subEl.textContent    = 'de ' + formatCurrency(goalAnual) + ' · meta anual';
  if (pctEl)    pctEl.textContent    = pct + '%';
  if (barEl)    barEl.style.width    = Math.min((total / goalAnual) * 100, 100) + '%';
  if (monthsEl) monthsEl.textContent = mesesBatidos + ' de 12 meses com meta batida';
  if (card)     card.className       = 'invest-annual-card' + (over ? ' over' : (total > 0 ? ' partial' : ''));
}
