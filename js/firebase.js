// ============================================================
//  firebase.js — Integração com Firebase Firestore
// ============================================================

// Importa Firebase via CDN (compat mode — sem npm)
var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAzZ_vaifxM6Q9WRxKU3c-lsBmaqe02tuE",
  authDomain:        "fincontrol-76e0c.firebaseapp.com",
  projectId:         "fincontrol-76e0c",
  storageBucket:     "fincontrol-76e0c.firebasestorage.app",
  messagingSenderId: "653477643370",
  appId:             "1:653477643370:web:a3f01f541a6e3ac9497613"
};

// ── Inicializa ─────────────────────────────────────────────

var db = null;

function initFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.firestore();
    console.log('[Firebase] Conectado!');
    loadFromFirebase();
  } catch(e) {
    console.warn('[Firebase] Erro ao inicializar:', e);
  }
}

// ── ID do usuário (simples, baseado no device) ─────────────
// Futuramente pode virar login real

function getUserId() {
  var uid = localStorage.getItem('fincontrol_uid');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('fincontrol_uid', uid);
  }
  return uid;
}

// ── Salva todos os dados no Firestore ─────────────────────

function saveToFirebase() {
  if (!db) return;

  var uid  = getUserId();
  var data = getRootData();

  db.collection('usuarios').doc(uid).set({
    data:        data,
    updatedAt:   firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(function() {
    console.log('[Firebase] Dados salvos!');
    showSyncBadge('saved');
  })
  .catch(function(err) {
    console.warn('[Firebase] Erro ao salvar:', err);
    showSyncBadge('error');
  });
}

// ── Carrega dados do Firestore ─────────────────────────────

function loadFromFirebase() {
  if (!db) return;

  var uid = getUserId();

  db.collection('usuarios').doc(uid).get()
    .then(function(doc) {
      if (doc.exists && doc.data().data) {
        var remoteData = doc.data().data;

        // Mescla com localStorage (Firebase tem prioridade)
        localStorage.setItem('fincontrol_v2', JSON.stringify(remoteData));
        console.log('[Firebase] Dados carregados!');
        showSyncBadge('loaded');

        // Recarrega a view atual
        if (typeof App !== 'undefined') App.refresh();

      } else {
        console.log('[Firebase] Nenhum dado remoto ainda.');
        showSyncBadge('new');
      }
    })
    .catch(function(err) {
      console.warn('[Firebase] Erro ao carregar:', err);
      showSyncBadge('error');
    });
}

// ── Badge de sincronização ─────────────────────────────────

function showSyncBadge(status) {
  var badge = document.getElementById('syncBadge');
  if (!badge) return;

  var map = {
    saved:  { text: '☁ Salvo',      cls: 'sync-saved'  },
    loaded: { text: '☁ Sincronizado', cls: 'sync-saved' },
    error:  { text: '⚠ Erro sync',  cls: 'sync-error'  },
    new:    { text: '☁ Novo',        cls: 'sync-saved'  },
    saving: { text: '⏳ Salvando...', cls: 'sync-saving' }
  };

  var s = map[status] || map['saved'];
  badge.textContent  = s.text;
  badge.className    = 'sync-badge ' + s.cls;
  badge.style.opacity = '1';

  setTimeout(function() {
    badge.style.opacity = '0';
  }, 2500);
}

// ── Chama saveToFirebase após qualquer mudança nos dados ───

var _saveTimeout = null;

function scheduleSave() {
  if (_saveTimeout) clearTimeout(_saveTimeout);
  showSyncBadge('saving');
  _saveTimeout = setTimeout(saveToFirebase, 1000); // debounce 1s
}
