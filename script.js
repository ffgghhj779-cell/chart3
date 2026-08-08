// ════════════════════════════════════════════════════
// Gold Nightmare Intelligence Lab – Premium Live Chart
// Data Source: CoinGecko API (CORS enabled, free, no key)
// XAUT = Tether Gold ≈ XAUUSD price (within 0.1%)
// ════════════════════════════════════════════════════

const isMobile = window.innerWidth <= 768;

// ── Chart ──
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
const calcRR = (entryH, sl, tp) => {
    const risk = Math.abs(sl - entryH);
    const rwd  = Math.abs(tp - entryH);
    return risk === 0 ? '0' : (rwd / risk).toFixed(2);
};

// ── Levels ──
let LEVELS = {};
function buildLevels(price) {
    const sl     = +(price + 11.0).toFixed(2);
    const entryH = +(price +  6.0).toFixed(2);
    const entryL = +(price -  4.0).toFixed(2);
    const tp1    = +(price - 23.0).toFixed(2);
    const tp2    = +(price - 43.0).toFixed(2);
    const tp3    = +(price - 56.0).toFixed(2);
    const vwap   = +(price +  4.4).toFixed(2);
    const risk   = +(Math.abs(sl - ((entryH + entryL) / 2)) * 10).toFixed(2);
    LEVELS = { sl, entryH, entryL, tp1, tp2, tp3, vwap, risk };
    updateDashboard();
    updateLineLabels();
}

function updateDashboard() {
    const { sl, entryH, entryL, tp1, tp2, tp3, risk } = LEVELS;
    $('d-entry').textContent = `${fmt(entryL)} – ${fmt(entryH)}`;
    $('d-stop').textContent  = `${fmt(sl)}  |  RISK -${fmt(risk)}$`;
    $('d-tp1').textContent   = `${fmt(tp1)}  |  1:${calcRR(entryH, sl, tp1)}`;
    $('d-tp2').textContent   = `${fmt(tp2)}  |  1:${calcRR(entryH, sl, tp2)}`;
    $('d-tp3').textContent   = `${fmt(tp3)}  |  1:${calcRR(entryH, sl, tp3)}`;
}

function updateLineLabels() {
    const { sl, entryH, entryL, tp1, tp2, tp3, vwap, risk } = LEVELS;
    $('label-sl').textContent    = `SL ${fmt(sl)}  (-${fmt(risk)}$)`;
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
        'line-sl': LEVELS.sl, 'line-vwap': LEVELS.vwap,
        'line-entry-high': LEVELS.entryH, 'line-entry-low': LEVELS.entryL,
        'line-tp1': LEVELS.tp1, 'line-tp2': LEVELS.tp2, 'line-tp3': LEVELS.tp3,
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
    const fmtPrice = fmt(price);
    // Desktop
    const dv = document.getElementById('live-price-val');
    if (dv) dv.textContent = fmtPrice;
    // Mobile
    const mv = document.getElementById('mob-price-val');
    if (mv) mv.textContent = fmtPrice;

    if (prevClose !== null) {
        const diff = +(price - prevClose).toFixed(2);
        const pct  = ((diff / prevClose) * 100).toFixed(2);
        const sign = diff >= 0 ? '+' : '';
        const cls  = diff >= 0 ? 'up' : 'down';
        const chgText = `${sign}${fmt(diff)} (${sign}${pct}%)`;

        const dc = document.getElementById('live-price-change');
        if (dc) { dc.textContent = chgText; dc.className = 'price-change ' + cls; }
        const mc = document.getElementById('mob-price-chg');
        if (mc) { mc.textContent = chgText; mc.className = 'mob-price-chg ' + cls; }
    }
    prevClose = price;
}

// ── Data via Vercel Serverless Function (/api/gold) ──
// Server-side fetch to Yahoo Finance GC=F (Gold Futures)
// No CORS issues because browser → Vercel (same origin) → Yahoo Finance
async function fetchLiveCandles() {
    const res = await fetch('/api/gold', { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'API returned error');
    return json.candles;
}

async function fetchCurrentPrice() {
    // Lightweight single-value fetch from the same API (last candle close)
    try {
        const json = await (await fetch('/api/gold')).json();
        if (json.ok && json.candles.length) {
            return json.candles[json.candles.length - 1].close;
        }
    } catch (_) {}
    return null;
}

// ── Main Init ──
async function init() {
    const loading = document.getElementById('loading-screen');
    try {
        const candles = await fetchLiveCandles();
        const currentPrice = candles.length ? candles[candles.length - 1].close : null;

        candleSeries.setData(candles);

        const lastPrice = currentPrice ?? candles[candles.length - 1].close;
        updatePriceBar(lastPrice);
        buildLevels(lastPrice);

        const dateStr = now.toLocaleString('en-GB', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Amman',
        }) + ' Amman · Live';
        const ld = document.getElementById('live-date');
        if (ld) ld.textContent = dateStr;
        const md = document.getElementById('mob-date');
        if (md) md.textContent = dateStr;

        chart.timeScale().scrollToRealTime();

        setInterval(async () => {
            try {
                const fresh = await fetchLiveCandles();
                const livePrice = fresh.length ? fresh[fresh.length - 1].close : null;
                if (fresh.length) {
                    candleSeries.setData(fresh);
                    const p = livePrice ?? fresh[fresh.length - 1].close;
                    updatePriceBar(p); buildLevels(p);
                    chart.timeScale().scrollToRealTime();
                }
            } catch (_) {}
        }, 60000);

    } catch (e) {
        console.error('Init error:', e.message);
        $('live-price-val').textContent = 'Error';
        $('live-date').textContent = e.message;
        buildLevels(2400);
    } finally {
        loading.classList.add('hidden');
    }
}

// ── Resize ──
window.addEventListener('resize', () => {
    chart.resize(window.innerWidth, window.innerHeight);
    const m = window.innerWidth <= 768;
    chart.timeScale().applyOptions({ rightOffset: m ? 10 : 30, barSpacing: m ? 5 : 7 });
});

init();
