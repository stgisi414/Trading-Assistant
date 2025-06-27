import React, { useRef, useEffect } from 'react';
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
    line 
} from 'd3';
import type { HistoricalDataPoint } from '../types.ts';

interface PriceChartProps {
    data: HistoricalDataPoint[];
    theme: 'light' | 'dark';
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, theme }) => {
    const chartRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!data || data.length === 0 || !chartRef.current || !containerRef.current) return;

        // Clear previous chart
        select(chartRef.current).selectAll("*").remove();

        const axisColor = theme === 'dark' ? "#9ca3af" : "#6b7280";
        const textColor = theme === 'dark' ? "#d1d5db" : "#374151";
        const lineColor = "#4f46e5"; // Indigo-500, works on both
        const gridColor = theme === 'dark' ? "#374151" : "#e5e7eb";

        const margin = { top: 20, right: 40, bottom: 50, left: 60 };
        const width = containerRef.current.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = select(chartRef.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const parseDate = timeParse("%Y-%m-%d");
        const processedData = data.map(d => ({
            date: parseDate(d.date),
            close: d.close
        })).filter(d => d.date !== null) as { date: Date, close: number }[];
        
        if (processedData.length === 0) return;

        const xScale = scaleTime()
            .domain(extent(processedData, d => d.date) as [Date, Date])
            .range([0, width]);

        const yScale = scaleLinear()
            .domain([min(processedData, d => d.close) as number * 0.98, max(processedData, d => d.close) as number * 1.02])
            .range([height, 0]);

        // Grid lines
        svg.append("g")
           .attr("class", "grid")
           .attr("transform", `translate(0,${height})`)
           .call(axisBottom(xScale).tickSize(-height).tickFormat(() => "").ticks(Math.max(width / 100, 2)));

        svg.append("g")
           .attr("class", "grid")
           .call(axisLeft(yScale).tickSize(-width).tickFormat(() => ""));

        svg.selectAll(".grid line").attr("stroke", gridColor).attr("stroke-opacity", 0.7);
        svg.selectAll(".grid path").attr("stroke-width", 0);

        const xAxis = axisBottom(xScale).ticks(Math.max(width / 100, 2)).tickFormat(timeFormat("%b %d"));
        const yAxis = axisLeft(yScale).tickFormat(d => `$${format(".2f")(d)}`);
        
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .call(g => g.selectAll("text").style("fill", axisColor))
            .call(g => g.select(".domain").attr("stroke", axisColor));

        svg.append("g")
            .call(yAxis)
            .call(g => g.selectAll("text").style("fill", axisColor))
            .call(g => g.select(".domain").attr("stroke", axisColor));
        
        svg.selectAll('.tick line').attr('stroke', axisColor);

        svg.append("path")
            .datum(processedData)
            .attr("fill", "none")
            .attr("stroke", lineColor)
            .attr("stroke-width", 2)
            .attr("d", line<{date: Date, close: number}>()
                .x(d => xScale(d.date))
                .y(d => yScale(d.close))
            );
        
        svg.append("text")
            .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style("text-anchor", "middle")
            .style("fill", textColor)
            .text("Date");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 15)
            .attr("x", 0 - (height / 2))
            .style("text-anchor", "middle")
            .style("fill", textColor)
            .text("Closing Price ($)");

    }, [data, theme, containerRef.current?.clientWidth]);

    return (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-4 text-gray-700 dark:text-gray-300">Historical Price Chart</h3>
            <div ref={containerRef} className="w-full">
                <svg ref={chartRef}></svg>
            </div>
        </div>
    );
};