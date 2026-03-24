// ============================================================
//  gerencial.js — Dashboard Gerencial (visão anual)
// ============================================================

function renderGerencial() {
  var meses = [];
  var totalIncome = 0, totalExpense = 0, totalInvestment = 0;

  for (var i = 0; i < 12; i++) {
    var s = getSummary(i);
    meses.push({ index: i, nome: MONTH_FULL[i], abrev: MONTHS[i], s: s });
    totalIncome     += s.income;
    totalExpense    += s.expense;
    totalInvestment += s.investment;
  }

  var totalBalance = totalIncome - totalExpense;

  // ── Cards anuais ─────────────────────────────────────────
  document.getElementById('gTotalIncome').textContent     = formatCurrency(totalIncome);
  document.getElementById('gTotalExpense').textContent    = formatCurrency(totalExpense);
  document.getElementById('gTotalInvestment').textContent = formatCurrency(totalInvestment);

  var gBal     = document.getElementById('gTotalBalance');
  var gBalCard = document.getElementById('gBalanceCard');
  gBal.textContent   = (totalBalance < 0 ? '-' : '') + formatCurrency(totalBalance);
  gBal.className     = 'card-value' + (totalBalance < 0 ? ' negative-value' : '');
  gBalCard.className = 'card balance' + (totalBalance < 0 ? ' negative' : '');

  var goalAnual = INVESTMENT_GOAL * 12;
  var pctAnual  = Math.min((totalInvestment / goalAnual) * 100, 100);
  var sub = document.getElementById('gInvestmentSub');
  var bar = document.getElementById('gInvestmentBar');
  if (sub) sub.textContent = formatCurrency(totalInvestment) + ' de ' + formatCurrency(goalAnual) + ' · meta anual';
  if (bar) bar.style.width = pctAnual + '%';

  renderChart(meses);
  renderTable(meses);
  renderInvestGrid(meses);
  renderAnnualRanking();
}

// ── Gráfico de barras ──────────────────────────────────────

function renderChart(meses) {
  var canvas = document.getElementById('gChart');
  if (!canvas) return;

  var dpr   = window.devicePixelRatio || 1;
  var W     = canvas.parentElement.offsetWidth - 40;
  var H     = 240;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var padL = 56, padR = 20, padT = 20, padB = 44;
  var chartW = W - padL - padR;
  var chartH = H - padT - padB;

  var maxVal = 100;
  meses.forEach(function(m) {
    maxVal = Math.max(maxVal, m.s.income, m.s.expense);
  });

  // Grid horizontal
  var steps = 4;
  for (var g = 0; g <= steps; g++) {
    var y = padT + chartH - (g / steps) * chartH;
    ctx.strokeStyle = g === 0 ? 'rgba(37,42,58,1)' : 'rgba(37,42,58,0.6)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label Y
    ctx.fillStyle = '#5a6180';
    ctx.font = '500 10px DM Mono, monospace';
    ctx.textAlign = 'right';
    var val = maxVal * g / steps;
    ctx.fillText(val >= 1000 ? (val/1000).toFixed(1)+'k' : val.toFixed(0), padL - 8, y + 3);
  }

  var barGroup = chartW / 12;
  var barW     = barGroup * 0.3;
  var gap      = 2;

  meses.forEach(function(m, i) {
    var cx   = padL + i * barGroup + barGroup / 2;
    var xInc = cx - barW - gap / 2;
    var xExp = cx + gap / 2;

    // Barra receita
    var hInc = (m.s.income / maxVal) * chartH;
    if (hInc > 0) {
      var grad = ctx.createLinearGradient(0, padT + chartH - hInc, 0, padT + chartH);
      grad.addColorStop(0, 'rgba(79,255,176,0.9)');
      grad.addColorStop(1, 'rgba(79,255,176,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(xInc, padT + chartH - hInc, barW, hInc, [4, 4, 0, 0]);
      ctx.fill();
    }

    // Barra despesa
    var hExp = (m.s.expense / maxVal) * chartH;
    if (hExp > 0) {
      var grad2 = ctx.createLinearGradient(0, padT + chartH - hExp, 0, padT + chartH);
      grad2.addColorStop(0, 'rgba(255,107,107,0.9)');
      grad2.addColorStop(1, 'rgba(255,107,107,0.3)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.roundRect(xExp, padT + chartH - hExp, barW, hExp, [4, 4, 0, 0]);
      ctx.fill();
    }

    // Label mês
    ctx.fillStyle = '#5a6180';
    ctx.font = '600 9px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.abrev.toUpperCase(), cx, H - padB + 16);
  });

  // Linha base
  ctx.strokeStyle = 'rgba(37,42,58,1)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(padL, padT + chartH);
  ctx.lineTo(padL + chartW, padT + chartH);
  ctx.stroke();

  // Legenda
  var legX = padL;
  var legY  = H - 10;

  ctx.fillStyle = 'rgba(79,255,176,0.85)';
  roundRect(ctx, legX, legY - 8, 12, 8, 2);
  ctx.fill();
  ctx.fillStyle = '#e8ecf4';
  ctx.font = '600 10px Syne, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Receita', legX + 16, legY - 1);

  ctx.fillStyle = 'rgba(255,107,107,0.85)';
  roundRect(ctx, legX + 76, legY - 8, 12, 8, 2);
  ctx.fill();
  ctx.fillStyle = '#e8ecf4';
  ctx.fillText('Despesa', legX + 92, legY - 1);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Tabela mensal ──────────────────────────────────────────

function renderTable(meses) {
  var table = document.getElementById('gTable');
  if (!table) return;

  var header =
    '<thead><tr>' +
      '<th>Mês</th>' +
      '<th class="col-income">Receitas</th>' +
      '<th class="col-expense">Despesas</th>' +
      '<th class="col-invest">Investido</th>' +
      '<th class="col-balance">Saldo</th>' +
    '</tr></thead>';

  var rows = meses.map(function(m) {
    var neg    = m.s.balance < 0;
    var hasAny = m.s.income > 0 || m.s.expense > 0 || m.s.investment > 0;
    var trAttr = hasAny
      ? 'class="g-table-row has-data" onclick="App.openMensal(' + m.index + ')" title="Ver detalhes de ' + m.nome + '"'
      : 'class="g-table-row row-empty"';

    return '<tr ' + trAttr + '>' +
      '<td class="col-month">' + m.nome + (hasAny ? ' <span class="row-arrow">→</span>' : '') + '</td>' +
      '<td class="col-income">'  + (m.s.income     > 0 ? '+' + formatCurrency(m.s.income)     : '—') + '</td>' +
      '<td class="col-expense">' + (m.s.expense    > 0 ? '-' + formatCurrency(m.s.expense)    : '—') + '</td>' +
      '<td class="col-invest">'  + (m.s.investment > 0 ?      formatCurrency(m.s.investment)   : '—') + '</td>' +
      '<td class="col-balance ' + (neg ? 'negative-value' : '') + '">' +
        (hasAny ? (neg ? '-' : '+') + formatCurrency(m.s.balance) : '—') +
      '</td>' +
    '</tr>';
  }).join('');

  table.innerHTML = header + '<tbody>' + rows + '</tbody>';
}

// ── Evolução do investimento ───────────────────────────────

function renderInvestGrid(meses) {
  var grid = document.getElementById('gInvestGrid');
  if (!grid) return;

  grid.innerHTML = meses.map(function(m) {
    var goal    = INVESTMENT_GOAL;
    var pct     = Math.min((m.s.investment / goal) * 100, 100);
    var reached = m.s.investment >= goal;
    var hasAny  = m.s.investment > 0;
    var cls = reached ? 'g-invest-item reached'
            : hasAny  ? 'g-invest-item partial'
            :            'g-invest-item empty';

    return '<div class="' + cls + '">' +
        '<span class="g-invest-month">' + m.abrev + '</span>' +
        '<div class="g-invest-track">' +
          '<div class="g-invest-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<span class="g-invest-val">' + (hasAny ? formatCurrency(m.s.investment) : '—') + '</span>' +
        (reached ? '<div class="g-invest-check">✓</div>' : '') +
      '</div>';
  }).join('');
}

// ── Ranking anual ──────────────────────────────────────────

function renderAnnualRanking() {
  var list = document.getElementById('gRankingList');
  if (!list) return;

  var map = {};
  for (var i = 0; i < 12; i++) {
    getTransactions(i)
      .filter(function(t) { return t.type === 'expense'; })
      .forEach(function(t) {
        var key    = t.credorId || ('__' + t.desc);
        var credor = t.credorId ? getCredorById(t.credorId) : null;
        if (!map[key]) map[key] = { label: credor ? credor.nome : t.desc, logo: credor ? credor.logo : null, total: 0 };
        map[key].total += t.amount;
      });
  }

  var sorted = Object.values(map).sort(function(a, b) { return b.total - a.total; });

  if (!sorted.length) {
    list.innerHTML = '<div class="empty-state" style="padding:2rem"><span class="emoji">📊</span>Nenhuma despesa registrada no ano.</div>';
    return;
  }

  var max    = sorted[0].total;
  var medals = ['🥇','🥈','🥉'];

  list.innerHTML = sorted.map(function(item, i) {
    var pct      = Math.round((item.total / max) * 100);
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
        '<div class="ranking-total">' + formatCurrency(item.total) + '</div>' +
      '</div>';
  }).join('');
}
