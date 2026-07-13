try {
    const chartProperties = {
        width: window.innerWidth,
        height: window.innerHeight,
        layout: {
            backgroundColor: '#0f131a',
            textColor: '#d1d4dc',
        },
        grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.04)', style: 1 },
            horzLines: { color: 'rgba(255, 255, 255, 0.04)', style: 1 },
        },
        crosshair: {
            mode: 0,
            vertLine: { color: 'rgba(255, 255, 255, 0.1)', width: 1, style: 2, labelBackgroundColor: '#131722' },
            horzLine: { color: 'rgba(255, 255, 255, 0.1)', width: 1, style: 2, labelBackgroundColor: '#131722' },
        },
        rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            autoScale: true,
        },
        timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            timeVisible: true,
            rightOffset: 12, // Space on the right like the screenshot
            barSpacing: 12, // Match the zoom level in the screenshot
        },
    };

    const chartContainer = document.getElementById('tvchart');
    const chart = LightweightCharts.createChart(chartContainer, chartProperties);

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#089981',
        downColor: '#f23645',
        borderDownColor: '#f23645',
        borderUpColor: '#089981',
        wickDownColor: '#f23645',
        wickUpColor: '#089981',
    });

    // Realistic specific data matching the visual curve of the target image
    const generateData = () => {
        const data = [];
        let t = 1716768000; // May 27 00:00
        
        // Segments: target close, number of candles, volatility factor, trend
        const segments = [
            [4450, 10, 6, -1],  // initial dip
            [4475, 8, 8, 1],    // slight recovery
            [4445, 6, 8, -1],   // another dip
            [4640, 20, 12, 1],  // huge rally to top peak
            [4530, 1, 0, -1],   // Massive red crash candle
            [4525, 3, 4, -1],   // hover after crash
            [4510, 5, 5, -1],   // slow bleed
            [4506.05, 2, 2, -1] // current price
        ];
        
        let open = 4490;
        for (let seg of segments) {
            let target = seg[0];
            let count = seg[1];
            let vol = seg[2];
            let step = (target - open) / count;
            
            for (let i = 0; i < count; i++) {
                t += 3600; // 1 hr steps
                let close;
                if (i === count - 1) {
                    close = target;
                } else {
                    close = open + step + (Math.random() * vol - vol/2);
                }
                
                let high = Math.max(open, close) + Math.random() * vol;
                let low = Math.min(open, close) - Math.random() * vol;
                
                if (count === 1 && target === 4530) {
                    high = 4645; low = 4520; // Exact shape of the huge drop
                }
                
                data.push({ time: t, open, high, low, close });
                open = close;
            }
        }
        return data;
    };

    candleSeries.setData(generateData());

    // 1. Stop Loss - Solid Red Line
    candleSeries.createPriceLine({
        price: 4527.8,
        color: '#f23645',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'SL (-15.98$)',
    });

    // 2. Entry High
    candleSeries.createPriceLine({
        price: 4516.8,
        color: '#ffaa00',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'ENTRY',
    });

    // 3. VWAP
    candleSeries.createPriceLine({
        price: 4514.9,
        color: '#ffaa00',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'VWAP-D',
    });

    // 4. Entry Low
    candleSeries.createPriceLine({
        price: 4506.7,
        color: '#ffaa00',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: false,
    });

    // 5. TP1
    candleSeries.createPriceLine({
        price: 4473.6,
        color: '#089981',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'TP1 (1:2.39)',
    });

    // 6. TP2
    candleSeries.createPriceLine({
        price: 4453.8,
        color: '#089981',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP2 (1:3.63)',
    });

    // 7. TP3
    candleSeries.createPriceLine({
        price: 4440.9,
        color: '#089981',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP3 (1:4.44)',
    });

    // Current Price line (Blue)
    candleSeries.createPriceLine({
        price: 4506.05,
        color: '#2962FF',
        lineWidth: 1,
        lineStyle: 1, // Dotted
        axisLabelVisible: true,
        title: '',
    });

    window.addEventListener('resize', () => {
        chart.resize(window.innerWidth, window.innerHeight);
    });

} catch (e) {
    document.body.innerHTML += `<div style="color:red; z-index:9999; position:absolute; top:50px; left:50px; background:white; padding:20px; font-family:sans-serif; border:2px solid red;">
        <h3>Chart Rendering Error</h3>
        <b>Message:</b> ${e.message}<br><br>
        <b>Stack:</b> <pre>${e.stack}</pre>
    </div>`;
}
