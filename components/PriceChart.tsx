
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

export const PriceChart: React.FC<PriceChartProps> = ({ data, theme }) => {
    const chartRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [chartType, setChartType] = useState<ChartType>('line');
    const [showVolume, setShowVolume] = useState(false);

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

        const parseDate = timeParse("%Y-%m-%d");
        const processedData = data.map(d => ({
            date: parseDate(d.date),
            close: d.close,
            open: d.open || d.close,
            high: d.high || d.close,
            low: d.low || d.close,
            volume: d.volume || 0
        })).filter(d => d.date !== null) as { 
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
                .call(axisBottom(xScale).ticks(Math.max(width / 100, 2)).tickFormat(timeFormat("%b %d")))
                .call(g => g.selectAll("text").style("fill", axisColor))
                .call(g => g.select(".domain").attr("stroke", axisColor));

            volumeChart.append("g")
                .call(axisLeft(volumeScale).ticks(3).tickFormat(d => format(".2s")(d)))
                .call(g => g.selectAll("text").style("fill", axisColor))
                .call(g => g.select(".domain").attr("stroke", axisColor));

            volumeChart.selectAll('.tick line').attr('stroke', axisColor);
        }

        // Main chart axes
        const xAxis = axisBottom(xScale).ticks(Math.max(width / 100, 2)).tickFormat(timeFormat("%b %d"));
        const yAxis = axisLeft(yScale).tickFormat(d => `$${format(".2f")(d)}`);
        
        mainChart.append("g")
            .attr("transform", `translate(0,${mainHeight})`)
            .call(xAxis)
            .call(g => g.selectAll("text").style("fill", axisColor))
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

    }, [data, theme, chartType, showVolume, containerRef.current?.clientWidth]);

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
            <div ref={containerRef} className="w-full">
                <svg ref={chartRef}></svg>
            </div>
        </div>
    );
};
