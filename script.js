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

// ── CoinGecko: OHLC data for XAUT (Tether Gold) ──
// CoinGecko is CORS-enabled, free, no API key needed.
// XAUT price ≈ XAUUSD within 0.1% (backed 1:1 by gold)
async function fetchCoinGeckoOHLC(days) {
    const url = `https://api.coingecko.com/api/v3/coins/tether-gold/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const raw = await res.json(); // [[timestamp_ms, open, high, low, close], ...]
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty OHLC response');
    const candles = raw.map(([ts, o, h, l, c]) => ({
        time: Math.floor(ts / 1000),
        open: +o.toFixed(2), high: +h.toFixed(2),
        low:  +l.toFixed(2), close: +c.toFixed(2),
    }));
    candles.sort((a, b) => a.time - b.time);
    // Deduplicate
    const seen = new Set();
    return candles.filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true; });
}

// ── Also fetch current live price from CoinGecko ──
async function fetchCurrentPrice() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd';
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Price fetch HTTP ${res.status}`);
    const json = await res.json();
    return json['tether-gold']?.usd ?? null;
}

// ── Main Init ──
async function init() {
    const loading = $('loading-screen');
    try {
        // Fetch 14 days of OHLC (gives ~4H candles) + current price
        const [candles, currentPrice] = await Promise.all([
            fetchCoinGeckoOHLC(14),
            fetchCurrentPrice(),
        ]);

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

        // Refresh every 4 minutes (CoinGecko free rate limit: 10-30 req/min)
        setInterval(async () => {
            try {
                const [fresh, livePrice] = await Promise.all([
                    fetchCoinGeckoOHLC(14),
                    fetchCurrentPrice(),
                ]);
                if (fresh.length) {
                    candleSeries.setData(fresh);
                    const p = livePrice ?? fresh[fresh.length - 1].close;
                    updatePriceBar(p);
                    buildLevels(p);
                    chart.timeScale().scrollToRealTime();
                }
            } catch (_) {}
        }, 4 * 60 * 1000);

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
