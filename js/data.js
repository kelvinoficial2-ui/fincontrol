// ============================================================
//  data.js — Camada de dados
// ============================================================

var MONTHS       = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
var MONTH_FULL   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
var MONTH_SCRIPT = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

var STORAGE_KEY     = 'fincontrol_v2';
var INVESTMENT_GOAL = 100;

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzEEs5401wjLNbemzUv3Zrtym2J6GD0wIIVLihd2i4Vs-wk3vHge5OdvGUdnG2YccDo/exec';

// ── Storage ────────────────────────────────────────────────

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch(e) { return {}; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getRootData() {
  var d = loadData();
  if (!d.despesas)    d.despesas    = {};
  if (!d.receitas)    d.receitas    = {};
  if (!d.investimentos) d.investimentos = {};
  return d;
}

// ── DÍVIDAS (Despesas) ─────────────────────────────────────

function getDebts(monthIndex) {
  var d = getRootData();
  return (d.despesas[monthIndex] || []).sort(function(a,b){ return a.day - b.day; });
}

function addDebtData(opts) {
  var d = getRootData();
  if (!d.despesas[opts.monthIndex]) d.despesas[opts.monthIndex] = [];
  d.despesas[opts.monthIndex].push({
    id:       Date.now(),
    desc:     opts.desc,
    amount:   opts.amount,
    day:      opts.day,
    credorId: opts.credorId || null,
    paid:     false
  });
  saveData(d);
  syncDebtsToSheets(opts.monthIndex);
}

function deleteDebtData(monthIndex, id) {
  var d = getRootData();
  d.despesas[monthIndex] = (d.despesas[monthIndex] || []).filter(function(t){ return t.id !== id; });
  saveData(d);
  syncDebtsToSheets(monthIndex);
}

function toggleDebtPaid(monthIndex, id) {
  var d = getRootData();
  (d.despesas[monthIndex] || []).forEach(function(t) {
    if (t.id === id) t.paid = !t.paid;
  });
  saveData(d);
  syncDebtsToSheets(monthIndex);
}

function getDebtSummary(monthIndex) {
  var debts = getDebts(monthIndex);
  var total  = 0, paid = 0;
  debts.forEach(function(t) {
    total += t.amount;
    if (t.paid) paid += t.amount;
  });
  return { total: total, paid: paid, remaining: total - paid };
}

function hasDebtData(monthIndex) {
  var d = getRootData();
  return !!(d.despesas[monthIndex] && d.despesas[monthIndex].length > 0);
}

// ── RECEITAS ───────────────────────────────────────────────

function getIncomes(monthIndex) {
  var d = getRootData();
  return (d.receitas[monthIndex] || []).sort(function(a,b){ return a.day - b.day; });
}

function addIncomeData(opts) {
  var d = getRootData();
  if (!d.receitas[opts.monthIndex]) d.receitas[opts.monthIndex] = [];
  d.receitas[opts.monthIndex].push({
    id: Date.now(), desc: opts.desc, amount: opts.amount,
    day: opts.day, credorId: opts.credorId || null
  });
  saveData(d);
}

function deleteIncomeData(monthIndex, id) {
  var d = getRootData();
  d.receitas[monthIndex] = (d.receitas[monthIndex] || []).filter(function(t){ return t.id !== id; });
  saveData(d);
}

function getIncomeSummary(monthIndex) {
  return getIncomes(monthIndex).reduce(function(s,t){ return s + t.amount; }, 0);
}

// ── INVESTIMENTOS ──────────────────────────────────────────

function getInvestments(monthIndex) {
  var d = getRootData();
  return (d.investimentos[monthIndex] || []).sort(function(a,b){ return a.day - b.day; });
}

function addInvestmentData(opts) {
  var d = getRootData();
  if (!d.investimentos[opts.monthIndex]) d.investimentos[opts.monthIndex] = [];
  d.investimentos[opts.monthIndex].push({
    id: Date.now(), desc: opts.desc, amount: opts.amount, day: opts.day
  });
  saveData(d);
}

function deleteInvestmentData(monthIndex, id) {
  var d = getRootData();
  d.investimentos[monthIndex] = (d.investimentos[monthIndex] || []).filter(function(t){ return t.id !== id; });
  saveData(d);
}

function getInvestmentTotal(monthIndex) {
  return getInvestments(monthIndex).reduce(function(s,t){ return s + t.amount; }, 0);
}

// ── Sumário geral por mês (para o Gerencial) ───────────────

function getSummary(monthIndex) {
  var income     = getIncomeSummary(monthIndex);
  var summary    = getDebtSummary(monthIndex);
  var investment = getInvestmentTotal(monthIndex);
  return {
    income:     income,
    expense:    summary.total,
    investment: investment,
    balance:    income - summary.total
  };
}

// ── Utilitários ────────────────────────────────────────────

function formatCurrency(v) {
  return 'R$ ' + Math.abs(v).toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ── Sync Sheets ────────────────────────────────────────────

function syncDebtsToSheets(monthIndex) {
  if (!APPS_SCRIPT_URL) return;
  var s   = getDebtSummary(monthIndex);
  var inc = getIncomeSummary(monthIndex);
  var inv = getInvestmentTotal(monthIndex);
  var ano = new Date().getFullYear();
  var mes = MONTH_SCRIPT[monthIndex];

  fetch(APPS_SCRIPT_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ano: ano, mes: mes, salario: inc, investimento: inv, despesas: s.total })
  }).then(function() {
    console.log('[Sheets] Sincronizado: ' + mes);
  }).catch(function(err) {
    console.warn('[Sheets] Erro:', err);
  });
}

function hasIncomeData(monthIndex) {
  var d = getRootData();
  return !!(d.receitas[monthIndex] && d.receitas[monthIndex].length > 0);
}

function hasInvestimentoData(monthIndex) {
  var d = getRootData();
  return !!(d.investimentos[monthIndex] && d.investimentos[monthIndex].length > 0);
}
