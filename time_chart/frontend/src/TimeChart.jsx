import React, {useEffect, useRef} from "react"
import {ComponentProps, Streamlit, withStreamlitConnection,} from "./streamlit"
import * as d3 from "d3";

import styles from './TimeChart.css'


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

    return [xScale, yScale]
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
        svgElement.append("g").classed('circles', true)
        svgElement.append("g").classed('line', true)
        svgElement.append("g").classed('x-axis', true)
        svgElement.append("g").classed('y-axis', true)
    }, [])

    // Hook to create / update axis
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const [xScale, yScale] = buildScales(props.args)

        const xAxis = (g) => g.attr("transform", `translate(0, ${svgHeight - margin.bottom})`)
            .transition().duration(transitionMillisec)
            .call(d3.axisBottom(xScale))
        const yAxis = (g) => g.attr("transform", `translate(${margin.left}, 0)`)
            .transition().duration(transitionMillisec)
            .call(d3.axisLeft(yScale))

        svgElement.select(".x-axis").call(xAxis);
        svgElement.select(".y-axis").call(yAxis);
    })

    // Hook to create / update circles
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const [xScale, yScale] = buildScales(props.args)

        svgElement.select(".circles").selectAll("circle")
            .data(data, (d) => d)
            .join(
                enter => (
                    enter.append("circle")
                        // Bind each circle to [x,y] coordinate
                        .classed(styles.circle, true)
                        .attr("cx", (d) => xScale(d[0]))
                        .attr("cy", (d) => yScale(d[1]))
                        .attr("fill", circleColor)
                        .attr("r", 0)
                        // Transition from invisible to visible circle
                        .call(el => el.transition().duration(transitionMillisec).attr("r", circleRadius))
                        // Add d3 mouseover to display and move tooltip around
                        .on("mouseover", (d, i, ns) => {
                            const [x, y] = d3.mouse(ns[i])
                            d3.select(".tooltip")
                                .attr("hidden", null)
                                .style("left", `${x}px`)
                                .style("top", `${y}px`)
                                .text(`Data : ${d}`)
                        })
                        .on("mouseout", _ => {
                            d3.select(".tooltip").attr("hidden", true)
                        })
                ),
                update => update.call(el =>
                    // If circle has not changed coordinates, maybe data scale changed
                    // so transition from original position to new position
                    el.transition().duration(transitionMillisec)
                        .attr("cy", (d) => yScale(d[1]))
                        // NB : keep radius value, it seems in Streamlit lifecycle there are 2 renders when mounting ?
                        // so circles enter and during transition to full radius rerender
                        // so if r < circleRadius while update then animation breaks and circle stay small for first render
                        .attr("r", circleRadius)
                        .attr("fill", circleColor)
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

    // create / update line
    useEffect(() => {
        const svgElement = d3.select(svgRef.current)
        const [xScale, yScale] = buildScales(props.args)

        const line = d3.line()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]))

        svgElement.select(".line").selectAll("path")
            .data([data]) // Array with 1 element keyed by index, so enters once then only updates
            .join(
                enter => enter.append("path")
                    .attr("d", (d) => line(d))
                    .attr("stroke", "black")
                    .attr("fill", "none")
                    .attr("opacity", 0)
                    .call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
                update => update
                    .attr("opacity", 0.2)
                    .call(el =>
                        el.transition().duration(transitionMillisec)
                            .attr("d", (d) => line(d))
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
