import React, {useEffect, useState, useRef} from "react";
import { Streamlit, withStreamlitConnection,} from "streamlit-component-lib";
import * as d3 from "d3";

import styles from './TimeChart.css';

// Create TimeChart component
const TimeChart = (props) => {

	let aspectRatio = 0.38
	let dimensions = get_client_dimensions();
	const [svgWidth, setWidth ] = useState(dimensions.width);
	if (svgWidth < 600) aspectRatio = 0.68
	const [svgHeight, setHeight ] = useState(aspectRatio*svgWidth);

	Streamlit.setFrameHeight(svgHeight);

	//let label_font_size = "15px";
	let axis_font_size = `${11+5*svgWidth/1000}px`;
	let legend_font_size = `${11+5*svgWidth/1000}px`;
	let  circleRadius = 0.004*svgWidth;

	let posColor = "#f77f00"
	let activeColor = "#ff006e"

	props.args.data =  props.args.data.map(d => [new Date( typeof d[0] == "string" ? d[0].split('T')[0]+'T12:00:00' : d[0]), d[1], d[2]]);
	const data = props.args.data

	const margin = {"top": 50, "bottom": 4*parseFloat(axis_font_size), "left": 3*parseFloat(axis_font_size)-5, "right": 3*parseFloat(axis_font_size)};

	const svgRef = useRef(null);
	const transitionMillisec = 1200;

	const tooltipHtml = (d) => {
		const html = `
				<p>Date: <strong>${formatDate(d[0])}</strong></p>
				<p>Active Cases: <strong style='color:${activeColor}'>${d[2]}</strong></p>
				<p>14-Day Positivity Rate: <strong style='color:${posColor}'>${formatPercent(d[1])}</strong></p>
				`
		return html;
	}

	let [xScale, pos_yScale, active_yScale] = buildScales(data, svgWidth, svgHeight, margin);

	// Set svgHeight and update it on window resize
	useEffect(() => {
		const handleResize = () => {
			let aspectRatio = 0.38
			let dimensions = get_client_dimensions();
			setWidth(dimensions.width);
			if (svgWidth < 600) aspectRatio = 0.68;
			setHeight( aspectRatio*svgWidth );
		}
		
		Streamlit.setFrameHeight(svgHeight);
		d3.select(svgRef.current).style("height", svgHeight);
		window.addEventListener('resize', handleResize)
	}, [svgWidth, svgHeight])

	// On mount, create group containers for circles, path and both axis
	useEffect(() => {
		const svgElement = d3.select(svgRef.current);
		svgElement.append("g").classed('x-axis', true);
		svgElement.append("g").classed('y-axis-pos', true);
		svgElement.append("g").classed('y-axis-active', true);
		svgElement.append("g").classed('active-area', true);
		svgElement.append("g").classed('active-line', true);
		svgElement.append("g").classed('pos-line', true);
		svgElement.append("g").classed('active-circles', true);
		svgElement.append("g").classed('pos-circles', true);
		svgElement.append("g").classed('legend', true);
		svgElement.append("text").classed('active-axis-label', true);
		svgElement.append("text").classed('pos-axis-label', true);
	}, [])

    // Hook to create / update axis and grid
    useEffect(() => {
		const svgElement = d3.select(svgRef.current);
		
		const xAxis = (g) => g.attr("transform", `translate(0, ${svgHeight - margin.bottom})`)
			    .transition().duration(transitionMillisec)
			    .attr("font", "sans-serif")
			    .attr("font-size", axis_font_size)
			    .call(d3.axisBottom(xScale)
				    .ticks(d3.timeWeek)
				    .tickFormat(d3.timeFormat("%b %d"))
				    .tickSize(-1 * (svgHeight - margin.top - margin.bottom))
				    .tickSizeOuter(0))
			    .call(g => g.selectAll('text')
					.style("text-anchor", "end")
					.attr("transform", "rotate(-65)"))
			    .call(g => g.selectAll("path")
					.attr("stroke", "black")
					.attr("stroke-width", 1)
					.attr("stroke-opacity", 1))
			    .call(g => g.selectAll(".tick line")
					.attr("stroke", "black")
					.attr("stroke-opacity", 1)
					.attr("stroke-dasharray", "2,2")
					.attr("stroke-width", 1));
        
		const active_yAxis = (g) => g.attr("transform", `translate(${margin.left}, 0)`)
				.transition().duration(transitionMillisec)
				.attr("font", "sans-serif")
				.attr("font-size", axis_font_size)
				.attr("font-weight", "bold")
				.attr("fill", activeColor)
				.call(d3.axisLeft(active_yScale).ticks(5).tickSize(4))
				.call(g => g.selectAll('text').attr("fill", activeColor))
				.call(g => g.selectAll("path")
						.attr("stroke", "black" )
						.attr("stroke-width", 1)
						.attr("stroke-opacity", 1))
				.call(g => g.selectAll("line")
					    .attr("stroke", "black")
					    .attr("stroke-width", 1)
					    .attr("stroke-opacity", 1));
 //      const active_label = (g) => g.text("Active Cases")
//				   .attr("transform", "rotate(-90)")
//				   .transition().duration(transitionMillisec)
//				   .attr("x", 0 - ((svgWidth - margin.left) / 3.03))
//				   .attr("y", 15)
//				   .style("text-anchor", "middle")
//				   .attr("font", "sans-serif")
//				   .attr("font-size", label_font_size);

        const pos_yAxis = (g) => g.attr("transform", `translate(${svgWidth - margin.right}, 0)`)
				.transition().duration(transitionMillisec)
				.attr("font", "sans-serif")
				.attr("font-size", axis_font_size)
				.attr("font-weight", "bold")
				.attr("fill", posColor)
				.call(d3.axisRight(pos_yScale).ticks(5, ".1%").tickSize(4))
				.call(g => g.selectAll('text')
					    .attr("fill", posColor))
				.call(g => g.selectAll("path")
					    .attr("stroke", "black")
					    .attr("stroke-width", 1)
					    .attr("stroke-opacity", 1))
				.call(g => g.selectAll("line")
					    .attr("stroke", "black")
					    .attr("stroke-width", 1)
					    .attr("stroke-opacity", 1));
//      const pos_label = (g) => g.text("14-Day Positivity Rates")
//				.attr("transform", "rotate(-270)")
//				.transition().duration(transitionMillisec)
//				.attr("x", (svgHeight - margin.bottom) / 2.1)
//				.attr("y", 0 - (svgWidth) + 10)
//				.style("text-anchor", "middle")
//				.attr("font-size", label_font_size);

    svgElement.select(".x-axis").call(xAxis);
    svgElement.select(".y-axis-active").call(active_yAxis);
    // svgElement.select(".active-axis-label").call(active_label);
    svgElement.select(".y-axis-pos").call(pos_yAxis);
    // svgElement.select(".pos-axis-label").call(pos_label);
    })

    // Hook to create / update legend
    useEffect(() => {
    	const svgElement = d3.select(svgRef.current);

    	const keys = ["Active Cases", "14-Day Positivity Rate"];
    	const color = d3.scaleOrdinal()
			.domain(keys)
			.range([activeColor, posColor]);

    	svgElement.select(".legend").selectAll("circle")
			.data(keys)	
			.join(
				enter => enter.append("circle")
					.attr("cx", (d,i) => (1-i)*margin.left + i*(svgWidth - margin.right))
					.attr("cy",  margin.top/2 )
					.attr("r", parseInt(legend_font_size)/2)
					.style("fill", d => color(d))
					.attr("opacity", 0)
					.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
				update => update
					.call(el => el.transition().duration(transitionMillisec)
							.attr("cx", (d,i) => (1-i)*margin.left + i*(svgWidth - margin.right))
							.attr("cy",  margin.top/2 )
							.attr("r", parseFloat(legend_font_size)/2)
							.attr("opacity", 1)
					)
			);
		
		svgElement.select(".legend").selectAll("text")
			.data(keys)
			.join(
				enter => enter.append("text")
					.attr("y", margin.top/2)
					.text(d => d )
					.attr("font-size", legend_font_size)
					.attr("font-weight", "bold")
					.attr("text-anchor", "left")
					.style("alignment-baseline", "middle")
					.style("fill", d => color(d) )
					.call(el => el.attr("x", (d,i) => {
						let x = margin.left + parseFloat(legend_font_size)/2 + 3;
						if (i===1) x = svgWidth - margin.right - parseFloat(legend_font_size)/2 -  el.nodes()[1].getComputedTextLength() - 3
						return x
					})), 
				update => update.call(el => el.transition().duration(transitionMillisec)
					.attr("y", margin.top/2)
					.attr("font-size", legend_font_size)
					.attr("x", (d,i) => {
						let x = margin.left + parseFloat(legend_font_size)/2 + 3;
						if (i===1) x = svgWidth - margin.right - parseFloat(legend_font_size)/2 - el.nodes()[1].getComputedTextLength() - 3;
						return x
					}))
			);
    })


    // create / update active-area
    useEffect(() => {
		const svgElement = d3.select(svgRef.current);

		const active_area = d3.area()
			.x(d => xScale(d[0]))
			.y0(active_yScale(0))
			.y1(d => active_yScale(d[2]));

		svgElement.select(".active-area").selectAll("path")
			.data([data]) // Array with 1 element keyed by index, so enters once then only updates
			.join(
				enter => enter.append("path")
					.classed(styles.area, true)
					.attr("d", (d) => active_area(d))
					.attr("fill", activeColor)
					.attr("fill-opacity", 0.3)
					.attr("opacity", 0)
					.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
				update => update
                    .attr("opacity", 0)
                    .call(el => el.transition().duration(transitionMillisec)
							.attr("d", (d) => active_area(d))
							.attr("opacity",1)
                    ),
			);
    })

    // create / update active-line
    useEffect(() => {
		const svgElement = d3.select(svgRef.current);

		const active_line = d3.line()
			.x(d => xScale(d[0]))
			.y(d => active_yScale(d[2]));

		svgElement.select(".active-line").selectAll("path")
			.data([data]) // Array with 1 element keyed by index, so enters once then only updates
			.join(
				enter => enter.append("path")
					.classed(styles.line, true)
					.attr("d", (d) => active_line(d))
					.attr("stroke", activeColor)
					.attr("stroke-width", 2)
					.attr("fill", "none")
					.attr("opacity", 0)
					.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
				update => update
                    .attr("opacity", 0)
                    .call(el => el.transition().duration(transitionMillisec)
                        	.attr("d", (d) => active_line(d))
                        	.attr("opacity", 1)
                    ),
			);
    })

    // create / update pos-line
    useEffect(() => {
		const svgElement = d3.select(svgRef.current);

		const pos_line = d3.line()
			.x(d => xScale(d[0]))
			.y(d => pos_yScale(d[1]));
	
    	svgElement.select(".pos-line").selectAll("path")
			.data([data]) // Array with 1 element keyed by index, so enters once then only updates
			.join(
				enter => enter.append("path")
					.classed(styles.line, true)
					.attr("d", (d) => pos_line(d))
					.attr("stroke", posColor)
					.attr("stroke-width", 2)
					.attr("fill", "none")
					.attr("opacity", 0)
					.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
				update => update
                	.attr("opacity", 0)
                	.call(el => el.transition().duration(transitionMillisec)
							.attr("d", (d) => pos_line(d))
                    		.attr("opacity", 1)
					),
			);
    })

    // Hook to create / update active-circles
    useEffect(() => {
    	const svgElement = d3.select(svgRef.current);
    	let tooltip = d3.select(".tooltip");
	
    	svgElement.select(".active-circles").selectAll("circle")
			.data(data)
			.join(
				enter => (enter.append("circle")
		    		// Bind each circle to [x,y] coordinate
					.classed("circle", true)
					.attr("cx", (d) => xScale(d[0]))
					.attr("cy", (d) => active_yScale(d[2]))
					.attr("fill", activeColor)
					.attr("r", 0)
		    		// Transition from invisible to visible circle
					.call(el => el.transition().duration(transitionMillisec).attr("r", circleRadius))
					// Add d3 mouseover to display and move tooltip around
					.on("mouseover", (d) => {
						tooltip.html(tooltipHtml(d));
						let tooltipLeft = d3.event.pageX > svgWidth/2 ? d3.event.pageX - parseFloat(tooltip.style('width')) : d3.event.pageX;
						let tooltipTop = d3.event.pageY > svgHeight/2 ? d3.event.pageY - parseFloat(tooltip.style('height')) : d3.event.pageY;
						tooltip.style("left", `${tooltipLeft}px` ).style("top", `${tooltipTop}px`);
						tooltip.classed("hide", false);
						tooltip.classed("show", true);
					})
					.on("mouseout", (d) => {
						tooltip.classed("show", false);
						tooltip.classed("hide", true);
					})
				),
				update => update.call(el =>
					// If circle has not changed coordinates, maybe data scale changed
					// so transition from original position to new position
					el.transition().duration(transitionMillisec)
						.attr("cx", (d) => xScale(d[0]))
						.attr("cy", (d) => active_yScale(d[2]))
		      			// NB : keep radius value, it seems in Streamlit lifecycle there are 2 renders when mounting ?
						// so circles enter and during transition to full radius rerender
		    			// so if r < circleRadius while update then animation breaks and circle stay small for first render
						.attr("r", circleRadius)
						.attr("fill", activeColor)
				),
				exit => (exit.dispatch("mouseout")
					.on("mouseover", null)
					.on("mouseout", null)
					// Transition from visible to invisible circle then remove entirely
					.call(el => el.transition().duration(transitionMillisec / 2)
							.attr("r", 0)
							.attr("fill", activeColor)
							.style("opacity", 0)
							.remove()
					)
				),
			);
    })

    // Hook to create / update pos-circles
    useEffect(() => {
		const svgElement = d3.select(svgRef.current);
		let tooltip = d3.select(".tooltip");

		svgElement.select(".pos-circles").selectAll("circle")
			.data(data)
			.join(
				enter => (enter.append("circle")
                	// Bind each circle to [x,y] coordinate
					.classed("circle", true)
					.attr("cx", (d) => xScale(d[0]))
					.attr("cy", (d) => pos_yScale(d[1]))
					.attr("fill", posColor)
					.attr("r", 0)
                    // Transition from invisible to visible circle
					.call(el => el.transition().duration(transitionMillisec).attr("r", circleRadius))
                    // Add d3 mouseover to display and move tooltip around
					.on("mouseover", (d) => {
						let tooltipLeft = d3.event.pageX > svgWidth/2 ? d3.event.pageX - parseFloat(tooltip.style('width')) : d3.event.pageX;
						let tooltipTop = d3.event.pageY > svgHeight/2 ? d3.event.pageY - parseFloat(tooltip.style('height')) : d3.event.pageY;
						tooltip.style("left", `${tooltipLeft}px` ).style("top", `${tooltipTop}px`);
						tooltip.html(tooltipHtml(d));
						tooltip.classed("hide", false);
						tooltip.classed("show", true);
					})
					.on("mouseout", (d) => {
						tooltip.classed("show", false);
						tooltip.classed("hide", true);
					})
				),
				update => update.call(el =>
					// If circle has not changed coordinates, maybe data scale changed
					// so transition from original position to new position
					el.transition().duration(transitionMillisec)
						.attr("cx", (d) => xScale(d[0]))
                    	.attr("cy", (d) => pos_yScale(d[1]))
                      	// NB : keep radius value, it seems in Streamlit lifecycle there are 2 renders when mounting ?
                      	// so circles enter and during transition to full radius rerender
                      	// so if r < circleRadius while update then animation breaks and circle stay small for first render
                    	.attr("r", circleRadius)
                    	.attr("fill", posColor)
				),
				exit => (exit.dispatch("mouseout")
					.on("mouseover", null)
					.on("mouseout", null)
                    // Transition from visible to invisible circle then remove entirely
					.call(el => el.transition().duration(transitionMillisec / 2)
							.attr("r", 0)
                            .attr("fill", posColor)
                            .style("opacity", 0)
                            .remove())
				),
			);
    })

    return (
		<div className="timechart-container">
		<div className='tooltip hide' />
		<svg className="timechart-svg" ref={svgRef}  />
		</div>
    )   
}

// Build D3 scales from data
const buildScales = (data, svgWidth, svgHeight, margin) => {
	const xScale = d3.scaleTime()
		.domain(d3.extent(data, (d) => d[0]))
		.range([margin.left, svgWidth - margin.right]);
	const pos_yScale = d3.scaleLinear()
		.domain([0, d3.max(data, (d) => d[1])])
		.range([svgHeight - margin.bottom, margin.top]);
	const active_yScale = d3.scaleLinear()
		.domain([0, d3.max(data, (d) => d[2])])
		.range([svgHeight - margin.bottom, margin.top]);

	return [xScale, pos_yScale, active_yScale]
}

// Format helpers
const formatDate = d3.timeFormat("%m/%d/%y");
const formatPercent = d3.format(".2%");

 // Get client's window dimensions
function get_client_dimensions() {
	let clientsWidth = 0, clientsHeight = 0;
	if( typeof( window.innerWidth ) == 'number' ) {
		//Non-IE
		clientsWidth = window.innerWidth;
		clientsHeight = window.innerHeight;
	} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    	//IE 6+ in 'standards compliant mode'
		clientsWidth = document.documentElement.clientWidth;
		clientsHeight = document.documentElement.clientHeight;
	} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
		//IE 4 compatible
		clientsWidth = document.body.clientWidth;
		clientsHeight = document.body.clientHeight;
	}

	return {'width':clientsWidth, 'height': clientsHeight };
}

// Export component  
export default withStreamlitConnection(TimeChart)