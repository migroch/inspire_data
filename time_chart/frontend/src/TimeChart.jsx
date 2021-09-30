import React, {useEffect, useRef} from "react"
import {ComponentProps, Streamlit, withStreamlitConnection,} from "./streamlit"
import * as d3 from "d3";

import styles from './TimeChart.css'
import { act } from "react-dom/test-utils";


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
        svgElement.append("g").classed('pos-circles', true)
        svgElement.append("g").classed('active-circles', true)
        svgElement.append("g").classed('active-area', true)
        svgElement.append("g").classed('pos-line', true)
        svgElement.append("g").classed('x-axis', true)
        svgElement.append("g").classed('y-axis-pos', true)
        svgElement.append("g").classed('y-axis-active', true)
        svgElement.append("text").classed('active-label', true)
    }, [])

    // Hook to create / update axis and grid
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const [xScale, pos_yScale, active_yScale] = buildScales(props.args)

        const xAxis = (g) => g.attr("transform", `translate(0, ${svgHeight - margin.bottom})`)
            .transition().duration(transitionMillisec)
            .call(d3.axisBottom(xScale).ticks().tickSize(-1 * (svgHeight - margin.top - margin.bottom)).tickSizeOuter(0))
        const active_yAxis = (g) => g.attr("transform", `translate(${margin.left}, 0)`)
            .transition().duration(transitionMillisec)
            .call(d3.axisLeft(active_yScale))
        const active_label = (label) => label.attr("transform", "rotate(-90)")
            .attr("x", 0 - margin.left)
            .attr("y", 0 - (svgHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Active Cases")
        const pos_yAxis = (g) => g.attr("transform", `translate(${svgWidth - margin.right}, 0)`)
            .transition().duration(transitionMillisec)
            .call(d3.axisRight(pos_yScale))

        svgElement.select(".x-axis").call(xAxis);
        svgElement.select(".y-axis-active").call(active_yAxis);
        svgElement.select(".active-label").call(active_label);
        svgElement.select(".y-axis-pos").call(pos_yAxis);
    })

    // Hook to create / update pos-circles
    // useEffect(() => {
    //     const svgElement = d3.select(svgRef.current)
    //     const [xScale, pos_yScale, active_yScale] = buildScales(props.args)

    //     svgElement.select(".pos-circles").selectAll("circle")
    //         .data(data, (d) => d)
    //         .join(
    //             enter => (
    //                 enter.append("circle")
    //                     // Bind each circle to [x,y] coordinate
    //                     .classed(styles.circle, true)
    //                     .attr("cx", (d) => xScale(d[0]))
    //                     .attr("cy", (d) => pos_yScale(d[1]))
    //                     .attr("fill", circleColor)
    //                     .attr("r", 0)
    //                     // Transition from invisible to visible circle
    //                     .call(el => el.transition().duration(transitionMillisec).attr("r", circleRadius))
    //                     // Add d3 mouseover to display and move tooltip around
    //                     .on("mouseover", (d, i, ns) => {
    //                         const [x, y] = d3.mouse(ns[i])
    //                         d3.select(".tooltip")
    //                             .attr("hidden", null)
    //                             .style("left", `${x}px`)
    //                             .style("top", `${y}px`)
    //                             .text(`Data : ${d}`)
    //                     })
    //                     .on("mouseout", _ => {
    //                         d3.select(".tooltip").attr("hidden", true)
    //                     })
    //             ),
    //             update => update.call(el =>
    //                 // If circle has not changed coordinates, maybe data scale changed
    //                 // so transition from original position to new position
    //                 el.transition().duration(transitionMillisec)
    //                     .attr("cy", (d) => pos_yScale(d[1]))
    //                     // NB : keep radius value, it seems in Streamlit lifecycle there are 2 renders when mounting ?
    //                     // so circles enter and during transition to full radius rerender
    //                     // so if r < circleRadius while update then animation breaks and circle stay small for first render
    //                     .attr("r", circleRadius)
    //                     .attr("fill", circleColor)
    //             ),
    //             exit => (
    //                 // Close tooltip and remove mouse events
    //                 exit.dispatch("mouseout")
    //                     .on("mouseover", null)
    //                     .on("mouseout", null)
    //                     // Transition from visible to invisible circle then remove entirely
    //                     .call(el =>
    //                         el.transition().duration(transitionMillisec / 2)
    //                             .attr("r", 0)
    //                             .attr("fill", "tomato")
    //                             .style("opacity", 0)
    //                             .remove()
    //                     )
    //             ),
    //         )
    // })

    // Hook to create / update active-circles
    // useEffect(() => {
    //     const svgElement = d3.select(svgRef.current)
    //     const [xScale, pos_yScale, active_yScale] = buildScales(props.args)

    //     svgElement.select(".active-circles").selectAll("circle")
    //         .data(data, (d) => d)
    //         .join(
    //             enter => (
    //                 enter.append("circle")
    //                     // Bind each circle to [x,y] coordinate
    //                     .classed(styles.circle, true)
    //                     .attr("cx", (d) => xScale(d[0]))
    //                     .attr("cy", (d) => active_yScale(d[3]))
    //                     .attr("fill", "#ED647C")
    //                     .attr("r", 0)
    //                     // Transition from invisible to visible circle
    //                     .call(el => el.transition().duration(transitionMillisec).attr("r", 3))
    //                     // Add d3 mouseover to display and move tooltip around
    //                     .on("mouseover", (d, i, ns) => {
    //                         const [x, y] = d3.mouse(ns[i])
    //                         d3.select(".tooltip")
    //                             .attr("hidden", null)
    //                             .style("left", `${x}px`)
    //                             .style("top", `${y}px`)
    //                             .text(`Data : ${d}`)
    //                     })
    //                     .on("mouseout", _ => {
    //                         d3.select(".tooltip").attr("hidden", true)
    //                     })
    //             ),
    //             update => update.call(el =>
    //                 // If circle has not changed coordinates, maybe data scale changed
    //                 // so transition from original position to new position
    //                 el.transition().duration(transitionMillisec)
    //                     .attr("cy", (d) => active_yScale(d[3]))
    //                     // NB : keep radius value, it seems in Streamlit lifecycle there are 2 renders when mounting ?
    //                     // so circles enter and during transition to full radius rerender
    //                     // so if r < circleRadius while update then animation breaks and circle stay small for first render
    //                     .attr("r", 3)
    //                     .attr("fill", "#ED647C")
    //             ),
    //             exit => (
    //                 // Close tooltip and remove mouse events
    //                 exit.dispatch("mouseout")
    //                     .on("mouseover", null)
    //                     .on("mouseout", null)
    //                     // Transition from visible to invisible circle then remove entirely
    //                     .call(el =>
    //                         el.transition().duration(transitionMillisec / 2)
    //                             .attr("r", 0)
    //                             .attr("fill", "tomato")
    //                             .style("opacity", 0)
    //                             .remove()
    //                     )
    //             ),
    //         )
    // })

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
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", "#ababab")
                    .attr("opacity", 0.3)
                    .call(el => el.transition().duration(transitionMillisec).attr("opacity", 0.3)),
                update => update
                    .attr("opacity", 0.3)
                    .call(el =>
                        el.transition().duration(transitionMillisec)
                            .attr("d", (d) => active_area(d))
                            .attr("opacity", 1)
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
            <div className={`${styles.tooltip} tooltip`} hidden={true}/>
            <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                ref={svgRef}
            />
        </div>
    )
}

export default withStreamlitConnection(TimeChart)
