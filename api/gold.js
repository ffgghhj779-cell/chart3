// Vercel Serverless Function (CommonJS - works on all Node versions)
// Uses Stooq.com for free reliable XAUUSD data

const https = require('https');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    // Last 10 days
    const now  = new Date();
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const d2 = now.toISOString().slice(0,10).replace(/-/g,'');
    const d1 = past.toISOString().slice(0,10).replace(/-/g,'');

    const url = `https://stooq.com/q/d/l/?s=xauusd&i=h&d1=${d1}&d2=${d2}`;

    try {
        const csv = await fetchText(url);

        if (!csv || csv.trim().length < 50 || csv.includes('<html')) {
            throw new Error('Stooq returned no valid data');
        }

        const lines  = csv.trim().split('\n');
        const header = lines[0].toLowerCase();
        const hasTime = header.includes('time');
        const candles = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].trim().split(',');
            if (cols.length < 5) continue;

            let time, open, high, low, close;
            if (hasTime) {
                // Date, Time, Open, High, Low, Close
                const [y, m, d] = cols[0].split('-');
                const timeParts = cols[1].split(':');
                time  = Math.floor(new Date(`${y}-${m}-${d}T${timeParts[0]}:${timeParts[1]}:00Z`).getTime() / 1000);
                open  = parseFloat(cols[2]);
                high  = parseFloat(cols[3]);
                low   = parseFloat(cols[4]);
                close = parseFloat(cols[5]);
            } else {
                // Date, Open, High, Low, Close
                const [y, m, d] = cols[0].split('-');
                time  = Math.floor(new Date(`${y}-${m}-${d}T12:00:00Z`).getTime() / 1000);
                open  = parseFloat(cols[1]);
                high  = parseFloat(cols[2]);
                low   = parseFloat(cols[3]);
                close = parseFloat(cols[4]);
            }

            if (isNaN(time) || isNaN(open) || isNaN(close)) continue;
            candles.push({ time, open, high, low, close });
        }

        candles.sort((a, b) => a.time - b.time);

        // Deduplicate
        const seen = new Set();
        const unique = candles.filter(c => {
            if (seen.has(c.time)) return false;
            seen.add(c.time); return true;
        });

        if (unique.length < 2) throw new Error('Not enough candles');

        res.status(200).json({ ok: true, candles: unique, count: unique.length });

    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
};

function fetchText(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
                'Accept': 'text/html,*/*',
                'Connection': 'keep-alive',
            }
        }, (resp) => {
            if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
                return fetchText(resp.headers.location).then(resolve).catch(reject);
            }
            if (resp.statusCode !== 200) return reject(new Error('HTTP ' + resp.statusCode));
            let data = '';
            resp.on('data', chunk => { data += chunk; });
            resp.on('end', () => resolve(data));
        }).on('error', reject);
    });
}
