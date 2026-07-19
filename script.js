try {
    const isMobile = window.innerWidth <= 768;

    const chartProperties = {
        width: window.innerWidth,
        height: window.innerHeight,
        layout: {
            backgroundColor: '#0d1017',
            textColor: '#787b86',
            fontSize: 11,
        },
        grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.02)', style: 1 },
            horzLines: { color: 'rgba(255, 255, 255, 0.02)', style: 1 },
        },
        crosshair: {
            mode: 0,
            vertLine: { color: 'rgba(255, 255, 255, 0.1)', width: 1, style: 2, labelBackgroundColor: '#131722' },
            horzLine: { color: 'rgba(255, 255, 255, 0.1)', width: 1, style: 2, labelBackgroundColor: '#131722' },
        },
        rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            autoScale: false,
        },
        timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            timeVisible: true,
            rightOffset: isMobile ? 12 : 35,
            barSpacing: isMobile ? 5 : 6,
        }
    };

    const chartContainer = document.getElementById('tvchart');
    const chart = LightweightCharts.createChart(chartContainer, chartProperties);

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#089981', downColor: '#f23645',
        borderDownColor: '#f23645', borderUpColor: '#089981',
        wickDownColor: '#f23645', wickUpColor: '#089981',
        lastValueVisible: false,
    });

    const generateData = () => {
        const data = [];
        let t = 1716768000; 
        const exactCandles = [
            [4480, 4500, 4460, 4470], [4470, 4480, 4450, 4460], [4460, 4520, 4450, 4510],
            [4510, 4515, 4490, 4500], [4500, 4520, 4495, 4515], [4515, 4525, 4490, 4505],
            [4505, 4510, 4490, 4500], [4500, 4530, 4490, 4525], [4525, 4545, 4520, 4540],
            [4540, 4555, 4530, 4550], [4550, 4580, 4545, 4575], [4575, 4610, 4570, 4605],
            [4605, 4635, 4600, 4630], [4630, 4645, 4625, 4640], [4640, 4650, 4635, 4645],
            [4645, 4655, 4630, 4635], [4635, 4645, 4625, 4630], 
            [4630, 4640, 4515, 4520], 
            [4520, 4530, 4430, 4440], 
            [4440, 4460, 4425, 4430], [4430, 4475, 4425, 4470], [4470, 4480, 4445, 4450],
            [4450, 4490, 4440, 4485], [4485, 4490, 4390, 4430], [4430, 4500, 4425, 4490],
            [4490, 4525, 4480, 4515], [4515, 4550, 4510, 4545], [4545, 4555, 4510, 4515],
            [4515, 4525, 4500, 4505], [4505, 4515, 4495, 4506.05]
        ];
        
        for (let i = 0; i < exactCandles.length; i++) {
            t += 3600 * 2;
            const c = exactCandles[i];
            data.push({ time: t, open: c[0], high: c[1], low: c[2], close: c[3] });
        }
        return data;
    };

    candleSeries.setData(generateData());

    chart.priceScale('right').applyOptions({
        autoScale: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
    });
    candleSeries.applyOptions({
        autoscaleInfoProvider: () => ({
            priceRange: { minValue: 4425, maxValue: 4625 },
            margins: { above: 10, below: 10 }
        })
    });

    candleSeries.createPriceLine({
        price: 4506.05,
        color: '#2962FF',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: '',
    });

    const syncOverlays = () => {
        const levels = {
            'line-sl': 4527.8,
            'line-vwap': 4514.9,
            'line-entry-high': 4516.8,
            'line-entry-low': 4506.7,
            'line-tp1': 4473.6,
            'line-tp2': 4453.8,
            'line-tp3': 4440.9,
            'line-brk1': 4540
        };
        
        for (const [id, price] of Object.entries(levels)) {
            const y = candleSeries.priceToCoordinate(price);
            const el = document.getElementById(id);
            if (el && y !== null) el.style.top = y + 'px';
        }
        
        const yHigh = candleSeries.priceToCoordinate(4516.8);
        const yLow = candleSeries.priceToCoordinate(4506.7);
        const zone = document.getElementById('entry-zone');
        if (zone && yHigh !== null && yLow !== null) {
            zone.style.top = Math.min(yHigh, yLow) + 'px';
            zone.style.height = Math.abs(yHigh - yLow) + 'px';
        }
    };

    const loop = () => {
        syncOverlays();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    window.addEventListener('resize', () => {
        chart.resize(window.innerWidth, window.innerHeight);
        
        // Dynamically adjust scale padding on mobile rotation
        const newIsMobile = window.innerWidth <= 768;
        chart.timeScale().applyOptions({
            rightOffset: newIsMobile ? 12 : 35,
            barSpacing: newIsMobile ? 5 : 6,
        });
        
        syncOverlays();
    });

} catch (e) {
    document.body.innerHTML += `<div style="color:red; z-index:9999; position:absolute; top:50px; left:50px; background:white; padding:20px; font-family:sans-serif; border:2px solid red;">
        <h3>Chart Rendering Error</h3>
        <b>Message:</b> ${e.message}<br><br>
        <b>Stack:</b> <pre>${e.stack}</pre>
    </div>`;
}
