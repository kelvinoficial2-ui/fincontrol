// ============================================================
//  firebase.js — Firebase Auth + Firestore
// ============================================================

var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAzZ_vaifxM6Q9WRxKU3c-lsBmaqe02tuE",
  authDomain:        "fincontrol-76e0c.firebaseapp.com",
  projectId:         "fincontrol-76e0c",
  storageBucket:     "fincontrol-76e0c.firebasestorage.app",
  messagingSenderId: "653477643370",
  appId:             "1:653477643370:web:a3f01f541a6e3ac9497613"
};

var db             = null;
var currentUser    = null;
var _saveTimeout   = null;
var _dataLoaded    = false;  // flag: Firebase já carregou uma vez
var _userModified  = false;  // flag: usuário modificou dados após o load

// ── Inicializa ─────────────────────────────────────────────

function initFirebase() {
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();

    // Monitora estado do login
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        currentUser = user;
        onUserLoggedIn(user);
      } else {
        currentUser = null;
        showLoginScreen();
      }
    });
  } catch(e) {
    console.warn('[Firebase] Erro:', e);
  }
}

// ── Login com Google ───────────────────────────────────────

function loginWithGoogle() {
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(function(result) {
      currentUser = result.user;
      onUserLoggedIn(result.user);
    })
    .catch(function(err) {
      console.warn('[Firebase] Erro login:', err);
      // Tenta redirect se popup bloqueado (iOS)
      firebase.auth().signInWithRedirect(provider);
    });
}

function logout() {
  firebase.auth().signOut().then(function() {
    currentUser = null;
    showLoginScreen();
  });
}

// ── Após login bem sucedido ────────────────────────────────

function onUserLoggedIn(user) {
  hideLoginScreen();
  updateUserBadge(user);
  loadFromFirebase();
}

// ── Salva no Firestore ─────────────────────────────────────

function saveToFirebase() {
  if (!db || !currentUser) return;

  var data = getRootData();
  db.collection('usuarios').doc(currentUser.uid).set({
    data:      data,
    email:     currentUser.email,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(function() {
    showSyncBadge('saved');
  })
  .catch(function(err) {
    console.warn('[Firebase] Erro salvar:', err);
    showSyncBadge('error');
  });
}

// ── Carrega do Firestore ───────────────────────────────────

function loadFromFirebase() {
  if (!db || !currentUser) return;

  showSyncBadge('loading');

  db.collection('usuarios').doc(currentUser.uid).get()
    .then(function(doc) {
      // Só carrega se o usuário ainda não modificou dados nesta sessão
      if (!_userModified) {
        if (doc.exists && doc.data().data) {
          localStorage.setItem('fincontrol_v2', JSON.stringify(doc.data().data));
          showSyncBadge('loaded');
        } else {
          showSyncBadge('new');
        }
      }
      _dataLoaded = true;
      if (typeof App !== 'undefined') App.refresh();
    })
    .catch(function(err) {
      console.warn('[Firebase] Erro carregar:', err);
      showSyncBadge('error');
    });
}

// ── Schedule save (debounce 1.5s) ─────────────────────────

function scheduleSave() {
  if (!currentUser) return;
  _userModified = true;  // usuário modificou dados — não deixa Firebase sobrescrever
  if (_saveTimeout) clearTimeout(_saveTimeout);
  showSyncBadge('saving');
  _saveTimeout = setTimeout(function() {
    saveToFirebase();
    // Após salvar com sucesso, reseta a flag
    _userModified = false;
  }, 1500);
}

// ── UI — Tela de login ─────────────────────────────────────

function showLoginScreen() {
  var el = document.getElementById('loginScreen');
  if (el) el.style.display = 'flex';
  var app = document.getElementById('appContent');
  if (app) app.style.display = 'none';
}

function hideLoginScreen() {
  var el = document.getElementById('loginScreen');
  if (el) el.style.display = 'none';
  var app = document.getElementById('appContent');
  if (app) app.style.display = 'block';
}

function updateUserBadge(user) {
  var badge  = document.getElementById('userBadge');
  var avatar = document.getElementById('userAvatar');
  var name   = document.getElementById('userName');
  if (badge)  badge.style.display  = 'flex';
  if (avatar && user.photoURL) avatar.src = user.photoURL;
  if (name)   name.textContent = user.displayName ? user.displayName.split(' ')[0] : user.email;
}

// ── Sync badge ─────────────────────────────────────────────

function showSyncBadge(status) {
  var badge = document.getElementById('syncBadge');
  if (!badge) return;
  var map = {
    saved:   { text: '☁ Salvo',          cls: 'sync-saved'   },
    loaded:  { text: '☁ Sincronizado',   cls: 'sync-saved'   },
    loading: { text: '⏳ Carregando...',  cls: 'sync-saving'  },
    saving:  { text: '⏳ Salvando...',    cls: 'sync-saving'  },
    error:   { text: '⚠ Erro sync',      cls: 'sync-error'   },
    new:     { text: '☁ Pronto',         cls: 'sync-saved'   }
  };
  var s = map[status] || map['saved'];
  badge.textContent = s.text;
  badge.className   = 'sync-badge ' + s.cls;
  badge.style.opacity = '1';
  if (status === 'saved' || status === 'loaded' || status === 'new') {
    setTimeout(function() { badge.style.opacity = '0'; }, 2500);
  }
}
