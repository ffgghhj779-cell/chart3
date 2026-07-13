// Lightweight Charts configuration
const chartProperties = {
    width: window.innerWidth,
    height: window.innerHeight,
    layout: {
        background: { type: 'solid', color: '#131722' },
        textColor: '#d1d4dc',
    },
    grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
    },
    crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
    },
    rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
    },
    timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
        timeVisible: true,
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

// Generate realistic looking mock data matching the image
const generateData = () => {
    let data = [];
    let time = new Date('2026-05-27T00:00:00Z').getTime();
    let open = 4450;
    let high, low, close;

    // Up trend first
    for (let i = 0; i < 40; i++) {
        time += 3600000; // 1 hour
        let volatility = Math.random() * 15;
        close = open + (Math.random() * 20 - 5);
        high = Math.max(open, close) + Math.random() * 10;
        low = Math.min(open, close) - Math.random() * 10;
        data.push({ time: time / 1000, open, high, low, close });
        open = close;
    }

    // The peak
    open = close;
    close = 4530;
    high = 4535;
    low = open - 5;
    time += 3600000;
    data.push({ time: time / 1000, open, high, low, close });

    // The drop
    open = 4530;
    for (let i = 0; i < 20; i++) {
        time += 3600000;
        close = open - (Math.random() * 15 + 2);
        high = open + Math.random() * 5;
        low = close - Math.random() * 10;
        data.push({ time: time / 1000, open, high, low, close });
        open = close;
    }

    return data;
};

const candleData = generateData();
candleSeries.setData(candleData);

// Set visible range to match the picture zoom level
chart.timeScale().fitContent();

// Add Price Lines to replicate the Dashboard Lines

// 1. Stop Loss
candleSeries.createPriceLine({
    price: 4527.8,
    color: '#f23645',
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Solid,
    axisLabelVisible: true,
    title: 'SL (-15.98$)',
});

// 2. Entry Zone High
candleSeries.createPriceLine({
    price: 4516.8,
    color: '#ffaa00',
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Solid,
    axisLabelVisible: true,
    title: 'ENTRY',
});

// 3. VWAP
candleSeries.createPriceLine({
    price: 4514.9,
    color: '#ffaa00',
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title: 'VWAP-D',
});

// 4. Entry Zone Low
candleSeries.createPriceLine({
    price: 4506.7,
    color: '#ffaa00',
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Solid,
    axisLabelVisible: false,
});

// 5. TP1
candleSeries.createPriceLine({
    price: 4473.6,
    color: '#089981',
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Solid,
    axisLabelVisible: true,
    title: 'TP1 (1:2.39)',
});

// 6. TP2
candleSeries.createPriceLine({
    price: 4453.8,
    color: '#089981',
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title: 'TP2 (1:3.63)',
});

// 7. TP3
candleSeries.createPriceLine({
    price: 4440.9,
    color: '#089981',
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title: 'TP3 (1:4.44)',
});

// Handle window resize
window.addEventListener('resize', () => {
    chart.resize(window.innerWidth, window.innerHeight);
});
