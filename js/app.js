// ============================================================
//  app.js — Orquestrador principal
// ============================================================

var App = (function() {

  var activeMonth = new Date().getMonth();
  var currentType = 'income';
  var currentView = 'mensal';

  function init() {
    document.getElementById('yearBadge').textContent = new Date().getFullYear();
    buildMonthButtons(activeMonth, selectMonth);
    selectMonth(activeMonth);
    updateMonthDots();
  }

  // ── Troca de view ────────────────────────────────────────

  function setView(view) {
    currentView = view;
    document.getElementById('viewMensal').style.display    = view === 'mensal'    ? 'block' : 'none';
    document.getElementById('viewGerencial').style.display = view === 'gerencial' ? 'block' : 'none';
    document.getElementById('btnMensal').className    = 'view-btn' + (view === 'mensal'    ? ' active' : '');
    document.getElementById('btnGerencial').className = 'view-btn' + (view === 'gerencial' ? ' active' : '');

    if (view === 'gerencial') renderGerencial();
  }

  // ── Mensal ───────────────────────────────────────────────

  function selectMonth(i) {
    activeMonth = i;
    setActiveMonthButton(i);
    renderTransactions(i);
    updateSummaryCards(i);
    renderRanking(i);
  }

  function setType(type) {
    currentType = type;
    setTypeActive(type);
  }

  function onCredorChange() {
    var credorId = document.getElementById('inputCredor').value;
    updateCredorLogoPreview(credorId);
    if (credorId) {
      var credor    = getCredorById(credorId);
      var inputDesc = document.getElementById('inputDesc');
      if (credor && !inputDesc.value.trim()) inputDesc.value = credor.nome;
    }
  }

  function add() {
    var desc     = document.getElementById('inputDesc').value.trim();
    var amount   = parseFloat(document.getElementById('inputAmount').value);
    var day      = parseInt(document.getElementById('inputDay').value) || new Date().getDate();
    var credorId = document.getElementById('inputCredor').value || null;

    if (!desc)                        { shakeInput('inputDesc');   return; }
    if (isNaN(amount) || amount <= 0) { shakeInput('inputAmount'); return; }

    addTransaction({ monthIndex: activeMonth, desc: desc, amount: amount, type: currentType, day: day, credorId: credorId });

    document.getElementById('inputDesc').value   = '';
    document.getElementById('inputAmount').value = '';
    document.getElementById('inputDay').value    = '';
    document.getElementById('inputCredor').value = '';
    updateCredorLogoPreview(null);

    renderTransactions(activeMonth);
    updateSummaryCards(activeMonth);
    updateMonthDots();
    renderRanking(activeMonth);
  }

  function remove(id) {
    deleteTransaction(activeMonth, id);
    renderTransactions(activeMonth);
    updateSummaryCards(activeMonth);
    updateMonthDots();
    renderRanking(activeMonth);
  }

  return { init: init, setView: setView, selectMonth: selectMonth, setType: setType, onCredorChange: onCredorChange, add: add, remove: remove };

})();

window.addEventListener('DOMContentLoaded', function() { App.init(); });