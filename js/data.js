// ============================================================
//  data.js — Camada de dados (localStorage + Google Sheets)
// ============================================================

var MONTHS      = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
var MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Meses sem acento para o Apps Script
var MONTH_SCRIPT = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

var STORAGE_KEY  = 'fincontrol';
var INVESTMENT_GOAL = 100;

// ⚠️ Cole aqui a URL gerada ao publicar o Apps Script como Web App
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzEEs5401wjLNbemzUv3Zrtym2J6GD0wIIVLihd2i4Vs-wk3vHge5OdvGUdnG2YccDo/exec';

// ── localStorage ───────────────────────────────────────────

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch(e) { return {}; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTransactions(monthIndex) {
  var data = loadData();
  var list = data[monthIndex] || [];
  return list.sort(function(a, b) { return a.day - b.day; });
}

function addTransaction(opts) {
  var data = loadData();
  if (!data[opts.monthIndex]) data[opts.monthIndex] = [];
  data[opts.monthIndex].push({
    id:       Date.now(),
    desc:     opts.desc,
    amount:   opts.amount,
    type:     opts.type,
    day:      opts.day,
    credorId: opts.credorId || null
  });
  saveData(data);

  // Sincroniza com Sheets após salvar
  syncToSheets(opts.monthIndex);
}

function deleteTransaction(monthIndex, id) {
  var data = loadData();
  data[monthIndex] = (data[monthIndex] || []).filter(function(t) { return t.id !== id; });
  saveData(data);

  // Sincroniza com Sheets após deletar
  syncToSheets(monthIndex);
}

function getSummary(monthIndex) {
  var txs = getTransactions(monthIndex);
  var income = 0, expense = 0, investment = 0;
  txs.forEach(function(t) {
    if (t.type === 'income')     income     += t.amount;
    if (t.type === 'expense')    expense    += t.amount;
    if (t.type === 'investment') investment += t.amount;
  });
  return {
    income:     income,
    expense:    expense,
    investment: investment,
    balance:    income - expense  // investimento NÃO entra no saldo
  };
}

function hasData(monthIndex) {
  var data = loadData();
  return !!(data[monthIndex] && data[monthIndex].length > 0);
}

function formatCurrency(v) {
  return 'R$ ' + Math.abs(v).toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ── Sincronização com Google Sheets ────────────────────────

function syncToSheets(monthIndex) {
  if (!APPS_SCRIPT_URL) return; // URL não configurada ainda

  var s   = getSummary(monthIndex);
  var ano = new Date().getFullYear();
  var mes = MONTH_SCRIPT[monthIndex];

  var payload = {
    ano:          ano,
    mes:          mes,
    salario:      s.income,
    investimento: s.investment,
    despesas:     s.expense
  };

  // mode: 'no-cors' necessário por causa do redirect do Apps Script
  fetch(APPS_SCRIPT_URL, {
    method:      'POST',
    mode:        'no-cors',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload)
  })
  .then(function() {
    console.log('[Sheets] Sincronizado: ' + mes + '/' + ano);
  })
  .catch(function(err) {
    console.warn('[Sheets] Falha na conexão:', err);
  });
}