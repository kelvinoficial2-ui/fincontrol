// ============================================================
//  app.js — Orquestrador principal
// ============================================================

var App = (function() {

  var activeTab           = 'despesas';
  var activeDespesasMonth = new Date().getMonth();
  var activeReceitasMonth      = new Date().getMonth();
  var activeInvestimentoMonth  = new Date().getMonth();

  // ── Init ─────────────────────────────────────────────────

  function init() {
    document.getElementById('yearBadge').textContent = new Date().getFullYear();
    buildMonthGrid('despesasMonthsGrid', activeDespesasMonth, selectDespesasMonth, hasDebtData);
    initTicker();
    if (typeof initFirebase === 'function') initFirebase();
    buildMonthGrid('receitasMonthsGrid', activeReceitasMonth, selectReceitasMonth, hasIncomeData);
    buildMonthGrid('investimentoMonthsGrid', activeInvestimentoMonth, selectInvestimentoMonth, hasInvestimentoData);
    setTab('despesas');
  }

  // ── Navegação entre abas ─────────────────────────────────

  function setTab(tab) {
    activeTab = tab;
    var tabs = ['despesas','receitas','investimento','gerencial','mensal'];

    tabs.forEach(function(t) {
      var el  = document.getElementById('tab-' + t);
      var btn = document.getElementById('nav-' + t);
      var bBtn = document.getElementById('bnav-' + t);

      if (el) {
        if (t === tab) {
          el.style.display = 'block';
          el.classList.remove('tab-slide-out');
          el.classList.add('tab-slide-in');
        } else {
          el.classList.remove('tab-slide-in');
          el.style.display = 'none';
        }
      }
      if (btn)  btn.className  = 'nav-btn'  + (t === tab ? ' active' : '');
      if (bBtn) bBtn.className = 'bottom-nav-btn' + (t === tab ? ' active' : '');
    });

    if (tab === 'gerencial')    renderGerencial();
    if (tab === 'investimento') renderAnnualInvestCard();
  }

  // ── DESPESAS — seleção de mês ────────────────────────────

  function selectDespesasMonth(i) {
    activeDespesasMonth = i;
    document.getElementById('despesas-months-view').style.display = 'none';
    document.getElementById('despesas-detail-view').style.display = 'block';
    document.getElementById('despesasMonthTitle').textContent = MONTH_FULL[i];
    document.getElementById('despesasYearBadge').textContent  = new Date().getFullYear();
    renderDebtCards(i);
    renderDebtList(i);
  }

  function backToMonths(section) {
    if (section === 'despesas') {
      document.getElementById('despesas-detail-view').style.display = 'none';
      document.getElementById('despesas-months-view').style.display = 'block';
      buildMonthGrid('despesasMonthsGrid', activeDespesasMonth, selectDespesasMonth, hasDebtData);
    initTicker();
    if (typeof initFirebase === 'function') initFirebase();
    }
    if (section === 'receitas') {
      document.getElementById('receitas-detail-view').style.display = 'none';
      document.getElementById('receitas-months-view').style.display = 'block';
      buildMonthGrid('receitasMonthsGrid', activeReceitasMonth, selectReceitasMonth, hasIncomeData);
    }
    if (section === 'investimento') {
      document.getElementById('investimento-detail-view').style.display = 'none';
      document.getElementById('investimento-months-view').style.display = 'block';
      buildMonthGrid('investimentoMonthsGrid', activeInvestimentoMonth, selectInvestimentoMonth, hasInvestimentoData);
      renderAnnualInvestCard();
    }
  }

  // ── Credor preview ───────────────────────────────────────

  function onDebtCredorChange() {
    var credorId = document.getElementById('debtCredor').value;
    updateDebtCredorPreview(credorId);
    if (credorId) {
      var credor = getCredorById(credorId);
      var desc   = document.getElementById('debtDesc');
      if (credor && !desc.value.trim()) desc.value = credor.nome;
    }
  }

  // ── Adicionar dívida ─────────────────────────────────────

  function submitDebt() {
    var desc     = document.getElementById('debtDesc').value.trim();
    var amount   = parseFloat(document.getElementById('debtAmount').value);
    var day      = parseInt(document.getElementById('debtDay').value) || 1;
    var credorId = document.getElementById('debtCredor').value || null;

    if (!desc)                        { shakeInput('debtDesc');   return; }
    if (isNaN(amount) || amount <= 0) { shakeInput('debtAmount'); return; }

    addDebtData({ monthIndex: activeDespesasMonth, desc: desc, amount: amount, day: day, credorId: credorId });

    document.getElementById('debtDesc').value   = '';
    document.getElementById('debtAmount').value = '';
    document.getElementById('debtDay').value    = '';
    document.getElementById('debtCredor').value = '';
    updateDebtCredorPreview(null);

    renderDebtCards(activeDespesasMonth);
    renderDebtList(activeDespesasMonth);
    buildMonthGrid('despesasMonthsGrid', activeDespesasMonth, selectDespesasMonth, hasDebtData);
    initTicker();
    if (typeof initFirebase === 'function') initFirebase();
  }

  // ── Remover dívida ───────────────────────────────────────

  function removeDebt(id) {
    deleteDebtData(activeDespesasMonth, id);
    renderDebtCards(activeDespesasMonth);
    renderDebtList(activeDespesasMonth);
    buildMonthGrid('despesasMonthsGrid', activeDespesasMonth, selectDespesasMonth, hasDebtData);
    initTicker();
    if (typeof initFirebase === 'function') initFirebase();
  }

  // ── Toggle pago ──────────────────────────────────────────

  function togglePaid(id) {
    toggleDebtPaid(activeDespesasMonth, id);
    renderDebtCards(activeDespesasMonth);
    renderDebtList(activeDespesasMonth);
  }

  // ── RECEITAS ─────────────────────────────────────────────

  function selectReceitasMonth(i) {
    activeReceitasMonth = i;
    document.getElementById('receitas-months-view').style.display = 'none';
    document.getElementById('receitas-detail-view').style.display = 'block';
    document.getElementById('receitasMonthTitle').textContent = MONTH_FULL[i];
    document.getElementById('receitasYearBadge').textContent  = new Date().getFullYear();
    renderIncomeCards(i);
    renderIncomeList(i);
  }

  function addIncome() {
    var desc   = document.getElementById('incomeDesc').value.trim();
    var amount = parseFloat(document.getElementById('incomeAmount').value);
    var day    = parseInt(document.getElementById('incomeDay').value) || new Date().getDate();

    if (!desc)                        { shakeInput('incomeDesc');   return; }
    if (isNaN(amount) || amount <= 0) { shakeInput('incomeAmount'); return; }

    addIncomeData({ monthIndex: activeReceitasMonth, desc: desc, amount: amount, day: day });

    document.getElementById('incomeDesc').value   = '';
    document.getElementById('incomeAmount').value = '';
    document.getElementById('incomeDay').value    = '';

    renderIncomeCards(activeReceitasMonth);
    renderIncomeList(activeReceitasMonth);
    buildMonthGrid('receitasMonthsGrid', activeReceitasMonth, selectReceitasMonth, hasIncomeData);
  }

  function removeIncome(id) {
    deleteIncomeData(activeReceitasMonth, id);
    renderIncomeCards(activeReceitasMonth);
    renderIncomeList(activeReceitasMonth);
    buildMonthGrid('receitasMonthsGrid', activeReceitasMonth, selectReceitasMonth, hasIncomeData);
  }

  // ── INVESTIMENTO ─────────────────────────────────────────

  function selectInvestimentoMonth(i) {
    activeInvestimentoMonth = i;
    document.getElementById('investimento-months-view').style.display = 'none';
    document.getElementById('investimento-detail-view').style.display = 'block';
    document.getElementById('investimentoMonthTitle').textContent = MONTH_FULL[i];
    document.getElementById('investimentoYearBadge').textContent  = new Date().getFullYear();
    renderInvestmentGoalCard(i);
    renderInvestmentList(i);
  }

  function addInvestment() {
    var desc   = document.getElementById('investDesc').value.trim();
    var amount = parseFloat(document.getElementById('investAmount').value);
    var day    = parseInt(document.getElementById('investDay').value) || new Date().getDate();

    if (!desc)                        { shakeInput('investDesc');   return; }
    if (isNaN(amount) || amount <= 0) { shakeInput('investAmount'); return; }

    addInvestmentData({ monthIndex: activeInvestimentoMonth, desc: desc, amount: amount, day: day });

    document.getElementById('investDesc').value   = '';
    document.getElementById('investAmount').value = '';
    document.getElementById('investDay').value    = '';

    renderInvestmentGoalCard(activeInvestimentoMonth);
    renderInvestmentList(activeInvestimentoMonth);
    buildMonthGrid('investimentoMonthsGrid', activeInvestimentoMonth, selectInvestimentoMonth, hasInvestimentoData);
    renderAnnualInvestCard();
  }

  function removeInvestment(id) {
    deleteInvestmentData(activeInvestimentoMonth, id);
    renderInvestmentGoalCard(activeInvestimentoMonth);
    renderInvestmentList(activeInvestimentoMonth);
    buildMonthGrid('investimentoMonthsGrid', activeInvestimentoMonth, selectInvestimentoMonth, hasInvestimentoData);
    renderAnnualInvestCard();
  }

  // ── Abre dashboard mensal a partir do Gerencial ─────────

  function openMensal(monthIndex) {
    var tabs = ['despesas','receitas','investimento','gerencial','mensal'];
    tabs.forEach(function(t) {
      var el   = document.getElementById('tab-' + t);
      var btn  = document.getElementById('nav-' + t);
      var bBtn = document.getElementById('bnav-' + t);
      if (el)  {
        el.style.display = (t === 'mensal') ? 'block' : 'none';
        if (t === 'mensal') el.classList.add('tab-slide-in');
      }
      if (btn)  btn.className  = 'nav-btn';
      if (bBtn) bBtn.className = 'bottom-nav-btn' + (t === 'gerencial' ? ' active' : '');
    });
    renderMensal(monthIndex);
  }

  function backToGerencial() {
    // Esconde mensal explicitamente antes de mostrar gerencial
    var mensalEl = document.getElementById('tab-mensal');
    if (mensalEl) mensalEl.style.display = 'none';
    setTab('gerencial');
  }

  // ── Refresh (chamado pelo Firebase após carregar dados) ──────

  function refresh() {
    buildMonthGrid('despesasMonthsGrid', activeDespesasMonth, selectDespesasMonth, hasDebtData);
    buildMonthGrid('receitasMonthsGrid', activeReceitasMonth, selectReceitasMonth, hasIncomeData);
    buildMonthGrid('investimentoMonthsGrid', activeInvestimentoMonth, selectInvestimentoMonth, hasInvestimentoData);
    setTab(activeTab);
  }

  // ── API pública ──────────────────────────────────────────

  return {
    init:               init,
    setTab:             setTab,
    backToMonths:       backToMonths,
    openMensal:         openMensal,
    refresh:            refresh,
    backToGerencial:    backToGerencial,
    onDebtCredorChange: onDebtCredorChange,
    addDebt:            submitDebt,
    addIncome:          addIncome,
    removeIncome:       removeIncome,
    addInvestment:      addInvestment,
    removeInvestment:   removeInvestment,
    removeDebt:         removeDebt,
    togglePaid:         togglePaid
  };

})();

window.addEventListener('DOMContentLoaded', function() { App.init(); });
