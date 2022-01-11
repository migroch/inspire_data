import React, {useEffect, useState, useRef} from "react";
import {renderToString} from "react-dom/server";
import { Streamlit, withStreamlitConnection,} from "streamlit-component-lib";
import * as d3 from "d3";

import styles from './AreaChart.css';
import { svg } from "d3";
import { format } from "path";

// Create AreaChart component
const AreaChart = (props) => {

	let aspectRatio = 0.38
	let dimensions = get_client_dimensions();
	const [svgWidth, setWidth ] = useState(dimensions.width);
	if (svgWidth < 600) aspectRatio = 0.68
	const [svgHeight, setHeight ] = useState(aspectRatio*svgWidth);

	Streamlit.setFrameHeight(svgHeight);

	//let label_font_size = "15px";
	let axis_font_size = `${11+5*svgWidth/1000}px`;
	let legend_font_size = `${11+5*svgWidth/1000}px`;
	let  circleRadius = 0.003*svgWidth;
	let margin = {"top": 10, "bottom": 4*parseFloat(axis_font_size)-10, "left": 2*parseFloat(axis_font_size)+30, "right": 3*parseFloat(axis_font_size)};

	const groups = props.args.groups;
	const colors = props.args.colors;
	const data = JSON.parse(props.args.data).map(d => { 
		let temp_d = {date:new Date( typeof d.date == "string" ? d.date.split('T')[0]+'T12:00:00' : d.date )};
		groups.map(g => temp_d[g] = d[g]);
		return temp_d;
	});

	// Build scales, group & stack data, and set colors
	let stackedData = d3.stack()
		.keys(groups)
		(data)
	//const total = stackedData.at(-1).at(-1)[1];
	const total = stackedData.slice(-1)[0].slice(-1)[0][1];
	let [xScale, yScale] = buildScales(data, total, svgWidth, svgHeight, margin);
	let colorScale = d3.scaleOrdinal()
		.domain(groups)
		.range(props.args.colors)
	const totalColor = '#F77F00'

	const svgRef = useRef(null);
	const transitionMillisec = 1200;

	// Create tooltip html
	const tooltip_html = (tooltip_data) => {
		let total_thisdate = groups.reduce((acc, g) => acc + tooltip_data[g], 0);
		let html = renderToString(
			<div className=".tooltip">	
				<p>Date: <strong>{formatDate(tooltip_data.date)}</strong></p>
				{
					groups.map(g => <p key={g} style={{color:colorScale(g)}}>{g}: <strong>{formatTooltip(tooltip_data[g])}</strong></p>)
				}
				<p style={{color:totalColor}}>Total: <strong>{formatTooltip(total_thisdate)}</strong></p>
			</div>
		)
		return html;
	}
	
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

	// On mount, create group containers
	useEffect(() => {
		const svgElement = d3.select(svgRef.current);
		svgElement.append("g").classed('x-axis', true);
		svgElement.append("g").classed('y-axis', true);
		svgElement.append("g").classed('stacked-area', true);
		svgElement.append("g").classed('legend', true);
		svgElement.append("rect").classed('box', true);
		groups.forEach(g => svgElement.append("g").classed(`${g.toLowerCase().split(' ')[0]}-focus`, true));
	}, [])

    // Hook to create / update axis and grid
    useEffect(() => {
		const svgElement = d3.select(svgRef.current);
		
		const xAxis = (g) => g.attr("transform", `translate(0, ${svgHeight - margin.bottom})`)
			.transition().duration(transitionMillisec)
			.attr("font", "sans-serif")
			.attr("font-size", axis_font_size)
			.call(d3.axisBottom(xScale)
				.ticks(d3.timeMonth)
				.tickFormat(d3.timeFormat("%b %y"))
				.tickSize(5)
				.tickSizeOuter(0)
			)
			.call(g => g.selectAll('text')
				.style("text-anchor", "end")
				.attr("transform", "rotate(-65)")
			)
			.call(g => g.selectAll("path")
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("stroke-opacity", 1)
			)
			.call(g => g.selectAll(".tick line")
				.attr("stroke", "black")
				.attr("stroke-opacity", 1)
				.attr("stroke-width", 1)
			);
        
		const yAxis = (g) => g.attr("transform", `translate(${margin.left}, 0)`)
			.transition().duration(transitionMillisec)
			.attr("font", "sans-serif")
			.attr("font-size", axis_font_size)
			.call(d3.axisLeft(yScale)
				.ticks(8,".0s")
				.tickSize(-1 * (svgWidth - margin.right - margin.left))
				.tickSizeOuter(0)
			)
			.call(g => g.selectAll('text'))
			.call(g => g.selectAll("path")
				.attr("stroke", "black" )
				.attr("stroke-width", 1)
				.attr("stroke-opacity", 1)
			)
			.call(g => g.selectAll("line")
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("stroke-opacity", 1)
			)
			.call(g => g.selectAll(".tick line")
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("stroke-opacity", 0.25)
				.attr("stroke-dasharray", "2,2")
			);

    svgElement.select(".x-axis").call(xAxis);
    svgElement.select(".y-axis").call(yAxis);
    })

    // Hook to create / update legend
    useEffect(() => {
			const svgElement = d3.select(svgRef.current);
			groups.reverse()
			svgElement.select(".legend").selectAll("circle")
			.data(groups)	
			.join(
				enter => enter.append("circle")
					.attr("cx", margin.left + 20)
					.attr("cy", (d,i) => ((1-i)*(margin.top/2) + 17) + (30*i))
					.attr("r", parseInt(legend_font_size)/2)
					.style("fill", d => colorScale(d))
					.attr("opacity", 0)
					.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
				update => update
					.call(el => el.transition().duration(transitionMillisec)
						.style("fill", d => colorScale(d))
						.attr("cx", margin.left + 20)
						.attr("cy", (d,i) => ((1-i)*(margin.top/2) + 17) + (30*i))
						.attr("r", parseFloat(legend_font_size)/2)
						.attr("opacity", 1)
					)
			);
		
		svgElement.select(".legend").selectAll("text")
			.data(groups)
			.join(
				enter => enter.append("text")
					.attr("x", margin.left + parseFloat(legend_font_size)/2 + 25)
					.text(d => d )
					.attr("font-size", legend_font_size)
					.attr("font-weight", "bold")
					.attr("text-anchor", "left")
					.style("alignment-baseline", "middle")
					.style("fill", d => colorScale(d) )
					.call(el => el.attr("y", (d,i) => ((1-i)*(margin.top/2) + 17) + (30*i) + 1)), 
				update => update.call(el => el.transition().duration(transitionMillisec)
					.text(d => d )
					.style("fill", d => colorScale(d) )
					.attr("x", margin.left + parseFloat(legend_font_size)/2 + 25)
					.attr("font-size", legend_font_size)
					.attr("y", (d,i) => ((1-i)*(margin.top/2) + 17) + (30*i) + 1)
				)
			);

			groups.reverse();
    })

    // create / update stacked-area
    useEffect(() => {
		const svgElement = d3.select(svgRef.current);

		const stacked_area = d3.area()
			.x((d) => xScale(d.data.date))
			.y0((d) => yScale(d[0]))
			.y1((d) => yScale(d[1]));

		svgElement.select(".stacked-area").selectAll("path")
			.data(stackedData) // Array with 1 element keyed by index, so enters once then only updates
			.join(
				enter => enter.append("path")
					.classed(styles.area, true)
					.attr("d", (d) => stacked_area(d))
					.attr("fill", function(d) { return colorScale(d.key); })
					.attr("fill-opacity", 0.3)
					.attr("opacity", 0)
					.call(el => el.transition().duration(transitionMillisec)
						.attr("fill-opacity", 0.7)
						.attr("opacity", 1)
					),
				update => update
					.attr("fill", function(d) { return colorScale(d.key); })
                    .attr("fill-opacity", 0.3)
					.attr("opacity", 0)
                    .call(el => el.transition().duration(transitionMillisec)
							.attr("d", (d) => stacked_area(d))
							.attr("fill-opacity",0.75)
							.attr("opacity", 1)
                    ),
			);
    })

	// Hook to create / update tooltip and foci
	useEffect(() => {
		const svgElement = d3.select(svgRef.current);
		let tooltip = d3.select(".tooltip");

		svgElement.select(".box")
			.attr("transform", `translate(${margin.left+1}, 0)`)
			.attr("width", svgWidth - margin.right - margin.left)
			.attr("height", svgHeight - margin.bottom)
			.on("mouseover", () => {
				groups.forEach(g => {
					let focus_el = svgElement.select(`.${g.toLowerCase().split(' ')[0]}-focus`)
					focus_el.append("line").classed("focusLine", true);
					focus_el.append("circle")
						.classed("focusCircle", true)
						.attr("r", circleRadius)
						.attr("fill", colorScale(g));
					focus_el.classed("hide", false);
					focus_el.classed("show", true);
				})
			})
			.on("mouseout", () => {
				groups.forEach(g => {
					let focus_el = svgElement.select(`.${g.toLowerCase().split(' ')[0]}-focus`)							
					focus_el.classed("show", false);
					focus_el.classed("hide", true);
				})
				tooltip.classed("show", false);
				tooltip.classed("hide", true);
			})
			.on("mousemove", () => {
				// Get date and group values data from the first group in stackedData 
				let g0_data = stackedData[0].map(d => d.data); 
				let tooltip_data = {};

				// get mouse x and y position
				let x = d3.event.pageX,
					y = d3.event.pageY,
					x0 = xScale.invert(x),
					i = bisectDate(g0_data, x0);

				i = i < 0 ? 0 : i;
				i = i > g0_data.length - 1 ? g0_data.length - 1 : i;

				let d0 = g0_data[i - 1], d1 = g0_data[i]
				tooltip_data = formatDate(x0) - formatDate(d0.date) > formatDate(d1.date) - formatDate(x0) ? d1 : d0;	
				if (i == 0) tooltip_data = d0;
				if (i == g0_data.length - 1) tooltip_data = d1;
							
				groups.forEach((g,j) => {
					let focus_el = svgElement.select(`.${g.toLowerCase().split(' ')[0]}-focus`);
					let date = tooltip_data.date;
					let values = stackedData[j][i];
					focus_el.select(".focusCircle")
						.attr("cx", xScale(date))
						.attr("cy", yScale(values[1]));
					focus_el.select(".focusLine")
						.attr("x1", xScale(date)).attr("y1", yScale(values[0]))
						.attr("x2", xScale(date)).attr("y2", yScale(values[1]))
						.attr("fill", 'black')
						.attr("stroke", 'black');					
				});

				tooltip.html(tooltip_html(tooltip_data))
				let tooltipLeft = x > svgWidth/2 ? x - parseFloat(tooltip.style('width')) - 10 : x + 10;
				let tooltipTop = y > svgHeight/2 ? y - parseFloat(tooltip.style('height')) : y;
				tooltip.style("left", `${tooltipLeft}px` ).style("top", `${tooltipTop}px`);
				tooltip.classed("hide", false);
				tooltip.classed("show", true);
			})
	});

    return (
		<div className="areachart-container">
		<div className='tooltip hide' />
		<svg className="areachart-svg" ref={svgRef}  />
		</div>
    )   
}


// Format helpers
const formatTooltip = d3.format(',');
const formatDate = d3.timeFormat("%m/%d/%y");
const bisectDate = d3.bisector( d => d.date).left;

// Build D3 scales from data
const buildScales = (data, total, svgWidth, svgHeight, margin) => {
	const xScale = d3.scaleTime()
		.domain(d3.extent(data, (d) => d.date))
		.range([margin.left, svgWidth - margin.right]);
	const yScale = d3.scaleLinear()
		.domain([0,total])
		.range([svgHeight - margin.bottom, margin.top]);

	return [xScale, yScale]
}

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
export default withStreamlitConnection(AreaChart)