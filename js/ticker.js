// ============================================================
//  ticker.js — Barra de cotações em tempo real (B3 + cripto)
//  API: brapi.dev (gratuita, sem chave)
// ============================================================

var TICKER_SYMBOLS = [
  // B3 — Ações
  'PETR4','VALE3','ITUB4','BBDC4','BBAS3',
  'ABEV3','WEGE3','RENT3','MGLU3','LREN3',
  // Índices e cripto via brapi
  'IBOV','BTC','ETH'
];

var TICKER_INTERVAL  = 60000; // atualiza a cada 60s
var tickerTimer      = null;
var tickerData       = [];

// ── Inicializa ─────────────────────────────────────────────

function initTicker() {
  fetchTicker();
  tickerTimer = setInterval(fetchTicker, TICKER_INTERVAL);
}

// ── Busca cotações ─────────────────────────────────────────

function fetchTicker() {
  var symbols = TICKER_SYMBOLS.join(',');
  var url = 'https://brapi.dev/api/quote/' + symbols + '?range=1d&interval=1d&fundamental=false';

  fetch(url)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data && data.results) {
        tickerData = data.results;
        renderTicker(tickerData);
      }
    })
    .catch(function(err) {
      console.warn('[Ticker] Erro:', err);
      renderTickerFallback();
    });
}

// ── Renderiza a barra ──────────────────────────────────────

function renderTicker(items) {
  var track = document.getElementById('tickerTrack');
  if (!track) return;

  if (!items || !items.length) { renderTickerFallback(); return; }

  // Monta os itens
  var html = items.map(function(item) {
    var change  = item.regularMarketChangePercent || 0;
    var price   = item.regularMarketPrice || 0;
    var symbol  = item.symbol || '';
    var cls     = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    var arrow   = change > 0 ? '▲' : change < 0 ? '▼' : '●';
    var pctStr  = (change > 0 ? '+' : '') + change.toFixed(2) + '%';

    // Formata preço
    var priceStr = price >= 1
      ? 'R$ ' + price.toFixed(2).replace('.', ',')
      : 'R$ ' + price.toFixed(4).replace('.', ',');

    // BTC/ETH em dólar
    if (symbol === 'BTC' || symbol === 'ETH') {
      priceStr = 'US$ ' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    return '<span class="ticker-item ' + cls + '">' +
        '<span class="ticker-symbol">' + symbol + '</span>' +
        '<span class="ticker-price">' + priceStr + '</span>' +
        '<span class="ticker-change">' + arrow + ' ' + pctStr + '</span>' +
      '</span>' +
      '<span class="ticker-sep">·</span>';
  }).join('');

  // Duplica para loop infinito
  track.innerHTML = '<div class="ticker-inner">' + html + html + '</div>';

  // Ajusta velocidade pela quantidade de itens
  var totalItems = items.length * 2;
  var duration   = totalItems * 3; // 3s por item
  var inner = track.querySelector('.ticker-inner');
  if (inner) inner.style.animationDuration = duration + 's';
}

function renderTickerFallback() {
  var track = document.getElementById('tickerTrack');
  if (!track) return;
  track.innerHTML =
    '<div class="ticker-inner ticker-offline">' +
      '<span class="ticker-item flat"><span class="ticker-symbol">MERCADO</span><span class="ticker-price">Offline</span></span>' +
      '<span class="ticker-sep">·</span>' +
      '<span class="ticker-item flat"><span class="ticker-symbol">Dados indisponíveis no momento</span></span>' +
    '</div>';
}
