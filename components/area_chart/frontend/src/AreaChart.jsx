import React, {useEffect, useState, useRef} from "react";
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

	let staffColor = "#ff006e"
	let studentColor = "#f77f00"
	let totalColor = "blue"

	const groups = props.args.groups;
	const data = JSON.parse(props.args.data).map(d => { 
		let temp_d = {date:new Date( typeof d.date == "string" ? d.date.split('T')[0]+'T12:00:00' : d.date )};
		groups.map(g => temp_d[g] = d[g]);
		return temp_d;
	});
	const margin = {"top": 10, "bottom": 4*parseFloat(axis_font_size)-10, "left": 2*parseFloat(axis_font_size)+30, "right": 3*parseFloat(axis_font_size)};

	const svgRef = useRef(null);
	const transitionMillisec = 1200;

	const tooltipHtml = (student_d, staff_d) => {
		const html = `
				<p>Date: <strong>${formatDate(student_d.data.date)}</strong></p>
				<p>Staff Vaccination Running Count: <strong style='color:${staffColor}'>${formatTooltip(staff_d[1] - student_d[1])}</strong></p>
				<p>Student Vaccination Running Count: <strong style='color:${studentColor}'>${formatTooltip(student_d[1])}</strong></p>
				<p>Total Vaccinations to Date: <strong style='color:${totalColor}'>${formatTooltip(total)}</strong></p>
				`
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
		// svgElement.append("g").classed('student-focus', true);
		// svgElement.append("g").classed('staff-focus', true);
		svgElement.append("rect").classed('box', true);
		groups.map(g => svgElement.append("g").classed(`${g.toLowerCase()}-focus`, true));
	}, [])

	// Build scales, group & stack data, and set colors
	let stackedData = d3.stack()
		.keys(groups)
		(data)
	const total = stackedData.at(-1).at(-1)[1];

	let [xScale, yScale] = buildScales(data, total, svgWidth, svgHeight, margin);

	let colorScale = d3.scaleOrdinal()
		.domain(groups)
		.range(props.args.colors)

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
				.tickSize(5)
				.tickSizeOuter(0)
			)
			.call(g => g.selectAll('text')
				.style("text-anchor", "middle")
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
				.ticks(8,".1s")
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
					.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
				update => update
                    .attr("opacity", 0)
                    .call(el => el.transition().duration(transitionMillisec)
							.attr("d", (d) => stacked_area(d))
							.attr("opacity",1)
                    ),
			);
    })

		// Hook to create / update tooltip and foci
		useEffect(() => {
				const svgElement = d3.select(svgRef.current);
				let tooltip = d3.select(".tooltip");
				let studentFocus = svgElement.select(".students-focus")
				let staffFocus = svgElement.select(".staff-focus")

				svgElement.select(".box")
					.attr("transform", `translate(${margin.left+1}, 0)`)
					.attr("width", svgWidth - margin.right - margin.left)
					.attr("height", svgHeight - margin.bottom)
					.on("mouseover", () => {
						studentFocus.append("line")
							.classed("focusLine", true);
						studentFocus.append("circle")
							.classed("focusCircle", true)
							.attr("r", circleRadius)
							.attr("fill", studentColor);
						studentFocus.classed("hide", false);
						studentFocus.classed("show", true);

						staffFocus.append("line")
							.classed("focusLine", true);
						staffFocus.append("circle")
							.classed("focusCircle", true)
							.attr("r", circleRadius)
							.attr("fill", staffColor);
							staffFocus.classed("hide", false);
							staffFocus.classed("show", true);
					})
					.on("mouseout", () => {
						studentFocus.classed("show", false);
						studentFocus.classed("hide", true);
						staffFocus.classed("show", false);
						staffFocus.classed("hide", true);
						tooltip.classed("show", false);
						tooltip.classed("hide", true);
					})
					.on("mousemove", () => {
						// get mouse x and y position
						let x = d3.event.pageX,
							y = d3.event.pageY,
							x0 = xScale.invert(x),
							i = bisectDate(stackedData[0], x0);
						
						let student_d = null;
						let staff_d = null;
						// bounds check
						if (i <= 0) {
							student_d = stackedData[0][0];
							staff_d = stackedData[1][0];
						}
						else if (i >= stackedData[0].length) {
							student_d = stackedData[0][stackedData[0].length - 1];
							staff_d = stackedData[1][stackedData[1].length - 1];
						}
						else{ 
							// find data points closest to mouse position
							let	student_d0 =stackedData[0][i-1],
								student_d1 = stackedData[0][i],
								staff_d0 = stackedData[1][i-1],
								staff_d1 = stackedData[1][i-1];
							student_d = formatDate(x0) - formatDate(student_d0.data.date) > formatDate(student_d1.data.date) - formatDate(x0) ? student_d1 : student_d0;
							staff_d = formatDate(x0) - formatDate(staff_d0.data.date) > formatDate(staff_d1.data.date) - formatDate(x0) ? staff_d1 : staff_d0;
						}

						studentFocus.select(".focusCircle")
							.attr("cx", xScale(student_d.data.date))
							.attr("cy", yScale(student_d[1]));
						studentFocus.select(".focusLine")
							.attr("x1", xScale(student_d.data.date)).attr("y1", yScale(student_d[0]))
							.attr("x2", xScale(student_d.data.date)).attr("y2", yScale(student_d[1]));
						
						staffFocus.select(".focusCircle")
							.attr("cx", xScale(staff_d.data.date))
							.attr("cy", yScale(staff_d[1]));
						staffFocus.select(".focusLine")
							.attr("x1", xScale(staff_d.data.date)).attr("y1", yScale(staff_d[0]) - circleRadius)
							.attr("x2", xScale(staff_d.data.date)).attr("y2", yScale(staff_d[1]));

						tooltip.html(tooltipHtml(student_d, staff_d));
						let tooltipLeft = xScale(staff_d.data.date) > svgWidth/2 ? xScale(staff_d.data.date) - parseFloat(tooltip.style('width')) - 10 : xScale(staff_d.data.date) + 10;
						let tooltipTop = yScale(staff_d[1]) > svgHeight/2 ? yScale(staff_d[1]) - parseFloat(tooltip.style('height')) : yScale(staff_d[1]);
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

// Format helpers
const formatTooltip = d3.format(',');
const formatDate = d3.timeFormat("%m/%d/%y");
const bisectDate = d3.bisector(function(d) { return d.data.date; }).left;

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