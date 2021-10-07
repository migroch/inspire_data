import React, {useEffect, useRef} from "react"
import {ComponentProps, Streamlit, withStreamlitConnection,} from "./streamlit"
import * as d3 from "d3";

import styles from './TimeChart.css'
import { act } from "react-dom/test-utils";
import { type } from "os";


/**
 * Build D3 scales from data
 */
const buildScales = (args) => {
    const {svgWidth, svgHeight, margin, data} = args

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, (d) => d[0]))
        .range([margin.left, svgWidth - margin.right])
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => d[1])])
        .range([svgHeight - margin.bottom, margin.top])
    const active_yScale = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => d[3])])
        .range([svgHeight - margin.bottom, margin.top])

    return [xScale, yScale, active_yScale]
}

const TimeChart = (props) => {
    props.args.data =  props.args.data.map(d => [new Date(d[0]), d[1], d[2], d[3], d[4], d[5]])
    const svgRef = useRef(null)
    const transitionMillisec = 1200
    const {svgWidth, svgHeight, circleRadius, circleColor, margin, data} = props.args
    console.log(data)
    
    // On mount, create group containers for circles, path and both axis
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        svgElement.append("g").classed('active-area', true)
        svgElement.append("g").classed('active-circles', true)
        svgElement.append("g").classed('pos-line', true)
        svgElement.append("g").classed('pos-circles', true)
        svgElement.append("g").classed('legend', true)
        svgElement.append("g").classed('x-axis', true)
        svgElement.append("g").classed('y-axis-pos', true)
        svgElement.append("g").classed('y-axis-active', true)
        svgElement.append("text").classed('active-axis-label', true)
        svgElement.append("text").classed('pos-axis-label', true)
    }, [])

    // Hook to create / update axis and grid
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const [xScale, pos_yScale, active_yScale] = buildScales(props.args)

        const xAxis = (g) => g.attr("transform", `translate(0, ${svgHeight - margin.bottom})`)
            .transition().duration(transitionMillisec)
            .attr("font", "sans-serif")
            .attr("font-size", "7px")
            .call(d3.axisBottom(xScale)
                .ticks()
                .tickFormat(d3.timeFormat("%b %d"))
                .tickSize(-1 * (svgHeight - margin.top - margin.bottom))
                .tickSizeOuter(0))
            .call(g => g.selectAll("path")
                .attr("stroke", "#262730")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.2))
            .call(g => g.selectAll(".tick line")
                .attr("stroke", "#ababab")
                .attr("stroke-opacity", 0.7)
                .attr("stroke-dasharray", "2,2")
                .attr("stroke-width", 0.3))
            
        const active_yAxis = (g) => g.attr("transform", `translate(${margin.left}, 0)`)
            .transition().duration(transitionMillisec)
            .attr("font", "sans-serif")
            .attr("font-size", "7px")
            .call(d3.axisLeft(active_yScale)
                .ticks()
                .tickSize(3))
            .call(g => g.selectAll("path")
                .attr("stroke", "#262730")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.2))
            .call(g => g.selectAll("line")
                .attr("stroke", "#262730")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.2))
        const active_label = (g) => g.text("Active Cases")
            .attr("transform", "rotate(-90)")
            .transition().duration(transitionMillisec)
            .attr("x", 0 - ((svgWidth - margin.left) / 3.03))
            .attr("y", 15)
            .style("text-anchor", "middle")
            .attr("font", "sans-serif")
            .attr("font-size", "8px")
        const pos_yAxis = (g) => g.attr("transform", `translate(${svgWidth - margin.right}, 0)`)
            .transition().duration(transitionMillisec)
            .attr("font", "sans-serif")
            .attr("font-size", "7px")
            .call(d3.axisRight(pos_yScale)
                .ticks()
                .tickSize(3))
            .call(g => g.selectAll("path")
                .attr("stroke", "#262730")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.2))
            .call(g => g.selectAll("line")
                .attr("stroke", "#262730")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.2))
        const pos_label = (g) => g.text("14-Day Positivity Rates")
            .attr("transform", "rotate(-270)")
            .transition().duration(transitionMillisec)
            .attr("x", (svgHeight - margin.bottom) / 2.1)
            .attr("y", 0 - (svgWidth) + 10)
            .style("text-anchor", "middle")
            .attr("font-size", "8px")

        svgElement.select(".x-axis").call(xAxis);
        svgElement.select(".y-axis-active").call(active_yAxis);
        svgElement.select(".active-axis-label").call(active_label);
        svgElement.select(".y-axis-pos").call(pos_yAxis);
        svgElement.select(".pos-axis-label").call(pos_label);
    })

    // Hook to create / update legend
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const keys = ["Active Cases", "14-Day Positivity Rate"]
        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(["#ED647C", "#ffc107"])

        svgElement.select(".legend").selectAll("circle")
            .data(keys)
            .enter()
            .append("circle")
            .attr("cx", margin.right + 23)
            .attr("cy", function(d,i) { return (margin.top + 5) + i * 18; })
            .attr("r", 5)
            .style("fill", function(d) { return color(d); })
        svgElement.select(".legend").selectAll("text")
            .data(keys)
            .enter()
            .append("text")
            .attr("x", margin.right + 30)
            .attr("y", function(d,i) { return (margin.top + 7) + i * 18; })
            .text(function(d) { return d; })
            .attr("font-size", "7px")
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
    })

    // Hook for initial tooltip
    useEffect(() => {
        var tooltip = d3.select(".tooltip").classed("hide", true)
    })

    // Hook to create / update active-circles
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const [xScale, pos_yScale, active_yScale] = buildScales(props.args)
        const formatDate = d3.timeFormat("%B %d")
        let tooltip = d3.select(".tooltip")

        svgElement.select(".active-circles").selectAll("circle")
            .data(data, (d) => d)
            .join(
                enter => (
                    enter.append("circle")
                        // Bind each circle to [x,y] coordinate
                        .classed(styles.circle, true)
                        .attr("cx", (d) => xScale(d[0]))
                        .attr("cy", (d) => active_yScale(d[3]))
                        .attr("fill", "#ED647C")
                        .attr("r", 0)
                        // Transition from invisible to visible circle
                        .call(el => el.transition().duration(transitionMillisec).attr("r", circleRadius))
                        // Add d3 mouseover to display and move tooltip around
                        .on("mouseover", (d) => {
                            d3.select(".tooltip")
                                .attr("hidden", null)
                                .style("left", `${d3.event.pageX}px`)
                                .style("top", `${d3.event.pageY}px`)
                                .style("opacity", 0.8)
                                .html("Date: " + formatDate(d[0]) + "<br/>Active Cases: " + d[3])
                        })
                        .on("mouseout", _ => {
                            d3.select(".tooltip").attr("hidden", true)
                        })
                ),
                update => update.call(el =>
                    // If circle has not changed coordinates, maybe data scale changed
                    // so transition from original position to new position
                    el.transition().duration(transitionMillisec)
                        .attr("cy", (d) => active_yScale(d[3]))
                        // NB : keep radius value, it seems in Streamlit lifecycle there are 2 renders when mounting ?
                        // so circles enter and during transition to full radius rerender
                        // so if r < circleRadius while update then animation breaks and circle stay small for first render
                        .attr("r", circleRadius)
                        .attr("fill", "#ED647C")
                ),
                exit => (
                    // Close tooltip and remove mouse events
                    exit.dispatch("mouseout")
                        .on("mouseover", null)
                        .on("mouseout", null)
                        // Transition from visible to invisible circle then remove entirely
                        .call(el =>
                            el.transition().duration(transitionMillisec / 2)
                                .attr("r", 0)
                                .attr("fill", "tomato")
                                .style("opacity", 0)
                                .remove()
                        )
                ),
            )
    })

    // Hook to create / update pos-circles
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const [xScale, pos_yScale, active_yScale] = buildScales(props.args)
        const formatDate = d3.timeFormat("%B %d")
        let tooltip = d3.select(".tooltip")

        svgElement.select(".pos-circles").selectAll("circle")
            .data(data, (d) => d)
            .join(
                enter => (
                    enter.append("circle")
                        // Bind each circle to [x,y] coordinate
                        .classed(styles.circle, true)
                        .attr("cx", (d) => xScale(d[0]))
                        .attr("cy", (d) => pos_yScale(d[1]))
                        .attr("fill", "#ffc107")
                        .attr("r", 0)
                        // Transition from invisible to visible circle
                        .call(el => el.transition().duration(transitionMillisec).attr("r", circleRadius))
                        // Add d3 mouseover to display and move tooltip around
                        .on("mouseover", (d) => {
                            tooltip.style("left", `${d3.event.pageX}px`).style("top", `${d3.event.pageY}px`);
                            tooltip.html("Date: " + formatDate(d[0]) + "<br/>14-Day Average Positive Rate: " + d[1].toFixed(2) + "%");
                            tooltip.classed("hide", false)
                            tooltip.classed("show", true)
                        })
                        .on("mouseout", () => {
                            tooltip.classed("show", false)
                            tooltip.classed("hide", true)
                        })
                ),
                update => update.call(el =>
                    // If circle has not changed coordinates, maybe data scale changed
                    // so transition from original position to new position
                    el.transition().duration(transitionMillisec)
                        .attr("cy", (d) => pos_yScale(d[1]))
                        // NB : keep radius value, it seems in Streamlit lifecycle there are 2 renders when mounting ?
                        // so circles enter and during transition to full radius rerender
                        // so if r < circleRadius while update then animation breaks and circle stay small for first render
                        .attr("r", circleRadius)
                        .attr("fill", "#ffc107")
                ),
                exit => (
                    // Close tooltip and remove mouse events
                    exit.dispatch("mouseout")
                        .on("mouseover", null)
                        .on("mouseout", null)
                        // Transition from visible to invisible circle then remove entirely
                        .call(el =>
                            el.transition().duration(transitionMillisec / 2)
                                .attr("r", 0)
                                .attr("fill", "tomato")
                                .style("opacity", 0)
                                .remove()
                        )
                ),
            )
    })

    // create / update active-area
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const [xScale, pos_yScale, active_yScale] = buildScales(props.args)

        const active_area = d3.area()
            .x(d => xScale(d[0]))
            .y0(active_yScale(0))
            .y1(d => active_yScale(d[3]))

        svgElement.select(".active-area").selectAll("path")
            .data([data]) // Array with 1 element keyed by index, so enters once then only updates
            .join(
                enter => enter.append("path")
                    .classed(styles.area, true)
                    .attr("d", (d) => active_area(d))
                    .attr("stroke", "red")
                    .attr("stroke-width", 1)
                    .attr("fill", "#ED647C")
                    .attr("opacity", 0)
                    .call(el => el.transition().duration(transitionMillisec).attr("opacity", 0.7)),
                update => update
                    .attr("opacity", 0)
                    .call(el =>
                        el.transition().duration(transitionMillisec)
                            .attr("d", (d) => active_area(d))
                            .attr("opacity", 0.7)
                    ),
            )
    })

    // create / update pos-line
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const [xScale, pos_yScale, active_yScale] = buildScales(props.args)

        const pos_line = d3.line()
            .x(d => xScale(d[0]))
            .y(d => pos_yScale(d[1]))

        svgElement.select(".pos-line").selectAll("path")
            .data([data]) // Array with 1 element keyed by index, so enters once then only updates
            .join(
                enter => enter.append("path")
                    .classed(styles.line, true)
                    .attr("d", (d) => pos_line(d))
                    .attr("stroke", "#ffc107")
                    .attr("stroke-width", 1)
                    .attr("fill", "none")
                    .attr("opacity", 0)
                    .call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
                update => update
                    .attr("opacity", 0.2)
                    .call(el =>
                        el.transition().duration(transitionMillisec)
                            .attr("d", (d) => pos_line(d))
                            .attr("opacity", 1)
                    ),
            )
    })

    // Just in case, update height
    useEffect(() => {
        Streamlit.setFrameHeight()
    }, [svgHeight])

    return (
        <div>
            <div className={`${styles.tooltip} tooltip`} />
            <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                ref={svgRef}
            />
        </div>
    )
}

export default withStreamlitConnection(TimeChart)
