
import React, { useRef, useEffect, useState } from 'react';
import { 
    select, 
    timeParse, 
    scaleTime, 
    extent, 
    scaleLinear, 
    min, 
    max, 
    axisBottom, 
    timeFormat, 
    axisLeft, 
    format, 
    line,
    area 
} from 'd3';
import type { HistoricalDataPoint } from '../types.ts';

interface ExtendedDataPoint extends HistoricalDataPoint {
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
}

interface PriceChartProps {
    data: ExtendedDataPoint[];
    theme: 'light' | 'dark';
}

type ChartType = 'line' | 'candlestick' | 'ohlc' | 'area';

interface IndicatorSettings {
    sma9: boolean;
    sma20: boolean;
    sma50: boolean;
    sma200: boolean;
    ema12: boolean;
    ema26: boolean;
    vwap: boolean;
    bollinger: boolean;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, theme }) => {
    const chartRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [chartType, setChartType] = useState<ChartType>('line');
    const [showVolume, setShowVolume] = useState(false);
    const [indicators, setIndicators] = useState<IndicatorSettings>({
        sma9: false,
        sma20: true,
        sma50: false,
        sma200: false,
        ema12: false,
        ema26: false,
        vwap: false,
        bollinger: false
    });

    // Calculate Simple Moving Average
    const calculateSMA = (data: any[], period: number) => {
        const sma = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
            sma.push({
                date: data[i].date,
                value: sum / period
            });
        }
        return sma;
    };

    // Calculate Exponential Moving Average
    const calculateEMA = (data: any[], period: number) => {
        const ema = [];
        const multiplier = 2 / (period + 1);
        let emaValue = data[0].close; // Start with first close price
        
        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                emaValue = data[i].close;
            } else {
                emaValue = (data[i].close * multiplier) + (emaValue * (1 - multiplier));
            }
            ema.push({
                date: data[i].date,
                value: emaValue
            });
        }
        return ema;
    };

    // Calculate VWAP (Volume Weighted Average Price)
    const calculateVWAP = (data: any[]) => {
        let cumulativeTPV = 0; // Typical Price * Volume
        let cumulativeVolume = 0;
        const vwap = [];
        
        for (let i = 0; i < data.length; i++) {
            const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
            const tpv = typicalPrice * data[i].volume;
            cumulativeTPV += tpv;
            cumulativeVolume += data[i].volume;
            
            vwap.push({
                date: data[i].date,
                value: cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice
            });
        }
        return vwap;
    };

    // Calculate Bollinger Bands
    const calculateBollingerBands = (data: any[], period: number = 20, stdDevMultiplier: number = 2) => {
        const smaData = calculateSMA(data, period);
        const bands = [];
        
        for (let i = 0; i < smaData.length; i++) {
            const dataIndex = i + period - 1;
            const subset = data.slice(dataIndex - period + 1, dataIndex + 1);
            const mean = smaData[i].value;
            const variance = subset.reduce((acc, d) => acc + Math.pow(d.close - mean, 2), 0) / period;
            const stdDev = Math.sqrt(variance);
            
            bands.push({
                date: data[dataIndex].date,
                upper: mean + (stdDev * stdDevMultiplier),
                middle: mean,
                lower: mean - (stdDev * stdDevMultiplier)
            });
        }
        return bands;
    };

    useEffect(() => {
        if (!data || data.length === 0 || !chartRef.current || !containerRef.current) return;

        // Clear previous chart
        select(chartRef.current).selectAll("*").remove();

        const axisColor = theme === 'dark' ? "#9ca3af" : "#6b7280";
        const textColor = theme === 'dark' ? "#d1d5db" : "#374151";
        const lineColor = "#4f46e5";
        const gridColor = theme === 'dark' ? "#374151" : "#e5e7eb";
        const bullishColor = "#10b981"; // Green
        const bearishColor = "#ef4444"; // Red
        const volumeColor = theme === 'dark' ? "#6b7280" : "#9ca3af";

        const margin = { top: 20, right: 40, bottom: showVolume ? 100 : 50, left: 60 };
        const width = containerRef.current.clientWidth - margin.left - margin.right;
        const mainHeight = showVolume ? 300 : 400;
        const volumeHeight = showVolume ? 80 : 0;
        const totalHeight = mainHeight + volumeHeight + margin.top + margin.bottom;

        const svg = select(chartRef.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", totalHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Handle both daily (YYYY-MM-DD) and intraday (ISO datetime) formats
        const parseDateDaily = timeParse("%Y-%m-%d");
        const processedData = data.map(d => {
            let parsedDate: Date | null = null;
            
            // Try parsing as ISO datetime first (for intraday data)
            if (d.date.includes('T') || d.date.includes(' ')) {
                parsedDate = new Date(d.date);
                // Check if the date is valid
                if (isNaN(parsedDate.getTime())) {
                    parsedDate = null;
                }
            }
            
            // Fallback to daily format parsing
            if (!parsedDate) {
                parsedDate = parseDateDaily(d.date);
            }
            
            return {
                date: parsedDate,
                close: d.close,
                open: d.open || d.close,
                high: d.high || d.close,
                low: d.low || d.close,
                volume: d.volume || 0
            };
        }).filter(d => d.date !== null) as { 
            date: Date, 
            close: number, 
            open: number, 
            high: number, 
            low: number, 
            volume: number 
        }[];
        
        if (processedData.length === 0) return;

        const xScale = scaleTime()
            .domain(extent(processedData, d => d.date) as [Date, Date])
            .range([0, width]);

        const priceExtent = [
            min(processedData, d => d.low) as number * 0.98, 
            max(processedData, d => d.high) as number * 1.02
        ];

        const yScale = scaleLinear()
            .domain(priceExtent)
            .range([mainHeight, 0]);

        // Volume scale (if showing volume)
        let volumeScale: any;
        if (showVolume) {
            volumeScale = scaleLinear()
                .domain([0, max(processedData, d => d.volume) as number])
                .range([volumeHeight, 0]);
        }

        // Grid lines
        const mainChart = svg.append("g").attr("class", "main-chart");
        
        mainChart.append("g")
           .attr("class", "grid")
           .attr("transform", `translate(0,${mainHeight})`)
           .call(axisBottom(xScale).tickSize(-mainHeight).tickFormat(() => "").ticks(Math.max(width / 100, 2)));

        mainChart.append("g")
           .attr("class", "grid")
           .call(axisLeft(yScale).tickSize(-width).tickFormat(() => ""));

        svg.selectAll(".grid line").attr("stroke", gridColor).attr("stroke-opacity", 0.7);
        svg.selectAll(".grid path").attr("stroke-width", 0);

        // Calculate and render indicators
        const indicatorColors = {
            sma9: "#ff6b6b",
            sma20: "#4ecdc4", 
            sma50: "#45b7d1",
            sma200: "#96ceb4",
            ema12: "#feca57",
            ema26: "#ff9ff3",
            vwap: "#54a0ff",
            bollinger: "#5f27cd"
        };

        // Render indicators
        if (indicators.sma9) {
            const sma9Data = calculateSMA(processedData, 9);
            mainChart.append("path")
                .datum(sma9Data)
                .attr("fill", "none")
                .attr("stroke", indicatorColors.sma9)
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "3,3")
                .attr("d", line<{date: Date, value: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
                );
        }

        if (indicators.sma20) {
            const sma20Data = calculateSMA(processedData, 20);
            mainChart.append("path")
                .datum(sma20Data)
                .attr("fill", "none")
                .attr("stroke", indicatorColors.sma20)
                .attr("stroke-width", 2)
                .attr("d", line<{date: Date, value: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
                );
        }

        if (indicators.sma50) {
            const sma50Data = calculateSMA(processedData, 50);
            mainChart.append("path")
                .datum(sma50Data)
                .attr("fill", "none")
                .attr("stroke", indicatorColors.sma50)
                .attr("stroke-width", 2)
                .attr("d", line<{date: Date, value: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
                );
        }

        if (indicators.sma200) {
            const sma200Data = calculateSMA(processedData, 200);
            mainChart.append("path")
                .datum(sma200Data)
                .attr("fill", "none")
                .attr("stroke", indicatorColors.sma200)
                .attr("stroke-width", 2.5)
                .attr("d", line<{date: Date, value: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
                );
        }

        if (indicators.ema12) {
            const ema12Data = calculateEMA(processedData, 12);
            mainChart.append("path")
                .datum(ema12Data)
                .attr("fill", "none")
                .attr("stroke", indicatorColors.ema12)
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "5,2")
                .attr("d", line<{date: Date, value: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
                );
        }

        if (indicators.ema26) {
            const ema26Data = calculateEMA(processedData, 26);
            mainChart.append("path")
                .datum(ema26Data)
                .attr("fill", "none")
                .attr("stroke", indicatorColors.ema26)
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "5,2")
                .attr("d", line<{date: Date, value: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
                );
        }

        if (indicators.vwap) {
            const vwapData = calculateVWAP(processedData);
            mainChart.append("path")
                .datum(vwapData)
                .attr("fill", "none")
                .attr("stroke", indicatorColors.vwap)
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "8,4")
                .attr("d", line<{date: Date, value: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
                );
        }

        if (indicators.bollinger) {
            const bollingerData = calculateBollingerBands(processedData);
            
            // Upper band
            mainChart.append("path")
                .datum(bollingerData)
                .attr("fill", "none")
                .attr("stroke", indicatorColors.bollinger)
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.7)
                .attr("d", line<{date: Date, upper: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.upper))
                );
            
            // Lower band
            mainChart.append("path")
                .datum(bollingerData)
                .attr("fill", "none")
                .attr("stroke", indicatorColors.bollinger)
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.7)
                .attr("d", line<{date: Date, lower: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.lower))
                );
            
            // Fill between bands
            const areaGenerator = area<{date: Date, upper: number, lower: number}>()
                .x(d => xScale(d.date))
                .y0(d => yScale(d.lower))
                .y1(d => yScale(d.upper));

            mainChart.append("path")
                .datum(bollingerData)
                .attr("fill", indicatorColors.bollinger)
                .attr("fill-opacity", 0.1)
                .attr("d", areaGenerator);
        }

        // Price chart based on type
        if (chartType === 'line') {
            mainChart.append("path")
                .datum(processedData)
                .attr("fill", "none")
                .attr("stroke", lineColor)
                .attr("stroke-width", 2)
                .attr("d", line<{date: Date, close: number}>()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.close))
                );
        } else if (chartType === 'area') {
            const areaGenerator = area<{date: Date, close: number}>()
                .x(d => xScale(d.date))
                .y0(yScale(priceExtent[0]))
                .y1(d => yScale(d.close));

            mainChart.append("path")
                .datum(processedData)
                .attr("fill", lineColor)
                .attr("fill-opacity", 0.3)
                .attr("stroke", lineColor)
                .attr("stroke-width", 2)
                .attr("d", areaGenerator);
        } else if (chartType === 'candlestick') {
            const candleWidth = Math.max(2, (width / processedData.length) * 0.7);
            
            const candles = mainChart.selectAll(".candle")
                .data(processedData)
                .enter()
                .append("g")
                .attr("class", "candle");

            // Wicks (high-low lines)
            candles.append("line")
                .attr("x1", d => xScale(d.date))
                .attr("x2", d => xScale(d.date))
                .attr("y1", d => yScale(d.high))
                .attr("y2", d => yScale(d.low))
                .attr("stroke", d => d.close >= d.open ? bullishColor : bearishColor)
                .attr("stroke-width", 1);

            // Candle bodies
            candles.append("rect")
                .attr("x", d => xScale(d.date) - candleWidth / 2)
                .attr("y", d => yScale(Math.max(d.open, d.close)))
                .attr("width", candleWidth)
                .attr("height", d => Math.abs(yScale(d.open) - yScale(d.close)) || 1)
                .attr("fill", d => d.close >= d.open ? bullishColor : bearishColor)
                .attr("stroke", d => d.close >= d.open ? bullishColor : bearishColor);
        } else if (chartType === 'ohlc') {
            const tickWidth = Math.max(3, (width / processedData.length) * 0.3);
            
            const ohlcBars = mainChart.selectAll(".ohlc")
                .data(processedData)
                .enter()
                .append("g")
                .attr("class", "ohlc");

            // Vertical line (high-low)
            ohlcBars.append("line")
                .attr("x1", d => xScale(d.date))
                .attr("x2", d => xScale(d.date))
                .attr("y1", d => yScale(d.high))
                .attr("y2", d => yScale(d.low))
                .attr("stroke", d => d.close >= d.open ? bullishColor : bearishColor)
                .attr("stroke-width", 1);

            // Open tick (left)
            ohlcBars.append("line")
                .attr("x1", d => xScale(d.date) - tickWidth)
                .attr("x2", d => xScale(d.date))
                .attr("y1", d => yScale(d.open))
                .attr("y2", d => yScale(d.open))
                .attr("stroke", d => d.close >= d.open ? bullishColor : bearishColor)
                .attr("stroke-width", 1);

            // Close tick (right)
            ohlcBars.append("line")
                .attr("x1", d => xScale(d.date))
                .attr("x2", d => xScale(d.date) + tickWidth)
                .attr("y1", d => yScale(d.close))
                .attr("y2", d => yScale(d.close))
                .attr("stroke", d => d.close >= d.open ? bullishColor : bearishColor)
                .attr("stroke-width", 1);
        }

        // Volume chart
        if (showVolume && volumeScale) {
            const volumeChart = svg.append("g")
                .attr("class", "volume-chart")
                .attr("transform", `translate(0, ${mainHeight + 20})`);

            const barWidth = Math.max(1, (width / processedData.length) * 0.8);

            volumeChart.selectAll(".volume-bar")
                .data(processedData)
                .enter()
                .append("rect")
                .attr("class", "volume-bar")
                .attr("x", d => xScale(d.date) - barWidth / 2)
                .attr("y", d => volumeScale(d.volume))
                .attr("width", barWidth)
                .attr("height", d => volumeHeight - volumeScale(d.volume))
                .attr("fill", volumeColor)
                .attr("opacity", 0.7);

            // Volume axis
            volumeChart.append("g")
                .attr("transform", `translate(0, ${volumeHeight})`)
                .call(axisBottom(xScale).ticks(Math.max(width / 100, 2)).tickFormat(timeFormatter))
                .call(g => g.selectAll("text")
                    .style("fill", axisColor)
                    .style("font-size", isIntraday ? "10px" : "12px")
                    .attr("transform", isIntraday ? "rotate(-45)" : "rotate(0)")
                    .style("text-anchor", isIntraday ? "end" : "middle"))
                .call(g => g.select(".domain").attr("stroke", axisColor));

            volumeChart.append("g")
                .call(axisLeft(volumeScale).ticks(3).tickFormat(d => format(".2s")(d)))
                .call(g => g.selectAll("text").style("fill", axisColor))
                .call(g => g.select(".domain").attr("stroke", axisColor));

            volumeChart.selectAll('.tick line').attr('stroke', axisColor);
        }

        // Main chart axes with dynamic time formatting
        const isIntraday = processedData.length > 0 && 
            (processedData[0].date.getHours() !== 0 || processedData[0].date.getMinutes() !== 0);
        
        const timeFormatter = isIntraday ? timeFormat("%m/%d %H:%M") : timeFormat("%b %d");
        const xAxis = axisBottom(xScale).ticks(Math.max(width / 100, 2)).tickFormat(timeFormatter);
        const yAxis = axisLeft(yScale).tickFormat(d => `$${format(".2f")(d)}`);
        
        mainChart.append("g")
            .attr("transform", `translate(0,${mainHeight})`)
            .call(xAxis)
            .call(g => g.selectAll("text")
                .style("fill", axisColor)
                .style("font-size", isIntraday ? "10px" : "12px")
                .attr("transform", isIntraday ? "rotate(-45)" : "rotate(0)")
                .style("text-anchor", isIntraday ? "end" : "middle"))
            .call(g => g.select(".domain").attr("stroke", axisColor));

        mainChart.append("g")
            .call(yAxis)
            .call(g => g.selectAll("text").style("fill", axisColor))
            .call(g => g.select(".domain").attr("stroke", axisColor));
        
        mainChart.selectAll('.tick line').attr('stroke', axisColor);

        // Labels
        svg.append("text")
            .attr("transform", `translate(${width / 2}, ${totalHeight - 10})`)
            .style("text-anchor", "middle")
            .style("fill", textColor)
            .text("Date");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 15)
            .attr("x", 0 - (mainHeight / 2))
            .style("text-anchor", "middle")
            .style("fill", textColor)
            .text("Price ($)");

        if (showVolume) {
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left + 35)
                .attr("x", 0 - (mainHeight + volumeHeight / 2))
                .style("text-anchor", "middle")
                .style("fill", textColor)
                .style("font-size", "12px")
                .text("Volume");
        }

    }, [data, theme, chartType, showVolume, indicators, containerRef.current?.clientWidth]);

    const chartTypeOptions = [
        { value: 'line' as ChartType, label: 'Line' },
        { value: 'candlestick' as ChartType, label: 'Candlestick' },
        { value: 'ohlc' as ChartType, label: 'OHLC' },
        { value: 'area' as ChartType, label: 'Area' }
    ];

    return (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Historical Price Chart</h3>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="chartType" className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Chart Type:
                        </label>
                        <select
                            id="chartType"
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value as ChartType)}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                            {chartTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="showVolume"
                            checked={showVolume}
                            onChange={(e) => setShowVolume(e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="showVolume" className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Show Volume
                        </label>
                    </div>
                </div>
            </div>
            
            {/* Indicators Panel */}
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Technical Indicators</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="sma9"
                            checked={indicators.sma9}
                            onChange={(e) => setIndicators(prev => ({ ...prev, sma9: e.target.checked }))}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="sma9" className="text-xs text-gray-600 dark:text-gray-400">SMA 9</label>
                        <div className="w-3 h-3 border-2 border-dashed" style={{ borderColor: '#ff6b6b' }}></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="sma20"
                            checked={indicators.sma20}
                            onChange={(e) => setIndicators(prev => ({ ...prev, sma20: e.target.checked }))}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="sma20" className="text-xs text-gray-600 dark:text-gray-400">SMA 20</label>
                        <div className="w-3 h-3 border-2" style={{ borderColor: '#4ecdc4' }}></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="sma50"
                            checked={indicators.sma50}
                            onChange={(e) => setIndicators(prev => ({ ...prev, sma50: e.target.checked }))}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="sma50" className="text-xs text-gray-600 dark:text-gray-400">SMA 50</label>
                        <div className="w-3 h-3 border-2" style={{ borderColor: '#45b7d1' }}></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="sma200"
                            checked={indicators.sma200}
                            onChange={(e) => setIndicators(prev => ({ ...prev, sma200: e.target.checked }))}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="sma200" className="text-xs text-gray-600 dark:text-gray-400">SMA 200</label>
                        <div className="w-3 h-3 border-2" style={{ borderColor: '#96ceb4' }}></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="ema12"
                            checked={indicators.ema12}
                            onChange={(e) => setIndicators(prev => ({ ...prev, ema12: e.target.checked }))}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="ema12" className="text-xs text-gray-600 dark:text-gray-400">EMA 12</label>
                        <div className="w-3 h-3 border-2 border-dashed" style={{ borderColor: '#feca57' }}></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="ema26"
                            checked={indicators.ema26}
                            onChange={(e) => setIndicators(prev => ({ ...prev, ema26: e.target.checked }))}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="ema26" className="text-xs text-gray-600 dark:text-gray-400">EMA 26</label>
                        <div className="w-3 h-3 border-2 border-dashed" style={{ borderColor: '#ff9ff3' }}></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="vwap"
                            checked={indicators.vwap}
                            onChange={(e) => setIndicators(prev => ({ ...prev, vwap: e.target.checked }))}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="vwap" className="text-xs text-gray-600 dark:text-gray-400">VWAP</label>
                        <div className="w-3 h-3 border-2 border-dashed" style={{ borderColor: '#54a0ff' }}></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="bollinger"
                            checked={indicators.bollinger}
                            onChange={(e) => setIndicators(prev => ({ ...prev, bollinger: e.target.checked }))}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="bollinger" className="text-xs text-gray-600 dark:text-gray-400">Bollinger</label>
                        <div className="w-3 h-3 border-2" style={{ borderColor: '#5f27cd' }}></div>
                    </div>
                </div>
            </div>
            <div ref={containerRef} className="w-full">
                <svg ref={chartRef}></svg>
            </div>
        </div>
    );
};
