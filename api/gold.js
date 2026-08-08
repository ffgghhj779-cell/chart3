// Vercel Serverless Function
// Fetches XAUUSD H1 data from Stooq.com (free, no API key, reliable)

import https from 'https';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    // Build date range: last 10 days
    const now  = new Date();
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const d2 = now.toISOString().slice(0,10).replace(/-/g,'');
    const d1 = past.toISOString().slice(0,10).replace(/-/g,'');

    // Stooq hourly CSV for XAUUSD
    const url = `https://stooq.com/q/d/l/?s=xauusd&i=h&d1=${d1}&d2=${d2}`;

    try {
        const csv = await fetchText(url);

        if (!csv || csv.includes('No data') || csv.trim().length < 50) {
            throw new Error('Stooq returned no data');
        }

        const lines  = csv.trim().split('\n');
        const header = lines[0].toLowerCase();

        // Detect CSV format (Date,Time,Open,High,Low,Close or Date,Open,High,Low,Close)
        const hasTime = header.includes('time');
        const candles = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 5) continue;

            let date, open, high, low, close;
            if (hasTime) {
                // Format: Date, Time, Open, High, Low, Close
                const [y, m, d] = cols[0].split('-');
                const [h, min]  = cols[1].split(':');
                date  = Math.floor(new Date(`${y}-${m}-${d}T${h}:${min}:00Z`).getTime() / 1000);
                open  = parseFloat(cols[2]);
                high  = parseFloat(cols[3]);
                low   = parseFloat(cols[4]);
                close = parseFloat(cols[5]);
            } else {
                // Format: Date, Open, High, Low, Close
                const [y, m, d] = cols[0].split('-');
                date  = Math.floor(new Date(`${y}-${m}-${d}T12:00:00Z`).getTime() / 1000);
                open  = parseFloat(cols[1]);
                high  = parseFloat(cols[2]);
                low   = parseFloat(cols[3]);
                close = parseFloat(cols[4]);
            }

            if (isNaN(open) || isNaN(close) || isNaN(date)) continue;
            candles.push({ time: date, open, high, low, close });
        }

        // Sort ascending
        candles.sort((a, b) => a.time - b.time);

        // Deduplicate by timestamp
        const seen = new Set();
        const unique = candles.filter(c => {
            if (seen.has(c.time)) return false;
            seen.add(c.time); return true;
        });

        if (unique.length < 2) throw new Error('Not enough candles parsed');

        res.status(200).json({ ok: true, candles: unique, count: unique.length, source: 'stooq' });

    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
}

// Native https fetch helper (works in all Node versions)
function fetchText(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
            }
        }, (resp) => {
            // Follow redirects
            if (resp.statusCode === 301 || resp.statusCode === 302) {
                return fetchText(resp.headers.location).then(resolve).catch(reject);
            }
            if (resp.statusCode !== 200) {
                return reject(new Error(`HTTP ${resp.statusCode}`));
            }
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => resolve(data));
        }).on('error', reject);
    });
}
