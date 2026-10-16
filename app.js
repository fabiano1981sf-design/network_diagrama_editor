/* ============================================================
   KLD Diagram Editor Pro — Lógica Completa v8
   Novidades v8:
   - Biblioteca de Ícones com 30 ícones personalizados
   - Ícones de rede reais (roteadores, servidores, impressoras, etc.)
   - Busca + filtros por categoria na biblioteca
   - Fallback de emoji caso a imagem não carregue
   ============================================================ */

// ========== ESTADO GLOBAL ==========
const state = {
    devices: [],
    connections: [],
    annotations: [],
    groups: [],
    layers: [{ id: 'default', name: 'Camada Principal', visible: true, locked: false }],
    activeLayer: 'default',
    selectedIds: [],
    clipboard: null,
    zoom: 1,
    connectionMode: null,
    showGrid: true,
    snapToGrid: true,
    measureMode: false,
    theme: 'light',
    lang: 'pt',
    presentation: { active: false, index: 0, points: [] },
    history: { past: [], future: [], max: 50 },
    versions: [],
    locked: false,
    password: null,
    compactMode: false,
    hasUnsavedChanges: false,
};

let deviceIdCounter = 0;
let connectionIdCounter = 0;
let annotationIdCounter = 0;
let groupIdCounter = 0;
let layerIdCounter = 0;

// ========== ELEMENTOS ==========
const canvas = document.getElementById('canvas');
const canvasSvg = document.getElementById('canvasSvg');
const canvasGuides = document.getElementById('canvasGuides');
const canvasScroll = document.getElementById('canvasScroll');
const selectionBox = document.getElementById('selectionBox');
const selectionBadge = document.getElementById('selectionBadge');
const selectionCount = document.getElementById('selectionCount');
const palette = document.getElementById('palette');
const propertiesForm = document.getElementById('propertiesForm');
const propertiesEmpty = document.getElementById('propertiesEmpty');
const connectionForm = document.getElementById('connectionForm');
const annotationForm = document.getElementById('annotationForm');
const multiSelectionForm = document.getElementById('multiSelectionForm');
const toast = document.getElementById('toast');
const cursorCoords = document.getElementById('cursorCoords');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapViewport = document.getElementById('minimapViewport');

// ========== I18N ==========
const I18N = {
    pt: { editor: 'Diagram Editor Pro', new: 'Novo', save: 'Salvar', load: 'Carregar', cloud: 'Nuvem', panels: 'Painéis', pdf: 'PDF' },
    en: { editor: 'Diagram Editor Pro', new: 'New', save: 'Save', load: 'Load', cloud: 'Cloud', panels: 'Panels', pdf: 'PDF' },
    es: { editor: 'Editor de Diagramas Pro', new: 'Nuevo', save: 'Guardar', load: 'Cargar', cloud: 'Nube', panels: 'Paneles', pdf: 'PDF' },
};

// ============================================================
// ========== BIBLIOTECA DE ÍCONES PERSONALIZADOS ============
// ============================================================
// Cada ícone tem:
//   - src: caminho da imagem em assets/icons/
//   - fallback: emoji caso a imagem não carregue
//   - name: nome legível
//   - keywords: palavras-chave para busca
//   - cat: categoria (roteadores, servidores, impressoras, switches, etc.)

const CUSTOM_ICONS = [
    // ===== ROTEADORES =====
    { src: 'assets/icons/roteador-tplink-branco.png',    fallback: '📶', name: 'Roteador TP-Link Branco',     keywords: 'tplink roteador wifi 2 antenas branco', cat: 'roteadores' },
    { src: 'assets/icons/roteador-tplink-3antenas.png',  fallback: '📶', name: 'Roteador TP-Link 3 Antenas',  keywords: 'tplink roteador wifi 3 antenas preto', cat: 'roteadores' },
    { src: 'assets/icons/roteador-tplink-4antenas.png',  fallback: '📶', name: 'Roteador TP-Link 4 Antenas',  keywords: 'tplink roteador wifi 4 antenas branco', cat: 'roteadores' },
    { src: 'assets/icons/roteador-tplink-arquitetura.png', fallback: '📶', name: 'Roteador TP-Link Curvo',    keywords: 'tplink roteador wifi 2 antenas curvo', cat: 'roteadores' },
    { src: 'assets/icons/roteador-linkone.png',          fallback: '📶', name: 'Roteador Link One',           keywords: 'linkone roteador wifi 2 antenas', cat: 'roteadores' },
    { src: 'assets/icons/roteador-intelbras-hotspot.png', fallback: '📶', name: 'Intelbras HotSpot 300',     keywords: 'intelbras hotspot wifi roteador', cat: 'roteadores' },
    { src: 'assets/icons/roteador-mikrotik.png',         fallback: '📡', name: 'Roteador Mikrotik',           keywords: 'mikrotik routerboard 4 antenas', cat: 'roteadores' },

    // ===== SERVIDORES =====
    { src: 'assets/icons/servidor-dell-t430.png',        fallback: '🖥', name: 'Servidor Dell T430',          keywords: 'dell servidor poweredge t430 torre', cat: 'servidores' },
    { src: 'assets/icons/servidor-dell-t320.png',        fallback: '🖥', name: 'Servidor Dell T320',          keywords: 'dell servidor poweredge t320 torre', cat: 'servidores' },
    { src: 'assets/icons/servidor-dell-torres.png',      fallback: '🖥', name: 'Servidor Dell Torre',         keywords: 'dell servidor torre poweredge', cat: 'servidores' },
    { src: 'assets/icons/desktop-dell.png',              fallback: '💻', name: 'Desktop Dell',                keywords: 'dell desktop optiplex computador', cat: 'servidores' },
    { src: 'assets/icons/mini-pc-dell.png',              fallback: '💻', name: 'Mini PC Dell',                keywords: 'dell mini pc micro optiplex', cat: 'servidores' },
    { src: 'assets/icons/notebook-dell-latitude.png',    fallback: '💻', name: 'Notebook Dell Latitude',      keywords: 'dell notebook latitude laptop', cat: 'servidores' },
    { src: 'assets/icons/notebook-dell-vostro.png',      fallback: '💻', name: 'Notebook Dell Vostro',        keywords: 'dell notebook vostro laptop', cat: 'servidores' },

    // ===== IMPRESSORAS =====
    { src: 'assets/icons/impressora-termica.png',        fallback: '🖨', name: 'Impressora Térmica',          keywords: 'impressora termica etiqueta zebra', cat: 'impressoras' },
    { src: 'assets/icons/impressora-epson.png',          fallback: '🖨', name: 'Impressora Epson',            keywords: 'epson impressora workforce multifuncional', cat: 'impressoras' },
    { src: 'assets/icons/impressora-hp-compacta.png',    fallback: '🖨', name: 'Impressora HP Compacta',      keywords: 'hp impressora deskjet compacta', cat: 'impressoras' },
    { src: 'assets/icons/impressora-hp-laserjet.png',    fallback: '🖨', name: 'Impressora HP LaserJet',      keywords: 'hp impressora laserjet preto', cat: 'impressoras' },
    { src: 'assets/icons/impressora-hp-color.png',       fallback: '🖨', name: 'Impressora HP Color',         keywords: 'hp impressora color laserjet multifuncional', cat: 'impressoras' },
    { src: 'assets/icons/impressora-multifuncional.png', fallback: '🖨', name: 'Multifuncional',              keywords: 'multifuncional impressora scanner copiadora', cat: 'impressoras' },

    // ===== SWITCHES =====
    { src: 'assets/icons/switch-dlink-24p.png',          fallback: '🔀', name: 'Switch D-Link 24 Portas',     keywords: 'dlink switch 24 portas des', cat: 'switches' },
    { src: 'assets/icons/switch-24p-generico.png',       fallback: '🔀', name: 'Switch 24 Portas',            keywords: 'switch 24 portas generico preto', cat: 'switches' },
    { src: 'assets/icons/switch-amp-24p.png',            fallback: '🔀', name: 'Switch AMP 24 Portas',        keywords: 'amp tyco switch 24 portas azul', cat: 'switches' },
    { src: 'assets/icons/switch-poe-8p.png',             fallback: '🔀', name: 'Switch PoE 8 Portas',         keywords: 'switch poe 8 portas preto', cat: 'switches' },
    { src: 'assets/icons/switch-tenda-8p.png',           fallback: '🔀', name: 'Switch Tenda 8 Portas',       keywords: 'tenda switch 8 portas branco', cat: 'switches' },
    { src: 'assets/icons/switch-tenda-5p.png',           fallback: '🔀', name: 'Switch Tenda 5 Portas',       keywords: 'tenda switch 5 portas branco', cat: 'switches' },

    // ===== CONVERSORES =====
    { src: 'assets/icons/conversor-miljet.png',          fallback: '🔄', name: 'Conversor Miljet SFP',        keywords: 'miljet conversor midia sfp rj45', cat: 'conversores' },
    { src: 'assets/icons/conversor-aligera.png',         fallback: '🔄', name: 'Conversor Aligera AG500',     keywords: 'aligera conversor ag500 ethernet', cat: 'conversores' },

    // ===== TELEFONIA =====
    { src: 'assets/icons/pabx-siemens.png',              fallback: '📞', name: 'PABX Siemens HiPath',         keywords: 'siemens pabx hipath telefonia', cat: 'telefonia' },
    { src: 'assets/icons/rack-siemens.png',              fallback: '🗄', name: 'Rack Siemens',                keywords: 'siemens rack telefonia gabinete', cat: 'telefonia' },

    // ===== CLIENTES =====
    { src: 'assets/icons/computador-win7.png',           fallback: '💻', name: 'Computador Windows 7',        keywords: 'computador desktop windows 7 hp', cat: 'clientes' },
    { src: 'assets/icons/computador-gamer.png',          fallback: '🖥', name: 'Computador Gamer',            keywords: 'computador gamer desktop monitor', cat: 'clientes' },
    { src: 'assets/icons/celular-x850.png',              fallback: '📱', name: 'Celular Android X850',        keywords: 'celular smartphone android x850', cat: 'clientes' },
    { src: 'assets/icons/iphone.png',                    fallback: '📱', name: 'iPhone',                      keywords: 'iphone apple smartphone ios', cat: 'clientes' },
    { src: 'assets/icons/maquininha-cielo.png',          fallback: '💳', name: 'Maquininha Cielo',            keywords: 'cielo maquininha cartao pos', cat: 'clientes' },
    { src: 'assets/icons/maquininha-henry.png',          fallback: '💳', name: 'Maquininha Henry',            keywords: 'henry maquininha cartao pos superfacil', cat: 'clientes' },
];

// ========== BIBLIOTECA DE EMOJIS FALLBACK ==========
const EMOJI_LIBRARY = [
    '☁', '📡', '📶', '🔀', '🖥', '💻', '📞', '🔄', '🛡', '📱',
    '🔌', '⚙', '🖨', '📠', '📺', '🎥', '🔒', '🔑', '📊', '📈',
    '🌐', '📧', '💾', '🗄', '📁', '📂', '🔧', '🔨', '⚡', '🔋',
    '📻', '🎮', '🕹', '🖱', '⌨', '🖲', '💿', '📀', '📷', '📹',
    '🎬', '🎙', '🔊', '🔔', '⏰', '⏱', '⌚', '🚀', '🌟', '⭐',
];

// ========== PALETA ==========
const DEVICE_TYPES = [
    { icon: '☁', name: 'Internet', category: 'wan', subtitle: 'Provedor' },
    { icon: '📡', name: 'Modem GPON', category: 'wan', subtitle: 'Huawei' },
    { icon: '📶', name: 'Roteador', category: 'core', subtitle: 'Wi-Fi' },
    { icon: '🔀', name: 'Switch', category: 'core', subtitle: '24 portas' },
    { icon: '🖥', name: 'Servidor', category: 'core', subtitle: 'Dell' },
    { icon: '💻', name: 'Computador', category: 'dist', subtitle: 'Desktop' },
    { icon: '📞', name: 'PABX', category: 'dist', subtitle: 'Intelbras' },
    { icon: '🔄', name: 'Conversor', category: 'dist', subtitle: 'Mídia' },
    { icon: '🛡', name: 'Firewall', category: 'core', subtitle: 'Modem' },
    { icon: '📱', name: 'Notebook', category: 'dist', subtitle: 'Laptop' },
];

// ========== CATEGORIAS DA PALETA ==========
const PALETTE_CATEGORIES = {
    wan: { name: 'WAN', icon: '🌐', color: '#F26A21' },
    core: { name: 'Núcleo', icon: '⚙️', color: '#3b82f6' },
    dist: { name: 'Distribuição', icon: '📡', color: '#10b981' },
    neutral: { name: 'Neutro', icon: '📦', color: '#6B7280' },
};

// ========== ESTADO DA PALETA E ÍCONES ==========
let paletteState = {
    search: '',
    filter: 'all',
    favorites: new Set(),
    recent: [],
};

let iconLibraryState = {
    search: '',
    filter: 'all',
};

// ============================================================
// INIT
// ============================================================
function init() {
    loadPreferences();
    loadPalettePreferences();
    applyTheme();
    applyLanguage();
    renderPalette();
    renderIconLibrary();
    renderLayers();
    renderRecentPalette();
    bindEvents();
    initAudio();

    const hasSaved = localStorage.getItem('kld-diagram');
    let restored = false;

    if (hasSaved && hasSaved.length > 10) {
        try {
            const data = JSON.parse(hasSaved);
            if (data && (data.devices?.length > 0 || data.connections?.length > 0 || data.annotations?.length > 0)) {
                loadData(data);
                showToast(`📂 Projeto restaurado (${data.devices?.length || 0} dispositivos)`);
                restored = true;
            }
        } catch (e) {
            console.warn('Erro ao restaurar projeto:', e);
        }
    }

    if (!restored) {
        loadTemplate('kld');
    }

    setTimeout(() => {
        drawMinimap();
        updateMinimapViewport();
    }, 500);

    setupAutoSave();
}

// ============================================================
// AUTO-SAVE
// ============================================================
function getStateHash() {
    try {
        const str = JSON.stringify(getSerializableState());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return String(hash);
    } catch (e) { return '0'; }
}

function setupAutoSave() {
    let lastSaveHash = getStateHash();
    setInterval(() => {
        if (state.devices.length === 0 && state.connections.length === 0) return;
        try {
            const current = getStateHash();
            if (current !== lastSaveHash) {
                localStorage.setItem('kld-diagram', JSON.stringify(getSerializableState()));
                lastSaveHash = current;
                state.hasUnsavedChanges = false;
                updateSaveIndicator();
            }
        } catch (e) {}
    }, 15000);

    window.addEventListener('beforeunload', () => {
        if (state.devices.length > 0 || state.connections.length > 0) {
            try { localStorage.setItem('kld-diagram', JSON.stringify(getSerializableState())); } catch (err) {}
        }
    });
}

function updateSaveIndicator() {
    const btn = document.getElementById('btnSaveLocal');
    if (!btn) return;
    if (state.hasUnsavedChanges) {
        btn.style.position = 'relative';
        if (!btn.querySelector('.unsaved-dot')) {
            const dot = document.createElement('span');
            dot.className = 'unsaved-dot';
            dot.style.cssText = 'position:absolute;top:4px;right:4px;width:8px;height:8px;background:#ef4444;border-radius:50%;box-shadow:0 0 0 2px var(--white);z-index:10;';
            btn.appendChild(dot);
        }
    } else {
        const dot = btn.querySelector('.unsaved-dot');
        if (dot) dot.remove();
    }
}

function markAsUnsaved() { state.hasUnsavedChanges = true; updateSaveIndicator(); }
function markAsSaved() { state.hasUnsavedChanges = false; updateSaveIndicator(); }

// ========== PREFERÊNCIAS ==========
function loadPreferences() {
    try {
        const prefs = JSON.parse(localStorage.getItem('kld-prefs') || '{}');
        if (prefs.theme) state.theme = prefs.theme;
        if (prefs.lang) state.lang = prefs.lang;
        if (prefs.showGrid !== undefined) state.showGrid = prefs.showGrid;
        if (prefs.snapToGrid !== undefined) state.snapToGrid = prefs.snapToGrid;
    } catch (e) {}
}

function savePreferences() {
    localStorage.setItem('kld-prefs', JSON.stringify({
        theme: state.theme, lang: state.lang,
        showGrid: state.showGrid, snapToGrid: state.snapToGrid,
    }));
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('btnTheme').classList.toggle('active', state.theme === 'dark');
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(); savePreferences(); playSound('toggle');
    showToast(state.theme === 'dark' ? '🌙 Tema escuro' : '☀️ Tema claro');
}

function applyLanguage() {
    const lang = I18N[state.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (lang[key]) el.textContent = lang[key];
    });
    document.documentElement.lang = state.lang === 'pt' ? 'pt-BR' : state.lang;
}

function cycleLanguage() {
    const langs = ['pt', 'en', 'es'];
    const idx = langs.indexOf(state.lang);
    state.lang = langs[(idx + 1) % langs.length];
    applyLanguage(); savePreferences(); playSound('toggle');
    showToast(`🌐 Idioma: ${state.lang.toUpperCase()}`);
}

// ========== ÁUDIO ==========
let audioCtx = null;
function initAudio() {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
}

function playSound(type) {
    if (!audioCtx) return;
    try {
        const sounds = {
            add: { freq: 880, dur: 0.08, type: 'sine' },
            connect: { freq: 1200, dur: 0.1, type: 'sine' },
            delete: { freq: 300, dur: 0.15, type: 'sawtooth' },
            toggle: { freq: 600, dur: 0.05, type: 'triangle' },
            error: { freq: 200, dur: 0.2, type: 'square' },
            success: { freq: 1400, dur: 0.1, type: 'sine' },
        };
        const s = sounds[type] || sounds.toggle;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = s.type; osc.frequency.value = s.freq;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + s.dur);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + s.dur);
    } catch (e) {}
}

// ============================================================
// HISTÓRICO
// ============================================================
function pushHistory() {
    const snapshot = {
        devices: JSON.parse(JSON.stringify(state.devices)),
        connections: JSON.parse(JSON.stringify(state.connections)),
        annotations: JSON.parse(JSON.stringify(state.annotations)),
        groups: JSON.parse(JSON.stringify(state.groups)),
        layers: JSON.parse(JSON.stringify(state.layers)),
    };
    state.history.past.push(snapshot);
    if (state.history.past.length > state.history.max) state.history.past.shift();
    state.history.future = [];
    markAsUnsaved();
}

function undo() {
    if (state.history.past.length === 0) { showToast('⚠️ Nada para desfazer'); return; }
    const current = {
        devices: JSON.parse(JSON.stringify(state.devices)),
        connections: JSON.parse(JSON.stringify(state.connections)),
        annotations: JSON.parse(JSON.stringify(state.annotations)),
        groups: JSON.parse(JSON.stringify(state.groups)),
        layers: JSON.parse(JSON.stringify(state.layers)),
    };
    state.history.future.push(current);
    restoreSnapshot(state.history.past.pop());
    markAsUnsaved(); showToast('↶ Desfeito'); playSound('toggle');
}

function redo() {
    if (state.history.future.length === 0) { showToast('⚠️ Nada para refazer'); return; }
    const current = {
        devices: JSON.parse(JSON.stringify(state.devices)),
        connections: JSON.parse(JSON.stringify(state.connections)),
        annotations: JSON.parse(JSON.stringify(state.annotations)),
        groups: JSON.parse(JSON.stringify(state.groups)),
        layers: JSON.parse(JSON.stringify(state.layers)),
    };
    state.history.past.push(current);
    restoreSnapshot(state.history.future.pop());
    markAsUnsaved(); showToast('↷ Refeito'); playSound('toggle');
}

function restoreSnapshot(snap) {
    state.devices = snap.devices;
    state.connections = snap.connections;
    state.annotations = snap.annotations || [];
    state.groups = snap.groups || [];
    state.layers = snap.layers || state.layers;
    state.devices.forEach(d => {
        const num = parseInt(d.id.replace('dev-', ''));
        if (num > deviceIdCounter) deviceIdCounter = num;
    });
    state.connections.forEach(c => {
        const num = parseInt(c.id.replace('conn-', ''));
        if (num > connectionIdCounter) connectionIdCounter = num;
    });
    renderAll();
}

function renderAll() {
    canvas.querySelectorAll('.device-node, .annotation, .group-box').forEach(el => el.remove());
    canvasSvg.querySelectorAll('path:not(.connection-preview), line, text, g').forEach(el => el.remove());
    state.groups.forEach(g => renderGroup(g));
    state.devices.forEach(d => renderDevice(d));
    state.annotations.forEach(a => renderAnnotation(a));
    renderLayers();
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            redrawConnections();
            drawMinimap();
        });
    });
}

// ============================================================
// PALETA AVANÇADA
// ============================================================
function loadPalettePreferences() {
    try {
        const prefs = JSON.parse(localStorage.getItem('kld-palette-prefs') || '{}');
        if (prefs.favorites) paletteState.favorites = new Set(prefs.favorites);
        if (prefs.recent) paletteState.recent = prefs.recent;
        if (prefs.customDevices && Array.isArray(prefs.customDevices)) {
            prefs.customDevices.forEach(d => {
                if (!DEVICE_TYPES.some(x => x.icon === d.icon && x.name === d.name)) {
                    DEVICE_TYPES.push(d);
                }
            });
        }
    } catch (e) {}
}

function savePalettePreferences() {
    const originalCount = 10;
    const customDevices = DEVICE_TYPES.slice(originalCount);
    localStorage.setItem('kld-palette-prefs', JSON.stringify({
        favorites: Array.from(paletteState.favorites),
        recent: paletteState.recent.slice(0, 8),
        customDevices: customDevices,
    }));
}

function getDeviceKey(device) { return `${device.icon}::${device.name}`; }

function toggleFavorite(deviceKey, event) {
    if (event) event.stopPropagation();
    if (paletteState.favorites.has(deviceKey)) {
        paletteState.favorites.delete(deviceKey);
        showToast('💔 Removido dos favoritos');
    } else {
        paletteState.favorites.add(deviceKey);
        showToast('⭐ Adicionado aos favoritos');
    }
    savePalettePreferences();
    renderPalette();
}

function addToRecent(device) {
    const key = getDeviceKey(device);
    paletteState.recent = paletteState.recent.filter(r => getDeviceKey(r) !== key);
    paletteState.recent.unshift({
        icon: device.icon, name: device.name,
        subtitle: device.subtitle || '', category: device.category,
    });
    paletteState.recent = paletteState.recent.slice(0, 8);
    savePalettePreferences();
    renderRecentPalette();
}

function renderPalette() {
    const container = document.getElementById('palette');
    if (!container) return;
    const search = paletteState.search.toLowerCase().trim();
    const filter = paletteState.filter;

    let filtered = DEVICE_TYPES.filter(d => {
        if (search) {
            const match = d.name.toLowerCase().includes(search) ||
                         (d.subtitle || '').toLowerCase().includes(search) ||
                         d.icon.includes(search);
            if (!match) return false;
        }
        if (filter === 'fav') return paletteState.favorites.has(getDeviceKey(d));
        if (filter !== 'all') return d.category === filter;
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="palette-empty">
                <span class="palette-empty__icon">${filter === 'fav' ? '⭐' : '🔍'}</span>
                ${filter === 'fav' ? 'Nenhum favorito ainda' : 'Nenhum dispositivo encontrado'}
            </div>`;
        return;
    }

    const grouped = {};
    filtered.forEach(d => {
        const cat = d.category || 'neutral';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(d);
    });

    let html = '';
    if (filter === 'all' || filter === 'fav') {
        Object.entries(grouped).forEach(([cat, devices]) => {
            const catInfo = PALETTE_CATEGORIES[cat] || PALETTE_CATEGORIES.neutral;
            html += `
                <div class="palette-category" data-cat="${cat}">
                    <div class="palette-category__title">${catInfo.icon} ${catInfo.name}</div>
                    <div class="palette" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        ${devices.map(d => renderPaletteItem(d)).join('')}
                    </div>
                </div>`;
        });
    } else {
        html = `<div class="palette" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            ${filtered.map(d => renderPaletteItem(d)).join('')}</div>`;
    }

    container.innerHTML = html;
    attachPaletteEvents();
}

function renderPaletteItem(d) {
    const key = getDeviceKey(d);
    const isFav = paletteState.favorites.has(key);
    const iconHtml = d.icon.startsWith('data:') || d.icon.includes('.png') || d.icon.includes('.jpg') || d.icon.includes('.svg')
        ? `<img src="${d.icon}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;">`
        : d.icon;
    return `
        <div class="palette-item" draggable="true"
             data-icon="${d.icon}" data-name="${d.name}"
             data-subtitle="${d.subtitle || ''}" data-category="${d.category || 'neutral'}"
             data-key="${key}">
            <button class="palette-item__fav ${isFav ? 'active' : ''}"
                    data-fav-key="${key}" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                ${isFav ? '⭐' : '☆'}
            </button>
            <span class="palette-item__icon">${iconHtml}</span>
            <span class="palette-item__name">${d.name}</span>
        </div>`;
}

function attachPaletteEvents() {
    document.querySelectorAll('.palette-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            const data = {
                icon: item.dataset.icon, name: item.dataset.name,
                subtitle: item.dataset.subtitle, category: item.dataset.category,
            };
            e.dataTransfer.setData('application/json', JSON.stringify(data));
            e.dataTransfer.effectAllowed = 'copy';
            item.classList.add('dragging');

            const preview = document.createElement('div');
            preview.className = 'drag-preview';
            const isImg = data.icon.startsWith('data:') || data.icon.includes('.png') || data.icon.includes('.jpg') || data.icon.includes('.svg');
            preview.innerHTML = `
                <div class="drag-preview__icon">${isImg ? `<img src="${data.icon}" style="max-width:32px;max-height:32px;">` : data.icon}</div>
                <div class="drag-preview__name">${data.name}</div>`;
            preview.style.left = e.clientX + 'px';
            preview.style.top = e.clientY + 'px';
            preview.id = 'dragPreview';
            document.body.appendChild(preview);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            document.getElementById('dragPreview')?.remove();
        });

        item.addEventListener('dblclick', () => {
            const data = {
                icon: item.dataset.icon, name: item.dataset.name,
                subtitle: item.dataset.subtitle, category: item.dataset.category,
            };
            const rect = canvasScroll.getBoundingClientRect();
            const x = (canvasScroll.scrollLeft + rect.width / 2) / state.zoom - 60;
            const y = (canvasScroll.scrollTop + rect.height / 2) / state.zoom - 40;
            addDevice({ x: Math.max(0, x), y: Math.max(0, y), ...data, ip: '', ip2: '' });
            addToRecent(data);
        });

        const favBtn = item.querySelector('.palette-item__fav');
        if (favBtn) favBtn.addEventListener('click', (e) => toggleFavorite(favBtn.dataset.favKey, e));
    });
}

function renderRecentPalette() {
    const section = document.getElementById('recentSection');
    const container = document.getElementById('paletteRecent');
    if (!section || !container) return;
    if (paletteState.recent.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    container.innerHTML = paletteState.recent.map(d => {
        const isImg = d.icon.startsWith('data:') || d.icon.includes('.png') || d.icon.includes('.jpg') || d.icon.includes('.svg');
        return `
        <div class="palette-recent__item" draggable="true"
             data-icon="${d.icon}" data-name="${d.name}"
             data-subtitle="${d.subtitle || ''}" data-category="${d.category}"
             title="${d.name}">
            ${isImg ? `<img src="${d.icon}" style="max-width:22px;max-height:22px;object-fit:contain;">` : d.icon}
        </div>`;
    }).join('');

    container.querySelectorAll('.palette-recent__item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({
                icon: item.dataset.icon, name: item.dataset.name,
                subtitle: item.dataset.subtitle, category: item.dataset.category,
            }));
            e.dataTransfer.effectAllowed = 'copy';
        });
        item.addEventListener('dblclick', () => {
            const rect = canvasScroll.getBoundingClientRect();
            const x = (canvasScroll.scrollLeft + rect.width / 2) / state.zoom - 60;
            const y = (canvasScroll.scrollTop + rect.height / 2) / state.zoom - 40;
            addDevice({ x: Math.max(0, x), y: Math.max(0, y),
                icon: item.dataset.icon, name: item.dataset.name,
                subtitle: item.dataset.subtitle, category: item.dataset.category, ip: '', ip2: '' });
        });
    });
}

function setupPaletteFilters() {
    document.querySelectorAll('.palette-filter').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.palette-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            paletteState.filter = btn.dataset.cat;
            renderPalette();
        };
    });
    const searchInput = document.getElementById('paletteSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            paletteState.search = e.target.value;
            renderPalette();
        };
    }
}

// ============================================================
// BIBLIOTECA DE ÍCONES (v8 — com ícones personalizados)
// ============================================================
function renderIconLibrary() {
    const lib = document.getElementById('iconLibrary');
    if (!lib) return;

    const search = iconLibraryState.search.toLowerCase().trim();
    const filter = iconLibraryState.filter;

    // Filtra ícones personalizados
    const filteredCustom = CUSTOM_ICONS.filter(ic => {
        if (search) {
            const match = ic.name.toLowerCase().includes(search) ||
                         ic.keywords.toLowerCase().includes(search);
            if (!match) return false;
        }
        if (filter !== 'all') return ic.cat === filter;
        return true;
    });

    // Filtra emojis
    const filteredEmojis = EMOJI_LIBRARY.filter(e => {
        if (search) return e.includes(search);
        if (filter !== 'all') return false;
        return true;
    });

    let html = '';

    // Seção 1: Ícones personalizados (imagens)
    if (filteredCustom.length > 0) {
        html += `<div class="icon-library__section-title">🖼️ Ícones Personalizados (${filteredCustom.length})</div>`;
        html += `<div class="icon-library__grid">`;
        filteredCustom.forEach((ic, idx) => {
            html += `
                <div class="icon-library__item icon-library__item--custom"
                     data-icon-src="${ic.src}"
                     data-icon-fallback="${ic.fallback}"
                     data-icon-name="${ic.name}"
                     title="${ic.name}">
                    <img src="${ic.src}" alt="${ic.name}"
                         onerror="this.style.display='none'; this.parentElement.classList.add('fallback'); this.parentElement.innerHTML='<span>${ic.fallback}</span>';">
                </div>`;
        });
        html += `</div>`;
    }

    // Seção 2: Emojis
    if (filteredEmojis.length > 0) {
        html += `<div class="icon-library__section-title">😀 Emojis (${filteredEmojis.length})</div>`;
        html += `<div class="icon-library__grid icon-library__grid--emoji">`;
        filteredEmojis.forEach(icon => {
            html += `<div class="icon-library__item" data-icon-emoji="${icon}" title="${icon}">${icon}</div>`;
        });
        html += `</div>`;
    }

    if (filteredCustom.length === 0 && filteredEmojis.length === 0) {
        html = `<div class="palette-empty"><span class="palette-empty__icon">🔍</span>Nenhum ícone encontrado</div>`;
    }

    lib.innerHTML = html;
    attachIconLibraryEvents();
}

function attachIconLibraryEvents() {
    document.querySelectorAll('.icon-library__item[data-icon-emoji]').forEach(item => {
        item.addEventListener('click', () => {
            applyIconToSelected(item.dataset.iconEmoji, item.dataset.iconEmoji);
        });
    });

    document.querySelectorAll('.icon-library__item[data-icon-src]').forEach(item => {
        item.addEventListener('click', () => {
            const src = item.dataset.iconSrc;
            const fallback = item.dataset.iconFallback;
            const name = item.dataset.iconName;
            // Usa caminho relativo da imagem
            applyIconToSelected(src, name);
        });
    });
}

function applyIconToSelected(icon, label) {
    const deviceSels = state.selectedIds.filter(s => s.type === 'device');
    if (deviceSels.length === 0) {
        showToast('⚠️ Selecione um dispositivo primeiro');
        playSound('error');
        return;
    }
    pushHistory();
    deviceSels.forEach(sel => {
        const dev = state.devices.find(d => d.id === sel.id);
        if (dev) {
            dev.icon = icon;
            updateDeviceVisual(dev);
        }
    });
    showToast(`✅ "${label}" aplicado a ${deviceSels.length} dispositivo(s)`);
    playSound('success');
}

function setupIconLibraryFilters() {
    document.querySelectorAll('.icon-filter').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.icon-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            iconLibraryState.filter = btn.dataset.iconcat;
            renderIconLibrary();
        };
    });

    const searchInput = document.getElementById('iconSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            iconLibraryState.search = e.target.value;
            renderIconLibrary();
        };
    }
}

// ============================================================
// CRIAR DISPOSITIVO CUSTOMIZADO
// ============================================================
function createCustomDevice() {
    const html = `
        <div class="form-group">
            <label>Nome</label>
            <input type="text" id="customDevName" placeholder="Ex: Roteador Cisco" value="Novo Dispositivo">
        </div>
        <div class="form-group">
            <label>Subtítulo</label>
            <input type="text" id="customDevSubtitle" placeholder="Ex: RV340">
        </div>
        <div class="form-group">
            <label>Ícone (emoji)</label>
            <input type="text" id="customDevIcon" value="📦" maxlength="4">
        </div>
        <div class="form-group">
            <label>Categoria</label>
            <select id="customDevCategory">
                <option value="wan">WAN</option>
                <option value="core">Núcleo</option>
                <option value="dist">Distribuição</option>
                <option value="neutral" selected>Neutro</option>
            </select>
        </div>`;
    showModal('➕ Criar Dispositivo', html, [
        { text: 'Cancelar', class: 'btn--outline', action: closeModal },
        { text: 'Criar', class: 'btn--primary', action: () => {
            const name = document.getElementById('customDevName').value.trim() || 'Dispositivo';
            const subtitle = document.getElementById('customDevSubtitle').value.trim();
            const icon = document.getElementById('customDevIcon').value.trim() || '📦';
            const category = document.getElementById('customDevCategory').value;
            DEVICE_TYPES.push({ icon, name, subtitle, category });
            savePalettePreferences();
            closeModal();
            renderPalette();
            showToast(`✅ "${name}" adicionado à paleta`);
            playSound('success');
        }},
    ]);
}

// ============================================================
// CAMADAS
// ============================================================
function renderLayers() {
    const list = document.getElementById('layersList');
    list.innerHTML = state.layers.map(layer => `
        <div class="layer-item ${layer.id === state.activeLayer ? 'active' : ''}">
            <button class="layer-item__toggle" data-layer-toggle="${layer.id}" title="Visibilidade">
                ${layer.visible ? '👁' : '🚫'}
            </button>
            <span class="layer-item__name" data-layer-select="${layer.id}">${layer.name}</span>
            ${layer.id !== 'default' ? `<button class="layer-item__toggle" data-layer-delete="${layer.id}" title="Excluir">🗑</button>` : ''}
        </div>`).join('');

    list.querySelectorAll('[data-layer-toggle]').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const layer = state.layers.find(l => l.id === btn.dataset.layerToggle);
            if (layer) {
                layer.visible = !layer.visible;
                renderLayers(); renderAll(); markAsUnsaved();
                showToast(`👁 Camada ${layer.name}: ${layer.visible ? 'visível' : 'oculta'}`);
            }
        };
    });
    list.querySelectorAll('[data-layer-select]').forEach(el => {
        el.onclick = () => { state.activeLayer = el.dataset.layerSelect; renderLayers(); };
    });
    list.querySelectorAll('[data-layer-delete]').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const layerId = btn.dataset.layerDelete;
            const devicesInLayer = state.devices.filter(d => d.layer === layerId);
            if (devicesInLayer.length > 0) {
                if (!confirm(`A camada tem ${devicesInLayer.length} dispositivos. Excluir mesmo assim?`)) return;
            }
            pushHistory();
            state.layers = state.layers.filter(l => l.id !== layerId);
            state.devices = state.devices.filter(d => d.layer !== layerId);
            if (state.activeLayer === layerId) state.activeLayer = 'default';
            renderAll(); renderLayers();
            showToast('🗑 Camada excluída'); playSound('delete');
        };
    });
}

function addLayer() {
    const name = prompt('Nome da nova camada:', `Camada ${state.layers.length + 1}`);
    if (!name) return;
    const layer = { id: `layer-${++layerIdCounter}`, name, visible: true, locked: false };
    state.layers.push(layer);
    state.activeLayer = layer.id;
    renderLayers(); markAsUnsaved();
    showToast(`✅ Camada "${name}" criada`); playSound('success');
}

// ============================================================
// DISPOSITIVOS
// ============================================================
function addDevice({ x, y, name, subtitle, ip, ip2, icon, category, color, rotation, iconZoom, layer }) {
    const device = {
        id: `dev-${++deviceIdCounter}`,
        x, y,
        name: name || 'Novo Dispositivo',
        subtitle: subtitle || '',
        ip: ip || '', ip2: ip2 || '',
        icon: icon || '📦',
        category: category || 'neutral',
        color: color || null,
        rotation: rotation || 0,
        iconZoom: iconZoom || 100,
        locked: false,
        layer: layer || state.activeLayer,
    };
    state.devices.push(device);
    renderDevice(device);
    selectDevice(device.id);
    pushHistory(); playSound('add');
    showToast(`✅ ${device.name} adicionado`);
}

function renderDevice(device) {
    let el = document.getElementById(device.id);
    if (!el) {
        el = document.createElement('div');
        canvas.appendChild(el);
    }
    el.className = `device-node ${device.category}`;
    if (state.selectedIds.some(s => s.id === device.id)) el.classList.add('selected');
    if (state.selectedIds.length > 1 && state.selectedIds.some(s => s.id === device.id)) {
        el.classList.add('multi-selected');
    }
    if (device.locked) el.classList.add('locked');
    el.id = device.id;
    el.style.left = `${device.x}px`;
    el.style.top = `${device.y}px`;
    el.style.transform = `rotate(${device.rotation || 0}deg)`;
    if (device.color) {
        el.style.borderTopColor = device.color;
        el.style.borderTopWidth = '4px';
    }
    const layer = state.layers.find(l => l.id === device.layer);
    el.style.display = (layer && !layer.visible) ? 'none' : 'flex';

    const iconZoom = device.iconZoom || 100;
    const fontSize = iconZoom * 0.22;
    const isImgIcon = device.icon.startsWith('data:') || device.icon.includes('.png') || device.icon.includes('.jpg') || device.icon.includes('.svg');

    el.innerHTML = `
        <div class="device-node__ports">
            <div class="device-node__port" data-dir="top"    data-device="${device.id}"></div>
            <div class="device-node__port" data-dir="right"  data-device="${device.id}"></div>
            <div class="device-node__port" data-dir="bottom" data-device="${device.id}"></div>
            <div class="device-node__port" data-dir="left"   data-device="${device.id}"></div>
        </div>
        <div class="device-node__icon" style="font-size: ${fontSize}px;">
            ${isImgIcon ? `<img src="${device.icon}" alt="" style="transform: scale(${iconZoom/100}); transition: transform 0.15s;" onerror="this.style.display='none'; this.parentElement.textContent='📦';">` : device.icon}
        </div>
        <div class="device-node__name">${device.name}</div>
        ${device.subtitle ? `<div class="device-node__subtitle">${device.subtitle}</div>` : ''}
        ${device.ip ? `<div class="device-node__ip">${device.ip}</div>` : ''}
        ${device.ip2 ? `<div class="device-node__ip alt">${device.ip2}</div>` : ''}
    `;
    attachDeviceEvents(el, device);
}

function attachDeviceEvents(el, device) {
    el.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('device-node__port')) return;
        e.stopPropagation();
        if (device.locked) { showToast('🔒 Dispositivo bloqueado'); return; }
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            toggleSelection(device.id, 'device');
        } else {
            const isSelected = state.selectedIds.some(s => s.id === device.id);
            if (!isSelected || state.selectedIds.length === 1) {
                clearSelection(); addToSelection(device.id, 'device');
            }
        }
        updateSelectionUI();
        startMultiDrag(e);
    });

    el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        focusPropertyInput('propName');
    });

    el.querySelectorAll('.device-node__port').forEach(port => {
        port.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!state.connectionMode) {
                showToast('⚠️ Selecione um tipo de conexão primeiro');
                playSound('error'); return;
            }
            handlePortClick(device.id, port.dataset.dir, e);
        });

        port.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (!state.connectionMode) {
                showToast('⚠️ Selecione um tipo de conexão primeiro');
                playSound('error'); return;
            }
            if (clickConnectionFirst) return;
            e.preventDefault();
            startConnection(device.id, port.dataset.dir, e);
        });

        port.addEventListener('mouseenter', () => {
            if (!state.connectionMode) return;
            port.classList.add('snap-target');
        });
        port.addEventListener('mouseleave', () => {
            if (clickConnectionFirst) return;
            port.classList.remove('snap-target');
        });
    });
}

// ============================================================
// SELEÇÃO
// ============================================================
function clearSelection() {
    state.selectedIds = [];
    document.querySelectorAll('.device-node.selected, .annotation.selected, .multi-selected')
        .forEach(el => el.classList.remove('selected', 'multi-selected'));
    updateSelectionUI();
}

function addToSelection(id, type) {
    if (!state.selectedIds.some(s => s.id === id)) {
        state.selectedIds.push({ id, type });
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('selected');
            if (state.selectedIds.length > 1) el.classList.add('multi-selected');
        }
    }
    updateSelectionUI();
}

function removeFromSelection(id) {
    state.selectedIds = state.selectedIds.filter(s => s.id !== id);
    const el = document.getElementById(id);
    if (el) el.classList.remove('selected', 'multi-selected');
    updateSelectionUI();
}

function toggleSelection(id, type) {
    if (state.selectedIds.some(s => s.id === id)) removeFromSelection(id);
    else addToSelection(id, type);
}

function updateSelectionUI() {
    const count = state.selectedIds.length;
    selectionCount.textContent = count;
    selectionBadge.classList.toggle('show', count > 1);

    const alignGroup = document.getElementById('alignGroup');
    const deviceCount = state.selectedIds.filter(s => s.type === 'device').length;
    alignGroup.style.display = deviceCount >= 2 ? 'flex' : 'none';

    if (count === 0) {
        propertiesEmpty.style.display = 'block';
        propertiesForm.style.display = 'none';
        connectionForm.style.display = 'none';
        annotationForm.style.display = 'none';
        multiSelectionForm.style.display = 'none';
    } else if (count === 1) {
        const sel = state.selectedIds[0];
        if (sel.type === 'device') selectDevice(sel.id);
        else if (sel.type === 'connection') selectConnection(sel.id);
        else if (sel.type === 'annotation') selectAnnotation(sel.id);
    } else {
        const devices = state.selectedIds.filter(s => s.type === 'device');
        if (devices.length > 0) {
            propertiesEmpty.style.display = 'none';
            propertiesForm.style.display = 'none';
            connectionForm.style.display = 'none';
            annotationForm.style.display = 'none';
            multiSelectionForm.style.display = 'block';
            document.getElementById('multiCount').textContent = devices.length;
        }
    }
}

// ============================================================
// ARRASTAR
// ============================================================
function startMultiDrag(e) {
    const selectedDevices = state.selectedIds
        .filter(s => s.type === 'device')
        .map(s => state.devices.find(d => d.id === s.id))
        .filter(d => d && !d.locked);
    if (selectedDevices.length === 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const originalPositions = selectedDevices.map(d => ({ id: d.id, x: d.x, y: d.y }));
    const SNAP = 20;

    const onMove = (ev) => {
        let dx = (ev.clientX - startX) / state.zoom;
        let dy = (ev.clientY - startY) / state.zoom;
        const refOrig = originalPositions[0];
        let newRefX = refOrig.x + dx;
        let newRefY = refOrig.y + dy;

        if (state.snapToGrid) {
            newRefX = Math.round(newRefX / SNAP) * SNAP;
            newRefY = Math.round(newRefY / SNAP) * SNAP;
        }

        clearGuides();
        if (selectedDevices.length === 1) {
            const tolerance = 8;
            state.devices.forEach(other => {
                if (other.id === refOrig.id) return;
                if (Math.abs(other.x - newRefX) < tolerance) {
                    newRefX = other.x;
                    drawGuide('v', other.x + 60);
                }
                if (Math.abs(other.y - newRefY) < tolerance) {
                    newRefY = other.y;
                    drawGuide('h', other.y + 40);
                }
            });
        }

        dx = newRefX - refOrig.x;
        dy = newRefY - refOrig.y;

        originalPositions.forEach(op => {
            const dev = state.devices.find(d => d.id === op.id);
            if (!dev || dev.locked) return;
            dev.x = Math.max(0, op.x + dx);
            dev.y = Math.max(0, op.y + dy);
            const el = document.getElementById(dev.id);
            if (el) {
                el.style.left = `${dev.x}px`;
                el.style.top = `${dev.y}px`;
            }
        });
        redrawConnections();
    };

    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        clearGuides();
        const changed = originalPositions.some(op => {
            const d = state.devices.find(dd => dd.id === op.id);
            return d && (d.x !== op.x || d.y !== op.y);
        });
        if (changed) { pushHistory(); drawMinimap(); }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

// ========== CAIXA DE SELEÇÃO ==========
let selectionBoxStart = null;

function startSelectionBox(e) {
    if (e.target !== canvas) return;
    const rect = canvas.getBoundingClientRect();
    selectionBoxStart = {
        x: (e.clientX - rect.left) / state.zoom,
        y: (e.clientY - rect.top) / state.zoom,
    };
    selectionBox.classList.add('active');
    selectionBox.style.left = `${selectionBoxStart.x}px`;
    selectionBox.style.top = `${selectionBoxStart.y}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';

    const onMove = (ev) => {
        const currX = (ev.clientX - rect.left) / state.zoom;
        const currY = (ev.clientY - rect.top) / state.zoom;
        const x = Math.min(selectionBoxStart.x, currX);
        const y = Math.min(selectionBoxStart.y, currY);
        const w = Math.abs(currX - selectionBoxStart.x);
        const h = Math.abs(currY - selectionBoxStart.y);
        selectionBox.style.left = `${x}px`;
        selectionBox.style.top = `${y}px`;
        selectionBox.style.width = `${w}px`;
        selectionBox.style.height = `${h}px`;
        if (!ev.shiftKey) {
            state.selectedIds = [];
            document.querySelectorAll('.device-node.selected').forEach(el => el.classList.remove('selected', 'multi-selected'));
        }
        const box = { x, y, w, h };
        state.devices.forEach(dev => {
            const devBox = { x: dev.x, y: dev.y, w: 120, h: 100 };
            if (intersects(box, devBox)) {
                if (!state.selectedIds.some(s => s.id === dev.id)) addToSelection(dev.id, 'device');
            }
        });
        updateSelectionUI();
    };

    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        selectionBox.classList.remove('active');
        selectionBoxStart = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

function intersects(a, b) {
    return !(b.x > a.x + a.w || b.x + b.w < a.x || b.y > a.y + a.h || b.y + b.h < a.y);
}

function drawGuide(type, position) {
    const line = document.createElement('div');
    line.className = `guide-line guide-line--${type}`;
    if (type === 'h') line.style.top = `${position}px`;
    else line.style.left = `${position}px`;
    canvasGuides.appendChild(line);
}

function clearGuides() { canvasGuides.innerHTML = ''; }

// ========== SELECIONAR DISPOSITIVO ==========
function selectDevice(id) {
    const device = state.devices.find(d => d.id === id);
    if (!device) return;
    propertiesEmpty.style.display = 'none';
    connectionForm.style.display = 'none';
    annotationForm.style.display = 'none';
    multiSelectionForm.style.display = 'none';
    propertiesForm.style.display = 'block';

    document.getElementById('propName').value = device.name;
    document.getElementById('propSubtitle').value = device.subtitle || '';
    document.getElementById('propIp').value = device.ip || '';
    document.getElementById('propIp2').value = device.ip2 || '';
    document.getElementById('propIcon').value = device.icon;
    document.getElementById('propIconZoom').value = device.iconZoom || 100;
    document.getElementById('iconZoomValue').textContent = `${device.iconZoom || 100}%`;
    document.getElementById('propCategory').value = device.category;
    document.getElementById('propColor').value = device.color || '#F26A21';
    document.getElementById('propRotation').value = device.rotation || 0;
    document.getElementById('rotationValue').textContent = (device.rotation || 0) + '°';
    document.getElementById('propLocked').checked = device.locked || false;
    bindPropertyInputs(device);
}

function bindPropertyInputs(device) {
    const inputs = { propName: 'name', propSubtitle: 'subtitle', propIp: 'ip', propIp2: 'ip2', propIcon: 'icon' };
    Object.entries(inputs).forEach(([inputId, key]) => {
        const input = document.getElementById(inputId);
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        newInput.oninput = () => { device[key] = newInput.value; updateDeviceVisual(device); markAsUnsaved(); };
        newInput.onchange = () => { device[key] = newInput.value; pushHistory(); };
    });

    const catInput = document.getElementById('propCategory');
    const newCat = catInput.cloneNode(true);
    catInput.parentNode.replaceChild(newCat, catInput);
    newCat.onchange = (e) => { device.category = e.target.value; updateDeviceVisual(device); pushHistory(); };

    const colorInput = document.getElementById('propColor');
    const newColor = colorInput.cloneNode(true);
    colorInput.parentNode.replaceChild(newColor, colorInput);
    newColor.oninput = (e) => { device.color = e.target.value; updateDeviceVisual(device); markAsUnsaved(); };
    newColor.onchange = () => pushHistory();

    const resetBtn = document.getElementById('btnClearColor');
    const newReset = resetBtn.cloneNode(true);
    resetBtn.parentNode.replaceChild(newReset, resetBtn);
    newReset.onclick = () => { device.color = null; updateDeviceVisual(device); pushHistory(); showToast('🎨 Cor resetada'); };

    const rotInput = document.getElementById('propRotation');
    const newRot = rotInput.cloneNode(true);
    rotInput.parentNode.replaceChild(newRot, rotInput);
    newRot.oninput = (e) => {
        device.rotation = parseInt(e.target.value);
        document.getElementById('rotationValue').textContent = device.rotation + '°';
        updateDeviceVisual(device); markAsUnsaved();
    };
    newRot.onchange = () => pushHistory();

    const resetRotBtn = document.getElementById('btnResetRotation');
    const newResetRot = resetRotBtn.cloneNode(true);
    resetRotBtn.parentNode.replaceChild(newResetRot, resetRotBtn);
    newResetRot.onclick = () => {
        device.rotation = 0;
        document.getElementById('propRotation').value = 0;
        document.getElementById('rotationValue').textContent = '0°';
        updateDeviceVisual(device); pushHistory();
        showToast('↺ Rotação resetada'); playSound('toggle');
    };

    const iconZoomInput = document.getElementById('propIconZoom');
    const newIconZoom = iconZoomInput.cloneNode(true);
    iconZoomInput.parentNode.replaceChild(newIconZoom, iconZoomInput);
    newIconZoom.value = device.iconZoom || 100;
    document.getElementById('iconZoomValue').textContent = `${device.iconZoom || 100}%`;
    newIconZoom.oninput = (e) => {
        device.iconZoom = parseInt(e.target.value);
        document.getElementById('iconZoomValue').textContent = `${device.iconZoom}%`;
        updateDeviceVisual(device); markAsUnsaved();
    };
    newIconZoom.onchange = () => pushHistory();

    const resetZoomBtn = document.getElementById('btnResetIconZoom');
    const newResetZoom = resetZoomBtn.cloneNode(true);
    resetZoomBtn.parentNode.replaceChild(newResetZoom, resetZoomBtn);
    newResetZoom.onclick = () => {
        device.iconZoom = 100;
        document.getElementById('propIconZoom').value = 100;
        document.getElementById('iconZoomValue').textContent = '100%';
        updateDeviceVisual(device); pushHistory();
        showToast('↺ Zoom do ícone resetado'); playSound('toggle');
    };

    const lockInput = document.getElementById('propLocked');
    const newLock = lockInput.cloneNode(true);
    lockInput.parentNode.replaceChild(newLock, lockInput);
    newLock.onchange = (e) => { device.locked = e.target.checked; updateDeviceVisual(device); pushHistory(); };
}

function focusPropertyInput(id) {
    const el = document.getElementById(id);
    if (el) { el.focus(); el.select(); }
}

function updateDeviceVisual(device) {
    const el = document.getElementById(device.id);
    if (!el) return;
    el.className = `device-node ${device.category}`;
    if (state.selectedIds.some(s => s.id === device.id)) el.classList.add('selected');
    if (state.selectedIds.length > 1 && state.selectedIds.some(s => s.id === device.id)) el.classList.add('multi-selected');
    if (device.locked) el.classList.add('locked');
    el.style.transform = `rotate(${device.rotation || 0}deg)`;
    if (device.color) {
        el.style.borderTopColor = device.color;
        el.style.borderTopWidth = '4px';
    } else {
        el.style.borderTopColor = '';
        el.style.borderTopWidth = '';
    }

    const iconZoom = device.iconZoom || 100;
    const fontSize = iconZoom * 0.22;
    const isImgIcon = device.icon.startsWith('data:') || device.icon.includes('.png') || device.icon.includes('.jpg') || device.icon.includes('.svg');
    const iconEl = el.querySelector('.device-node__icon');
    if (iconEl) {
        iconEl.innerHTML = isImgIcon
            ? `<img src="${device.icon}" alt="" style="transform: scale(${iconZoom/100}); transition: transform 0.15s;" onerror="this.style.display='none'; this.parentElement.textContent='📦';">`
            : device.icon;
        iconEl.style.fontSize = `${fontSize}px`;
    }

    const nameEl = el.querySelector('.device-node__name');
    if (nameEl) nameEl.textContent = device.name;
    el.querySelectorAll('.device-node__subtitle, .device-node__ip').forEach(n => n.remove());

    if (device.subtitle) {
        const sub = document.createElement('div');
        sub.className = 'device-node__subtitle';
        sub.textContent = device.subtitle;
        el.appendChild(sub);
    }
    if (device.ip) {
        const ip = document.createElement('div');
        ip.className = 'device-node__ip';
        ip.textContent = device.ip;
        el.appendChild(ip);
    }
    if (device.ip2) {
        const ip2 = document.createElement('div');
        ip2.className = 'device-node__ip alt';
        ip2.textContent = device.ip2;
        el.appendChild(ip2);
    }
    redrawConnections();
    drawMinimap();
}

// ============================================================
// COPIAR / COLAR / DUPLICAR
// ============================================================
function copySelected() {
    if (state.selectedIds.length === 0) { showToast('⚠️ Nada selecionado'); return; }
    const items = state.selectedIds.filter(s => s.type === 'device')
        .map(s => state.devices.find(d => d.id === s.id)).filter(Boolean);
    if (items.length === 0) return;
    state.clipboard = JSON.parse(JSON.stringify(items));
    showToast(`📋 ${items.length} dispositivo(s) copiado(s)`); playSound('toggle');
}

function paste() {
    if (!state.clipboard || state.clipboard.length === 0) { showToast('⚠️ Nada para colar'); return; }
    pushHistory();
    const offset = 40;
    clearSelection();
    state.clipboard.forEach(item => {
        const device = { ...item, id: `dev-${++deviceIdCounter}`, x: item.x + offset, y: item.y + offset, layer: state.activeLayer };
        state.devices.push(device);
        renderDevice(device);
        addToSelection(device.id, 'device');
    });
    showToast(`📋 ${state.clipboard.length} dispositivo(s) colado(s)`); playSound('success');
    drawMinimap();
}

function duplicateSelected() {
    if (state.selectedIds.length === 0) return;
    copySelected(); paste();
}

// ============================================================
// CONEXÕES
// ============================================================
let connectionState = { active: false, fromId: null, fromDir: null, previewPath: null, hoveredPort: null };
let clickConnectionFirst = null;

function startConnection(fromId, fromDir, e) {
    if (connectionState.active) return;
    const fromDev = state.devices.find(d => d.id === fromId);
    if (!fromDev) return;
    const fromPortPos = getPortPosition(fromDev, fromDir);
    connectionState.active = true;
    connectionState.fromId = fromId;
    connectionState.fromDir = fromDir;
    document.body.classList.add('connecting');
    canvas.classList.add('connecting');
    const fromPortEl = document.querySelector(`.device-node__port[data-device="${fromId}"][data-dir="${fromDir}"]`);
    if (fromPortEl) fromPortEl.classList.add('connection-origin');

    const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    previewPath.setAttribute('class', 'connection-preview');
    previewPath.setAttribute('fill', 'none');
    previewPath.setAttribute('stroke', getConnectionColor(state.connectionMode || 'rj45'));
    previewPath.setAttribute('stroke-width', '3');
    previewPath.setAttribute('stroke-dasharray', '8 4');
    previewPath.setAttribute('stroke-linecap', 'round');
    canvasSvg.appendChild(previewPath);
    connectionState.previewPath = previewPath;
    previewPath.setAttribute('d', `M ${fromPortPos.x} ${fromPortPos.y} L ${fromPortPos.x} ${fromPortPos.y}`);

    const onMove = (ev) => {
        if (!connectionState.active) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (ev.clientX - rect.left) / state.zoom;
        const mouseY = (ev.clientY - rect.top) / state.zoom;
        const nearest = findNearestPort(ev.clientX, ev.clientY, fromId);

        if (connectionState.hoveredPort && connectionState.hoveredPort !== nearest?.el) {
            connectionState.hoveredPort.classList.remove('snap-target');
            const prevDevice = connectionState.hoveredPort.closest('.device-node');
            if (prevDevice) prevDevice.classList.remove('target-highlight');
        }
        if (nearest) {
            nearest.el.classList.add('snap-target');
            const targetDevice = nearest.el.closest('.device-node');
            if (targetDevice) targetDevice.classList.add('target-highlight');
            connectionState.hoveredPort = nearest.el;
            previewPath.setAttribute('d', `M ${fromPortPos.x} ${fromPortPos.y} L ${nearest.x} ${nearest.y}`);
        } else {
            connectionState.hoveredPort = null;
            previewPath.setAttribute('d', `M ${fromPortPos.x} ${fromPortPos.y} L ${mouseX} ${mouseY}`);
        }
    };

    const onUp = (ev) => {
        if (!connectionState.active) return;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        const nearest = findNearestPort(ev.clientX, ev.clientY, fromId);
        if (connectionState.previewPath) { connectionState.previewPath.remove(); connectionState.previewPath = null; }
        document.querySelectorAll('.device-node__port.snap-target').forEach(el => el.classList.remove('snap-target'));
        document.querySelectorAll('.device-node.target-highlight').forEach(el => el.classList.remove('target-highlight'));
        document.querySelectorAll('.device-node__port.connection-origin').forEach(el => el.classList.remove('connection-origin'));
        connectionState.active = false;
        connectionState.fromId = null;
        connectionState.fromDir = null;
        connectionState.hoveredPort = null;
        document.body.classList.remove('connecting');
        canvas.classList.remove('connecting');

        if (nearest) {
            const toId = nearest.deviceId;
            if (toId === fromId) { showToast('⚠️ Não pode conectar ao mesmo dispositivo'); playSound('error'); return; }
            const exists = state.connections.some(c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId));
            if (exists) { showToast('⚠️ Conexão já existe'); playSound('error'); return; }
            addConnection(fromId, toId, state.connectionMode || 'rj45');
            const fromEl = document.getElementById(fromId);
            const toEl = document.getElementById(toId);
            if (fromEl) { fromEl.classList.add('connection-created'); setTimeout(() => fromEl.classList.remove('connection-created'), 600); }
            if (toEl) { toEl.classList.add('connection-created'); setTimeout(() => toEl.classList.remove('connection-created'), 600); }
        }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

function getPortPosition(device, dir) {
    const el = document.getElementById(device.id);
    if (!el) return { x: device.x + 60, y: device.y + 40 };
    const rect = el.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const cx = (rect.left - canvasRect.left) / state.zoom;
    const cy = (rect.top - canvasRect.top) / state.zoom;
    const w = rect.width / state.zoom;
    const h = rect.height / state.zoom;
    switch (dir) {
        case 'top':    return { x: cx + w / 2, y: cy };
        case 'bottom': return { x: cx + w / 2, y: cy + h };
        case 'left':   return { x: cx, y: cy + h / 2 };
        case 'right':  return { x: cx + w, y: cy + h / 2 };
        default:       return { x: cx + w / 2, y: cy + h / 2 };
    }
}

function findNearestPort(clientX, clientY, excludeDeviceId = null) {
    const SNAP_RADIUS = 80;
    let nearest = null;
    let minDist = SNAP_RADIUS;
    state.devices.forEach(device => {
        if (device.id === excludeDeviceId) return;
        if (device.locked) return;
        ['top', 'right', 'bottom', 'left'].forEach(dir => {
            const portEl = document.querySelector(`.device-node__port[data-device="${device.id}"][data-dir="${dir}"]`);
            if (!portEl) return;
            const portRect = portEl.getBoundingClientRect();
            const px = portRect.left + portRect.width / 2;
            const py = portRect.top + portRect.height / 2;
            const dx = clientX - px;
            const dy = clientY - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                const canvasRect = canvas.getBoundingClientRect();
                nearest = { el: portEl, deviceId: device.id, dir,
                    x: (px - canvasRect.left) / state.zoom,
                    y: (py - canvasRect.top) / state.zoom };
            }
        });
    });
    return nearest;
}

function handlePortClick(fromId, fromDir, e) {
    if (!clickConnectionFirst) {
        clickConnectionFirst = { fromId, fromDir };
        const el = document.querySelector(`.device-node__port[data-device="${fromId}"][data-dir="${fromDir}"]`);
        if (el) el.classList.add('connection-origin');
        showToast(`🔗 Porta selecionada. Clique em outra porta.`); playSound('toggle');
    } else {
        const { fromId: firstFromId } = clickConnectionFirst;
        document.querySelectorAll('.device-node__port.connection-origin').forEach(el => el.classList.remove('connection-origin'));
        clickConnectionFirst = null;
        if (firstFromId === fromId) { showToast('⚠️ Não pode conectar ao mesmo dispositivo'); playSound('error'); return; }
        const exists = state.connections.some(c => (c.from === firstFromId && c.to === fromId) || (c.from === fromId && c.to === firstFromId));
        if (exists) { showToast('⚠️ Conexão já existe'); playSound('error'); return; }
        addConnection(firstFromId, fromId, state.connectionMode || 'rj45');
        const fromEl = document.getElementById(firstFromId);
        const toEl = document.getElementById(fromId);
        if (fromEl) { fromEl.classList.add('connection-created'); setTimeout(() => fromEl.classList.remove('connection-created'), 600); }
        if (toEl) { toEl.classList.add('connection-created'); setTimeout(() => toEl.classList.remove('connection-created'), 600); }
    }
}

function addConnection(fromId, toId, type) {
    if (!fromId || !toId || fromId === toId) { showToast('⚠️ Conexão inválida'); playSound('error'); return; }
    const from = state.devices.find(d => d.id === fromId);
    const to = state.devices.find(d => d.id === toId);
    if (!from || !to) return;
    const conn = {
        id: `conn-${++connectionIdCounter}`,
        from: fromId, to: toId,
        type: type || 'rj45',
        label: getConnectionLabel(type),
        speed: '', length: '', vlan: '',
        routing: 'curve',
    };
    state.connections.push(conn);
    redrawConnections(); pushHistory(); playSound('connect');
    showToast(`🔗 Conexão criada (${conn.label})`);
    drawMinimap();
}

function getConnectionLabel(type) {
    const labels = { fibra: 'Fibra Óptica', rj45: 'Cabo RJ45', bnc: 'Cabo BNC', wifi: 'Wi-Fi' };
    return labels[type] || 'Conexão';
}

function getConnectionColor(type) {
    const colors = { fibra: '#F26A21', rj45: '#3b82f6', bnc: '#10b981', wifi: '#8b5cf6' };
    return colors[type] || '#6B7280';
}

function redrawConnections() {
    canvasSvg.querySelectorAll('path:not(.connection-preview), line, text, g').forEach(el => el.remove());
    state.connections.forEach(conn => {
        const fromDev = state.devices.find(d => d.id === conn.from);
        const toDev = state.devices.find(d => d.id === conn.to);
        if (!fromDev || !toDev) return;
        const fromEl = document.getElementById(fromDev.id);
        const toEl = document.getElementById(toDev.id);
        if (!fromEl || !toEl) return;
        if (fromEl.style.display === 'none' || toEl.style.display === 'none') return;
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const x1 = (fromRect.left + fromRect.width / 2 - canvasRect.left) / state.zoom;
        const y1 = (fromRect.top + fromRect.height / 2 - canvasRect.top) / state.zoom;
        const x2 = (toRect.left + toRect.width / 2 - canvasRect.left) / state.zoom;
        const y2 = (toRect.top + toRect.height / 2 - canvasRect.top) / state.zoom;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        let d;
        if (conn.routing === 'straight') d = `M ${x1} ${y1} L ${x2} ${y2}`;
        else if (conn.routing === 'ortho') d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        else d = `M ${x1} ${y1} Q ${midX} ${y1} ${midX} ${midY} T ${x2} ${y2}`;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', getConnectionColor(conn.type));
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-linecap', 'round');
        if (conn.type === 'wifi') path.setAttribute('stroke-dasharray', '6 4');
        path.setAttribute('marker-end', `url(#arrow-${conn.type})`);
        path.setAttribute('data-conn-id', conn.id);
        path.style.cursor = 'pointer';
        path.style.pointerEvents = 'stroke';
        path.addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelection();
            addToSelection(conn.id, 'connection');
            updateSelectionUI();
        });
        canvasSvg.appendChild(path);

        const parts = [conn.label];
        if (conn.speed) parts.push(conn.speed);
        if (conn.length) parts.push(`${conn.length}m`);
        if (conn.vlan) parts.push(`VLAN ${conn.vlan}`);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', midX);
        label.setAttribute('y', midY - 6);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('font-weight', '600');
        label.setAttribute('font-family', 'Inter, sans-serif');
        label.setAttribute('fill', '#6B7280');
        label.setAttribute('pointer-events', 'none');
        label.textContent = parts.join(' · ');
        canvasSvg.appendChild(label);
    });
}

function selectConnection(id) {
    const conn = state.connections.find(c => c.id === id);
    if (!conn) return;
    propertiesEmpty.style.display = 'none';
    propertiesForm.style.display = 'none';
    annotationForm.style.display = 'none';
    multiSelectionForm.style.display = 'none';
    connectionForm.style.display = 'block';
    const fields = ['connType', 'connLabel', 'connSpeed', 'connLength', 'connVlan', 'connRouting'];
    const cloned = {};
    fields.forEach(fid => {
        const original = document.getElementById(fid);
        const clone = original.cloneNode(true);
        original.parentNode.replaceChild(clone, original);
        cloned[fid] = clone;
    });
    cloned.connType.value = conn.type;
    cloned.connLabel.value = conn.label || '';
    cloned.connSpeed.value = conn.speed || '';
    cloned.connLength.value = conn.length || '';
    cloned.connVlan.value = conn.vlan || '';
    cloned.connRouting.value = conn.routing || 'curve';
    cloned.connType.onchange = (e) => { conn.type = e.target.value; conn.label = getConnectionLabel(conn.type); cloned.connLabel.value = conn.label; redrawConnections(); pushHistory(); };
    cloned.connLabel.oninput = (e) => { conn.label = e.target.value; redrawConnections(); markAsUnsaved(); };
    cloned.connLabel.onchange = () => pushHistory();
    cloned.connSpeed.oninput = (e) => { conn.speed = e.target.value; redrawConnections(); markAsUnsaved(); };
    cloned.connSpeed.onchange = () => pushHistory();
    cloned.connLength.oninput = (e) => { conn.length = e.target.value; redrawConnections(); markAsUnsaved(); };
    cloned.connLength.onchange = () => pushHistory();
    cloned.connVlan.oninput = (e) => { conn.vlan = e.target.value; redrawConnections(); markAsUnsaved(); };
    cloned.connVlan.onchange = () => pushHistory();
    cloned.connRouting.onchange = (e) => { conn.routing = e.target.value; redrawConnections(); pushHistory(); };
}

// ============================================================
// ANOTAÇÕES
// ============================================================
function addAnnotation(x, y, color) {
    const ann = {
        id: `ann-${++annotationIdCounter}`,
        x: x || 400, y: y || 400,
        text: 'Nova anotação',
        color: color || '#FFF3C4',
    };
    state.annotations.push(ann);
    renderAnnotation(ann);
    selectAnnotation(ann.id);
    pushHistory(); playSound('add');
    showToast('📝 Anotação criada');
}

function renderAnnotation(ann) {
    let el = document.getElementById(ann.id);
    if (!el) {
        el = document.createElement('div');
        el.className = 'annotation';
        el.id = ann.id;
        canvas.appendChild(el);
    }
    el.style.left = `${ann.x}px`;
    el.style.top = `${ann.y}px`;
    el.style.background = ann.color;
    el.textContent = ann.text;
    el.classList.toggle('selected', state.selectedIds.some(s => s.id === ann.id));
    el.onmousedown = (e) => {
        if (e.target.classList.contains('annotation')) {
            e.stopPropagation();
            if (e.shiftKey || e.ctrlKey || e.metaKey) toggleSelection(ann.id, 'annotation');
            else { clearSelection(); addToSelection(ann.id, 'annotation'); }
            updateSelectionUI();
            startAnnotationDrag(e, ann, el);
        }
    };
}

function startAnnotationDrag(e, ann, el) {
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = ann.x;
    const origY = ann.y;
    const onMove = (ev) => {
        ann.x = Math.max(0, origX + (ev.clientX - startX) / state.zoom);
        ann.y = Math.max(0, origY + (ev.clientY - startY) / state.zoom);
        el.style.left = `${ann.x}px`;
        el.style.top = `${ann.y}px`;
    };
    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        pushHistory();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

function selectAnnotation(id) {
    const ann = state.annotations.find(a => a.id === id);
    if (!ann) return;
    propertiesEmpty.style.display = 'none';
    propertiesForm.style.display = 'none';
    connectionForm.style.display = 'none';
    multiSelectionForm.style.display = 'none';
    annotationForm.style.display = 'block';
    const textInput = document.getElementById('annText');
    const colorInput = document.getElementById('annColor');
    const newText = textInput.cloneNode(true);
    textInput.parentNode.replaceChild(newText, textInput);
    const newColor = colorInput.cloneNode(true);
    colorInput.parentNode.replaceChild(newColor, colorInput);
    newText.value = ann.text;
    newColor.value = ann.color;
    newText.oninput = (e) => { ann.text = e.target.value; const el = document.getElementById(ann.id); if (el) el.textContent = ann.text; markAsUnsaved(); };
    newText.onchange = () => pushHistory();
    newColor.oninput = (e) => { ann.color = e.target.value; const el = document.getElementById(ann.id); if (el) el.style.background = ann.color; markAsUnsaved(); };
    newColor.onchange = () => pushHistory();
}

function addStickyNote() {
    const colors = ['#FFF3C4', '#E9D5FF', '#DBEAFE', '#D1FAE5', '#FCE7F3'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    addAnnotation(300 + Math.random() * 400, 300 + Math.random() * 200, color);
}

// ============================================================
// GRUPOS
// ============================================================
function groupSelected() {
    const devices = state.selectedIds.filter(s => s.type === 'device')
        .map(s => state.devices.find(d => d.id === s.id)).filter(Boolean);
    if (devices.length < 2) { showToast('⚠️ Selecione pelo menos 2 dispositivos'); return; }
    const name = prompt('Nome do grupo:', 'Novo Grupo');
    if (!name) return;
    const minX = Math.min(...devices.map(d => d.x)) - 20;
    const minY = Math.min(...devices.map(d => d.y)) - 30;
    const maxX = Math.max(...devices.map(d => d.x + 120)) + 20;
    const maxY = Math.max(...devices.map(d => d.y + 120)) + 20;
    const group = {
        id: `grp-${++groupIdCounter}`,
        name, x: minX, y: minY,
        w: maxX - minX, h: maxY - minY,
        deviceIds: devices.map(d => d.id),
    };
    state.groups.push(group);
    renderGroup(group); pushHistory();
    showToast(`✅ Grupo "${name}" criado`); playSound('success');
}

function renderGroup(group) {
    let el = document.getElementById(group.id);
    if (!el) {
        el = document.createElement('div');
        el.className = 'group-box';
        el.id = group.id;
        canvas.appendChild(el);
    }
    el.style.left = `${group.x}px`;
    el.style.top = `${group.y}px`;
    el.style.width = `${group.w}px`;
    el.style.height = `${group.h}px`;
    el.innerHTML = `<div class="group-box__label">${group.name}</div>`;
}

// ============================================================
// ALINHAMENTO
// ============================================================
function getSelectedDevices() {
    return state.selectedIds.filter(s => s.type === 'device')
        .map(s => state.devices.find(d => d.id === s.id)).filter(d => d && !d.locked);
}

function alignLeft() {
    const devices = getSelectedDevices();
    if (devices.length < 2) return;
    const minX = Math.min(...devices.map(d => d.x));
    devices.forEach(d => { d.x = minX; const el = document.getElementById(d.id); if (el) el.style.left = `${d.x}px`; });
    redrawConnections(); pushHistory(); showToast('⬅️ Alinhado à esquerda');
}

function alignRight() {
    const devices = getSelectedDevices();
    if (devices.length < 2) return;
    const maxX = Math.max(...devices.map(d => d.x));
    devices.forEach(d => { d.x = maxX; const el = document.getElementById(d.id); if (el) el.style.left = `${d.x}px`; });
    redrawConnections(); pushHistory(); showToast('➡️ Alinhado à direita');
}

function alignCenterH() {
    const devices = getSelectedDevices();
    if (devices.length < 2) return;
    const avgX = devices.reduce((s, d) => s + d.x, 0) / devices.length;
    devices.forEach(d => { d.x = Math.round(avgX); const el = document.getElementById(d.id); if (el) el.style.left = `${d.x}px`; });
    redrawConnections(); pushHistory(); showToast('↔️ Centralizado H');
}

function alignTop() {
    const devices = getSelectedDevices();
    if (devices.length < 2) return;
    const minY = Math.min(...devices.map(d => d.y));
    devices.forEach(d => { d.y = minY; const el = document.getElementById(d.id); if (el) el.style.top = `${d.y}px`; });
    redrawConnections(); pushHistory(); showToast('⬆️ Alinhado ao topo');
}

function alignBottom() {
    const devices = getSelectedDevices();
    if (devices.length < 2) return;
    const maxY = Math.max(...devices.map(d => d.y));
    devices.forEach(d => { d.y = maxY; const el = document.getElementById(d.id); if (el) el.style.top = `${d.y}px`; });
    redrawConnections(); pushHistory(); showToast('⬇️ Alinhado à base');
}

function alignCenterV() {
    const devices = getSelectedDevices();
    if (devices.length < 2) return;
    const avgY = devices.reduce((s, d) => s + d.y, 0) / devices.length;
    devices.forEach(d => { d.y = Math.round(avgY); const el = document.getElementById(d.id); if (el) el.style.top = `${d.y}px`; });
    redrawConnections(); pushHistory(); showToast('↕️ Centralizado V');
}

function distributeH() {
    const devices = getSelectedDevices();
    if (devices.length < 3) { showToast('⚠️ Precisa de 3+ dispositivos'); return; }
    devices.sort((a, b) => a.x - b.x);
    const minX = devices[0].x, maxX = devices[devices.length - 1].x;
    const step = (maxX - minX) / (devices.length - 1);
    devices.forEach((d, i) => { d.x = Math.round(minX + i * step); const el = document.getElementById(d.id); if (el) el.style.left = `${d.x}px`; });
    redrawConnections(); pushHistory(); showToast('⇹ Distribuído H');
}

function distributeV() {
    const devices = getSelectedDevices();
    if (devices.length < 3) { showToast('⚠️ Precisa de 3+ dispositivos'); return; }
    devices.sort((a, b) => a.y - b.y);
    const minY = devices[0].y, maxY = devices[devices.length - 1].y;
    const step = (maxY - minY) / (devices.length - 1);
    devices.forEach((d, i) => { d.y = Math.round(minY + i * step); const el = document.getElementById(d.id); if (el) el.style.top = `${d.y}px`; });
    redrawConnections(); pushHistory(); showToast('⇵ Distribuído V');
}

// ============================================================
// LAYOUT AUTOMÁTICO
// ============================================================
function autoLayout() {
    if (state.devices.length === 0) { showToast('⚠️ Nenhum dispositivo'); return; }
    pushHistory();
    const layers = { wan: [], core: [], dist: [], neutral: [] };
    state.devices.forEach(d => layers[d.category]?.push(d));
    const startY = 60, spacingY = 200, spacingX = 180, startX = 100;
    ['wan', 'core', 'dist', 'neutral'].forEach((cat, rowIdx) => {
        const row = layers[cat];
        if (!row || row.length === 0) return;
        const totalW = row.length * spacingX;
        const offsetX = startX + Math.max(0, (1400 - totalW) / 2 - startX);
        row.forEach((d, i) => {
            d.x = offsetX + i * spacingX;
            d.y = startY + rowIdx * spacingY;
            const el = document.getElementById(d.id);
            if (el) { el.style.left = `${d.x}px`; el.style.top = `${d.y}px`; }
        });
    });
    redrawConnections(); drawMinimap();
    showToast('📐 Layout reorganizado'); playSound('success');
}

// ============================================================
// BUSCA
// ============================================================
function searchDevices(query) {
    document.querySelectorAll('.device-node').forEach(el => el.classList.remove('highlight'));
    if (!query) return;
    const q = query.toLowerCase();
    const matches = state.devices.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.ip.toLowerCase().includes(q) ||
        d.ip2.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q));
    matches.forEach(d => { document.getElementById(d.id)?.classList.add('highlight'); });
    if (matches.length > 0) {
        const first = matches[0];
        canvasScroll.scrollTo({ left: first.x - 200, top: first.y - 100, behavior: 'smooth' });
        showToast(`🔍 ${matches.length} resultado(s)`);
    } else showToast('⚠️ Nenhum resultado');
}

// ============================================================
// VALIDAÇÃO
// ============================================================
function validateNetwork() {
    const issues = [];
    const ipMap = {};
    state.devices.forEach(d => {
        if (d.ip) {
            if (ipMap[d.ip]) issues.push(`🔴 IP duplicado: ${d.ip} em "${ipMap[d.ip]}" e "${d.name}"`);
            else ipMap[d.ip] = d.name;
        }
        const connected = state.connections.some(c => c.from === d.id || c.to === d.id);
        if (!connected) issues.push(`🟡 Dispositivo órfão: "${d.name}" sem conexões`);
    });
    if (issues.length === 0) {
        showModal('✅ Validação OK', '<p style="color:#10b981;font-weight:600;">Nenhum problema detectado!</p>', [{ text: 'Fechar', class: 'btn--primary', action: closeModal }]);
    } else {
        const html = `<ul style="padding-left:20px;line-height:1.8;font-size:0.85rem;">${issues.map(i => `<li>${i}</li>`).join('')}</ul>`;
        showModal(`⚠️ ${issues.length} problema(s)`, html, [{ text: 'Fechar', class: 'btn--primary', action: closeModal }]);
    }
}

// ============================================================
// ESTATÍSTICAS
// ============================================================
function showStatistics() {
    const catCount = { wan: 0, core: 0, dist: 0, neutral: 0 };
    state.devices.forEach(d => catCount[d.category] = (catCount[d.category] || 0) + 1);
    const connCount = { fibra: 0, rj45: 0, bnc: 0, wifi: 0 };
    state.connections.forEach(c => connCount[c.type] = (connCount[c.type] || 0) + 1);
    const ips = state.devices.filter(d => d.ip).map(d => d.ip);
    const uniqueIps = new Set(ips).size;
    const html = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.8rem;">
            <div style="padding:12px;background:#FFF0E8;border-radius:8px;"><div style="font-size:0.7rem;color:#6B7280;">DISPOSITIVOS</div><div style="font-size:1.5rem;font-weight:800;color:#F26A21;">${state.devices.length}</div></div>
            <div style="padding:12px;background:#E0F2FE;border-radius:8px;"><div style="font-size:0.7rem;color:#6B7280;">CONEXÕES</div><div style="font-size:1.5rem;font-weight:800;color:#3b82f6;">${state.connections.length}</div></div>
            <div style="padding:12px;background:#D1FAE5;border-radius:8px;"><div style="font-size:0.7rem;color:#6B7280;">IPs ÚNICOS</div><div style="font-size:1.5rem;font-weight:800;color:#10b981;">${uniqueIps}</div></div>
            <div style="padding:12px;background:#EDE9FE;border-radius:8px;"><div style="font-size:0.7rem;color:#6B7280;">ANOTAÇÕES</div><div style="font-size:1.5rem;font-weight:800;color:#8b5cf6;">${state.annotations.length}</div></div>
        </div>
        <h4 style="margin-top:16px;font-size:0.85rem;">Por categoria:</h4>
        <ul style="padding-left:20px;font-size:0.8rem;line-height:1.6;"><li>WAN: ${catCount.wan}</li><li>Núcleo: ${catCount.core}</li><li>Distribuição: ${catCount.dist}</li><li>Neutros: ${catCount.neutral}</li></ul>
        <h4 style="margin-top:12px;font-size:0.85rem;">Por tipo de cabo:</h4>
        <ul style="padding-left:20px;font-size:0.8rem;line-height:1.6;"><li>Fibra: ${connCount.fibra}</li><li>RJ45: ${connCount.rj45}</li><li>BNC: ${connCount.bnc}</li><li>Wi-Fi: ${connCount.wifi}</li></ul>`;
    showModal('📊 Estatísticas', html, [{ text: 'Fechar', class: 'btn--primary', action: closeModal }]);
}

// ============================================================
// HISTÓRICO DE VERSÕES
// ============================================================
function saveVersion() {
    const snapshot = {
        timestamp: new Date().toISOString(),
        name: prompt('Nome da versão:', `Versão ${state.versions.length + 1}`) || `Versão ${state.versions.length + 1}`,
        devices: JSON.parse(JSON.stringify(state.devices)),
        connections: JSON.parse(JSON.stringify(state.connections)),
        annotations: JSON.parse(JSON.stringify(state.annotations)),
    };
    state.versions.push(snapshot);
    localStorage.setItem('kld-versions', JSON.stringify(state.versions));
    showToast(`💾 Versão "${snapshot.name}" salva`);
}

function showVersions() {
    try {
        const stored = localStorage.getItem('kld-versions');
        if (stored) state.versions = JSON.parse(stored);
    } catch (e) {}
    if (state.versions.length === 0) {
        showModal('📚 Histórico', '<p>Nenhuma versão salva ainda.</p>', [
            { text: 'Salvar Versão Atual', class: 'btn--primary', action: () => { closeModal(); saveVersion(); } },
            { text: 'Fechar', class: 'btn--outline', action: closeModal },
        ]);
        return;
    }
    const html = state.versions.map((v, i) => `
        <div style="padding:10px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <div><strong>${v.name}</strong><div style="font-size:0.7rem;color:#6B7280;">${new Date(v.timestamp).toLocaleString('pt-BR')}</div></div>
            <button class="btn btn--outline btn--sm" data-restore-version="${i}">Restaurar</button>
        </div>`).join('');
    showModal('📚 Histórico de Versões', html, [{ text: 'Fechar', class: 'btn--primary', action: closeModal }]);
    setTimeout(() => {
        document.querySelectorAll('[data-restore-version]').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.restoreVersion);
                const v = state.versions[idx];
                if (!v) return;
                pushHistory();
                state.devices = JSON.parse(JSON.stringify(v.devices));
                state.connections = JSON.parse(JSON.stringify(v.connections));
                state.annotations = JSON.parse(JSON.stringify(v.annotations));
                renderAll(); closeModal();
                showToast(`↺ Versão "${v.name}" restaurada`);
            };
        });
    }, 50);
}

// ============================================================
// UPLOAD DE IMAGEM
// ============================================================
function handleImageUpload(file) {
    if (!file) return;
    if (file.size > 500 * 1024) { showToast('⚠️ Imagem muito grande (máx 500KB)'); return; }
    const deviceSels = state.selectedIds.filter(s => s.type === 'device');
    if (deviceSels.length === 0) { showToast('⚠️ Selecione um dispositivo primeiro'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        pushHistory();
        deviceSels.forEach(sel => {
            const dev = state.devices.find(d => d.id === sel.id);
            if (dev) { dev.icon = dataUrl; updateDeviceVisual(dev); }
        });
        showToast(`🖼️ Imagem aplicada a ${deviceSels.length} dispositivo(s)`);
        playSound('success');
    };
    reader.readAsDataURL(file);
}

// ============================================================
// NUMERAÇÃO
// ============================================================
function autoNumbering() {
    const devices = state.selectedIds.filter(s => s.type === 'device').length > 0 ? getSelectedDevices() : state.devices;
    if (devices.length === 0) { showToast('⚠️ Nenhum dispositivo'); return; }
    const prefix = prompt('Prefixo:', 'DEV-');
    if (prefix === null) return;
    pushHistory();
    devices.forEach((d, i) => { d.name = `${prefix}${String(i + 1).padStart(3, '0')}`; updateDeviceVisual(d); });
    showToast(`🔢 ${devices.length} dispositivo(s) renumerado(s)`); playSound('success');
}

// ============================================================
// CSV
// ============================================================
function exportCSV() {
    if (state.devices.length === 0) { showToast('⚠️ Nenhum dispositivo'); return; }
    const rows = [['ID', 'Nome', 'Subtítulo', 'IP', 'IP2', 'Categoria', 'Layer', 'X', 'Y']];
    state.devices.forEach(d => rows.push([d.id, d.name, d.subtitle, d.ip, d.ip2, d.category, d.layer || 'default', d.x, d.y]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dispositivos-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('📥 CSV exportado');
}

function importCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
            if (!headers.includes('nome') && !headers.includes('name')) { showToast('❌ Coluna "Nome" não encontrada'); return; }
            pushHistory();
            let added = 0;
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                const obj = {};
                headers.forEach((h, idx) => obj[h] = values[idx] || '');
                const x = parseFloat(obj.x) || (100 + (added % 8) * 160);
                const y = parseFloat(obj.y) || (100 + Math.floor(added / 8) * 140);
                const device = {
                    id: `dev-${++deviceIdCounter}`, x, y,
                    name: obj.nome || obj.name || 'Dispositivo',
                    subtitle: obj.subtítulo || obj.subtitle || '',
                    ip: obj.ip || '', ip2: obj.ip2 || '',
                    icon: '📦',
                    category: obj.categoria || obj.category || 'neutral',
                    color: null, rotation: 0, iconZoom: 100, locked: false,
                    layer: state.activeLayer,
                };
                state.devices.push(device); renderDevice(device); added++;
            }
            drawMinimap();
            showToast(`📂 ${added} dispositivo(s) importado(s)`); playSound('success');
        } catch (err) { console.error(err); showToast('❌ Erro ao processar CSV'); }
    };
    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) { result.push(current); current = ''; }
        else current += c;
    }
    result.push(current);
    return result;
}

// ============================================================
// EXPORTAR PNG / SVG / PDF
// ============================================================
async function exportPNG() {
    showToast('⏳ Gerando PNG...');
    clearSelection();
    const originalTransform = canvas.style.transform;
    canvas.style.transform = 'scale(1)';
    try {
        const canvasEl = await html2canvas(canvas, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
        const link = document.createElement('a');
        link.download = `diagrama-${Date.now()}.png`;
        link.href = canvasEl.toDataURL('image/png');
        link.click();
        showToast('✅ PNG exportado');
    } catch (err) { console.error(err); showToast('❌ Erro ao exportar PNG'); }
    finally { canvas.style.transform = originalTransform; }
}

function exportSVG() {
    try {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('xmlns', svgNS);
        svg.setAttribute('width', '1400');
        svg.setAttribute('height', '900');
        svg.setAttribute('viewBox', '0 0 1400 900');
        const bg = document.createElementNS(svgNS, 'rect');
        bg.setAttribute('width', '1400'); bg.setAttribute('height', '900'); bg.setAttribute('fill', '#ffffff');
        svg.appendChild(bg);
        canvasSvg.querySelectorAll('path:not(.connection-preview), text').forEach(el => svg.appendChild(el.cloneNode(true)));
        state.devices.forEach(d => {
            const g = document.createElementNS(svgNS, 'g');
            g.setAttribute('transform', `translate(${d.x},${d.y})`);
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('width', '120'); rect.setAttribute('height', '100'); rect.setAttribute('rx', '10');
            rect.setAttribute('fill', '#ffffff'); rect.setAttribute('stroke', d.color || '#E5E7EB'); rect.setAttribute('stroke-width', '2');
            g.appendChild(rect);
            const name = document.createElementNS(svgNS, 'text');
            name.setAttribute('x', '60'); name.setAttribute('y', '80'); name.setAttribute('text-anchor', 'middle');
            name.setAttribute('font-size', '11'); name.setAttribute('font-weight', '700');
            name.setAttribute('font-family', 'Inter, sans-serif'); name.setAttribute('fill', '#1A1A2E');
            name.textContent = d.name;
            g.appendChild(name);
            svg.appendChild(g);
        });
        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `diagrama-${Date.now()}.svg`; a.click();
        URL.revokeObjectURL(url);
        showToast('✅ SVG exportado');
    } catch (err) { console.error(err); showToast('❌ Erro ao exportar SVG'); }
}

async function exportPDF() {
    document.getElementById('modalPdf').classList.remove('show');
    showToast('⏳ Gerando PDF...');
    clearSelection();
    const format = document.querySelector('input[name="pdfFormat"]:checked')?.value || 'a4l';
    const includeLegend = document.getElementById('pdfIncludeLegend').checked;
    const includeReport = document.getElementById('pdfIncludeReport').checked;
    const includeStats = document.getElementById('pdfIncludeStats').checked;
    const originalTransform = canvas.style.transform;
    canvas.style.transform = 'scale(1)';
    document.querySelector('.canvas-header').style.visibility = 'hidden';
    try {
        const canvasEl = await html2canvas(canvas, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, width: canvas.offsetWidth, height: canvas.offsetHeight });
        const { jsPDF } = window.jspdf;
        const formats = { a4l: { orientation: 'landscape', format: 'a4' }, a4p: { orientation: 'portrait', format: 'a4' }, a3l: { orientation: 'landscape', format: 'a3' } };
        const fmt = formats[format];
        const pdf = new jsPDF({ orientation: fmt.orientation, unit: 'mm', format: fmt.format });
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        pdf.setFontSize(12); pdf.setTextColor(242, 106, 33); pdf.setFont(undefined, 'bold');
        pdf.text('KLD Biosistemas', 10, 12);
        pdf.setFontSize(10); pdf.setTextColor(26, 26, 46);
        pdf.text(document.getElementById('diagramTitle').textContent, 10, 18);
        pdf.setFontSize(8); pdf.setTextColor(107, 114, 128); pdf.setFont(undefined, 'normal');
        pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, pdfW - 10, 12, { align: 'right' });
        const imgData = canvasEl.toDataURL('image/png');
        const imgRatio = canvasEl.width / canvasEl.height;
        const pageRatio = (pdfW - 20) / (pdfH - 40);
        let renderW, renderH;
        if (imgRatio > pageRatio) { renderW = pdfW - 20; renderH = renderW / imgRatio; }
        else { renderH = pdfH - 40; renderW = renderH * imgRatio; }
        pdf.addImage(imgData, 'PNG', (pdfW - renderW) / 2, 25, renderW, renderH);
        let yPos = 25 + renderH + 8;
        if (includeLegend) {
            if (yPos > pdfH - 20) { pdf.addPage(); yPos = 20; }
            pdf.setFontSize(9); pdf.setFont(undefined, 'bold'); pdf.setTextColor(26, 26, 46);
            pdf.text('Legenda', 10, yPos); yPos += 6;
            pdf.setFont(undefined, 'normal'); pdf.setFontSize(8); pdf.setTextColor(60, 60, 60);
            pdf.text('— Fibra Óptica', 12, yPos); yPos += 4;
            pdf.text('— Cabo RJ45', 12, yPos); yPos += 4;
            pdf.text('— Cabo BNC', 12, yPos); yPos += 4;
            pdf.text('- - Wi-Fi', 12, yPos); yPos += 6;
        }
        if (includeReport) {
            if (yPos > pdfH - 40) { pdf.addPage(); yPos = 20; }
            pdf.setFontSize(9); pdf.setFont(undefined, 'bold'); pdf.setTextColor(26, 26, 46);
            pdf.text('Dispositivos', 10, yPos); yPos += 6;
            pdf.setFont(undefined, 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(60, 60, 60);
            state.devices.forEach(d => {
                if (yPos > pdfH - 15) { pdf.addPage(); yPos = 20; }
                pdf.text(`• ${d.name}${d.subtitle ? ' — ' + d.subtitle : ''}${d.ip ? ' [' + d.ip + ']' : ''}`, 12, yPos);
                yPos += 4;
            });
            yPos += 4;
        }
        if (includeStats) {
            if (yPos > pdfH - 40) { pdf.addPage(); yPos = 20; }
            pdf.setFontSize(9); pdf.setFont(undefined, 'bold'); pdf.setTextColor(26, 26, 46);
            pdf.text('Estatísticas', 10, yPos); yPos += 6;
            pdf.setFont(undefined, 'normal'); pdf.setFontSize(8); pdf.setTextColor(60, 60, 60);
            pdf.text(`Total de dispositivos: ${state.devices.length}`, 12, yPos); yPos += 4;
            pdf.text(`Total de conexões: ${state.connections.length}`, 12, yPos); yPos += 4;
            pdf.text(`Anotações: ${state.annotations.length}`, 12, yPos); yPos += 4;
        }
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(7); pdf.setTextColor(156, 163, 175);
            pdf.text(`Página ${i} de ${totalPages}`, pdfW / 2, pdfH - 6, { align: 'center' });
        }
        pdf.save(`diagrama-kld-${Date.now()}.pdf`);
        showToast('✅ PDF exportado'); playSound('success');
    } catch (err) { console.error(err); showToast('❌ Erro ao gerar PDF'); }
    finally {
        canvas.style.transform = originalTransform;
        document.querySelector('.canvas-header').style.visibility = 'visible';
    }
}

// ============================================================
// SALVAR / CARREGAR
// ============================================================
function getSerializableState() {
    return {
        version: '8.0',
        title: document.getElementById('diagramTitle').textContent,
        devices: state.devices.map(d => ({
            id: d.id, x: d.x, y: d.y,
            name: d.name, subtitle: d.subtitle || '',
            ip: d.ip || '', ip2: d.ip2 || '',
            icon: d.icon || '📦',
            category: d.category || 'neutral',
            color: d.color || null,
            rotation: d.rotation || 0,
            iconZoom: d.iconZoom || 100,
            locked: d.locked || false,
            layer: d.layer || 'default',
        })),
        connections: state.connections.map(c => ({
            id: c.id, from: c.from, to: c.to,
            type: c.type || 'rj45', label: c.label || '',
            speed: c.speed || '', length: c.length || '',
            vlan: c.vlan || '', routing: c.routing || 'curve',
        })),
        annotations: state.annotations.map(a => ({
            id: a.id, x: a.x, y: a.y,
            text: a.text || '', color: a.color || '#FFF3C4',
        })),
        groups: state.groups || [],
        layers: state.layers,
        savedAt: new Date().toISOString(),
    };
}

function saveToLocal() {
    try {
        const data = getSerializableState();
        if (!data.devices && !data.connections && !data.annotations) { showToast('⚠️ Nada para salvar'); return; }
        const json = JSON.stringify(data);
        if (json.length > 4 * 1024 * 1024) { showToast('⚠️ Projeto muito grande (máx 4MB). Use JSON export!'); playSound('error'); return; }
        localStorage.setItem('kld-diagram', json);
        const saved = localStorage.getItem('kld-diagram');
        if (saved === json) {
            const now = new Date().toLocaleTimeString('pt-BR');
            showToast(`💾 Salvo às ${now} — ${state.devices.length} disp, ${state.connections.length} conexões`);
            playSound('success'); markAsSaved();
            const btn = document.getElementById('btnSaveLocal');
            if (btn) {
                const originalBg = btn.style.background;
                btn.style.background = '#10b981'; btn.style.color = 'white';
                setTimeout(() => { btn.style.background = originalBg; btn.style.color = ''; }, 800);
            }
        } else { showToast('❌ Falha na verificação do salvamento'); playSound('error'); }
    } catch (e) {
        console.error('Erro ao salvar:', e);
        if (e.name === 'QuotaExceededError') showToast('❌ Espaço insuficiente no navegador');
        else showToast('❌ Erro ao salvar');
        playSound('error');
    }
}

function loadFromLocal() {
    const raw = localStorage.getItem('kld-diagram');
    if (!raw || raw.length === 0) { showToast('⚠️ Nenhum diagrama salvo'); playSound('error'); return; }
    try {
        const data = JSON.parse(raw);
        if (!data.devices && !data.connections) { showToast('⚠️ Arquivo vazio ou corrompido'); playSound('error'); return; }
        loadData(data);
        showToast(`📂 Carregado: ${data.devices?.length || 0} dispositivos`); playSound('success');
    } catch (err) { console.error('Erro ao carregar:', err); showToast('❌ Erro ao carregar'); playSound('error'); }
}

function loadData(data) {
    pushHistory();
    state.devices = data.devices || [];
    state.connections = data.connections || [];
    state.annotations = data.annotations || [];
    state.groups = data.groups || [];
    state.layers = data.layers || [{ id: 'default', name: 'Camada Principal', visible: true, locked: false }];
    deviceIdCounter = 0; connectionIdCounter = 0; annotationIdCounter = 0; groupIdCounter = 0;
    state.devices.forEach(d => {
        const n = parseInt((d.id || 'dev-0').replace('dev-', ''));
        if (n > deviceIdCounter) deviceIdCounter = n;
        if (d.iconZoom === undefined) d.iconZoom = 100;
    });
    state.connections.forEach(c => {
        const n = parseInt((c.id || 'conn-0').replace('conn-', ''));
        if (n > connectionIdCounter) connectionIdCounter = n;
    });
    state.annotations.forEach(a => {
        const n = parseInt((a.id || 'ann-0').replace('ann-', ''));
        if (n > annotationIdCounter) annotationIdCounter = n;
    });
    document.getElementById('diagramTitle').textContent = data.title || 'Diagrama';
    canvas.querySelectorAll('.device-node, .annotation, .group-box').forEach(el => el.remove());
    canvasSvg.querySelectorAll('path:not(.connection-preview), line, text, g').forEach(el => el.remove());
    state.groups.forEach(g => renderGroup(g));
    state.devices.forEach(d => renderDevice(d));
    state.annotations.forEach(a => renderAnnotation(a));
    renderLayers();
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            redrawConnections(); drawMinimap(); updateMinimapViewport();
        });
    });
    markAsSaved();
}

function saveToCloud() {
    showToast('☁️ Enviando...');
    setTimeout(() => {
        try {
            localStorage.setItem('kld-cloud-backup', JSON.stringify(getSerializableState()));
            showToast('✅ Sincronizado com a nuvem'); playSound('success');
        } catch (e) { showToast('❌ Erro na nuvem'); playSound('error'); }
    }, 800);
}

function exportJSON() {
    const blob = new Blob([JSON.stringify(getSerializableState(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `diagrama-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('📥 JSON exportado');
}

function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try { loadData(JSON.parse(e.target.result)); showToast('📂 Diagrama importado'); playSound('success'); }
        catch (err) { showToast('❌ Arquivo inválido'); playSound('error'); }
    };
    reader.readAsText(file);
}

// ============================================================
// TOAST / MODAL
// ============================================================
function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function showModal(title, bodyHtml, actions) {
    const modal = document.getElementById('modalGeneric');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    const actionsEl = document.getElementById('modalActions');
    actionsEl.innerHTML = '';
    actions.forEach(a => {
        const btn = document.createElement('button');
        btn.className = `btn ${a.class || 'btn--outline'}`;
        btn.textContent = a.text;
        btn.onclick = a.action;
        actionsEl.appendChild(btn);
    });
    modal.classList.add('show');
}

function closeModal() { document.getElementById('modalGeneric').classList.remove('show'); }

// ============================================================
// ZOOM
// ============================================================
function setZoom(level) {
    state.zoom = Math.max(0.3, Math.min(2, level));
    canvas.style.transform = `scale(${state.zoom})`;
    document.getElementById('zoomLevel').textContent = `${Math.round(state.zoom * 100)}%`;
    setTimeout(() => { redrawConnections(); updateMinimapViewport(); }, 50);
}

// ============================================================
// TEMPLATES
// ============================================================
function loadTemplate(name, skipConfirm = false) {
    if (!skipConfirm && (state.devices.length > 0 || state.connections.length > 0)) {
        if (!confirm('Isso substituirá o projeto atual. Deseja continuar?')) return;
        try { localStorage.setItem('kld-diagram-backup-' + Date.now(), JSON.stringify(getSerializableState())); } catch (e) {}
    }
    clearAll(false);
    const templates = {
        empty: () => { showToast('📄 Novo projeto em branco'); },
        kld: () => buildKldTemplate(),
        'small-office': () => buildSmallOfficeTemplate(),
        home: () => buildHomeTemplate(),
        datacenter: () => buildDatacenterTemplate(),
        'wifi-mesh': () => buildWifiMeshTemplate(),
    };
    const builder = templates[name];
    if (builder) builder();
}

function buildKldTemplate() {
    const devices = [
        { x: 620, y: 40,  name: 'Internet',           subtitle: 'Provedor',        icon: '☁',  category: 'wan',  ip: '' },
        { x: 620, y: 160, name: 'Modem GPON',         subtitle: 'Huawei HG8145V5', icon: '📡', category: 'wan',  ip: '189.1.163.70' },
        { x: 100, y: 300, name: 'Servidor Dell',      subtitle: 'PowerEdge T30',   icon: 'assets/icons/servidor-dell-t430.png', category: 'core', ip: '10.0.0.2', ip2: '192.168.0.4' },
        { x: 400, y: 300, name: 'TP-Link AC1200',     subtitle: 'EC 220-G5',       icon: 'assets/icons/roteador-tplink-branco.png', category: 'core', ip: '10.0.0.1' },
        { x: 700, y: 300, name: 'Roteador MAB',       subtitle: 'Wi-Fi',           icon: 'assets/icons/roteador-tplink-3antenas.png', category: 'core', ip: '10.0.0.3' },
        { x: 1000, y: 300, name: 'Modem Aruba',       subtitle: 'NET-P/SME',       icon: '🛡',  category: 'core', ip: '10.0.0.5' },
        { x: 1000, y: 180, name: 'Notebook MAB',      subtitle: 'Laptop',          icon: 'assets/icons/notebook-dell-latitude.png', category: 'core', ip: '' },
        { x: 100, y: 500, name: 'Roteador Mikrotik',  subtitle: '',                icon: 'assets/icons/roteador-mikrotik.png', category: 'dist', ip: '192.168.0.24' },
        { x: 400, y: 500, name: 'Switch 24 Portas',   subtitle: 'Classe C',        icon: 'assets/icons/switch-dlink-24p.png', category: 'dist', ip: '192.168.0.24' },
        { x: 250, y: 660, name: 'Computadores',       subtitle: 'Workstations',    icon: 'assets/icons/computador-win7.png', category: 'dist', ip: '' },
        { x: 550, y: 660, name: 'PABX Intelbras C',   subtitle: '3000/5000 V8',    icon: 'assets/icons/pabx-siemens.png', category: 'dist', ip: 'Unid. C: 192.168.0.64', ip2: 'Unid. C: 192.168.0.67' },
        { x: 800, y: 500, name: 'Conversor A',        subtitle: 'Unidade E',       icon: 'assets/icons/conversor-miljet.png', category: 'dist', ip: '' },
        { x: 800, y: 660, name: 'Conversor B',        subtitle: 'Unidade E',       icon: 'assets/icons/conversor-miljet.png', category: 'dist', ip: '' },
        { x: 1050, y: 660, name: 'Switch 24 Portas E', subtitle: 'Unidade E',      icon: 'assets/icons/switch-24p-generico.png', category: 'dist', ip: '192.168.0.24' },
        { x: 1280, y: 660, name: 'PABX Intelbras E',  subtitle: '3000/5000 V8',    icon: 'assets/icons/pabx-siemens.png', category: 'dist', ip: 'Unid. E: 192.168.0.66', ip2: 'Unid. E: 192.168.0.67' },
    ];
    const conns = [
        ['Internet', 'Modem GPON', 'fibra'],
        ['Modem GPON', 'TP-Link AC1200', 'fibra'],
        ['TP-Link AC1200', 'Servidor Dell', 'rj45'],
        ['TP-Link AC1200', 'Roteador MAB', 'wifi'],
        ['Roteador MAB', 'Notebook MAB', 'wifi'],
        ['TP-Link AC1200', 'Modem Aruba', 'rj45'],
        ['Modem Aruba', 'Roteador Mikrotik', 'bnc'],
        ['Roteador Mikrotik', 'Switch 24 Portas', 'rj45'],
        ['Switch 24 Portas', 'Computadores', 'rj45'],
        ['Switch 24 Portas', 'Conversor A', 'rj45'],
        ['Conversor A', 'Conversor B', 'fibra'],
        ['Conversor B', 'Switch 24 Portas E', 'rj45'],
    ];
    applyTemplate(devices, conns, '📋 Template KLD carregado');
}

function buildSmallOfficeTemplate() {
    const devices = [
        { x: 300, y: 60,  name: 'Internet',  subtitle: 'Provedor',   icon: '☁',  category: 'wan',  ip: '' },
        { x: 300, y: 200, name: 'Modem',     subtitle: 'VDSL',       icon: '📡', category: 'wan',  ip: '192.168.1.1' },
        { x: 300, y: 360, name: 'Roteador',  subtitle: 'Wi-Fi Dual', icon: 'assets/icons/roteador-tplink-branco.png', category: 'core', ip: '192.168.1.2' },
        { x: 120, y: 540, name: 'Switch',    subtitle: '8 portas',   icon: 'assets/icons/switch-tenda-8p.png', category: 'dist', ip: '192.168.1.3' },
        { x: 480, y: 540, name: 'Servidor',  subtitle: 'Arquivos',   icon: 'assets/icons/servidor-dell-t320.png', category: 'dist', ip: '192.168.1.10' },
    ];
    const conns = [
        ['Internet', 'Modem', 'fibra'],
        ['Modem', 'Roteador', 'rj45'],
        ['Roteador', 'Switch', 'rj45'],
        ['Roteador', 'Servidor', 'rj45'],
    ];
    applyTemplate(devices, conns, '🏢 Template Pequeno Escritório carregado');
}

function buildHomeTemplate() {
    const devices = [
        { x: 400, y: 80,  name: 'Internet',    subtitle: 'Fibra',     icon: '☁',  category: 'wan',  ip: '' },
        { x: 400, y: 240, name: 'Modem ONT',   subtitle: 'Operadora', icon: '📡', category: 'wan',  ip: '192.168.0.1' },
        { x: 400, y: 420, name: 'Roteador',    subtitle: 'Wi-Fi 6',   icon: 'assets/icons/roteador-tplink-4antenas.png', category: 'core', ip: '192.168.0.2' },
        { x: 180, y: 600, name: 'Smart TV',    subtitle: 'Sala',      icon: '📺', category: 'dist', ip: '192.168.0.10' },
        { x: 400, y: 600, name: 'Notebook',    subtitle: 'Trabalho',  icon: 'assets/icons/notebook-dell-vostro.png', category: 'dist', ip: '192.168.0.11' },
        { x: 620, y: 600, name: 'Smartphone',  subtitle: 'Móvel',     icon: 'assets/icons/iphone.png', category: 'dist', ip: '192.168.0.12' },
    ];
    const conns = [
        ['Internet', 'Modem ONT', 'fibra'],
        ['Modem ONT', 'Roteador', 'rj45'],
        ['Roteador', 'Smart TV', 'rj45'],
        ['Roteador', 'Notebook', 'wifi'],
        ['Roteador', 'Smartphone', 'wifi'],
    ];
    applyTemplate(devices, conns, '🏠 Template Residencial carregado');
}

function buildDatacenterTemplate() {
    const devices = [
        { x: 600, y: 40,  name: 'Internet',       subtitle: 'Borda',      icon: '☁',  category: 'wan',  ip: '' },
        { x: 600, y: 180, name: 'Firewall',       subtitle: 'HA Pair',    icon: '🛡',  category: 'wan',  ip: '200.1.1.1' },
        { x: 400, y: 340, name: 'Switch Core A',  subtitle: '10G',        icon: 'assets/icons/switch-24p-generico.png', category: 'core', ip: '10.0.0.1' },
        { x: 800, y: 340, name: 'Switch Core B',  subtitle: '10G',        icon: 'assets/icons/switch-24p-generico.png', category: 'core', ip: '10.0.0.2' },
        { x: 200, y: 520, name: 'Servidor Web',   subtitle: 'Cluster',    icon: 'assets/icons/servidor-dell-t430.png', category: 'dist', ip: '10.0.1.10' },
        { x: 400, y: 520, name: 'Servidor DB',    subtitle: 'PostgreSQL', icon: 'assets/icons/servidor-dell-t320.png', category: 'dist', ip: '10.0.1.20' },
        { x: 600, y: 520, name: 'Storage NAS',    subtitle: 'RAID 10',    icon: '🗄',  category: 'dist', ip: '10.0.1.30' },
        { x: 800, y: 520, name: 'Backup Server',  subtitle: 'Offsite',    icon: 'assets/icons/servidor-dell-torres.png', category: 'dist', ip: '10.0.1.40' },
        { x: 1000, y: 520, name: 'Load Balancer', subtitle: 'HAProxy',    icon: '⚙',  category: 'dist', ip: '10.0.1.50' },
    ];
    const conns = [
        ['Internet', 'Firewall', 'fibra'],
        ['Firewall', 'Switch Core A', 'fibra'],
        ['Firewall', 'Switch Core B', 'fibra'],
        ['Switch Core A', 'Servidor Web', 'rj45'],
        ['Switch Core A', 'Servidor DB', 'rj45'],
        ['Switch Core B', 'Storage NAS', 'fibra'],
        ['Switch Core B', 'Backup Server', 'rj45'],
        ['Switch Core A', 'Load Balancer', 'rj45'],
        ['Switch Core B', 'Load Balancer', 'rj45'],
    ];
    applyTemplate(devices, conns, '🖥️ Template Data Center carregado');
}

function buildWifiMeshTemplate() {
    const devices = [
        { x: 500, y: 60,  name: 'Internet',       subtitle: 'Fibra',       icon: '☁',  category: 'wan',  ip: '' },
        { x: 500, y: 220, name: 'Modem',          subtitle: 'ONU',         icon: '📡', category: 'wan',  ip: '192.168.1.1' },
        { x: 500, y: 400, name: 'Mesh Principal', subtitle: 'Nó central',  icon: 'assets/icons/roteador-tplink-4antenas.png', category: 'core', ip: '192.168.1.2' },
        { x: 200, y: 580, name: 'Mesh Satélite 1', subtitle: 'Sala',       icon: 'assets/icons/roteador-linkone.png', category: 'dist', ip: '192.168.1.3' },
        { x: 500, y: 580, name: 'Mesh Satélite 2', subtitle: 'Quarto',     icon: 'assets/icons/roteador-intelbras-hotspot.png', category: 'dist', ip: '192.168.1.4' },
        { x: 800, y: 580, name: 'Mesh Satélite 3', subtitle: 'Escritório', icon: 'assets/icons/roteador-tplink-branco.png', category: 'dist', ip: '192.168.1.5' },
    ];
    const conns = [
        ['Internet', 'Modem', 'fibra'],
        ['Modem', 'Mesh Principal', 'rj45'],
        ['Mesh Principal', 'Mesh Satélite 1', 'wifi'],
        ['Mesh Principal', 'Mesh Satélite 2', 'wifi'],
        ['Mesh Principal', 'Mesh Satélite 3', 'wifi'],
    ];
    applyTemplate(devices, conns, '📶 Template Wi-Fi Mesh carregado');
}

function applyTemplate(devices, conns, message) {
    devices.forEach(d => addDeviceSilent(d));
    setTimeout(() => {
        conns.forEach(([fromName, toName, type]) => {
            const from = state.devices.find(d => d.name === fromName);
            const to = state.devices.find(d => d.name === toName);
            if (from && to) addConnection(from.id, to.id, type);
        });
        drawMinimap();
        try { localStorage.setItem('kld-diagram', JSON.stringify(getSerializableState())); } catch (e) {}
        markAsSaved();
    }, 200);
    showToast(message); playSound('success');
}

function addDeviceSilent(data) {
    const device = {
        id: `dev-${++deviceIdCounter}`,
        iconZoom: 100, rotation: 0,
        ...data,
        layer: 'default', locked: false
    };
    state.devices.push(device);
    renderDevice(device);
}

// ============================================================
// LIMPAR / DELETAR
// ============================================================
function clearAll(showMsg = true) {
    if (showMsg && !confirm('Limpar todo o diagrama?')) return;
    pushHistory();
    state.devices = []; state.connections = []; state.annotations = []; state.groups = []; state.selectedIds = [];
    deviceIdCounter = 0; connectionIdCounter = 0; annotationIdCounter = 0; groupIdCounter = 0;
    canvas.querySelectorAll('.device-node, .annotation, .group-box').forEach(el => el.remove());
    canvasSvg.querySelectorAll('path:not(.connection-preview), line, text, g').forEach(el => el.remove());
    propertiesEmpty.style.display = 'block';
    propertiesForm.style.display = 'none';
    connectionForm.style.display = 'none';
    annotationForm.style.display = 'none';
    multiSelectionForm.style.display = 'none';
    updateSelectionUI();
    if (showMsg) showToast('🗑️ Diagrama limpo');
    drawMinimap();
}

function deleteSelected() {
    if (state.selectedIds.length === 0) return;
    pushHistory();
    const count = state.selectedIds.length;
    state.selectedIds.forEach(sel => {
        if (sel.type === 'device') {
            state.devices = state.devices.filter(d => d.id !== sel.id);
            state.connections = state.connections.filter(c => c.from !== sel.id && c.to !== sel.id);
            document.getElementById(sel.id)?.remove();
        } else if (sel.type === 'connection') {
            state.connections = state.connections.filter(c => c.id !== sel.id);
        } else if (sel.type === 'annotation') {
            state.annotations = state.annotations.filter(a => a.id !== sel.id);
            document.getElementById(sel.id)?.remove();
        }
    });
    clearSelection(); redrawConnections(); drawMinimap();
    playSound('delete'); showToast(`🗑️ ${count} item(s) removido(s)`);
}

function deleteDevice(id) {
    state.devices = state.devices.filter(d => d.id !== id);
    state.connections = state.connections.filter(c => c.from !== id && c.to !== id);
    document.getElementById(id)?.remove();
    clearSelection(); redrawConnections(); pushHistory(); drawMinimap();
    playSound('delete'); showToast('🗑️ Dispositivo removido');
}

function selectAll() {
    clearSelection();
    state.devices.forEach(d => addToSelection(d.id, 'device'));
    updateSelectionUI();
    showToast(`☑️ ${state.devices.length} selecionados`);
}

// ============================================================
// MEDIÇÃO
// ============================================================
let measureStart = null;

function toggleMeasureMode() {
    state.measureMode = !state.measureMode;
    document.getElementById('btnMeasure').classList.toggle('active', state.measureMode);
    canvas.classList.toggle('measuring', state.measureMode);
    showToast(state.measureMode ? '📏 Régua ativada' : '📏 Régua desativada');
}

function handleMeasureClick(e) {
    if (!state.measureMode) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / state.zoom;
    const y = (e.clientY - rect.top) / state.zoom;
    if (!measureStart) {
        measureStart = { x, y };
        showToast('📏 Clique no segundo ponto');
    } else {
        const dx = x - measureStart.x;
        const dy = y - measureStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const meters = (dist / 20).toFixed(1);
        showToast(`📏 Distância: ${meters} m (${dist.toFixed(0)} px)`);
        measureStart = null; state.measureMode = false;
        document.getElementById('btnMeasure').classList.remove('active');
        canvas.classList.remove('measuring');
    }
}

// ============================================================
// APRESENTAÇÃO
// ============================================================
function startPresentation() {
    if (state.devices.length === 0) { showToast('⚠️ Nenhum dispositivo'); return; }
    state.presentation.active = true;
    state.presentation.index = 0;
    state.presentation.points = state.devices.map(d => ({ x: d.x, y: d.y, name: d.name }));
    document.getElementById('presentationOverlay').classList.add('show');
    showPresentationPoint(); playSound('toggle');
}

function showPresentationPoint() {
    const p = state.presentation.points[state.presentation.index];
    if (!p) return;
    document.getElementById('presCounter').textContent = `${state.presentation.index + 1} / ${state.presentation.points.length}`;
    canvasScroll.scrollTo({ left: p.x - 300, top: p.y - 200, behavior: 'smooth' });
    setZoom(1.5);
    showToast(`📍 ${p.name}`);
}

function nextPresentation() {
    if (state.presentation.index < state.presentation.points.length - 1) {
        state.presentation.index++;
        showPresentationPoint();
    }
}

function prevPresentation() {
    if (state.presentation.index > 0) {
        state.presentation.index--;
        showPresentationPoint();
    }
}

function exitPresentation() {
    state.presentation.active = false;
    document.getElementById('presentationOverlay').classList.remove('show');
    setZoom(1);
    canvasScroll.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
}

// ============================================================
// BLOQUEIO
// ============================================================
function toggleLock() {
    if (!state.locked) {
        const pwd = prompt('Senha para bloquear:');
        if (!pwd) return;
        state.password = pwd;
        state.locked = true;
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0.7';
        document.getElementById('btnLock').classList.add('active');
        showToast('🔒 Diagrama bloqueado');
    } else {
        const pwd = prompt('Senha para desbloquear:');
        if (pwd === state.password) {
            state.locked = false; state.password = null;
            canvas.style.pointerEvents = ''; canvas.style.opacity = '';
            document.getElementById('btnLock').classList.remove('active');
            showToast('🔓 Desbloqueado'); playSound('success');
        } else { showToast('❌ Senha incorreta'); playSound('error'); }
    }
}

// ============================================================
// MINIMAPA
// ============================================================
function drawMinimap() {
    if (!minimapCanvas) return;
    const ctx = minimapCanvas.getContext('2d');
    const W = minimapCanvas.width, H = minimapCanvas.height;
    const canvasW = 1400, canvasH = 900;
    const scaleX = W / canvasW, scaleY = H / canvasH;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 0.5;
    for (let i = 0; i < W; i += 10) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let i = 0; i < H; i += 10) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
    state.connections.forEach(conn => {
        const from = state.devices.find(d => d.id === conn.from);
        const to = state.devices.find(d => d.id === conn.to);
        if (!from || !to) return;
        ctx.strokeStyle = getConnectionColor(conn.type);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo((from.x + 60) * scaleX, (from.y + 40) * scaleY);
        ctx.lineTo((to.x + 60) * scaleX, (to.y + 40) * scaleY);
        ctx.stroke();
    });
    state.devices.forEach(d => {
        const color = d.color || getCategoryColor(d.category);
        ctx.fillStyle = color;
        ctx.fillRect(d.x * scaleX, d.y * scaleY, 120 * scaleX, 100 * scaleY);
    });
    updateMinimapViewport();
}

function getCategoryColor(cat) {
    const colors = { wan: '#F26A21', core: '#3b82f6', dist: '#10b981', neutral: '#9CA3AF' };
    return colors[cat] || '#9CA3AF';
}

function updateMinimapViewport() {
    if (!minimapViewport) return;
    const canvasW = 1400, canvasH = 900;
    const W = minimapCanvas.width, H = minimapCanvas.height;
    const scaleX = W / canvasW, scaleY = H / canvasH;
    const scrollLeft = canvasScroll.scrollLeft / state.zoom;
    const scrollTop = canvasScroll.scrollTop / state.zoom;
    const viewW = canvasScroll.clientWidth / state.zoom;
    const viewH = canvasScroll.clientHeight / state.zoom;
    minimapViewport.style.left = `${scrollLeft * scaleX}px`;
    minimapViewport.style.top = `${scrollTop * scaleY}px`;
    minimapViewport.style.width = `${viewW * scaleX}px`;
    minimapViewport.style.height = `${viewH * scaleY}px`;
}

// ============================================================
// CURSOR / MODO COMPACTO
// ============================================================
function updateCursorCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / state.zoom);
    const y = Math.round((e.clientY - rect.top) / state.zoom);
    cursorCoords.textContent = `x: ${x}, y: ${y}`;
}

function toggleCompact() {
    state.compactMode = !state.compactMode;
    document.getElementById('workspace').classList.toggle('compact', state.compactMode);
    document.getElementById('btnCompact').classList.toggle('active', state.compactMode);
    showToast(state.compactMode ? '📦 Modo compacto' : '🔍 Modo normal');
    setTimeout(redrawConnections, 300);
}

// ============================================================
// SIDEBARS
// ============================================================
function setupSidebarToggles() {
    const workspace = document.getElementById('workspace');
    const btnToggle = document.getElementById('btnToggleSidebars');
    const toggleLeft = document.getElementById('toggleLeftSidebar');
    const toggleRight = document.getElementById('toggleRightSidebar');
    const reopenLeft = document.getElementById('reopenLeftSidebar');
    const reopenRight = document.getElementById('reopenRightSidebar');
    function save() {
        localStorage.setItem('kld-sidebar-state', JSON.stringify({
            left: workspace.classList.contains('hide-left'),
            right: workspace.classList.contains('hide-right'),
        }));
    }
    function load() {
        try {
            const s = JSON.parse(localStorage.getItem('kld-sidebar-state') || '{}');
            if (s.left) workspace.classList.add('hide-left');
            if (s.right) workspace.classList.add('hide-right');
        } catch (e) {}
    }
    toggleLeft.onclick = () => { workspace.classList.add('hide-left'); save(); setTimeout(() => { redrawConnections(); updateMinimapViewport(); }, 400); };
    toggleRight.onclick = () => { workspace.classList.add('hide-right'); save(); setTimeout(() => { redrawConnections(); updateMinimapViewport(); }, 400); };
    reopenLeft.onclick = () => { workspace.classList.remove('hide-left'); save(); setTimeout(() => { redrawConnections(); updateMinimapViewport(); }, 400); };
    reopenRight.onclick = () => { workspace.classList.remove('hide-right'); save(); setTimeout(() => { redrawConnections(); updateMinimapViewport(); }, 400); };
    btnToggle.onclick = () => {
        const bothHidden = workspace.classList.contains('hide-left') && workspace.classList.contains('hide-right');
        if (bothHidden) { workspace.classList.remove('hide-left', 'hide-right'); showToast('👁️ Painéis visíveis'); }
        else { workspace.classList.add('hide-left', 'hide-right'); showToast('🙈 Painéis ocultos'); }
        save();
        setTimeout(() => { redrawConnections(); updateMinimapViewport(); }, 400);
    };
    load();
}

function bindMultiSelectionForm() {
    document.getElementById('btnApplyToAll').onclick = () => {
        const devices = state.selectedIds.filter(s => s.type === 'device')
            .map(s => state.devices.find(d => d.id === s.id)).filter(Boolean);
        if (devices.length === 0) return;
        pushHistory();
        const category = document.getElementById('multiCategory').value;
        const icon = document.getElementById('multiIcon').value;
        const color = document.getElementById('multiColor').value;
        devices.forEach(d => {
            if (category) d.category = category;
            if (icon) d.icon = icon;
            if (color) d.color = color;
            updateDeviceVisual(d);
        });
        showToast(`✅ Alterações aplicadas a ${devices.length} dispositivo(s)`);
        playSound('success'); drawMinimap();
    };
    document.getElementById('btnDeleteMulti').onclick = () => {
        if (confirm(`Remover ${state.selectedIds.length} itens?`)) deleteSelected();
    };
}

// ============================================================
// EVENTOS GLOBAIS
// ============================================================
function bindEvents() {
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        const preview = document.getElementById('dragPreview');
        if (preview) {
            preview.style.left = e.clientX + 'px';
            preview.style.top = e.clientY + 'px';
        }
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        document.getElementById('dragPreview')?.remove();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const deviceData = JSON.parse(data);
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / state.zoom - 60;
            const y = (e.clientY - rect.top) / state.zoom - 40;
            addDevice({ x: Math.max(0, x), y: Math.max(0, y), ...deviceData, ip: '', ip2: '' });
            addToRecent(deviceData);
        } catch (err) { console.error(err); }
    });

    document.addEventListener('dragover', (e) => {
        const preview = document.getElementById('dragPreview');
        if (preview) {
            preview.style.left = e.clientX + 'px';
            preview.style.top = e.clientY + 'px';
        }
    });
    document.addEventListener('dragend', () => { document.getElementById('dragPreview')?.remove(); });
    document.addEventListener('drop', () => { document.getElementById('dragPreview')?.remove(); });

    canvas.addEventListener('mousedown', (e) => {
        if (state.measureMode) { handleMeasureClick(e); return; }
        if (e.target === canvas) {
            if (!e.shiftKey && !e.ctrlKey && !e.metaKey) clearSelection();
            startSelectionBox(e);
        }
    });

    canvas.addEventListener('mousemove', updateCursorCoords);

    document.querySelectorAll('.conn-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.conn;
            const hint = document.getElementById('connectionHint');
            const hintTitle = document.getElementById('connectionHintTitle');
            const hintDesc = document.getElementById('connectionHintDesc');
            if (state.connectionMode === type) {
                state.connectionMode = null;
                document.querySelectorAll('.conn-item').forEach(b => b.classList.remove('active', 'selected'));
                document.body.classList.remove('connection-mode-active');
                document.getElementById('connectionHint').classList.remove('show');
                if (clickConnectionFirst) {
                    document.querySelectorAll('.device-node__port.connection-origin').forEach(el => el.classList.remove('connection-origin'));
                    clickConnectionFirst = null;
                }
                showToast('Conexão desativada');
            } else {
                state.connectionMode = type;
                document.querySelectorAll('.conn-item').forEach(b => b.classList.remove('active', 'selected'));
                btn.classList.add('active', 'selected');
                document.body.classList.add('connection-mode-active');
                if (clickConnectionFirst) {
                    document.querySelectorAll('.device-node__port.connection-origin').forEach(el => el.classList.remove('connection-origin'));
                    clickConnectionFirst = null;
                }
                hintTitle.textContent = `Modo: ${getConnectionLabel(type)}`;
                hintDesc.innerHTML = `Clique em uma <span class="highlight-port">porta</span> e depois em outra. Ou arraste de uma porta até outra.`;
                hint.classList.add('show');
                showToast(`🔗 Modo: ${getConnectionLabel(type)}`);
            }
        });
    });

    document.getElementById('cancelConnection').addEventListener('click', () => {
        state.connectionMode = null;
        document.querySelectorAll('.conn-item').forEach(b => b.classList.remove('active', 'selected'));
        document.getElementById('connectionHint').classList.remove('show');
        document.body.classList.remove('connection-mode-active');
        document.querySelectorAll('.device-node__port.snap-target, .device-node__port.connection-origin')
            .forEach(el => el.classList.remove('snap-target', 'connection-origin'));
        document.querySelectorAll('.device-node.target-highlight')
            .forEach(el => el.classList.remove('target-highlight'));
        if (clickConnectionFirst) { clickConnectionFirst = null; showToast('❌ Conexão cancelada'); }
    });

    document.querySelectorAll('.sidebar__tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.sidebar__tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.sidebar__panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        };
    });

    document.getElementById('btnNew').onclick = () => {
        if (state.devices.length > 0 || state.connections.length > 0) {
            const choice = confirm('Deseja salvar antes de criar um novo projeto?\n\nOK = Salvar e criar novo\nCancelar = Descartar');
            if (choice) { saveToLocal(); setTimeout(() => clearAll(false), 100); }
            else if (confirm('Descartar alterações não salvas?')) clearAll(false);
        } else clearAll(false);
    };

    document.getElementById('btnSaveLocal').onclick = saveToLocal;
    document.getElementById('btnLoadLocal').onclick = loadFromLocal;
    document.getElementById('btnCloud').onclick = saveToCloud;
    document.getElementById('btnUndo').onclick = undo;
    document.getElementById('btnRedo').onclick = redo;
    document.getElementById('btnCopy').onclick = copySelected;
    document.getElementById('btnPaste').onclick = paste;
    document.getElementById('btnDuplicate').onclick = duplicateSelected;
    document.getElementById('btnSearch').onclick = () => {
        document.getElementById('searchBar').classList.toggle('show');
        document.getElementById('searchInput').focus();
    };
    document.getElementById('closeSearch').onclick = () => {
        document.getElementById('searchBar').classList.remove('show');
        document.querySelectorAll('.device-node').forEach(el => el.classList.remove('highlight'));
    };
    document.getElementById('searchInput').oninput = (e) => searchDevices(e.target.value);
    document.getElementById('clearSelection').onclick = clearSelection;
    document.getElementById('btnSelectAll').onclick = selectAll;
    document.getElementById('btnMeasure').onclick = toggleMeasureMode;
    document.getElementById('btnAnnotate').onclick = () => addAnnotation(400, 400);
    document.getElementById('btnSticky').onclick = addStickyNote;
    document.getElementById('btnGroup').onclick = groupSelected;
    document.getElementById('btnAutoLayout').onclick = autoLayout;
    document.getElementById('btnValidate').onclick = validateNetwork;
    document.getElementById('btnStats').onclick = showStatistics;
    document.getElementById('btnHistory').onclick = showVersions;
    document.getElementById('btnNumbering').onclick = autoNumbering;
    document.getElementById('btnImportCSV').onclick = () => document.getElementById('csvInput').click();
    document.getElementById('btnExportCSV').onclick = exportCSV;
    document.getElementById('btnCompact').onclick = toggleCompact;
    document.getElementById('btnTheme').onclick = toggleTheme;
    document.getElementById('btnLang').onclick = cycleLanguage;
    document.getElementById('btnPresentation').onclick = startPresentation;
    document.getElementById('btnLock').onclick = toggleLock;

    document.getElementById('alignLeft').onclick = alignLeft;
    document.getElementById('alignRight').onclick = alignRight;
    document.getElementById('alignCenterH').onclick = alignCenterH;
    document.getElementById('alignTop').onclick = alignTop;
    document.getElementById('alignBottom').onclick = alignBottom;
    document.getElementById('alignCenterV').onclick = alignCenterV;
    document.getElementById('distributeH').onclick = distributeH;
    document.getElementById('distributeV').onclick = distributeV;

    document.getElementById('btnExportPNG').onclick = exportPNG;
    document.getElementById('btnExportSVG').onclick = exportSVG;
    document.getElementById('btnExportJSON').onclick = exportJSON;
    document.getElementById('btnImportJSON').onclick = () => document.getElementById('fileInput').click();
    document.getElementById('fileInput').onchange = (e) => {
        if (e.target.files[0]) importJSON(e.target.files[0]);
        e.target.value = '';
    };
    document.getElementById('imageInput').onchange = (e) => {
        if (e.target.files[0]) handleImageUpload(e.target.files[0]);
        e.target.value = '';
    };
    document.getElementById('csvInput').onchange = (e) => {
        if (e.target.files[0]) importCSV(e.target.files[0]);
        e.target.value = '';
    };
    document.getElementById('btnExportPDF').onclick = () => document.getElementById('modalPdf').classList.add('show');
    document.getElementById('btnCancelPdf').onclick = () => document.getElementById('modalPdf').classList.remove('show');
    document.getElementById('btnConfirmPdf').onclick = exportPDF;
    document.getElementById('btnUploadImage').onclick = () => document.getElementById('imageInput').click();

    document.getElementById('zoomIn').onclick = () => setZoom(state.zoom + 0.1);
    document.getElementById('zoomOut').onclick = () => setZoom(state.zoom - 0.1);
    document.getElementById('zoomReset').onclick = () => setZoom(1);
    document.getElementById('toggleGrid').onclick = () => {
        state.showGrid = !state.showGrid;
        canvas.classList.toggle('no-grid', !state.showGrid);
        document.getElementById('toggleGrid').classList.toggle('active', !state.showGrid);
        savePreferences();
    };
    document.getElementById('toggleSnap').onclick = () => {
        state.snapToGrid = !state.snapToGrid;
        document.getElementById('toggleSnap').classList.toggle('active', state.snapToGrid);
        savePreferences();
        showToast(state.snapToGrid ? '🧲 Snap ativado' : '🧲 Snap desativado');
    };

    document.querySelectorAll('.template-card').forEach(btn => {
        btn.onclick = () => loadTemplate(btn.dataset.template);
    });

    document.getElementById('btnAddLayer').onclick = addLayer;
    document.getElementById('btnClear').onclick = () => clearAll();
    document.getElementById('btnDeleteSelected').onclick = deleteSelected;
    document.getElementById('btnDeleteDevice').onclick = () => {
        if (state.selectedIds[0]?.type === 'device') deleteDevice(state.selectedIds[0].id);
    };
    document.getElementById('btnDeleteConnection').onclick = () => {
        if (state.selectedIds[0]?.type === 'connection') {
            state.connections = state.connections.filter(c => c.id !== state.selectedIds[0].id);
            clearSelection(); redrawConnections(); pushHistory();
            showToast('🗑️ Conexão removida');
        }
    };
    document.getElementById('btnDeleteAnnotation').onclick = () => {
        if (state.selectedIds[0]?.type === 'annotation') {
            const id = state.selectedIds[0].id;
            state.annotations = state.annotations.filter(a => a.id !== id);
            document.getElementById(id)?.remove();
            clearSelection(); pushHistory();
            showToast('🗑️ Anotação removida');
        }
    };

    minimapCanvas.addEventListener('click', (e) => {
        const rect = minimapCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / minimapCanvas.width * 1400;
        const y = (e.clientY - rect.top) / minimapCanvas.height * 900;
        canvasScroll.scrollTo({
            left: (x - canvasScroll.clientWidth / 2) * state.zoom,
            top: (y - canvasScroll.clientHeight / 2) * state.zoom,
            behavior: 'smooth',
        });
    });

    canvasScroll.addEventListener('scroll', updateMinimapViewport);

    // ========== CONFIGURAÇÕES ESPECÍFICAS ==========
    setupPaletteFilters();
    renderRecentPalette();
    document.getElementById('btnAddCustomDevice').onclick = createCustomDevice;
    setupIconLibraryFilters(); // ← NOVO: filtros da biblioteca de ícones

    setupSidebarToggles();
    bindMultiSelectionForm();
    setupKeyboardShortcuts();

    document.getElementById('presExit').onclick = exitPresentation;
    document.getElementById('presNext').onclick = nextPresentation;
    document.getElementById('presPrev').onclick = prevPresentation;

    window.addEventListener('resize', () => { redrawConnections(); updateMinimapViewport(); });

    document.getElementById('diagramTitle').addEventListener('input', () => {
        markAsUnsaved();
        setTimeout(drawMinimap, 100);
    });
}

// ============================================================
// ATALHOS DE TECLADO
// ============================================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement.tagName;
        const isEditing = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement.contentEditable === 'true';
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's': e.preventDefault(); saveToLocal(); break;
                case 'z': if (!e.shiftKey) { e.preventDefault(); undo(); } else { e.preventDefault(); redo(); } break;
                case 'y': e.preventDefault(); redo(); break;
                case 'c': if (!isEditing) { e.preventDefault(); copySelected(); } break;
                case 'v': if (!isEditing) { e.preventDefault(); paste(); } break;
                case 'd': if (!isEditing) { e.preventDefault(); duplicateSelected(); } break;
                case 'a': if (!isEditing) { e.preventDefault(); selectAll(); } break;
                case 'b': e.preventDefault(); document.getElementById('btnToggleSidebars').click(); break;
                case 'f': e.preventDefault(); document.getElementById('searchBar').classList.add('show'); document.getElementById('searchInput').focus(); break;
                case '1': e.preventDefault(); document.getElementById('toggleLeftSidebar').click(); break;
                case '2': e.preventDefault(); document.getElementById('toggleRightSidebar').click(); break;
            }
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (!isEditing && state.selectedIds.length > 0) { e.preventDefault(); deleteSelected(); }
        }
        if (e.key === 'Escape') {
            state.connectionMode = null; state.measureMode = false;
            document.querySelectorAll('.conn-item').forEach(b => b.classList.remove('active', 'selected'));
            document.getElementById('btnMeasure').classList.remove('active');
            canvas.classList.remove('measuring');
            document.getElementById('searchBar').classList.remove('show');
            document.getElementById('connectionHint').classList.remove('show');
            document.body.classList.remove('connection-mode-active');
            if (clickConnectionFirst) {
                document.querySelectorAll('.device-node__port.connection-origin').forEach(el => el.classList.remove('connection-origin'));
                clickConnectionFirst = null;
            }
            clearSelection();
        }
    });
}

// ============================================================
// START
// ============================================================
init();