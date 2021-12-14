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

	props.args.data =  props.args.data.map(d => [new Date( typeof d[0] == "string" ? d[0].split('T')[0]+'T12:00:00' : d[0]), d[1], d[2]]);
	const data = props.args.data.map(d => {return({ date: d[0], Students: d[1], Staff: d[2] })});
	const margin = {"top": 10, "bottom": 4*parseFloat(axis_font_size)-10, "left": 2*parseFloat(axis_font_size)+30, "right": 3*parseFloat(axis_font_size)};

	const svgRef = useRef(null);
	const transitionMillisec = 1200;

	const tooltipHtml = (d, group, color) => {
		const html = `
				<p>Date: <strong>${formatDate(d.data.date)}</strong></p>
				<p>${group} Vaccination Count: <strong style='color:${color}'>${d[1]}</strong></p>
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
		svgElement.append("g").classed('student-focus', true);
		svgElement.append("g").classed('staff-focus', true);
		svgElement.append("rect").classed('box', true);
		svgElement.append("g").classed('staff-circles', true);
		svgElement.append("g").classed('student-circles', true);
	}, [])

	// Build scales, group & stack data, and set colors
	let [xScale, yScale] = buildScales(data, svgWidth, svgHeight, margin);
	let keys = ["Students", "Staff"]
	let stackedData = d3.stack()
		.keys(keys)
		(data)
	console.log("Stacked data: ", stackedData)
		let color = d3.scaleOrdinal()
			.domain(keys)
			.range([studentColor,staffColor])

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
				.tickSize(1)
				.tickSizeOuter(0)
			)
			.call(g => g.selectAll('text')
				.style("text-anchor", "end")
				// .attr("transform", "rotate(-65)")
			)
			.call(g => g.selectAll("path")
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("stroke-opacity", 1)
			)
			.call(g => g.selectAll(".tick line")
				.attr("stroke", "black")
				.attr("stroke-opacity", 1)
				.attr("stroke-dasharray", "2,2")
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

			svgElement.select(".legend").selectAll("circle")
			.data(keys)	
			.join(
				enter => enter.append("circle")
					.attr("cx", margin.left + 20)
					.attr("cy", (d,i) => ((1-i)*(margin.top/2) + 17) + (30*i))
					.attr("r", parseInt(legend_font_size)/2)
					.style("fill", d => color(d))
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
			.data(keys)
			.join(
				enter => enter.append("text")
					.attr("x", margin.left + parseFloat(legend_font_size)/2 + 25)
					.text(d => d )
					.attr("font-size", legend_font_size)
					.attr("font-weight", "bold")
					.attr("text-anchor", "left")
					.style("alignment-baseline", "middle")
					.style("fill", d => color(d) )
					.call(el => el.attr("y", (d,i) => ((1-i)*(margin.top/2) + 17) + (30*i) + 1)), 
				update => update.call(el => el.transition().duration(transitionMillisec)
					.attr("x", margin.left + parseFloat(legend_font_size)/2 + 25)
					.attr("font-size", legend_font_size)
					.attr("y", (d,i) => ((1-i)*(margin.top/2) + 17) + (30*i) + 1)
				)
			);
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
					.attr("fill", function(d) { return color(d.key); })
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

		// Hook to create / update tooltip
		useEffect(() => {
				const svgElement = d3.select(svgRef.current);

				let studentFocus = svgElement.select(".student-focus")

				svgElement.select(".box")
						.classed("overlay", true)
						.attr("width", svgWidth - margin.right)
						.attr("height", svgHeight - margin.bottom)
						.on("mouseover", () => {
							studentFocus.append("circle")
								.attr("r", circleRadius)
								.attr("fill", studentColor);
							studentFocus.classed("hide", false);
							studentFocus.classed("show", true);
						})
						.on("mouseout", () => {
							studentFocus.classed("show", false);
							studentFocus.classed("hide", true);
						})
						.on("mousemove", () => {
							let x = d3.event.pageX,
								x0 = xScale.invert(x),
								i = bisectDate(stackedData[0], x0),
								d0 = stackedData[0][i - 1],
								d1 = stackedData[0][i],
								d = formatDate(x0) - formatDate(d0.data.date) > formatDate(d1.data.date) - formatDate(x0) ? d1 : d0;

							studentFocus.attr("transform", `translate(${xScale(d.data.date)}, ${yScale(d[1])})`);
						})
		});

    // Hook to create / update student-circles
    // useEffect(() => {
		// 	const svgElement = d3.select(svgRef.current);
		// 	let tooltip = d3.select(".tooltip");
			
		// 	svgElement.select(".student-circles").selectAll("circle")
		// 	.data(stackedData[0])
		// 	.join(
		// 		enter => (enter.append("circle")
		//     	// Bind each circle to [x,y] coordinate
		// 			.classed("circle", true)
		// 			.attr("cx", (d) => xScale(d.data.date))
		// 			.attr("cy", (d) => yScale(d[1]))
		// 			.attr("fill", studentColor)
		// 			.attr("r", 0)
		//     	// Transition from invisible to visible circle
		// 			.call(el => el.transition().duration(transitionMillisec).attr("r", circleRadius))
		// 			// Add d3 mouseover to display and move tooltip around
		// 			.on("mouseover", (d) => {
		// 				tooltip.html(tooltipHtml(d, "Student", studentColor));
		// 				let tooltipLeft = d3.event.pageX > svgWidth/2 ? d3.event.pageX - parseFloat(tooltip.style('width')) : d3.event.pageX;
		// 				let tooltipTop = d3.event.pageY > svgHeight/2 ? d3.event.pageY - parseFloat(tooltip.style('height')) : d3.event.pageY;
		// 				tooltip.style("left", `${tooltipLeft}px` ).style("top", `${tooltipTop}px`);
		// 				tooltip.classed("hide", false);
		// 				tooltip.classed("show", true);
		// 			})
		// 			.on("mouseout", () => {
		// 				tooltip.classed("show", false);
		// 				tooltip.classed("hide", true);
		// 			})
		// 		),
		// 		update => update.call(el => el.transition().duration(transitionMillisec)
		// 			.attr("cx", (d) => xScale(d.data.date))
		// 			.attr("cy", (d) => yScale(d[1]))
		// 			.attr("r", circleRadius)
		// 			.attr("fill", studentColor)
		// 		),
		// 		exit => (exit.dispatch("mouseout")
		// 			.on("mouseover", null)
		// 			.on("mouseout", null)
		// 			// Transition from visible to invisible circle then remove entirely
		// 			.call(el => el.transition().duration(transitionMillisec / 2)
		// 					.attr("r", 0)
		// 					.attr("fill", studentColor)
		// 					.style("opacity", 0)
		// 					.remove()
		// 			)
		// 		),
		// 	);
    // })

    // // Hook to create / update staff-circles
    // useEffect(() => {
		// const svgElement = d3.select(svgRef.current);
		// let tooltip = d3.select(".tooltip");

		// svgElement.select(".staff-circles").selectAll("circle")
		// 	.data(stackedData[1])
		// 	.join(
		// 		enter => (enter.append("circle")
    //       // Bind each circle to [x,y] coordinate
		// 			.classed("circle", true)
		// 			.attr("cx", (d) => xScale(d.data.date))
		// 			.attr("cy", (d) => yScale(d[1]))
		// 			.attr("fill", staffColor)
		// 			.attr("r", 0)
		// 			// Transition from invisible to visible circle
		// 			.call(el => el.transition().duration(transitionMillisec).attr("r", circleRadius))
		// 			// Add d3 mouseover to display and move tooltip around
		// 			.on("mouseover", (d) => {
		// 				let tooltipLeft = d3.event.pageX > svgWidth/2 ? d3.event.pageX - parseFloat(tooltip.style('width')) : d3.event.pageX;
		// 				let tooltipTop = d3.event.pageY > svgHeight/2 ? d3.event.pageY - parseFloat(tooltip.style('height')) : d3.event.pageY;
		// 				tooltip.style("left", `${tooltipLeft}px` ).style("top", `${tooltipTop}px`);
		// 				tooltip.html(tooltipHtml(d, "Staff", staffColor));
		// 				tooltip.classed("hide", false);
		// 				tooltip.classed("show", true);
		// 			})
		// 			.on("mouseout", () => {
		// 				tooltip.classed("show", false);
		// 				tooltip.classed("hide", true);
		// 			})
		// 		),
		// 		update => update.call(el => el.transition().duration(transitionMillisec)
		// 			.attr("cx", (d) => xScale(d.data.date))
		// 			.attr("cy", (d) => yScale(d[1]))
		// 			.attr("r", circleRadius)
		// 			.attr("fill", staffColor)
		// 		),
		// 		exit => (exit.dispatch("mouseout")
		// 			.on("mouseover", null)
		// 			.on("mouseout", null)
    //       // Transition from visible to invisible circle then remove entirely
		// 			.call(el => el.transition().duration(transitionMillisec / 2)
		// 					.attr("r", 0)
		// 					.attr("fill", staffColor)
		// 					.style("opacity", 0)
		// 					.remove())
		// 		),
		// 	);
    // })

    return (
		<div className="areachart-container">
		<div className='tooltip hide' />
		<svg className="areachart-svg" ref={svgRef}  />
		</div>
    )   
}

// Build D3 scales from data
const buildScales = (data, svgWidth, svgHeight, margin) => {
	const xScale = d3.scaleTime()
		.domain(d3.extent(data, (d) => d.date))
		.range([margin.left, svgWidth - margin.right]);
	const yScale = d3.scaleLinear()
		.domain([0,d3.max(data, (d) => d.Students) + d3.max(data, (d) => d.Staff)])
		.range([svgHeight - margin.bottom, margin.top]);

	return [xScale, yScale]
}

// Format helpers
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