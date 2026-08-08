// Vercel Serverless Function - Node.js 18 (native fetch)
// Fetches Gold Futures (GC=F) OHLCV from Yahoo Finance server-side

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');

    const url = 'https://query2.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=4h&range=10d';

    try {
        const resp = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://finance.yahoo.com/',
            }
        });

        if (!resp.ok) {
            return res.status(502).json({ ok: false, error: `Yahoo HTTP ${resp.status}` });
        }

        const data = await resp.json();
        const result = data?.chart?.result?.[0];

        if (!result || !result.timestamp) {
            return res.status(502).json({ ok: false, error: 'No chart data in Yahoo response' });
        }

        const timestamps = result.timestamp;
        const q = result.indicators.quote[0];
        const candles = [];

        for (let i = 0; i < timestamps.length; i++) {
            const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i];
            if (o && h && l && c) {
                candles.push({
                    time:  timestamps[i],
                    open:  parseFloat(o.toFixed(2)),
                    high:  parseFloat(h.toFixed(2)),
                    low:   parseFloat(l.toFixed(2)),
                    close: parseFloat(c.toFixed(2)),
                });
            }
        }

        candles.sort((a, b) => a.time - b.time);

        return res.status(200).json({
            ok: true,
            candles,
            count: candles.length,
            source: 'Yahoo Finance GC=F'
        });

    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
};
