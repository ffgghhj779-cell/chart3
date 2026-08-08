// ════════════════════════════════════════════════════
// Gold Nightmare Intelligence Lab – Premium Live Chart
// Data: Stooq.com via allorigins proxy (no API key)
// ════════════════════════════════════════════════════

const isMobile = window.innerWidth <= 768;

// ── Chart Setup ──
const chart = LightweightCharts.createChart(document.getElementById('tvchart'), {
    width: window.innerWidth,
    height: window.innerHeight,
    layout: { backgroundColor: '#0d1017', textColor: '#787b86', fontSize: 11 },
    grid: {
        vertLines: { color: 'rgba(255,255,255,0.025)', style: 1 },
        horzLines: { color: 'rgba(255,255,255,0.025)', style: 1 },
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
    priceLineColor: '#2962FF',
});

// ── Helpers ──
const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const $ = id => document.getElementById(id);
const calcRR = (entry, sl, tp) => {
    const risk = Math.abs(sl - entry);
    const reward = Math.abs(tp - entry);
    return risk === 0 ? 0 : (reward / risk).toFixed(2);
};

// ── Trade levels (built around current price) ──
let LEVELS = {};
function buildLevels(price) {
    const sl     = +(price + 11.0).toFixed(2);
    const entryH = +(price + 6.0).toFixed(2);
    const entryL = +(price - 4.0).toFixed(2);
    const entryMid = +((entryH + entryL) / 2).toFixed(2);
    const tp1    = +(price - 23.0).toFixed(2);
    const tp2    = +(price - 43.0).toFixed(2);
    const tp3    = +(price - 56.0).toFixed(2);
    const vwap   = +(price + 4.4).toFixed(2);
    const risk   = +((sl - entryMid) * 10).toFixed(2);
    LEVELS = { sl, entryH, entryL, entryMid, tp1, tp2, tp3, vwap, risk };
    updateDashboard();
    updateLineLabels();
}

function updateDashboard() {
    const { sl, entryH, entryL, tp1, tp2, tp3, risk } = LEVELS;
    $('d-entry').textContent = `${fmt(entryL)} – ${fmt(entryH)}`;
    $('d-stop').textContent  = `${fmt(sl)}  |  RISK -${fmt(Math.abs(risk))}$`;
    $('d-tp1').textContent   = `${fmt(tp1)}  |  1:${calcRR(entryH, sl, tp1)}`;
    $('d-tp2').textContent   = `${fmt(tp2)}  |  1:${calcRR(entryH, sl, tp2)}`;
    $('d-tp3').textContent   = `${fmt(tp3)}  |  1:${calcRR(entryH, sl, tp3)}`;
}

function updateLineLabels() {
    const { sl, entryH, entryL, tp1, tp2, tp3, vwap, risk } = LEVELS;
    $('label-sl').textContent    = `SL ${fmt(sl)}  (-${fmt(Math.abs(risk))}$)`;
    $('label-vwap').textContent  = `VWAP-D ${fmt(vwap)}`;
    $('label-entry').textContent = `ENTRY ${fmt(entryL)}–${fmt(entryH)}`;
    $('label-tp1').textContent   = `TP1 ${fmt(tp1)}  1:${calcRR(entryH, sl, tp1)}`;
    $('label-tp2').textContent   = `TP2 ${fmt(tp2)}  1:${calcRR(entryH, sl, tp2)}`;
    $('label-tp3').textContent   = `TP3 ${fmt(tp3)}  1:${calcRR(entryH, sl, tp3)}`;
}

// ── 60fps Overlay Sync ──
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

// ── Live Price Bar ──
let prevClose = null;
function updatePriceBar(price) {
    $('live-price-val').textContent = fmt(price);
    if (prevClose !== null) {
        const diff = +(price - prevClose).toFixed(2);
        const pct  = ((diff / prevClose) * 100).toFixed(2);
        const ch   = $('live-price-change');
        ch.textContent = `${diff >= 0 ? '+' : ''}${fmt(diff)} (${diff >= 0 ? '+' : ''}${pct}%)`;
        ch.className   = 'price-change ' + (diff >= 0 ? 'up' : 'down');
    }
    prevClose = price;
}

// ── Parse Stooq CSV ──
function parseStooqCSV(csv) {
    const lines  = csv.trim().split('\n');
    const header = lines[0].toLowerCase();
    const hasTime = header.includes('time');
    const candles = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].trim().split(',');
        if (cols.length < 5) continue;
        let time, open, high, low, close;
        if (hasTime) {
            const [y, m, d] = cols[0].split('-');
            const [hh, mm]  = cols[1].split(':');
            time  = Math.floor(new Date(`${y}-${m}-${d}T${hh}:${mm}:00Z`).getTime() / 1000);
            open  = parseFloat(cols[2]); high = parseFloat(cols[3]);
            low   = parseFloat(cols[4]); close = parseFloat(cols[5]);
        } else {
            const [y, m, d] = cols[0].split('-');
            time  = Math.floor(new Date(`${y}-${m}-${d}T12:00:00Z`).getTime() / 1000);
            open  = parseFloat(cols[1]); high = parseFloat(cols[2]);
            low   = parseFloat(cols[3]); close = parseFloat(cols[4]);
        }
        if (!isNaN(time) && !isNaN(open) && !isNaN(close) && open > 0)
            candles.push({ time, open, high, low, close });
    }
    candles.sort((a, b) => a.time - b.time);
    const seen = new Set();
    return candles.filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true; });
}

// ── Fetch Live Data ──
async function fetchData() {
    const stooqUrl = 'https://stooq.com/q/d/l/?s=xauusd&i=h';

    // Try multiple CORS proxies
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(stooqUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(stooqUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(stooqUrl)}`,
    ];

    for (const proxyUrl of proxies) {
        try {
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) continue;
            const text = await res.text();
            if (!text || text.length < 50 || text.startsWith('<')) continue;
            const candles = parseStooqCSV(text);
            if (candles.length >= 5) return candles;
        } catch (_) { /* try next proxy */ }
    }
    throw new Error('All proxies failed');
}

// ── Init ──
async function init() {
    const loading = $('loading-screen');
    try {
        const candles = await fetchData();
        candleSeries.setData(candles);
        const last = candles[candles.length - 1];
        updatePriceBar(last.close);
        buildLevels(last.close);

        const d = new Date(last.time * 1000);
        $('live-date').textContent = d.toLocaleString('en-GB', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Amman'
        }) + ' Amman';

        chart.timeScale().scrollToRealTime();

        // Auto-refresh every 60s
        setInterval(async () => {
            try {
                const fresh = await fetchData();
                if (fresh.length) {
                    candleSeries.setData(fresh);
                    const l = fresh[fresh.length - 1];
                    updatePriceBar(l.close);
                    buildLevels(l.close);
                    chart.timeScale().scrollToRealTime();
                }
            } catch (_) {}
        }, 60000);

    } catch (e) {
        console.warn('Live data failed, using last known price:', e.message);
        $('live-price-val').textContent = 'Loading failed';
        $('live-date').textContent = 'Check connection';
        buildLevels(2400); // last-known fallback
    }
    loading.classList.add('hidden');
}

// ── Resize ──
window.addEventListener('resize', () => {
    chart.resize(window.innerWidth, window.innerHeight);
    const m = window.innerWidth <= 768;
    chart.timeScale().applyOptions({ rightOffset: m ? 10 : 30, barSpacing: m ? 5 : 7 });
});

init();
