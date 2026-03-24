// ============================================================
//  ticker.js — Barra de cotações em tempo real (B3 + cripto)
// ============================================================

var TICKER_SYMBOLS = [
  'PETR4','VALE3','ITUB4','BBDC4','BBAS3',
  'ABEV3','WEGE3','MGLU3','LREN3','RENT3'
];

var TICKER_INTERVAL = 60000;
var tickerTimer     = null;

function initTicker() {
  fetchTicker();
  tickerTimer = setInterval(fetchTicker, TICKER_INTERVAL);
}

function fetchTicker() {
  var symbols = TICKER_SYMBOLS.join('%2C');

  // Tenta brapi.dev com token opcional
  var url = 'https://brapi.dev/api/quote/' + symbols + '?range=1d&interval=1d';

  fetch(url, { mode: 'cors' })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (data && data.results && data.results.length) {
        renderTicker(data.results);
      } else {
        fetchTickerFallback();
      }
    })
    .catch(function() {
      fetchTickerFallback();
    });
}

// Fallback: HG Brasil Finance API (sem CORS)
function fetchTickerFallback() {
  var url = 'https://hgbrasil.com/status/finance/ticker/PETR4,VALE3,ITUB4,BBDC4,BBAS3,ABEV3,WEGE3,BTC,USD';

  fetch(url)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data && data.results) {
        var items = [];
        Object.keys(data.results).forEach(function(key) {
          var r = data.results[key];
          if (r && r.price !== undefined) {
            items.push({
              symbol:                      key,
              regularMarketPrice:          r.price,
              regularMarketChangePercent:  r.change_percent || 0
            });
          }
        });
        if (items.length) { renderTicker(items); return; }
      }
      renderTickerStatic();
    })
    .catch(function() {
      renderTickerStatic();
    });
}

// Último recurso: dados estáticos com animação
function renderTickerStatic() {
  var staticData = [
    { symbol: 'PETR4',  regularMarketPrice: 0, regularMarketChangePercent: 0 },
    { symbol: 'VALE3',  regularMarketPrice: 0, regularMarketChangePercent: 0 },
    { symbol: 'ITUB4',  regularMarketPrice: 0, regularMarketChangePercent: 0 },
    { symbol: 'BBDC4',  regularMarketPrice: 0, regularMarketChangePercent: 0 },
    { symbol: 'IBOV',   regularMarketPrice: 0, regularMarketChangePercent: 0 },
    { symbol: 'BTC',    regularMarketPrice: 0, regularMarketChangePercent: 0 },
    { symbol: 'USD/BRL',regularMarketPrice: 0, regularMarketChangePercent: 0 }
  ];

  var track = document.getElementById('tickerTrack');
  if (!track) return;

  track.innerHTML =
    '<div class="ticker-inner ticker-offline">' +
      '<span class="ticker-item flat">' +
        '<span class="ticker-symbol">📡 Mercado</span>' +
        '<span class="ticker-price">fora do horário</span>' +
        '<span class="ticker-change flat">B3: 10h–18h</span>' +
      '</span>' +
      '<span class="ticker-sep">·</span>' +
      '<span class="ticker-item flat"><span class="ticker-symbol">PETR4</span><span class="ticker-price">—</span></span><span class="ticker-sep">·</span>' +
      '<span class="ticker-item flat"><span class="ticker-symbol">VALE3</span><span class="ticker-price">—</span></span><span class="ticker-sep">·</span>' +
      '<span class="ticker-item flat"><span class="ticker-symbol">ITUB4</span><span class="ticker-price">—</span></span><span class="ticker-sep">·</span>' +
      '<span class="ticker-item flat"><span class="ticker-symbol">BBAS3</span><span class="ticker-price">—</span></span><span class="ticker-sep">·</span>' +
      '<span class="ticker-item flat"><span class="ticker-symbol">IBOV</span><span class="ticker-price">—</span></span><span class="ticker-sep">·</span>' +
      '<span class="ticker-item flat"><span class="ticker-symbol">BTC</span><span class="ticker-price">—</span></span><span class="ticker-sep">·</span>' +
      '<span class="ticker-item flat"><span class="ticker-symbol">USD/BRL</span><span class="ticker-price">—</span></span>' +
    '</div>';
}

// ── Renderiza ──────────────────────────────────────────────

function renderTicker(items) {
  var track = document.getElementById('tickerTrack');
  if (!track || !items || !items.length) { renderTickerStatic(); return; }

  var html = items.map(function(item) {
    var change  = item.regularMarketChangePercent || 0;
    var price   = item.regularMarketPrice || 0;
    var symbol  = item.symbol || '';
    var cls     = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    var arrow   = change > 0 ? '▲' : change < 0 ? '▼' : '●';
    var pctStr  = (change > 0 ? '+' : '') + change.toFixed(2) + '%';
    var priceStr;

    if (symbol === 'BTC' || symbol === 'ETH') {
      priceStr = 'US$ ' + Math.round(price).toLocaleString('pt-BR');
    } else if (symbol === 'USD' || symbol === 'USD/BRL') {
      priceStr = 'R$ ' + price.toFixed(4).replace('.', ',');
    } else {
      priceStr = 'R$ ' + price.toFixed(2).replace('.', ',');
    }

    return '<span class="ticker-item ' + cls + '">' +
        '<span class="ticker-symbol">' + symbol + '</span>' +
        '<span class="ticker-price">' + priceStr + '</span>' +
        '<span class="ticker-change">' + arrow + ' ' + pctStr + '</span>' +
      '</span>' +
      '<span class="ticker-sep">·</span>';
  }).join('');

  // Duplica para loop contínuo
  track.innerHTML = '<div class="ticker-inner">' + html + html + '</div>';

  var dur = items.length * 4;
  var inner = track.querySelector('.ticker-inner');
  if (inner) inner.style.animationDuration = dur + 's';
}
