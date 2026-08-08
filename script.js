// ════════════════════════════════════════════════════
// Gold Nightmare Intelligence Lab – Premium Live Chart
// Fetches real XAUUSD H1 candles from Yahoo Finance
// ════════════════════════════════════════════════════

const isMobile = window.innerWidth <= 768;

// ── Chart Setup ──
const chart = LightweightCharts.createChart(document.getElementById('tvchart'), {
    width:  window.innerWidth,
    height: window.innerHeight,
    layout: { backgroundColor: '#0d1017', textColor: '#787b86', fontSize: 11 },
    grid: {
        vertLines: { color: 'rgba(255,255,255,0.02)', style: 1 },
        horzLines: { color: 'rgba(255,255,255,0.02)', style: 1 },
    },
    crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(255,255,255,0.15)', width: 1, style: 2, labelBackgroundColor: '#1e2130' },
        horzLine: { color: 'rgba(255,255,255,0.15)', width: 1, style: 2, labelBackgroundColor: '#1e2130' },
    },
    rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)' },
    timeScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: isMobile ? 10 : 30,
        barSpacing: isMobile ? 5 : 7,
    },
});

const candleSeries = chart.addCandlestickSeries({
    upColor: '#089981', downColor: '#f23645',
    borderUpColor: '#089981', borderDownColor: '#f23645',
    wickUpColor: '#089981', wickDownColor: '#f23645',
    lastValueVisible: true,
    priceLineVisible: true,
});

// ── Helpers ──
const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const calcRR = (entry, sl, tp) => {
    const risk = Math.abs(sl - entry);
    const reward = Math.abs(tp - entry);
    return risk === 0 ? 0 : reward / risk;
};

// ── DOM refs ──
const $ = id => document.getElementById(id);
const loadingScreen = $('loading-screen');

// ── Trade Levels (will be calculated relative to live price) ──
let LEVELS = {};

function buildLevels(lastClose) {
    // Place levels relative to current real price
    const sl    = lastClose + 11.0;     // SL above current price (SELL setup)
    const entryH = lastClose + 6.0;
    const entryL = lastClose - 4.0;
    const entryMid = (entryH + entryL) / 2;
    const tp1   = lastClose - 23.2;
    const tp2   = lastClose - 43.0;
    const tp3   = lastClose - 55.9;
    const vwap  = lastClose + 4.4;
    const risk  = (sl - entryMid) * 10; // approx USD risk per 0.1 lot

    LEVELS = { sl, entryH, entryL, entryMid, tp1, tp2, tp3, vwap, risk };
    updateDashboard();
    updateLineLabels();
}

function updateDashboard() {
    const { sl, entryH, entryL, tp1, tp2, tp3, risk } = LEVELS;
    const rr1 = calcRR(entryH, sl, tp1).toFixed(2);
    const rr2 = calcRR(entryH, sl, tp2).toFixed(2);
    const rr3 = calcRR(entryH, sl, tp3).toFixed(2);

    $('d-entry').textContent = `${fmt(entryL)} – ${fmt(entryH)}`;
    $('d-stop').textContent  = `${fmt(sl)} | RISK -${fmt(Math.abs(risk))}$`;
    $('d-tp1').textContent   = `${fmt(tp1)} | 1:${rr1}`;
    $('d-tp2').textContent   = `${fmt(tp2)} | 1:${rr2}`;
    $('d-tp3').textContent   = `${fmt(tp3)} | 1:${rr3}`;
}

function updateLineLabels() {
    const { sl, entryH, entryL, tp1, tp2, tp3, vwap, risk } = LEVELS;
    const rr1 = calcRR(entryH, sl, tp1).toFixed(2);
    const rr2 = calcRR(entryH, sl, tp2).toFixed(2);
    const rr3 = calcRR(entryH, sl, tp3).toFixed(2);

    $('label-sl').textContent    = `SL ${fmt(sl)} (-${fmt(Math.abs(risk))}$)`;
    $('label-vwap').textContent  = `VWAP-D ${fmt(vwap)}`;
    $('label-entry').textContent = `ENTRY ${fmt(entryL)}–${fmt(entryH)}`;
    $('label-tp1').textContent   = `TP1 ${fmt(tp1)}  1:${rr1}`;
    $('label-tp2').textContent   = `TP2 ${fmt(tp2)}  1:${rr2}`;
    $('label-tp3').textContent   = `TP3 ${fmt(tp3)}  1:${rr3}`;
}

// ── Overlay Sync (60 FPS) ──
function syncOverlays() {
    if (!LEVELS.sl) return;
    const pts = {
        'line-sl':         LEVELS.sl,
        'line-vwap':       LEVELS.vwap,
        'line-entry-high': LEVELS.entryH,
        'line-entry-low':  LEVELS.entryL,
        'line-tp1':        LEVELS.tp1,
        'line-tp2':        LEVELS.tp2,
        'line-tp3':        LEVELS.tp3,
    };
    for (const [id, price] of Object.entries(pts)) {
        const y = candleSeries.priceToCoordinate(price);
        const el = $(id);
        if (el && y !== null) el.style.top = y + 'px';
    }
    const yH = candleSeries.priceToCoordinate(LEVELS.entryH);
    const yL = candleSeries.priceToCoordinate(LEVELS.entryL);
    const zone = $('entry-zone');
    if (zone && yH !== null && yL !== null) {
        zone.style.top    = Math.min(yH, yL) + 'px';
        zone.style.height = Math.abs(yH - yL) + 'px';
    }
}
(function loop() { syncOverlays(); requestAnimationFrame(loop); })();

// ── Live Price Display ──
let prevClose = null;
function updateLivePriceBar(price) {
    const el = $('live-price-val');
    const ch = $('live-price-change');
    el.textContent = fmt(price);
    if (prevClose !== null) {
        const diff = price - prevClose;
        const pct  = ((diff / prevClose) * 100).toFixed(2);
        ch.textContent = `${diff >= 0 ? '+' : ''}${fmt(diff)} (${diff >= 0 ? '+' : ''}${pct}%)`;
        ch.className = 'price-change ' + (diff >= 0 ? 'up' : 'down');
    }
    prevClose = price;
}

// ── Fetch Real XAUUSD H1 Data via Vercel Serverless Function ──
// The /api/gold route fetches from Yahoo Finance server-side (no CORS issues)
async function fetchLiveData() {
    const res = await fetch('/api/gold?interval=1h&range=5d');
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'API returned error');
    return json.candles; // already sorted asc
}

// ── Live Update Loop (every 30 seconds) ──
async function refreshLiveCandle() {
    try {
        const candles = await fetchLiveData();
        if (!candles.length) return;

        candleSeries.setData(candles);
        const last = candles[candles.length - 1];
        updateLivePriceBar(last.close);
        buildLevels(last.close);

        // Update date display
        const d = new Date(last.time * 1000);
        $('live-date').textContent = d.toLocaleString('en-GB', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Amman'
        }) + ' Amman';

        chart.timeScale().scrollToRealTime();
    } catch (e) {
        console.warn('Live refresh skipped:', e.message);
    }
}

// ── Init ──
async function init() {
    try {
        const candles = await fetchLiveData();
        if (candles.length) {
            candleSeries.setData(candles);
            const last = candles[candles.length - 1];
            updateLivePriceBar(last.close);
            buildLevels(last.close);

            const d = new Date(last.time * 1000);
            $('live-date').textContent = d.toLocaleString('en-GB', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Amman'
            }) + ' Amman';

            chart.timeScale().scrollToRealTime();
        }
    } catch (e) {
        console.error('Failed to load live data:', e.message);
        // Graceful degradation with latest known price approximation
        const fallbackPrice = 2400;
        buildLevels(fallbackPrice);
        $('live-price-val').textContent = '~' + fmt(fallbackPrice);
        $('live-date').textContent = 'Offline mode';
    }

    // Hide loading screen
    loadingScreen.classList.add('hidden');

    // Auto-refresh every 30s for live candle updates
    setInterval(refreshLiveCandle, 30000);
}

// ── Resize ──
window.addEventListener('resize', () => {
    chart.resize(window.innerWidth, window.innerHeight);
    const m = window.innerWidth <= 768;
    chart.timeScale().applyOptions({ rightOffset: m ? 10 : 30, barSpacing: m ? 5 : 7 });
});

// ── Run ──
init();
