import React, {useEffect, useState, useRef} from "react";
import {ComponentProps, Streamlit, withStreamlitConnection,} from "./streamlit";
import * as d3 from "d3";

import styles from './TimeChart.css';
import { act } from "react-dom/test-utils";
import { type } from "os";

// Create GaugeChart component
const GaugeChart = (props) => {

  	let aspectRatio = 0.38
  	const [svgWidth, setWidth ] = useState(window.innerWidth);
  	const [svgHeight, setHeight ] = useState(aspectRatio*svgWidth);
	let axis_font_size = `${11+5*svgWidth/1000}px`;
  
  	const handleResize = () =>{
    	setWidth(window.innerWidth);
    	setHeight( aspectRatio*svgWidth );
  	}
  	Streamlit.setFrameHeight(svgHeight);

  	const margin = {"top": 50, "bottom": 50, "left": 2*parseFloat(axis_font_size)-5, "right": 3*parseFloat(axis_font_size)};
 
  	const svgRef = useRef(null);
  	const transitionMillisec = 1200;
	
	// Get properties
  	const {data, width, rotation, thickness, arc, ticks, color_scheme, color_step, tick_color, needle_color, key} = props.args
	const pi = Math.PI
	const rad = pi / 180
	const deg = 180 / pi
	
  	// Set svg values
	let needlePercent = data[2],
  		center = setCenter(svgWidth, svgHeight, margin),
		radii = setRadii(svgHeight, margin, thickness),
		angles = setAngles(arc, pi, rotation, rad),
		gauge_ticks = setTicks(angles, ticks, radii, data[1]),
		gradient = setGradient(color_scheme, color_step, angles),
		scales = setScales(radii, angles, data[1]);
	
	console.log(data)
	console.log([angles.start_angle, angles.end_angle])
	console.log(needlePercent)
  	// Set svgHeight and update it on window resize
  	useEffect(() => {
    	Streamlit.setFrameHeight(svgHeight);
    	d3.select(svgRef.current).style("height", svgHeight);
    	window.addEventListener('resize', handleResize)
  	}, [svgWidth, svgHeight])
  
  	// On mount, create group containers for circles, path and both axis
  	useEffect(() => {
    	const svgElement = d3.select(svgRef.current);
    	svgElement.append("g").classed("gauge-container", true);
  	}, [])

	// Hook to create / update gauge 
	useEffect(() => {
		const svgElement = d3.select(svgRef.current);

		const gauge_container = (g) => g.attr("transform", `translate(${center.x}, ${center.y})`)
				.transition().duration(transitionMillisec)

		svgElement.select(".gauge-container").append("g")
				.attr("class", "gauge-arc")
				.selectAll("path")
				.data(gradient)
				.join(
				  	enter => enter.append("path")
							.attr("d", scales.subArcScale)
							.attr("fill", (d) => d.fill)
							.attr("stroke-width", 0.5)
							.attr("stroke", (d) => d.fill)
							.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
				  	update => update
							.attr("opacity", 0)
							.call(el => el.transition().duration(transitionMillisec)
									.attr("d", scales.subArcScale)
									.attr("opacity", 1)),
				);
				
		svgElement.select(".gauge-container").append("g")
				.attr("class", "gauge-ticks")
				.selectAll("path")
				.data(gauge_ticks)
				.join(
					enter => enter.append("g")
							.attr("class", "tick")
							.append("path")
							.attr("d", (d) => scales.lineRadial(d.coordinates))
							.attr("stroke", tick_color)
							.attr("stroke-width", 2)
							.attr("stroke-linecap", "round")
							.attr("fill", "none")
							.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
					update => update
							.attr("opacity", 0)
							.call(el => el.transition().duration(transitionMillisec)
									.attr("d", (d) => scales.lineRadial(d.coordinates))
									.attr("opacity", 1)),
				);

		svgElement.select(".gauge-container").select(".gauge-ticks")
				.selectAll("text")
				.data(gauge_ticks)
				.join(
					enter => enter.append("g")
							.attr("class", "tick-label")
							.append("text")
							.attr("transform", (d) => `translate(${radii.tick_label * Math.sin(d.angle)},
																${-radii.tick_label * Math.cos(d.angle)})
													rotate(${d.angle * deg - pi})`)
							.attr("dy", "0.35em")
							.attr("text-anchor", "middle")
							.attr("font-size", "0.67em")
							.text((d) => d.label)
							.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
					update => update
							.attr("opacity", 0)
							.call(el => el.transition().duration(transitionMillisec)
									.attr("d", (d) => `translate(${radii.tick_label * Math.sin(d.angle)},
																 ${-radii.tick_label * Math.cos(d.angle)})
							 						   rotate(${d.angle * deg - pi})`)
									.attr("opacity", 1)),
				);
		
		svgElement.select(".gauge-container").append("g")
				.attr("class", "needle")
				.selectAll("path")
				.data([needlePercent])
				.join(
					enter => enter.append("path")
							.attr("d", (d) => scales.lineRadial([[0,0], [scales.needleScale(d), radii.outer_tick]]))
							.attr("stroke", needle_color)
							.attr("stroke-width", 3)
							.attr("stroke-linecap", "round")
								.attr("fill", "white")
							.call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
					update => update
							.attr("opacity", 0)
							.call(el => el.transition().duration(transitionMillisec)
									.attr("d", (d) => scales.lineRadial([[0,0], [scales.needleScale(d), radii.outer_tick]]))
									.attr("opacity", 1)),
				);
		
		svgElement.select('.gauge-container').select('.needle')
				.append("circle")
				.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", radii.cap)
				.attr("stroke", needle_color)
				.attr("stroke-width", 3)
				.attr("fill", "white")
				.attr("opacity", 1)
				
				// .attr("stroke", needle_color)
				// .attr("stroke-width", 3)
				// .style("fill", "white")
				// .call(el => el.transition().duration(transitionMillisec).attr("opacity", 1))
					// update => update
					// 		.attr("opacity", 0)
					// 		.call(el => el.transition().duration(transitionMillisec)
					// 				.attr("cx", 0)
					// 				.attr("cy", 0)
					// 				.attr("opacity", 1)),

				
				
		
		svgElement.select(".gauge-container").call(gauge_container);
	})

    return (
      <div className="gaugechart-container">
	<div className='tooltip hide' />
	<svg className="gaugechart-svg" style={{width: 100 + '%'}} ref={svgRef}  />
      </div>
    )
    
}

// Build svg values
const setCenter = (svgWidth, svgHeight, margin) => {
	let center = {};

	center["x"] = svgWidth / 2;
	center["y"] = svgHeight - margin.top;

	return center
}

const setRadii = (svgHeight, margin, thickness) => {
	let radii = {};
	let base = svgHeight - (2 * margin.top);

	radii["base"] = base;
	radii["cap"] = base / 15;
	radii["inner"] = base * (1 - thickness);
	radii["outer_tick"] = base + 5;
	radii["tick_label"] = base + 15;

	return radii
}

const setAngles = (arc, pi, rotation, rad) => {
	let angles = {};
	let arc_complement = 1 - arc;

	angles["arc_complement"] = arc_complement;
	angles["start_angle"] = (-pi / 2);
	angles["end_angle"] = pi / 2;

	return angles
}

const setTicks = (angles, u_ticks, radii, max_pct) => {
	let sub_arc = (angles.end_angle - angles.start_angle) / (u_ticks - 1),
		tick_pct = max_pct / (u_ticks - 1);
	
	const gauge_ticks = d3.range(u_ticks).map( (d) => {
		let sub_angle = angles.start_angle + (sub_arc * d);
		return {
			label: formatPercent(tick_pct * d),
			angle: sub_angle,
			coordinates: [[sub_angle, radii.inner],
						  [sub_angle, radii.outer_tick]]
		}
	});

	return gauge_ticks
}

const setGradient = (color_scheme, color_step, angles) => {
	let c = d3[color_scheme],
		samples = color_step,
		total_arc = angles.end_angle - angles.start_angle,
		sub_arc = total_arc / (samples);

	const gradient = d3.range(samples).map( (d) => {
		let sub_color = d / (samples - 1),
			sub_start_angle = angles.start_angle + (sub_arc * d),
			sub_end_angle = sub_start_angle + sub_arc;
		return {
			fill: c(sub_color),
			start: sub_start_angle,
			end: sub_end_angle
		}
	});

	return gradient
}

const setScales = (radii, angles, max_pct) => {
	let scales = {};

	scales["lineRadial"] = d3.lineRadial();

	scales["subArcScale"] = d3.arc()
		.innerRadius(radii.inner + 1)
		.outerRadius(radii.base)
		.startAngle((d) => d.start)
		.endAngle((d) => d.end)

	scales["needleScale"] = d3.scaleLinear()
		.domain([0, max_pct])
		.range([angles.start_angle, angles.end_angle])
	
	return scales
}

const formatPercent = d3.format(".2%")

// Export component  
export default withStreamlitConnection(GaugeChart)
