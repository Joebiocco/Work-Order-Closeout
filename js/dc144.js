/* dc144.js — NJDOT DC-144 Field Form Tool
   Depends on: ExcelJS (CDN), ft_photos IDB (v2), field_dark_mode localStorage
   ========================================================================= */

'use strict';

/* ============================================================
   1. CONSTANTS & CELL MAP
   ============================================================ */

var DC144_RECENT_KEY    = 'ft_dc144_recent';
var DC144_MAX_RECENT    = 5;
var DC144_TEMPLATES_KEY = 'ft_dc144_templates';
var DC144_MAX_TEMPLATES = 10;
var IDB_DB_NAME         = 'ft_photos';
var IDB_DB_VERSION      = 2;
var IDB_WO_STORE        = 'session_photos';
var IDB_DC144_STORE     = 'dc144_sessions';
var TEMPLATE_URL        = '../data/dc144-template.xlsx';

/* Absolute cell coordinates for every writable field.
   All row/col values are 1-based, matching the ExcelJS API. */
var DC144_CELL_MAP = {
  a: {
    header: {
      projectName:   { r: 5,  c: 3 },
      contractId:    { r: 6,  c: 3 },
      contractor:    { r: 7,  c: 3 },
      inspectorName: { r: 9,  c: 5 },
      date:          { r: 9,  c: 13 },
      weatherAMCond: { r: 11, c: 3 },
      weatherAMHigh: { r: 11, c: 4 },
      weatherAMLow:  { r: 11, c: 6 },
      weatherPMCond: { r: 12, c: 3 },
      weatherPMHigh: { r: 12, c: 4 },
      weatherPMLow:  { r: 12, c: 6 }
    },
    payItems: {
      baseRow: 16,
      maxRows: 17,
      cols: {
        itemNo:        1,
        description:   3,
        itemCode:      7,
        planPageNum:   8,
        location:      9,
        subcontractor: 13,
        placedQty:     14,
        asBuiltQty:    15
      }
    },
    remarks: {
      environmental:    { r: 33, c: 1 },
      trafficControl:   { r: 36, c: 1 },
      workObservations: { r: 42, c: 1 }
    },
    workHours: {
      regularCol:  4,
      overtimeCol: 5,
      rows: {
        re:              65,
        nonRESupervisor: 66,
        office:          67,
        general:         68,
        earth:           69,
        drainage:        70,
        aggregates:      71,
        curbSidewalk:    72,
        paving:          73,
        structures:      74,
        utilities:       75,
        electrical:      76,
        guideRail:       77,
        safety:          78,
        miscellaneous:   79,
        benefitLeave:    81,
        training:        82,
        loanedOff:       83
      }
    }
  },
  b: {
    header: {
      projectName:     { r: 5,  c: 3 },
      contractId:      { r: 6,  c: 3 },
      contractor:      { r: 7,  c: 3 },
      itemNumber:      { r: 8,  c: 3 },
      itemDescription: { r: 8,  c: 7 },
      itemCode:        { r: 8,  c: 15 },
      inspectorName:   { r: 10, c: 5 },
      date:            { r: 10, c: 15 }
    },
    hmaPavingRows: {
      baseRow: 15,
      maxRows: 19,
      formulaProtectedRows: [33],
      cols: {
        locationStation: 1,
        lane:            6,
        lift:            7,
        thickness:       8,
        mixNo:           9,
        lotNo:           10,
        poundsReceived:  11,
        poundsPlaced:    13,
        syLaid:          16,
        lbsPerSY:        17
      }
    },
    workObservations: { r: 35, c: 1 },
    temperature: {
      producer: { r: 39, c: 3 },
      mix1: { mixNo: { r: 39, c: 6 }, highestF: { r: 40, c: 7 }, lowestF: { r: 40, c: 8 }, avgF: { r: 40, c: 9 } },
      mix2: { mixNo: { r: 41, c: 6 }, highestF: { r: 41, c: 7 }, lowestF: { r: 41, c: 8 }, avgF: { r: 41, c: 9 } }
    }
  },
  c: {
    header: {
      projectName:     { r: 5,  c: 3 },
      contractId:      { r: 6,  c: 3 },
      contractor:      { r: 7,  c: 3 },
      itemNumber:      { r: 8,  c: 3 },
      itemDescription: { r: 8,  c: 7 },
      itemCode:        { r: 8,  c: 16 },
      inspectorName:   { r: 11, c: 5 },
      date:            { r: 11, c: 16 }
    },
    materialInfo: {
      gradeOfMaterial:  { r: 16, c: 1 },
      producerLocation: { r: 16, c: 6 },
      haulerLocation:   { r: 16, c: 12 }
    },
    applicationRows: {
      baseRow: 20,
      maxRows: 18,
      cols: {
        locationStation:     1,
        lane:                6,
        lotNo:               7,
        tankNo:              8,
        truckNo:             9,
        gaugeStart:          10,
        gaugeFinish:         11,
        tempOfMaterial:      12,
        conversionFactor:    13,
        gallonsAppliedGross: 14,
        gallonsApplied60F:   15,
        areaSY:              16,
        rateGPerSY:          17
      }
    },
    specifiedTempRange:         { r: 36, c: 5 },
    specifiedRateOfApplication: { r: 37, c: 5 },
    workObservations:           { r: 38, c: 5 }
  },
  d: {
    header: {
      projectName:     { r: 5,  c: 3 },
      contractId:      { r: 6,  c: 3 },
      contractor:      { r: 7,  c: 3 },
      itemNumber:      { r: 8,  c: 3 },
      itemDescription: { r: 8,  c: 7 },
      itemCode:        { r: 8,  c: 16 },
      inspectorName:   { r: 10, c: 5 },
      date:            { r: 10, c: 14 }
    },
    pileDescriptor: {
      structure:  { r: 15, c: 1 },
      location:   { r: 15, c: 7 },
      typeHammer: { r: 15, c: 14 }
    },
    pileRows: {
      baseRow: 19,
      maxRows: 24,
      cols: {
        pileNo:            1,
        lengthInLead:      2,
        timberDiaTip:      4,
        timberDiaButt:     5,
        spliceLength:      6,
        spliceFrom:        7,
        penetrationLength: 8,
        blows5ft:          9,
        blows4ft:          10,
        blows3ft:          11,
        blows2ft:          12,
        blows1ft:          13,
        blowsLastInch:     14,
        notes:             15
      }
    },
    workObservations: { r: 41, c: 3 }
  }
};

var TAB_META = {
  a: {
    label: 'DC-144 (a)',
    name:  'Daily Work Report',
    desc:  'Core daily log: pay items, weather conditions, work hours matrix, and field observations.',
    color: '#4338ca',
    colorBg: 'rgba(67,56,202,0.10)',
    sheetName: 'DC-144 (a) Daily Work Report'
  },
  b: {
    label: 'DC-144 (b)',
    name:  'HMA Supplement',
    desc:  'Hot Mix Asphalt paving log: station data, lift/thickness, tonnage, and core temperatures.',
    color: '#92400e',
    colorBg: 'rgba(146,64,14,0.10)',
    sheetName: 'DC-144 (b) HMA Supplement'
  },
  c: {
    label: 'DC-144 (c)',
    name:  'Bituminous Materials',
    desc:  'Tack/prime coat application: gauge readings, gallons applied, area covered, and conversion.',
    color: '#0e7490',
    colorBg: 'rgba(14,116,144,0.10)',
    sheetName: 'DC-144 (c) Bituminous Materials'
  },
  d: {
    label: 'DC-144 (d)',
    name:  'Pile Driving Supplement',
    desc:  'Structural piling log: blow counts per foot and inch, splice data, penetration, and notes.',
    color: '#9f1239',
    colorBg: 'rgba(159,18,57,0.10)',
    sheetName: 'DC-144 (d) Pile Driving Suppl.'
  }
};

var WORK_HOURS_CATEGORIES = [
  { key: 're',              label: 'RE',                  excelRow: 65 },
  { key: 'nonRESupervisor', label: 'Non-RE Supervision',  excelRow: 66 },
  { key: 'office',          label: 'Office',              excelRow: 67 },
  { key: 'general',         label: 'General',             excelRow: 68 },
  { key: 'earth',           label: 'Earth',               excelRow: 69 },
  { key: 'drainage',        label: 'Drainage',            excelRow: 70 },
  { key: 'aggregates',      label: 'Aggregates',          excelRow: 71 },
  { key: 'curbSidewalk',    label: 'Curb and Sidewalk',   excelRow: 72 },
  { key: 'paving',          label: 'Paving',              excelRow: 73 },
  { key: 'structures',      label: 'Structures',          excelRow: 74 },
  { key: 'utilities',       label: 'Utilities',           excelRow: 75 },
  { key: 'electrical',      label: 'Electrical',          excelRow: 76 },
  { key: 'guideRail',       label: 'Guide Rail',          excelRow: 77 },
  { key: 'safety',          label: 'Safety',              excelRow: 78 },
  { key: 'miscellaneous',   label: 'Miscellaneous',       excelRow: 79 },
  { key: 'benefitLeave',    label: 'Benefit Leave',       excelRow: 81 },
  { key: 'training',        label: 'Training',            excelRow: 82 },
  { key: 'loanedOff',       label: 'Loaned off Project',  excelRow: 83 }
];

/* ============================================================
   2. APPLICATION STATE
   ============================================================ */

var currentSession      = null;
var currentTab          = null;
var autosaveTimer       = null;
var autosaveStatusTimer = null;
var templateCache       = null;
var photoTargetKey      = null;
var idbConn             = null;

/* ============================================================
   3. INDEXEDDB
   ============================================================ */

function openPhotoDB() {
  if (idbConn) return Promise.resolve(idbConn);
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION);
    req.onupgradeneeded = function(event) {
      var db = event.target.result;
      var oldVersion = event.oldVersion;
      if (oldVersion < 1) {
        db.createObjectStore(IDB_WO_STORE);
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(IDB_DC144_STORE)) {
          db.createObjectStore(IDB_DC144_STORE);
        }
      }
    };
    req.onsuccess = function(e) { idbConn = e.target.result; resolve(idbConn); };
    req.onerror   = function(e) { reject(e.target.error); };
  });
}

function dbPutDC144(key, data) {
  return openPhotoDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx  = db.transaction(IDB_DC144_STORE, 'readwrite');
      var req = tx.objectStore(IDB_DC144_STORE).put(data, key);
      req.onsuccess = function() { resolve(); };
      req.onerror   = function(e) { reject(e.target.error); };
    });
  });
}

function dbGetDC144(key) {
  return openPhotoDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx  = db.transaction(IDB_DC144_STORE, 'readonly');
      var req = tx.objectStore(IDB_DC144_STORE).get(key);
      req.onsuccess = function(e) { resolve(e.target.result || null); };
      req.onerror   = function(e) { reject(e.target.error); };
    });
  });
}

function dbDeleteDC144(key) {
  if (!key) return;
  openPhotoDB().then(function(db) {
    var tx = db.transaction(IDB_DC144_STORE, 'readwrite');
    tx.objectStore(IDB_DC144_STORE).delete(key);
  }).catch(function() {});
}

/* ============================================================
   4. LOCALSTORAGE — recent sessions list (metadata only)
   ============================================================ */

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(DC144_RECENT_KEY) || '[]'); } catch(e) { return []; }
}

function saveRecent(arr) {
  var slim = arr.slice(0, DC144_MAX_RECENT).map(function(r) {
    return {
      photoKey:      r.photoKey,
      tab:           r.tab,
      projectName:   r.projectName   || '',
      contractId:    r.contractId    || '',
      date:          r.date          || '',
      inspectorName: r.inspectorName || '',
      rowCount:      r.rowCount      || 0,
      photoCount:    r.photoCount    || 0,
      savedAt:       r.savedAt       || new Date().toISOString()
    };
  });
  try { localStorage.setItem(DC144_RECENT_KEY, JSON.stringify(slim)); } catch(e) {}
}

function addToRecent(session) {
  var arr = loadRecent();
  arr = arr.filter(function(r) { return r.photoKey !== session.photoKey; });
  var meta = {
    photoKey:      session.photoKey,
    tab:           session.tab,
    projectName:   (session.header && session.header.projectName)   || 'Untitled Project',
    contractId:    (session.header && session.header.contractId)    || '',
    date:          (session.header && session.header.date)          || '',
    inspectorName: (session.header && session.header.inspectorName) || '',
    rowCount:      getSessionRowCount(session),
    photoCount:    (session.photos && session.photos.length) || 0,
    savedAt:       new Date().toISOString()
  };
  arr.unshift(meta);
  if (arr.length > DC144_MAX_RECENT) {
    arr.splice(DC144_MAX_RECENT).forEach(function(r) { dbDeleteDC144(r.photoKey); });
  }
  saveRecent(arr);
}

function getSessionRowCount(session) {
  if (!session || !session.tab) return 0;
  var s = session.section;
  if (!s) return 0;
  if (session.tab === 'a' && s.payItems)        return s.payItems.length;
  if (session.tab === 'b' && s.hmaPavingRows)   return s.hmaPavingRows.length;
  if (session.tab === 'c' && s.applicationRows) return s.applicationRows.length;
  if (session.tab === 'd' && s.pileRows)        return s.pileRows.length;
  return 0;
}

/* ============================================================
   5. SESSION SCHEMA FACTORIES
   ============================================================ */

function createBlankSession(tab) {
  return {
    schemaVersion: 1,
    formId:   'dc144',
    tab:      tab,
    photoKey: 'pk_' + Date.now(),
    savedAt:  new Date().toISOString(),
    header: {
      projectName:   '',
      contractId:    '',
      contractor:    '',
      inspectorName: '',
      date:          todayISO(),
      weatherAMCond: '',
      weatherAMHigh: '',
      weatherAMLow:  '',
      weatherPMCond: '',
      weatherPMHigh: '',
      weatherPMLow:  ''
    },
    itemHeader: (tab !== 'a') ? { itemNumber: '', description: '', itemCode: '' } : null,
    section:    buildBlankSection(tab),
    photos:     []
  };
}

function buildBlankSection(tab) {
  if (tab === 'a') {
    var wh = {};
    WORK_HOURS_CATEGORIES.forEach(function(cat) { wh[cat.key] = { regular: '', overtime: '' }; });
    return {
      payItems: [],
      remarks:  { environmental: '', trafficControl: '', workObservations: '' },
      workHours: wh
    };
  }
  if (tab === 'b') {
    return {
      hmaPavingRows:    [],
      workObservations: '',
      temperature: {
        producer: '',
        mix1: { mixNo: '', highestF: '', lowestF: '', avgF: '' },
        mix2: { mixNo: '', highestF: '', lowestF: '', avgF: '' }
      }
    };
  }
  if (tab === 'c') {
    return {
      materialInfo:               { gradeOfMaterial: '', producerLocation: '', haulerLocation: '' },
      applicationRows:            [],
      specifiedTempRange:         '',
      specifiedRateOfApplication: '',
      workObservations:           ''
    };
  }
  if (tab === 'd') {
    return {
      pileDescriptor:   { structure: '', location: '', typeHammer: '' },
      pileRows:         [],
      workObservations: ''
    };
  }
  return {};
}

function blankPayItemRow(rowIndex) {
  return {
    rowIndex: rowIndex,
    itemNo: '', description: '', itemCode: '', planPageNum: '',
    location: '', subcontractor: '',
    placedQty: '', placedQtyUnit: 'UNIT', placedQtyUnitCustom: '',
    asBuiltQty: '', asBuiltQtyUnit: 'UNIT', asBuiltQtyUnitCustom: ''
  };
}
function blankHMARow(rowIndex) {
  return { rowIndex: rowIndex, locationStation: '', lane: '', lift: '', thickness: '', mixNo: '', lotNo: '', poundsReceived: '', poundsPlaced: '', syLaid: '', lbsPerSY: '' };
}
function blankApplicationRow(rowIndex) {
  return { rowIndex: rowIndex, locationStation: '', lane: '', lotNo: '', tankNo: '', truckNo: '', gaugeStart: '', gaugeFinish: '', tempOfMaterial: '', conversionFactor: '', gallonsAppliedGross: '', gallonsApplied60F: '', areaSY: '', rateGPerSY: '' };
}
function blankPileRow(rowIndex) {
  return { rowIndex: rowIndex, pileNo: '', lengthInLead: '', timberDiaTip: '', timberDiaButt: '', spliceLength: '', spliceFrom: '', penetrationLength: '', blows5ft: '', blows4ft: '', blows3ft: '', blows2ft: '', blows1ft: '', blowsLastInch: '', notes: '' };
}

function todayISO() {
  var d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate());
}
function pad2(n) { return n < 10 ? '0'+n : String(n); }

/* ============================================================
   6. TOAST
   ============================================================ */

function showToast(msg, type, dur) {
  var ct = document.getElementById('toast-ct');
  if (!ct) return;
  var t = document.createElement('div');
  t.className = 'toast ' + (type || 'info');
  t.setAttribute('role', type === 'err' ? 'alert' : 'status');
  t.textContent = msg;
  ct.appendChild(t);
  setTimeout(function() {
    t.classList.add('out');
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
  }, dur || 2400);
}

/* ============================================================
   7. AUTO-SAVE & STATUS INDICATOR
   ============================================================ */

function setAutosaveStatus(status) {
  var el = document.getElementById('autosave-status');
  if (!el) return;
  clearTimeout(autosaveStatusTimer);
  if (status === 'saving') {
    el.textContent = 'Saving…';
    el.style.color = 'var(--muted)';
  } else if (status === 'saved') {
    el.textContent = 'Draft Saved';
    el.style.color = '#16a34a';
    autosaveStatusTimer = setTimeout(function() { el.textContent = ''; }, 3000);
  } else {
    el.textContent = '';
  }
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  setAutosaveStatus('saving');
  autosaveTimer = setTimeout(function() { performAutosave(false); }, 2000);
}

function performAutosave(manual) {
  if (!currentSession || !currentTab) return;
  collectFormData();
  currentSession.savedAt = new Date().toISOString();
  dbPutDC144(currentSession.photoKey, currentSession).then(function() {
    addToRecent(currentSession);
    setAutosaveStatus('saved');
    if (manual) showToast('Draft saved', 'ok', 2000);
  }).catch(function() {
    setAutosaveStatus('');
    showToast('Save failed — storage error', 'err');
  });
}

/* ============================================================
   8. NAVIGATION
   ============================================================ */

function handleTopbarBack() {
  var formScreen = document.getElementById('form-screen');
  if (formScreen && formScreen.style.display !== 'none') {
    // Inside form — go back to dashboard (no page navigation)
    showDashboard();
  } else {
    // On dashboard — exit back to hub with slide-out animation
    try { sessionStorage.setItem('ft_returning_to_hub', '1'); } catch(_) {}
    document.documentElement.classList.add('exiting-to-hub');
    setTimeout(function() { window.location.href = '../index.html'; }, 280);
  }
}

function showDashboard() {
  document.getElementById('form-screen').style.display      = 'none';
  document.getElementById('dashboard-screen').style.display = '';
  document.getElementById('topbar-title').textContent       = 'DC-144 Field Form';
  document.getElementById('topbar-export-btn').style.display = 'none';
  // Reset actionbar top to default (topbar is visible on dashboard)
  updateActionbarTop(false);
  currentTab     = null;
  currentSession = null;
  renderRecentChips();
  renderTemplateChips();
}

function showForm(tab, session) {
  currentTab     = tab;
  currentSession = session;
  document.getElementById('dashboard-screen').style.display = 'none';
  document.getElementById('form-screen').style.display      = '';
  document.getElementById('topbar-title').textContent       = TAB_META[tab].label;
  document.getElementById('topbar-export-btn').style.display = '';
  document.getElementById('form-actionbar-title').textContent = TAB_META[tab].label + ' — ' + TAB_META[tab].name;
  setAutosaveStatus('');
  renderForm(tab, session);
}

/* ============================================================
   9. DASHBOARD RENDERING
   ============================================================ */

function renderDashboard() {
  renderTabCards();
  renderRecentChips();
  renderTemplateChips();
}

function renderTabCards() {
  var grid = document.getElementById('tab-cards-grid');
  if (!grid) return;
  grid.innerHTML = '';
  ['a','b','c','d'].forEach(function(tab) {
    var meta = TAB_META[tab];
    var card = document.createElement('button');
    card.className = 'tab-card';
    card.setAttribute('aria-label', 'Start ' + meta.name);
    card.innerHTML =
      '<span style="position:absolute;left:0;top:0;bottom:0;width:4px;background:' + meta.color + ';border-radius:12px 0 0 12px;" aria-hidden="true"></span>' +
      '<div class="tab-card-top">' +
        '<div class="tab-badge" style="background:' + meta.colorBg + ';color:' + meta.color + ';">' + tab.toUpperCase() + '</div>' +
        '<div class="tab-card-meta">' +
          '<div class="tab-card-label" style="color:' + meta.color + ';">' + meta.label + '</div>' +
          '<div class="tab-card-name">' + meta.name + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tab-card-desc">' + meta.desc + '</div>' +
      '<div class="tab-card-arrow">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
      '</div>';
    card.addEventListener('click', function() { startNewSession(tab, null); });
    grid.appendChild(card);
  });
}

function renderRecentChips() {
  var container = document.getElementById('recent-chips-container');
  if (!container) return;
  var arr = loadRecent();
  if (!arr.length) {
    container.innerHTML = '<div class="chips-empty">No recent drafts. Start a new report above.</div>';
    return;
  }
  var list = document.createElement('div');
  list.className = 'session-chips-list';
  arr.forEach(function(rec) {
    var meta = TAB_META[rec.tab] || TAB_META['a'];
    var chip = document.createElement('div');
    chip.className = 'session-chip';
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('aria-label', 'Resume ' + (rec.projectName || 'Untitled') + ' — ' + rec.tab.toUpperCase());
    var rowLabel   = rec.rowCount  === 1 ? '1 row'   : rec.rowCount  + ' rows';
    var photoLabel = rec.photoCount === 1 ? '1 photo' : rec.photoCount + ' photos';
    var dateLabel  = rec.date ? rec.date : 'No date';
    chip.innerHTML =
      '<div class="session-chip-tab" style="background:' + meta.colorBg + ';color:' + meta.color + ';">' + rec.tab.toUpperCase() + '</div>' +
      '<div class="session-chip-info">' +
        '<div class="session-chip-project">' + esc(rec.projectName || 'Untitled Project') + '</div>' +
        '<div class="session-chip-meta">' + esc(dateLabel) + (rec.contractId ? ' · ' + esc(rec.contractId) : '') + '</div>' +
        '<div class="session-chip-badges">' +
          '<span class="chip-badge">' + esc(meta.label) + '</span>' +
          (rec.rowCount  ? '<span class="chip-badge">' + rowLabel + '</span>'   : '') +
          (rec.photoCount ? '<span class="chip-badge">' + photoLabel + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<button class="session-chip-del" data-key="' + esc(rec.photoKey) + '" aria-label="Delete this draft">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>';
    chip.addEventListener('click', function(e) {
      if (e.target.closest('.session-chip-del')) return;
      restoreSession(rec.photoKey, rec.tab);
    });
    chip.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!e.target.classList.contains('session-chip-del')) restoreSession(rec.photoKey, rec.tab);
      }
    });
    chip.querySelector('.session-chip-del').addEventListener('click', function(e) {
      e.stopPropagation();
      deleteSession(rec.photoKey);
    });
    list.appendChild(chip);
  });
  container.innerHTML = '';
  container.appendChild(list);
}

function startNewSession(tab, tplData) {
  var session = createBlankSession(tab);
  // Pre-populate header fields from template if provided
  if (tplData && tplData.header) {
    Object.keys(tplData.header).forEach(function(k) {
      if (session.header.hasOwnProperty(k)) session.header[k] = tplData.header[k];
    });
  }
  dbPutDC144(session.photoKey, session).then(function() {
    addToRecent(session);
    showForm(tab, session);
  }).catch(function() {
    showForm(tab, session);
  });
}

function restoreSession(photoKey, tab) {
  dbGetDC144(photoKey).then(function(session) {
    if (!session) { showToast('Draft not found — may have been cleared', 'err'); return; }
    showForm(tab, session);
  }).catch(function() { showToast('Could not load draft', 'err'); });
}

function deleteSession(photoKey) {
  dbDeleteDC144(photoKey);
  var arr = loadRecent().filter(function(r) { return r.photoKey !== photoKey; });
  saveRecent(arr);
  renderRecentChips();
  showToast('Draft deleted', 'info', 1800);
}

/* ============================================================
   10. TEMPLATE SYSTEM
   ============================================================ */

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(DC144_TEMPLATES_KEY) || '[]'); } catch(e) { return []; }
}

function saveTemplatesArr(arr) {
  try { localStorage.setItem(DC144_TEMPLATES_KEY, JSON.stringify(arr.slice(0, DC144_MAX_TEMPLATES))); } catch(e) {}
}

function addTemplate(name, session) {
  var arr = loadTemplates();
  var entry = {
    id:        'tpl_' + Date.now(),
    name:      name,
    createdAt: new Date().toISOString(),
    header: {
      projectName:   (session.header && session.header.projectName)   || '',
      contractId:    (session.header && session.header.contractId)    || '',
      contractor:    (session.header && session.header.contractor)    || '',
      inspectorName: (session.header && session.header.inspectorName) || ''
    }
  };
  arr.unshift(entry);
  if (arr.length > DC144_MAX_TEMPLATES) arr = arr.slice(0, DC144_MAX_TEMPLATES);
  saveTemplatesArr(arr);
  return entry;
}

function deleteTemplate(id) {
  var arr = loadTemplates().filter(function(t) { return t.id !== id; });
  saveTemplatesArr(arr);
  renderTemplateChips();
  showToast('Template deleted', 'info', 1800);
}

function openTemplateModal() {
  if (!currentSession) return;
  var modal = document.getElementById('template-modal');
  var input = document.getElementById('template-name-input');
  if (!modal) return;
  if (input) {
    input.value = (currentSession.header && currentSession.header.projectName) || '';
    input.style.borderColor = '';
  }
  modal.classList.add('open');
  if (input) requestAnimationFrame(function() { input.focus(); input.select(); });
}

function closeTemplateModal() {
  var modal = document.getElementById('template-modal');
  if (modal) modal.classList.remove('open');
}

function confirmSaveTemplate() {
  var input = document.getElementById('template-name-input');
  var name  = (input && input.value.trim()) || '';
  if (!name) {
    if (input) { input.focus(); input.style.borderColor = 'var(--red)'; }
    return;
  }
  if (input) input.style.borderColor = '';
  addTemplate(name, currentSession);
  closeTemplateModal();
  showToast('Template saved: ' + name, 'ok', 2400);
}

function renderTemplateChips() {
  var container = document.getElementById('templates-chips-container');
  if (!container) return;
  var arr = loadTemplates();
  if (!arr.length) {
    container.innerHTML = '<div class="chips-empty" style="padding:16px 0;">No templates yet. Fill in a form header and tap “Save as Template” to create one.</div>';
    return;
  }
  container.innerHTML = '';
  arr.forEach(function(tpl) {
    var chip = document.createElement('div');
    chip.className = 'template-chip';
    chip.style.marginBottom = '8px';
    var dateStr = tpl.createdAt ? tpl.createdAt.slice(0, 10) : '';
    var subLine = [tpl.header.projectName, tpl.header.contractId, dateStr].filter(Boolean).join(' · ');
    chip.innerHTML =
      '<div class="template-chip-icon" aria-hidden="true">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>' +
      '</div>' +
      '<div class="template-chip-info">' +
        '<div class="template-chip-name">' + esc(tpl.name) + '</div>' +
        (subLine ? '<div class="template-chip-meta">' + esc(subLine) + '</div>' : '') +
      '</div>' +
      '<button class="template-chip-load" aria-label="Load template ' + esc(tpl.name) + '">Load</button>' +
      '<button class="template-chip-del" aria-label="Delete template ' + esc(tpl.name) + '">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>';
    chip.querySelector('.template-chip-load').addEventListener('click', function() {
      showTemplateTabPicker(tpl);
    });
    chip.querySelector('.template-chip-del').addEventListener('click', function() {
      deleteTemplate(tpl.id);
    });
    container.appendChild(chip);
  });
}

function showTemplateTabPicker(tpl) {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8500;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;padding:20px;';
  var box = document.createElement('div');
  box.style.cssText = 'background:var(--surface);border-radius:12px;padding:24px;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);border:1.5px solid var(--border);font-family:var(--sans);';
  box.innerHTML =
    '<div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px;">Load Template</div>' +
    '<div style="font-size:13px;color:var(--muted);margin-bottom:16px;">' + esc(tpl.name) + ' — Select a form type:</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
      ['a','b','c','d'].map(function(tab) {
        var m = TAB_META[tab];
        return '<button style="padding:12px 8px;background:' + m.colorBg + ';border:1.5px solid ' + m.color + ';border-radius:8px;cursor:pointer;font-family:var(--sans);font-size:12px;font-weight:700;color:' + m.color + ';line-height:1.3;" data-tab-pick="' + tab + '">' + m.label + '<br><span style="font-weight:500;font-size:11px;">' + m.name + '</span></button>';
      }).join('') +
    '</div>' +
    '<div style="margin-top:14px;text-align:right;">' +
      '<button data-cancel style="padding:7px 14px;background:none;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-family:var(--sans);font-size:13px;color:var(--muted);">Cancel</button>' +
    '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  box.querySelectorAll('[data-tab-pick]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.body.removeChild(overlay);
      startNewSession(btn.dataset.tabPick, tpl);
    });
  });
  box.querySelector('[data-cancel]').addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) document.body.removeChild(overlay);
  });
}

/* ============================================================
   11. FORM RENDERING (master dispatcher)
   ============================================================ */

function renderForm(tab, session) {
  var container = document.getElementById('form-content');
  container.innerHTML = '';
  container.appendChild(renderHeaderSection(tab, session));
  if (tab !== 'a') container.appendChild(renderItemHeaderSection(tab, session));
  if (tab === 'a')      container.appendChild(renderSectionA(session));
  else if (tab === 'b') container.appendChild(renderSectionB(session));
  else if (tab === 'c') container.appendChild(renderSectionC(session));
  else if (tab === 'd') container.appendChild(renderSectionD(session));
  container.appendChild(renderPhotosSection(session));
  wireFormAutosave();
}

/* ── 11a. Header section ──────────────────────────────────── */
function renderHeaderSection(tab, session) {
  var h    = session.header || {};
  var card = makeCard('Header Information',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  );
  var body = card.querySelector('.section-card-body');
  body.innerHTML =
    '<div class="field-group" style="grid-template-columns:1fr 1fr;">' +
      fieldHtml('projectName',   'Project Name',           h.projectName,   'text', 'full-grid-span') +
    '</div>' +
    '<div class="field-group" style="grid-template-columns:1fr 1fr;">' +
      fieldHtml('contractId',    'Contract ID',            h.contractId)   +
      fieldHtml('contractor',    'Contractor',             h.contractor)   +
    '</div>' +
    '<div class="field-group" style="grid-template-columns:1fr 1fr;">' +
      fieldHtml('inspectorName', 'Inspector Printed Name', h.inspectorName)+
      fieldHtml('date',          'Date',                   h.date, 'date') +
    '</div>' +
    (tab === 'a' ? renderWeatherHtml(h) : '');
  var projWrap = body.querySelector('[data-field="projectName"]');
  if (projWrap) projWrap.style.gridColumn = '1 / -1';
  return card;
}

function renderWeatherHtml(h) {
  return '<div style="border-top:1px solid var(--border-lo);margin-top:6px;padding-top:14px;">' +
    '<div style="font-size:12px;font-weight:700;color:var(--muted2);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:12px;">Weather / Temperature</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
      '<div>' +
        '<div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:6px;letter-spacing:0.04em;">AM</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
          fieldHtml('weatherAMCond', 'Condition', h.weatherAMCond) +
          fieldHtml('weatherAMHigh', 'High °F', h.weatherAMHigh, 'number') +
          fieldHtml('weatherAMLow',  'Low °F',  h.weatherAMLow,  'number') +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:6px;letter-spacing:0.04em;">PM</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
          fieldHtml('weatherPMCond', 'Condition', h.weatherPMCond) +
          fieldHtml('weatherPMHigh', 'High °F', h.weatherPMHigh, 'number') +
          fieldHtml('weatherPMLow',  'Low °F',  h.weatherPMLow,  'number') +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ── 11b. Item header section (tabs b/c/d) ──────────────── */
function renderItemHeaderSection(tab, session) {
  var ih   = session.itemHeader || {};
  var card = makeCard('Pay Item Information',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
  );
  var body = card.querySelector('.section-card-body');
  body.innerHTML =
    '<div class="field-group" style="grid-template-columns:1fr 1fr 1fr;">' +
      fieldHtml('ih_itemNumber',  'Item #',      ih.itemNumber)  +
      fieldHtml('ih_description', 'Description', ih.description) +
      fieldHtml('ih_itemCode',    'Item Code',   ih.itemCode)    +
    '</div>';
  return card;
}

/* ============================================================
   12. TAB A — Daily Work Report
   ============================================================ */

function renderSectionA(session) {
  var frag = document.createDocumentFragment();
  var s    = session.section;

  var payCard = makeCard('Pay Items',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
  );
  payCard.querySelector('.section-card-body').style.padding = '0';
  payCard.querySelector('.section-card-body').appendChild(buildDynamicTable('a', s.payItems));
  frag.appendChild(payCard);

  frag.appendChild(renderRemarksCard('Environmental Remarks', 'environmental', s.remarks.environmental, 'a'));
  frag.appendChild(renderRemarksCard('Traffic Control Safety Remarks', 'trafficControl', s.remarks.trafficControl, 'a'));
  frag.appendChild(renderRemarksCard('Work Observations and Remarks', 'workObservations', s.remarks.workObservations, 'a'));

  var hoursCard = makeCard('Work Hours',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  );
  hoursCard.querySelector('.section-card-body').style.padding = '0';
  hoursCard.querySelector('.section-card-body').appendChild(buildWorkHoursTable(s.workHours));
  frag.appendChild(hoursCard);

  var wrapper = document.createElement('div');
  wrapper.appendChild(frag);
  return wrapper;
}

function buildWorkHoursTable(workHours) {
  var table = document.createElement('table');
  table.className = 'hours-table';
  table.innerHTML =
    '<thead><tr>' +
      '<th style="width:60%;">Labor Category</th>' +
      '<th class="num-col">Regular Hrs</th>' +
      '<th class="num-col">Overtime Hrs</th>' +
    '</tr></thead>';
  var tbody = document.createElement('tbody');
  WORK_HOURS_CATEGORIES.forEach(function(cat) {
    var vals = (workHours && workHours[cat.key]) || { regular: '', overtime: '' };
    var tr   = document.createElement('tr');
    tr.innerHTML =
      '<td class="cat-label">' + esc(cat.label) + '</td>' +
      '<td class="num-cell"><input type="number" step="0.25" min="0" class="hours-input" data-wh-key="' + cat.key + '" data-wh-col="regular"  value="' + esc(vals.regular)  + '" placeholder="0" aria-label="' + esc(cat.label) + ' regular hours"></td>' +
      '<td class="num-cell"><input type="number" step="0.25" min="0" class="hours-input" data-wh-key="' + cat.key + '" data-wh-col="overtime" value="' + esc(vals.overtime) + '" placeholder="0" aria-label="' + esc(cat.label) + ' overtime hours"></td>';
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

/* ============================================================
   13. TAB B — HMA Supplement
   ============================================================ */

function renderSectionB(session) {
  var frag = document.createDocumentFragment();
  var s    = session.section;

  var tableCard = makeCard('HMA Paving Log',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>'
  );
  tableCard.querySelector('.section-card-body').style.padding = '0';
  tableCard.querySelector('.section-card-body').appendChild(buildDynamicTable('b', s.hmaPavingRows));
  frag.appendChild(tableCard);

  frag.appendChild(renderRemarksCard('Work Observations and Remarks', 'workObservations', s.workObservations, 'b'));
  frag.appendChild(renderTemperatureBlock(s.temperature));

  var wrapper = document.createElement('div');
  wrapper.appendChild(frag);
  return wrapper;
}

function renderTemperatureBlock(temp) {
  var t    = temp || {};
  var card = makeCard('Mix Temperature',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>'
  );
  var body = card.querySelector('.section-card-body');
  var m1   = t.mix1 || {};
  var m2   = t.mix2 || {};
  body.innerHTML =
    '<div class="field-group" style="grid-template-columns:1fr;margin-bottom:16px;">' +
      fieldHtml('temp_producer', 'Producer of Material', t.producer) +
    '</div>' +
    '<div style="font-size:11px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Mix 1 Temperatures</div>' +
    '<div class="temp-grid" style="margin-bottom:16px;">' +
      fieldHtml('temp_mix1_mixNo',   'Mix #',      m1.mixNo)              +
      fieldHtml('temp_mix1_highest', 'Highest °F', m1.highestF, 'number') +
      fieldHtml('temp_mix1_lowest',  'Lowest °F',  m1.lowestF,  'number') +
      fieldHtml('temp_mix1_avg',     'Avg °F',     m1.avgF,     'number') +
    '</div>' +
    '<div style="font-size:11px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Mix 2 Temperatures (if applicable)</div>' +
    '<div class="temp-grid">' +
      fieldHtml('temp_mix2_mixNo',   'Mix #',      m2.mixNo)              +
      fieldHtml('temp_mix2_highest', 'Highest °F', m2.highestF, 'number') +
      fieldHtml('temp_mix2_lowest',  'Lowest °F',  m2.lowestF,  'number') +
      fieldHtml('temp_mix2_avg',     'Avg °F',     m2.avgF,     'number') +
    '</div>';
  return card;
}

/* ============================================================
   14. TAB C — Bituminous Materials
   ============================================================ */

function renderSectionC(session) {
  var frag = document.createDocumentFragment();
  var s    = session.section;

  var matCard  = makeCard('Material Information',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>'
  );
  var mi       = s.materialInfo || {};
  matCard.querySelector('.section-card-body').innerHTML =
    '<div class="field-group" style="grid-template-columns:1fr 1fr 1fr;">' +
      fieldHtml('mi_grade',    'Grade of Material',     mi.gradeOfMaterial)  +
      fieldHtml('mi_producer', 'Producer and Location', mi.producerLocation) +
      fieldHtml('mi_hauler',   'Hauler and Location',   mi.haulerLocation)   +
    '</div>';
  frag.appendChild(matCard);

  var tableCard = makeCard('Application Log',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>'
  );
  tableCard.querySelector('.section-card-body').style.padding = '0';
  tableCard.querySelector('.section-card-body').appendChild(buildDynamicTable('c', s.applicationRows));
  frag.appendChild(tableCard);

  var specCard = makeCard('Specifications',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>'
  );
  specCard.querySelector('.section-card-body').innerHTML =
    '<div class="field-group" style="grid-template-columns:1fr 1fr;">' +
      fieldHtml('spec_tempRange', 'Specified Temperature Range of Material', s.specifiedTempRange)         +
      fieldHtml('spec_rate',      'Specified Rate of Application',           s.specifiedRateOfApplication) +
    '</div>';
  frag.appendChild(specCard);

  frag.appendChild(renderRemarksCard('Work Observations and Remarks', 'workObservations', s.workObservations, 'c'));

  var wrapper = document.createElement('div');
  wrapper.appendChild(frag);
  return wrapper;
}

/* ============================================================
   15. TAB D — Pile Driving Supplement
   ============================================================ */

function renderSectionD(session) {
  var frag = document.createDocumentFragment();
  var s    = session.section;

  var pileInfoCard = makeCard('Pile Descriptor',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>'
  );
  var pd = s.pileDescriptor || {};
  pileInfoCard.querySelector('.section-card-body').innerHTML =
    '<div class="field-group" style="grid-template-columns:1fr 1fr 1fr;">' +
      fieldHtml('pd_structure',  'Structure',   pd.structure)  +
      fieldHtml('pd_location',   'Location',    pd.location)   +
      fieldHtml('pd_typeHammer', 'Type Hammer', pd.typeHammer) +
    '</div>';
  frag.appendChild(pileInfoCard);

  var tableCard = makeCard('Pile Log',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>'
  );
  tableCard.querySelector('.section-card-body').style.padding = '0';
  tableCard.querySelector('.section-card-body').appendChild(buildDynamicTable('d', s.pileRows));
  frag.appendChild(tableCard);

  frag.appendChild(renderRemarksCard('Work Observations and Remarks', 'workObservations', s.workObservations, 'd'));

  var wrapper = document.createElement('div');
  wrapper.appendChild(frag);
  return wrapper;
}

/* ============================================================
   16. REMARKS CARD (shared)
   ============================================================ */

function renderRemarksCard(title, sectionKey, value, tab) {
  var card = makeCard(title,
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>'
  );
  var body = card.querySelector('.section-card-body');
  var textarea = document.createElement('textarea');
  textarea.className = 'remarks-textarea';
  textarea.dataset.remarksKey = sectionKey;
  textarea.placeholder = 'Enter observations, conditions, and any relevant field notes…';
  textarea.value = value || '';
  textarea.setAttribute('aria-label', title);
  body.appendChild(textarea);
  var photoWrap = document.createElement('div');
  photoWrap.dataset.photoSection = sectionKey;
  photoWrap.appendChild(renderPhotoStripForSection(sectionKey));
  body.appendChild(photoWrap);
  return card;
}

/* ============================================================
   17. PHOTOS SECTION
   ============================================================ */

function renderPhotosSection(session) {
  var card = makeCard('Additional Photos (Appendix)',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
  );
  var body = card.querySelector('.section-card-body');
  body.innerHTML = '<p style="font-size:13px;color:var(--muted);margin-bottom:12px;">Photos added here are not linked to a specific remarks section. They appear in the Photo Appendix of the exported Excel file.</p>';
  var photoWrap = document.createElement('div');
  photoWrap.dataset.photoSection = 'appendixOnly';
  photoWrap.appendChild(renderPhotoStripForSection('appendixOnly'));
  body.appendChild(photoWrap);
  return card;
}

/* ============================================================
   18. DYNAMIC GRID TABLE
   ============================================================ */

var TABLE_DEFS = {
  a: {
    key:      'payItems',
    blankRow: blankPayItemRow,
    maxRows:  DC144_CELL_MAP.a.payItems.maxRows,
    cols: [
      { key: 'itemNo',        label: 'Item No',          width: '70px'  },
      { key: 'description',   label: 'Item Description', width: '200px' },
      { key: 'itemCode',      label: 'Item Code',        width: '90px'  },
      { key: 'planPageNum',   label: 'Plan Page #',      width: '80px'  },
      { key: 'location',      label: 'Location',         width: '120px' },
      { key: 'subcontractor', label: 'Subcontractor',    width: '120px' },
      { key: 'placedQty',     label: 'Placed Qty',       width: '140px', type: 'qty-unit' },
      { key: 'asBuiltQty',    label: 'As Built Qty',     width: '140px', type: 'qty-unit' }
    ]
  },
  b: {
    key:      'hmaPavingRows',
    blankRow: blankHMARow,
    maxRows:  DC144_CELL_MAP.b.hmaPavingRows.maxRows,
    cols: [
      { key: 'locationStation', label: 'Station Range',  width: '130px' },
      { key: 'lane',            label: 'Lane',           width: '60px'  },
      { key: 'lift',            label: 'Lift',           width: '60px'  },
      { key: 'thickness',       label: 'Thickness (in)', width: '90px', type: 'number' },
      { key: 'mixNo',           label: 'Mix No.',        width: '70px'  },
      { key: 'lotNo',           label: 'Lot No.',        width: '70px'  },
      { key: 'poundsReceived',  label: 'Lbs Received',   width: '90px', type: 'number' },
      { key: 'poundsPlaced',    label: 'Lbs Placed',     width: '90px', type: 'number' },
      { key: 'syLaid',          label: 'SY Laid',        width: '80px', type: 'number' },
      { key: 'lbsPerSY',        label: 'LBS/SY',         width: '80px', type: 'number' }
    ]
  },
  c: {
    key:      'applicationRows',
    blankRow: blankApplicationRow,
    maxRows:  DC144_CELL_MAP.c.applicationRows.maxRows,
    cols: [
      { key: 'locationStation',     label: 'Station Range',  width: '110px' },
      { key: 'lane',                label: 'Lane',           width: '55px'  },
      { key: 'lotNo',               label: 'Lot No.',        width: '65px'  },
      { key: 'tankNo',              label: 'Tank No.',       width: '65px'  },
      { key: 'truckNo',             label: 'Truck No.',      width: '65px'  },
      { key: 'gaugeStart',          label: 'Gauge Start',    width: '80px', type: 'number' },
      { key: 'gaugeFinish',         label: 'Gauge Finish',   width: '80px', type: 'number' },
      { key: 'tempOfMaterial',      label: 'Temp (°F)', width: '70px', type: 'number' },
      { key: 'conversionFactor',    label: 'Conv. Factor',   width: '80px', type: 'number' },
      { key: 'gallonsAppliedGross', label: 'Gal. Gross',     width: '80px', type: 'number' },
      { key: 'gallonsApplied60F',   label: 'Gal. @60°F', width: '80px', type: 'number' },
      { key: 'areaSY',              label: 'Area (SY)',      width: '80px', type: 'number' },
      { key: 'rateGPerSY',          label: 'Rate (G/SY)',    width: '80px', type: 'number' }
    ]
  },
  d: {
    key:      'pileRows',
    blankRow: blankPileRow,
    maxRows:  DC144_CELL_MAP.d.pileRows.maxRows,
    cols: [
      { key: 'pileNo',            label: 'Pile No.',       width: '60px'  },
      { key: 'lengthInLead',      label: 'Length (Lead)',  width: '80px', type: 'number' },
      { key: 'timberDiaTip',      label: 'Dia. Tip',       width: '65px', type: 'number' },
      { key: 'timberDiaButt',     label: 'Dia. Butt',      width: '65px', type: 'number' },
      { key: 'spliceLength',      label: 'Splice Len.',    width: '75px', type: 'number' },
      { key: 'spliceFrom',        label: 'Splice From',    width: '75px', type: 'number' },
      { key: 'penetrationLength', label: 'Penetration',    width: '80px', type: 'number' },
      { key: 'blows5ft',          label: '5.0 ft',         width: '55px', type: 'number' },
      { key: 'blows4ft',          label: '4.0 ft',         width: '55px', type: 'number' },
      { key: 'blows3ft',          label: '3.0 ft',         width: '55px', type: 'number' },
      { key: 'blows2ft',          label: '2.0 ft',         width: '55px', type: 'number' },
      { key: 'blows1ft',          label: '1.0 ft',         width: '55px', type: 'number' },
      { key: 'blowsLastInch',     label: 'Blows/Inch',     width: '70px', type: 'number' },
      { key: 'notes',             label: 'Notes',          width: '120px' }
    ]
  }
};

var QTY_UNIT_OPTIONS = ['SF', 'LF', 'SY', 'TONS', 'CY', 'UNIT', 'LS', 'Custom'];

function buildDynamicTable(tab, rows) {
  var def     = TABLE_DEFS[tab];
  var maxRows = def.maxRows;
  rows = rows || [];

  var wrap = document.createElement('div');
  wrap.dataset.gridTab = tab;

  if (tab === 'c' || tab === 'd') {
    var hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:var(--muted);padding:8px 16px 0;text-align:right;';
    hint.textContent = '← Scroll table horizontally →';
    wrap.appendChild(hint);
  }

  var tableWrap = document.createElement('div');
  tableWrap.className = 'data-table-wrap';

  var table = document.createElement('table');
  table.className   = 'data-table';
  table.dataset.gridTab = tab;

  var thead     = document.createElement('thead');
  var headerRow = document.createElement('tr');
  headerRow.innerHTML = '<th style="width:28px;">#</th>';
  def.cols.forEach(function(col) {
    headerRow.innerHTML += '<th style="min-width:' + col.width + ';">' + col.label + '</th>';
  });
  headerRow.innerHTML += '<th style="width:40px;"></th>';
  thead.appendChild(headerRow);
  table.appendChild(thead);

  var tbody = document.createElement('tbody');
  tbody.id   = 'grid-tbody-' + tab;
  rows.forEach(function(row) { tbody.appendChild(buildTableRow(tab, row, def)); });
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);

  var footer = document.createElement('div');
  footer.style.cssText = 'padding:14px 16px;display:flex;align-items:center;gap:12px;border-top:1px solid var(--border-lo);';

  var addBtn = document.createElement('button');
  addBtn.className = 'btn-add-row';
  addBtn.id        = 'add-row-btn-' + tab;
  addBtn.disabled  = rows.length >= maxRows;
  addBtn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
    'Add Row';
  addBtn.addEventListener('click', function() { addGridRow(tab, def, maxRows); });

  var counter = document.createElement('span');
  counter.id             = 'row-counter-' + tab;
  counter.style.cssText  = 'font-size:12px;color:var(--muted);';
  counter.textContent    = rows.length + ' / ' + maxRows + ' rows';

  footer.appendChild(addBtn);
  footer.appendChild(counter);
  wrap.appendChild(footer);

  var notice = document.createElement('div');
  notice.className       = 'row-limit-notice';
  notice.id              = 'row-limit-notice-' + tab;
  notice.style.display   = rows.length >= maxRows ? '' : 'none';
  notice.style.margin    = '0 16px 16px';
  notice.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
    'Maximum ' + maxRows + ' rows reached. Start a new DC-144 (' + tab + ') to log additional entries.';
  wrap.appendChild(notice);

  return wrap;
}

function buildTableRow(tab, rowData, def) {
  var tr     = document.createElement('tr');
  tr.dataset.rowIndex = rowData.rowIndex;
  var rowNum = rowData.rowIndex + 1;

  var tdNum = document.createElement('td');
  tdNum.className   = 'row-num';
  tdNum.textContent = rowNum;
  tr.appendChild(tdNum);

  def.cols.forEach(function(col) {
    var td = document.createElement('td');

    if (col.type === 'qty-unit') {
      var unitKey       = col.key + 'Unit';
      var unitCustomKey = col.key + 'UnitCustom';
      var currentUnit   = rowData[unitKey] || 'UNIT';

      var wrap = document.createElement('div');
      wrap.className = 'qty-cell-wrap';

      var numInput = document.createElement('input');
      numInput.type              = 'number';
      numInput.step              = 'any';
      numInput.min               = '0';
      numInput.className         = 'grid-input';
      numInput.value             = rowData[col.key] || '';
      numInput.dataset.rowIndex  = rowData.rowIndex;
      numInput.dataset.colKey    = col.key;
      numInput.dataset.gridTab   = tab;
      numInput.setAttribute('aria-label', col.label + ' quantity row ' + rowNum);
      wrap.appendChild(numInput);

      var sel = document.createElement('select');
      sel.className        = 'grid-select';
      sel.dataset.rowIndex = rowData.rowIndex;
      sel.dataset.colKey   = unitKey;
      sel.dataset.gridTab  = tab;
      sel.setAttribute('aria-label', col.label + ' unit row ' + rowNum);
      QTY_UNIT_OPTIONS.forEach(function(opt) {
        var option       = document.createElement('option');
        option.value     = opt;
        option.textContent = opt;
        if (opt === currentUnit) option.selected = true;
        sel.appendChild(option);
      });
      wrap.appendChild(sel);

      var customInput = document.createElement('input');
      customInput.type             = 'text';
      customInput.className        = 'qty-custom-input';
      customInput.dataset.rowIndex = rowData.rowIndex;
      customInput.dataset.colKey   = unitCustomKey;
      customInput.dataset.gridTab  = tab;
      customInput.value            = rowData[unitCustomKey] || '';
      customInput.placeholder      = 'Unit';
      customInput.style.display    = currentUnit === 'Custom' ? '' : 'none';
      customInput.setAttribute('aria-label', col.label + ' custom unit row ' + rowNum);
      wrap.appendChild(customInput);

      sel.addEventListener('change', function() {
        customInput.style.display = sel.value === 'Custom' ? '' : 'none';
        scheduleAutosave();
      });

      td.appendChild(wrap);
    } else {
      var input = document.createElement('input');
      input.type              = col.type || 'text';
      input.className         = 'grid-input';
      input.value             = rowData[col.key] || '';
      input.dataset.rowIndex  = rowData.rowIndex;
      input.dataset.colKey    = col.key;
      input.dataset.gridTab   = tab;
      input.setAttribute('aria-label', col.label + ' row ' + rowNum);
      if (col.type === 'number') { input.step = 'any'; input.min = '0'; }
      td.appendChild(input);
    }

    tr.appendChild(td);
  });

  var tdDel  = document.createElement('td');
  var delBtn = document.createElement('button');
  delBtn.className = 'btn-del-row';
  delBtn.setAttribute('aria-label', 'Delete row ' + rowNum);
  delBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>';
  delBtn.addEventListener('click', function() { deleteGridRow(tab, rowData.rowIndex, TABLE_DEFS[tab].maxRows); });
  tdDel.appendChild(delBtn);
  tr.appendChild(tdDel);
  return tr;
}

function addGridRow(tab, def, maxRows) {
  var tbody   = document.getElementById('grid-tbody-' + tab);
  var counter = document.getElementById('row-counter-' + tab);
  var addBtn  = document.getElementById('add-row-btn-' + tab);
  var notice  = document.getElementById('row-limit-notice-' + tab);
  if (!tbody) return;

  var currentCount = tbody.querySelectorAll('tr').length;
  if (currentCount >= maxRows) return;

  var newRow = def.blankRow(currentCount);
  tbody.appendChild(buildTableRow(tab, newRow, def));
  currentCount++;

  if (counter) counter.textContent = currentCount + ' / ' + maxRows + ' rows';
  if (addBtn)  addBtn.disabled     = currentCount >= maxRows;
  if (notice)  notice.style.display = currentCount >= maxRows ? '' : 'none';

  var newTr = tbody.lastElementChild;
  if (newTr) { var fi = newTr.querySelector('input'); if (fi) fi.focus(); }
  scheduleAutosave();
}

function deleteGridRow(tab, rowIndex, maxRows) {
  var tbody   = document.getElementById('grid-tbody-' + tab);
  var counter = document.getElementById('row-counter-' + tab);
  var addBtn  = document.getElementById('add-row-btn-' + tab);
  var notice  = document.getElementById('row-limit-notice-' + tab);
  if (!tbody) return;

  var rows   = tbody.querySelectorAll('tr');
  var target = null;
  rows.forEach(function(r) { if (parseInt(r.dataset.rowIndex, 10) === rowIndex) target = r; });
  if (target) tbody.removeChild(target);

  var remaining = tbody.querySelectorAll('tr');
  remaining.forEach(function(r, i) {
    r.dataset.rowIndex = i;
    var numCell = r.querySelector('.row-num');
    if (numCell) numCell.textContent = i + 1;
    r.querySelectorAll('[data-row-index]').forEach(function(inp) { inp.dataset.rowIndex = i; });
  });

  var currentCount = remaining.length;
  if (counter) counter.textContent  = currentCount + ' / ' + maxRows + ' rows';
  if (addBtn)  addBtn.disabled      = currentCount >= maxRows;
  if (notice)  notice.style.display = currentCount >= maxRows ? '' : 'none';

  scheduleAutosave();
}

/* ============================================================
   19. COLLECT FORM DATA into currentSession
   ============================================================ */

function collectFormData() {
  if (!currentSession || !currentTab) return;
  var h   = currentSession.header;
  var tab = currentTab;

  // Header fields — use getElementById (inputs have id="field-{key}")
  var headerFields = ['projectName','contractId','contractor','inspectorName','date',
    'weatherAMCond','weatherAMHigh','weatherAMLow','weatherPMCond','weatherPMHigh','weatherPMLow'];
  headerFields.forEach(function(f) {
    var el = document.getElementById('field-' + f);
    if (el) h[f] = el.value;
  });

  // Item header (tabs b/c/d)
  if (tab !== 'a' && currentSession.itemHeader) {
    var ih = currentSession.itemHeader;
    var ihMap = { 'ih_itemNumber': 'itemNumber', 'ih_description': 'description', 'ih_itemCode': 'itemCode' };
    Object.keys(ihMap).forEach(function(domKey) {
      var el = document.getElementById('field-' + domKey);
      if (el) ih[ihMap[domKey]] = el.value;
    });
  }

  var s = currentSession.section;

  if (tab === 'a') {
    s.payItems = collectGridRows('a');
    ['environmental','trafficControl','workObservations'].forEach(function(k) {
      var ta = document.querySelector('[data-remarks-key="' + k + '"]');
      if (ta) s.remarks[k] = ta.value;
    });
    document.querySelectorAll('[data-wh-key]').forEach(function(inp) {
      var key = inp.dataset.whKey;
      var col = inp.dataset.whCol;
      if (s.workHours[key]) s.workHours[key][col] = inp.value;
    });
  }

  if (tab === 'b') {
    s.hmaPavingRows = collectGridRows('b');
    var wobsB = document.querySelector('[data-remarks-key="workObservations"]');
    if (wobsB) s.workObservations = wobsB.value;
    var tmap = {
      'temp_producer':     function(v) { s.temperature.producer    = v; },
      'temp_mix1_mixNo':   function(v) { s.temperature.mix1.mixNo   = v; },
      'temp_mix1_highest': function(v) { s.temperature.mix1.highestF= v; },
      'temp_mix1_lowest':  function(v) { s.temperature.mix1.lowestF = v; },
      'temp_mix1_avg':     function(v) { s.temperature.mix1.avgF    = v; },
      'temp_mix2_mixNo':   function(v) { s.temperature.mix2.mixNo   = v; },
      'temp_mix2_highest': function(v) { s.temperature.mix2.highestF= v; },
      'temp_mix2_lowest':  function(v) { s.temperature.mix2.lowestF = v; },
      'temp_mix2_avg':     function(v) { s.temperature.mix2.avgF    = v; }
    };
    Object.keys(tmap).forEach(function(k) {
      var el = document.getElementById('field-' + k);
      if (el) tmap[k](el.value);
    });
  }

  if (tab === 'c') {
    var mi    = s.materialInfo;
    var miMap = { 'mi_grade': 'gradeOfMaterial', 'mi_producer': 'producerLocation', 'mi_hauler': 'haulerLocation' };
    Object.keys(miMap).forEach(function(k) {
      var el = document.getElementById('field-' + k);
      if (el) mi[miMap[k]] = el.value;
    });
    s.applicationRows = collectGridRows('c');
    var stEl = document.getElementById('field-spec_tempRange');
    var srEl = document.getElementById('field-spec_rate');
    if (stEl) s.specifiedTempRange         = stEl.value;
    if (srEl) s.specifiedRateOfApplication = srEl.value;
    var wobsC = document.querySelector('[data-remarks-key="workObservations"]');
    if (wobsC) s.workObservations = wobsC.value;
  }

  if (tab === 'd') {
    var pd    = s.pileDescriptor;
    var pdMap = { 'pd_structure': 'structure', 'pd_location': 'location', 'pd_typeHammer': 'typeHammer' };
    Object.keys(pdMap).forEach(function(k) {
      var el = document.getElementById('field-' + k);
      if (el) pd[pdMap[k]] = el.value;
    });
    s.pileRows = collectGridRows('d');
    var wobsD  = document.querySelector('[data-remarks-key="workObservations"]');
    if (wobsD) s.workObservations = wobsD.value;
  }

  // Photo captions
  document.querySelectorAll('[data-photo-caption-idx]').forEach(function(inp) {
    var idx = parseInt(inp.dataset.photoCaptionIdx, 10);
    if (currentSession.photos[idx]) currentSession.photos[idx].caption = inp.value;
  });
}

function collectGridRows(tab) {
  var def   = TABLE_DEFS[tab];
  var tbody = document.getElementById('grid-tbody-' + tab);
  if (!tbody) return [];
  var rows = [];
  tbody.querySelectorAll('tr').forEach(function(tr, idx) {
    var row = def.blankRow(idx);
    tr.querySelectorAll('[data-col-key]').forEach(function(el) {
      row[el.dataset.colKey] = el.value;
    });
    rows.push(row);
  });
  return rows.slice(0, def.maxRows);
}

/* ============================================================
   20. WIRE FORM AUTO-SAVE LISTENERS
   ============================================================ */

function wireFormAutosave() {
  var container = document.getElementById('form-content');
  if (!container) return;
  container.addEventListener('input',  function() { scheduleAutosave(); });
  container.addEventListener('change', function() { scheduleAutosave(); });
}

/* ============================================================
   21. PHOTO MANAGEMENT
   ============================================================ */

function renderPhotoStripForSection(sectionKey) {
  var wrap = document.createElement('div');
  wrap.className = 'photo-strip';
  wrap.id        = 'photo-strip-' + sectionKey;

  if (currentSession && currentSession.photos) {
    currentSession.photos.forEach(function(photo, idx) {
      if (photo.sectionKey === sectionKey) {
        wrap.appendChild(buildPhotoThumb(photo, idx));
      }
    });
  }

  var addItem = document.createElement('div');
  addItem.className = 'photo-item';
  addItem.innerHTML =
    '<button class="photo-add-btn" data-section-key="' + esc(sectionKey) + '" aria-label="Add photo to ' + sectionKey + '">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
      'Add Photo' +
    '</button>';
  addItem.querySelector('.photo-add-btn').addEventListener('click', function() {
    triggerPhotoCapture(sectionKey);
  });
  wrap.appendChild(addItem);
  return wrap;
}

function buildPhotoThumb(photo, idx) {
  var item = document.createElement('div');
  item.className      = 'photo-item';
  item.dataset.photoIdx = idx;
  item.innerHTML =
    '<div class="photo-thumb">' +
      '<img src="' + photo.base64 + '" alt="Photo ' + (idx+1) + '" loading="lazy">' +
      '<button class="photo-del-btn" data-photo-idx="' + idx + '" aria-label="Delete photo ' + (idx+1) + '">×</button>' +
    '</div>' +
    '<input class="photo-caption" type="text" data-photo-caption-idx="' + idx + '" placeholder="Caption…" value="' + esc(photo.caption||'') + '" aria-label="Caption for photo ' + (idx+1) + '" maxlength="120">';
  item.querySelector('.photo-del-btn').addEventListener('click', function() { deletePhoto(idx); });
  return item;
}

function triggerPhotoCapture(sectionKey) {
  photoTargetKey = sectionKey;
  var input = document.getElementById('photo-file-input');
  if (input) input.click();
}

function handlePhotoCaptureEvent(event) {
  var file = event.target.files && event.target.files[0];
  if (!file || !currentSession) { event.target.value = ''; return; }
  if (!file.type.startsWith('image/')) {
    showToast('Only image files are accepted', 'err');
    event.target.value = '';
    return;
  }
  compressImage(file, function(base64, w, h) {
    var photo = {
      photoIndex:   currentSession.photos.length + 1,
      sectionKey:   photoTargetKey || 'appendixOnly',
      caption:      '',
      base64:       base64,
      originalName: file.name,
      capturedAt:   new Date().toISOString(),
      widthPx:      w,
      heightPx:     h
    };
    currentSession.photos.push(photo);
    var strip = document.getElementById('photo-strip-' + photo.sectionKey);
    if (strip) {
      var addBtnWrapper = strip.querySelector('.photo-item:last-child');
      var newThumb      = buildPhotoThumb(photo, currentSession.photos.length - 1);
      strip.insertBefore(newThumb, addBtnWrapper);
    }
    scheduleAutosave();
  });
  event.target.value = '';
}

function deletePhoto(idx) {
  if (!currentSession || !currentSession.photos) return;
  currentSession.photos.splice(idx, 1);
  currentSession.photos.forEach(function(p, i) { p.photoIndex = i + 1; });
  reRenderAllPhotoStrips();
  scheduleAutosave();
}

function reRenderAllPhotoStrips() {
  document.querySelectorAll('[data-photo-section]').forEach(function(wrap) {
    var key = wrap.dataset.photoSection;
    wrap.innerHTML = '';
    wrap.appendChild(renderPhotoStripForSection(key));
  });
}

/* ── Image compression pipeline ─────────────────────────────── */
function compressImage(file, callback) {
  var MAX_LONG_SIDE = 1400;
  var BYPASS_SIZE   = 150 * 1024;

  if (file.size < BYPASS_SIZE) {
    var reader = new FileReader();
    reader.onloadend = function() {
      var img    = new Image();
      img.onload = function() { callback(reader.result, img.naturalWidth, img.naturalHeight); };
      img.src    = reader.result;
    };
    reader.readAsDataURL(file);
    return;
  }

  var objectURL = URL.createObjectURL(file);
  var img       = new Image();
  img.onload = function() {
    URL.revokeObjectURL(objectURL);
    var w     = img.naturalWidth, h = img.naturalHeight;
    var scale = Math.min(1.0, MAX_LONG_SIDE / Math.max(w, h));
    var tw    = Math.round(w * scale), th = Math.round(h * scale);
    var canvas       = document.createElement('canvas');
    canvas.width     = tw;
    canvas.height    = th;
    canvas.getContext('2d').drawImage(img, 0, 0, tw, th);
    canvas.toBlob(function(blob) {
      if (!blob) { callback(canvas.toDataURL('image/jpeg', 0.72), tw, th); return; }
      if (blob.size <= 200 * 1024) {
        blobToDataURL(blob, function(dataURL) { callback(dataURL, tw, th); });
      } else {
        canvas.toBlob(function(blob2) {
          blobToDataURL(blob2 || blob, function(dataURL) { callback(dataURL, tw, th); });
        }, 'image/jpeg', 0.58);
      }
    }, 'image/jpeg', 0.72);
  };
  img.onerror = function() { URL.revokeObjectURL(objectURL); showToast('Could not read image', 'err'); };
  img.src = objectURL;
}

function blobToDataURL(blob, cb) {
  var reader     = new FileReader();
  reader.onloadend = function() { cb(reader.result); };
  reader.readAsDataURL(blob);
}

/* ============================================================
   22. EXCEL EXPORT ENGINE
   ============================================================ */

function loadDC144Template() {
  if (templateCache) return Promise.resolve(templateCache);
  return fetch(TEMPLATE_URL)
    .then(function(res) {
      if (!res.ok) throw new Error('Template not found (HTTP ' + res.status + ')');
      return res.arrayBuffer();
    })
    .then(function(buffer) {
      var wb = new ExcelJS.Workbook();
      return wb.xlsx.load(buffer).then(function() {
        templateCache = wb;
        return wb;
      });
    });
}

function handleExport() {
  if (!currentSession) return;
  collectFormData();
  var exportBtn1 = document.getElementById('topbar-export-btn');
  var exportBtn2 = document.getElementById('actionbar-export-btn');

  function setLoading(loading) {
    [exportBtn1, exportBtn2].forEach(function(btn) {
      if (!btn) return;
      btn.disabled = loading;
      btn.innerHTML = loading
        ? '<svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Generating…'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export XLSX';
    });
  }

  setLoading(true);

  loadDC144Template()
    .then(function(wb) { return buildWorkbook(wb, currentSession); })
    .catch(function(err) {
      console.warn('Template load failed (' + err.message + '). Building minimal workbook.');
      var wb  = new ExcelJS.Workbook();
      wb.creator = 'NJDOT Field Tools DC-144';
      wb.created = new Date();
      wb.addWorksheet(TAB_META[currentSession.tab].sheetName);
      return buildWorkbook(wb, currentSession);
    })
    .then(function(wb) { return wb.xlsx.writeBuffer(); })
    .then(function(buffer) {
      var session    = currentSession;
      var safeProject = (session.header.projectName || 'DC144').replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_').slice(0, 30);
      var safeDate    = (session.header.date || todayISO()).replace(/-/g, '');
      var filename    = 'DC-144-' + session.tab.toUpperCase() + '-' + safeDate + '-' + safeProject + '.xlsx';
      triggerDownload(buffer, filename);
      setLoading(false);
      showToast('Export downloaded: ' + filename, 'ok', 3000);
    })
    .catch(function(err) {
      setLoading(false);
      showToast('Export failed: ' + err.message, 'err', 4000);
      console.error('DC-144 export error:', err);
    });
}

function buildWorkbook(wb, session) {
  var tab       = session.tab;
  var sheetName = TAB_META[tab].sheetName;
  var ws        = wb.getWorksheet(sheetName) || wb.getWorksheet(1);
  if (!ws) ws   = wb.addWorksheet(sheetName);

  patchHeaderFields(ws, session);
  patchItemHeader(ws, session);
  patchDataRows(ws, session);
  patchRemarksFields(ws, session);
  if (tab === 'a') patchWorkHours(ws, session);
  if (tab === 'b') patchTemperature(ws, session);
  if (tab === 'c') patchMaterialInfo(ws, session);
  if (tab === 'd') patchPileDescriptor(ws, session);

  // Apply programmatic borders to grid data rows
  var sectionMap = DC144_CELL_MAP[tab];
  var gridMap    = sectionMap.payItems || sectionMap.hmaPavingRows || sectionMap.applicationRows || sectionMap.pileRows;
  if (gridMap) {
    var colNums    = Object.keys(gridMap.cols).map(function(k) { return gridMap.cols[k]; });
    var maxColNum  = Math.max.apply(null, colNums);
    applyDataRowBorders(ws, gridMap.baseRow, gridMap.baseRow + gridMap.maxRows - 1, 1, maxColNum);
  }

  // Ensure remarks zones are merged across columns
  applyRemarksMerges(ws, tab);

  if (session.photos && session.photos.length > 0) {
    appendPhotoSheet(wb, session.photos);
  }
  return wb;
}

function setCellValue(ws, r, c, value) {
  if (!r || !c) return;
  try {
    ws.getCell(r, c).value = (value !== undefined && value !== null) ? value : '';
  } catch(e) {}
}

function patchHeaderFields(ws, session) {
  var map    = DC144_CELL_MAP[session.tab].header;
  var h      = session.header;
  Object.keys(map).forEach(function(f) {
    if (h[f] !== undefined) setCellValue(ws, map[f].r, map[f].c, h[f]);
  });
}

function patchItemHeader(ws, session) {
  if (session.tab === 'a' || !session.itemHeader) return;
  var map = DC144_CELL_MAP[session.tab].header;
  var ih  = session.itemHeader;
  if (map.itemNumber)      setCellValue(ws, map.itemNumber.r,      map.itemNumber.c,      ih.itemNumber);
  if (map.itemDescription) setCellValue(ws, map.itemDescription.r, map.itemDescription.c, ih.description);
  if (map.itemCode)        setCellValue(ws, map.itemCode.r,        map.itemCode.c,        ih.itemCode);
}

function patchDataRows(ws, session) {
  var tab = session.tab;
  var s   = session.section;

  if (tab === 'a') {
    var piMap = DC144_CELL_MAP.a.payItems;
    (s.payItems || []).slice(0, piMap.maxRows).forEach(function(row) {
      var excelRow = piMap.baseRow + row.rowIndex;
      // Write non-qty fields
      ['itemNo','description','itemCode','planPageNum','location','subcontractor'].forEach(function(field) {
        if (piMap.cols[field]) setCellValue(ws, excelRow, piMap.cols[field], row[field] || '');
      });
      // Qty + unit concatenation
      var formatQty = function(qtyVal, unitVal, customVal) {
        var q = String(qtyVal || '').trim();
        if (!q) return '';
        var u = unitVal === 'Custom' ? String(customVal || '').trim() : String(unitVal || '').trim();
        return u ? q + ' ' + u : q;
      };
      setCellValue(ws, excelRow, piMap.cols.placedQty,  formatQty(row.placedQty,  row.placedQtyUnit,  row.placedQtyUnitCustom));
      setCellValue(ws, excelRow, piMap.cols.asBuiltQty, formatQty(row.asBuiltQty, row.asBuiltQtyUnit, row.asBuiltQtyUnitCustom));
    });
  }

  if (tab === 'b') {
    var hmaMap         = DC144_CELL_MAP.b.hmaPavingRows;
    var protectedRows  = hmaMap.formulaProtectedRows || [];
    (s.hmaPavingRows || []).slice(0, hmaMap.maxRows).forEach(function(row) {
      var excelRow = hmaMap.baseRow + row.rowIndex;
      if (protectedRows.indexOf(excelRow) !== -1) return;
      Object.keys(hmaMap.cols).forEach(function(field) {
        setCellValue(ws, excelRow, hmaMap.cols[field], row[field]);
      });
    });
  }

  if (tab === 'c') {
    var appMap = DC144_CELL_MAP.c.applicationRows;
    (s.applicationRows || []).slice(0, appMap.maxRows).forEach(function(row) {
      var excelRow = appMap.baseRow + row.rowIndex;
      Object.keys(appMap.cols).forEach(function(field) {
        setCellValue(ws, excelRow, appMap.cols[field], row[field]);
      });
    });
  }

  if (tab === 'd') {
    var pileMap = DC144_CELL_MAP.d.pileRows;
    (s.pileRows || []).slice(0, pileMap.maxRows).forEach(function(row) {
      var excelRow = pileMap.baseRow + row.rowIndex;
      Object.keys(pileMap.cols).forEach(function(field) {
        setCellValue(ws, excelRow, pileMap.cols[field], row[field]);
      });
    });
  }
}

function patchRemarksFields(ws, session) {
  var tab = session.tab;
  var s   = session.section;

  function buildRemarksText(text, sectionKey) {
    var photosForSection = (session.photos || []).filter(function(p) { return p.sectionKey === sectionKey; });
    if (!photosForSection.length) return text || '';
    var indices = photosForSection.map(function(p) { return 'Photo ' + p.photoIndex; }).join(', ');
    return (text ? text + '\n\n' : '') + '[See Photo Appendix — ' + indices + ']';
  }

  if (tab === 'a') {
    var rm = DC144_CELL_MAP.a.remarks;
    setCellValue(ws, rm.environmental.r,    rm.environmental.c,    buildRemarksText(s.remarks.environmental, 'environmental'));
    setCellValue(ws, rm.trafficControl.r,   rm.trafficControl.c,   buildRemarksText(s.remarks.trafficControl, 'trafficControl'));
    setCellValue(ws, rm.workObservations.r, rm.workObservations.c, buildRemarksText(s.remarks.workObservations, 'workObservations'));
  }
  if (tab === 'b') {
    var wobB = DC144_CELL_MAP.b.workObservations;
    setCellValue(ws, wobB.r, wobB.c, buildRemarksText(s.workObservations, 'workObservations'));
  }
  if (tab === 'c') {
    var wobC  = DC144_CELL_MAP.c.workObservations;
    var stMap = DC144_CELL_MAP.c.specifiedTempRange;
    var srMap = DC144_CELL_MAP.c.specifiedRateOfApplication;
    setCellValue(ws, wobC.r,  wobC.c,  buildRemarksText(s.workObservations, 'workObservations'));
    setCellValue(ws, stMap.r, stMap.c, s.specifiedTempRange);
    setCellValue(ws, srMap.r, srMap.c, s.specifiedRateOfApplication);
  }
  if (tab === 'd') {
    var wobD = DC144_CELL_MAP.d.workObservations;
    setCellValue(ws, wobD.r, wobD.c, buildRemarksText(s.workObservations, 'workObservations'));
  }
}

function patchWorkHours(ws, session) {
  var s   = session.section;
  var map = DC144_CELL_MAP.a.workHours;
  WORK_HOURS_CATEGORIES.forEach(function(cat) {
    var vals = (s.workHours && s.workHours[cat.key]) || {};
    setCellValue(ws, cat.excelRow, map.regularCol,  vals.regular  || '');
    setCellValue(ws, cat.excelRow, map.overtimeCol, vals.overtime || '');
  });
}

function patchTemperature(ws, session) {
  var t   = (session.section && session.section.temperature) || {};
  var map = DC144_CELL_MAP.b.temperature;
  setCellValue(ws, map.producer.r, map.producer.c, t.producer || '');
  var m1 = t.mix1 || {}, m2 = t.mix2 || {};
  setCellValue(ws, map.mix1.mixNo.r,    map.mix1.mixNo.c,    m1.mixNo    || '');
  setCellValue(ws, map.mix1.highestF.r, map.mix1.highestF.c, m1.highestF || '');
  setCellValue(ws, map.mix1.lowestF.r,  map.mix1.lowestF.c,  m1.lowestF  || '');
  setCellValue(ws, map.mix1.avgF.r,     map.mix1.avgF.c,     m1.avgF     || '');
  setCellValue(ws, map.mix2.mixNo.r,    map.mix2.mixNo.c,    m2.mixNo    || '');
  setCellValue(ws, map.mix2.highestF.r, map.mix2.highestF.c, m2.highestF || '');
  setCellValue(ws, map.mix2.lowestF.r,  map.mix2.lowestF.c,  m2.lowestF  || '');
  setCellValue(ws, map.mix2.avgF.r,     map.mix2.avgF.c,     m2.avgF     || '');
}

function patchMaterialInfo(ws, session) {
  var mi  = (session.section && session.section.materialInfo) || {};
  var map = DC144_CELL_MAP.c.materialInfo;
  setCellValue(ws, map.gradeOfMaterial.r,  map.gradeOfMaterial.c,  mi.gradeOfMaterial  || '');
  setCellValue(ws, map.producerLocation.r, map.producerLocation.c, mi.producerLocation || '');
  setCellValue(ws, map.haulerLocation.r,   map.haulerLocation.c,   mi.haulerLocation   || '');
}

function patchPileDescriptor(ws, session) {
  var pd  = (session.section && session.section.pileDescriptor) || {};
  var map = DC144_CELL_MAP.d.pileDescriptor;
  setCellValue(ws, map.structure.r,  map.structure.c,  pd.structure  || '');
  setCellValue(ws, map.location.r,   map.location.c,   pd.location   || '');
  setCellValue(ws, map.typeHammer.r, map.typeHammer.c, pd.typeHammer || '');
}

/* ── Excel formatting helpers ────────────────────────────────── */
function applyDataRowBorders(ws, startRow, endRow, startCol, endCol) {
  var thinBorder = { style: 'thin', color: { argb: 'FFB0B8C0' } };
  var border     = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
  for (var r = startRow; r <= endRow; r++) {
    for (var c = startCol; c <= endCol; c++) {
      try {
        var cell = ws.getCell(r, c);
        if (!cell.border) cell.border = border;
      } catch(e) {}
    }
  }
}

function applyRemarksMerges(ws, tab) {
  var merges = [];
  if (tab === 'a') {
    var rm = DC144_CELL_MAP.a.remarks;
    merges = [
      [rm.environmental.r,    rm.environmental.c,    rm.environmental.r    + 2, 15],
      [rm.trafficControl.r,   rm.trafficControl.c,   rm.trafficControl.r   + 2, 15],
      [rm.workObservations.r, rm.workObservations.c, rm.workObservations.r + 4, 15]
    ];
  } else if (tab === 'b') {
    var wobB2 = DC144_CELL_MAP.b.workObservations;
    merges = [[wobB2.r, wobB2.c, wobB2.r + 3, 17]];
  } else if (tab === 'c') {
    var wobC2 = DC144_CELL_MAP.c.workObservations;
    merges = [[wobC2.r, wobC2.c, wobC2.r + 3, 17]];
  } else if (tab === 'd') {
    var wobD2 = DC144_CELL_MAP.d.workObservations;
    merges = [[wobD2.r, wobD2.c, wobD2.r + 3, 15]];
  }
  merges.forEach(function(m) {
    try { ws.mergeCells(m[0], m[1], m[2], m[3]); } catch(e) {}
  });
}

/* ── Photo Appendix sheet ────────────────────────────────────── */
function appendPhotoSheet(wb, photos) {
  if (!photos || !photos.length) return;

  var existing = wb.getWorksheet('Photo Appendix');
  if (existing) wb.removeWorksheet(existing.id);

  var ws = wb.addWorksheet('Photo Appendix');

  // Image column — 60 character-width units ≈ 450 pts displayed width
  var IMAGE_COL_WIDTH      = 60;
  var IMAGE_DISPLAY_PTS    = IMAGE_COL_WIDTH * 7.5;
  var IMAGE_HEIGHT_MIN     = 100;
  var IMAGE_HEIGHT_MAX     = 450;
  var CAPTION_HEIGHT       = 22;

  ws.getColumn(1).width = IMAGE_COL_WIDTH;
  ws.getColumn(2).width = 20;

  var currentRow = 1;

  photos.forEach(function(photo) {
    // Caption row
    var captionRow  = ws.getRow(currentRow);
    captionRow.height = CAPTION_HEIGHT;
    var captionCell = captionRow.getCell(1);
    captionCell.value = 'Photo ' + photo.photoIndex +
      (photo.caption ? ' — ' + photo.caption : '') +
      (photo.sectionKey && photo.sectionKey !== 'appendixOnly' ? ' [' + photo.sectionKey + ']' : '');
    captionCell.font  = { bold: true, size: 11, color: { argb: 'FF1e2939' } };
    captionCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF6E3' } };

    // Calculate image row height preserving aspect ratio
    var imageHeightPts = IMAGE_HEIGHT_MAX;
    if (photo.widthPx && photo.heightPx && photo.widthPx > 0) {
      imageHeightPts = Math.round(IMAGE_DISPLAY_PTS * (photo.heightPx / photo.widthPx));
      if (imageHeightPts < IMAGE_HEIGHT_MIN) imageHeightPts = IMAGE_HEIGHT_MIN;
      if (imageHeightPts > IMAGE_HEIGHT_MAX) imageHeightPts = IMAGE_HEIGHT_MAX;
    }

    // Image row
    var imageRowNum  = currentRow + 1;
    var imageRow     = ws.getRow(imageRowNum);
    imageRow.height  = imageHeightPts;

    try {
      var base64Data = photo.base64.replace(/^data:image\/\w+;base64,/, '');
      var ext        = photo.base64.indexOf('data:image/png') === 0 ? 'png' : 'jpeg';
      var imageId    = wb.addImage({ base64: base64Data, extension: ext });
      // tl/br use 0-based row/col; col 0→1 = column A only for correct width
      ws.addImage(imageId, {
        tl:     { col: 0, row: currentRow },
        br:     { col: 1, row: currentRow + 1 },
        editAs: 'oneCell'
      });
    } catch(imgErr) {
      imageRow.getCell(1).value = '[Image: ' + (photo.originalName || 'photo') + ']';
    }

    // Spacer row
    ws.getRow(currentRow + 2).height = 8;
    currentRow += 3;
  });
}

/* ── Download helper ─────────────────────────────────────────── */
function triggerDownload(buffer, filename) {
  var blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
}

/* ============================================================
   23. UTILITY HELPERS
   ============================================================ */

function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function makeCard(title, iconSvg) {
  var card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML =
    '<div class="section-card-header">' +
      '<span class="section-card-icon" style="color:var(--accent);" aria-hidden="true">' + (iconSvg||'') + '</span>' +
      '<span class="section-card-title">' + title + '</span>' +
    '</div>' +
    '<div class="section-card-body"></div>';
  return card;
}

function fieldHtml(key, label, value, type, extraClass) {
  var inputType = type || 'text';
  var cls       = extraClass || '';
  return '<div data-field="' + key + '" class="' + cls + '">' +
    '<label class="field-label" for="field-' + key + '">' + label + '</label>' +
    '<input id="field-' + key + '" class="field-input" type="' + inputType + '" ' +
    'data-field="' + key + '" value="' + esc(value || '') + '" ' +
    'placeholder="' + label + '" aria-label="' + label + '">' +
  '</div>';
}

/* ============================================================
   24. SMART TOPBAR HIDE/REVEAL ON SCROLL
   ============================================================ */

function updateActionbarTop(isTopbarHidden) {
  var actionbar = document.getElementById('form-actionbar');
  if (!actionbar) return;
  actionbar.style.top = isTopbarHidden ? '0px' : 'var(--topbar-h)';
}

function initSmartHeader() {
  var topbar = document.getElementById('topbar');
  if (!topbar) return;
  var lastScrollY = 0, lastDir = 'up', mouseOverHeader = false, hideTimeout = null;

  function revealTopbar() {
    topbar.classList.remove('header-hidden');
    updateActionbarTop(false);
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  function hideTopbar() {
    topbar.classList.add('header-hidden');
    updateActionbarTop(true);
  }

  topbar.addEventListener('mouseenter', function() {
    mouseOverHeader = true;
    revealTopbar();
  });
  topbar.addEventListener('mouseleave', function() { mouseOverHeader = false; });

  document.addEventListener('scroll', function() {
    var sy  = window.scrollY;
    var dir = sy > lastScrollY ? 'down' : 'up';
    if (dir === 'up') {
      revealTopbar();
    } else if (dir === 'down' && sy > 80 && !mouseOverHeader && !hideTimeout) {
      hideTimeout = setTimeout(function() {
        if (lastDir === 'down' && !mouseOverHeader) hideTopbar();
        hideTimeout = null;
      }, 1000);
    }
    lastDir    = dir;
    lastScrollY = sy;
  }, { passive: true });

  var zone = document.querySelector('.header-hover-zone');
  if (zone) {
    zone.addEventListener('mouseenter', function() { revealTopbar(); });
  }

  document.addEventListener('touchmove', function(e) {
    if (!topbar.classList.contains('header-hidden')) return;
    var t = e.touches[0];
    if (t && t.clientY <= 30) revealTopbar();
  }, { passive: true });
}

/* ============================================================
   25. INITIALISATION
   ============================================================ */

function init() {
  try { localStorage.setItem('ft_last', 'dc144'); } catch(e) {}

  // Wire template modal keyboard shortcut (Escape to close)
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeTemplateModal();
  });

  // Wire photo file input
  var photoInput = document.getElementById('photo-file-input');
  if (photoInput) {
    photoInput.addEventListener('change', handlePhotoCaptureEvent);
  }

  initSmartHeader();

  openPhotoDB().catch(function() {
    showToast('Storage unavailable — drafts will not persist', 'err', 4000);
  });

  renderDashboard();
}

document.addEventListener('DOMContentLoaded', init);
