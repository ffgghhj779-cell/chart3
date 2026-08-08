// Vercel Serverless Function - No CORS issues
// Fetches XAUUSD H1 data from Yahoo Finance server-side

export default async function handler(req, res) {
    // Allow all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30'); // cache 60s

    const symbol   = 'XAUUSD%3DX';
    const interval = req.query.interval || '1h';
    const range    = req.query.range    || '5d';

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
            throw new Error(`Yahoo Finance returned ${response.status}`);
        }

        const raw = await response.json();
        const result = raw?.chart?.result?.[0];

        if (!result) throw new Error('No chart data in response');

        const timestamps = result.timestamp;
        const q = result.indicators.quote[0];
        const candles = [];

        for (let i = 0; i < timestamps.length; i++) {
            const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i];
            if (!o || !h || !l || !c) continue;
            candles.push({
                time:  timestamps[i],
                open:  parseFloat(o.toFixed(2)),
                high:  parseFloat(h.toFixed(2)),
                low:   parseFloat(l.toFixed(2)),
                close: parseFloat(c.toFixed(2)),
            });
        }

        candles.sort((a, b) => a.time - b.time);

        res.status(200).json({ ok: true, candles, count: candles.length });

    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
}
