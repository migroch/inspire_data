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
	props.args.data =  props.args.data.map(d => [d[0], d[1], d[2]]);
  	const {data, width, rotation, thickness, arc, u_ticks, color_scheme, color_step, tick_color, needle_color, key} = props.args
	const pi = Math.PI
	const rad = pi / 180
	const deg = 180 / pi

  	// Set svg values
	let needlePercent = data[2],
  		center = setCenter(svgWidth, svgHeight, margin),
		radii = setRadii(svgHeight, margin, thickness),
		angles = setAngles(arc, pi, rotation, rad),
		ticks = setTicks(angles, u_ticks),
		gradient = setGradient(color_scheme, color_step, angles),
		scales = setScales(radii,angles);

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
		
		// Append arc
		gauge_container.append("g")
			.attr("class", "gauge-arc")
			.selectAll("path")
			.data(gradient)
			.enter()
			.append("path")
				.attr("d", scales.subArcScale)
				.attr("fill", (d) => d.fill)
				.attr("stroke-width", 0.5)
				.attr("stroke", (d) => d.fill)		

		// Append ticks
		gauge_container.append("g")
			.attr("class", "gauge-ticks")
			.selectAll("paths")
			.data(ticks)
			.enter()
			.append("g")
				.attr("class", "tick")
				.append("path")
					.attr("d", (d) => scales.lineRadial(d.coordinates))
					.attr("stroke", tick_color)
					.attr("stroke-width", 2)
					.attr("stroke-linecap", "round")
					.attr("fill", "none")
		
		gauge_container.select("g.gauge_ticks")
			.selectAll("text")
			.data(ticks)
			.enter()
			.append("g")
				.attr("class", "tick-label")
				.append("text")
					.attr("transform", (d) => 
						`translate(${radii.tick_label * Math.sin(d.angle)},
								   ${-radii.tick_label * Math.cos(d.angle)}
						rotate(${d.angle * deg - pi}))`)
					.attr("dy", "0.35em")
					.attr("text-anchor", "middle")
					.attr("font-size", "0.67em")
					.text((d) => d.label)
		
		// Append needle
		gauge_container.append("g")
			.attr("class", "needle")
			.selectAll("path")
			.data([needlePercent])
			.enter()
			.append("path")
				.attr("d", (d) => scales.lineRadial([[0,0], [scales.needleScale(d), radii.outer_tick]]))
				.attr("stroke", needle_color)
				.attr("stroke-width", 6)
				.attr("stroke-linecap", "round")

		gauge_container.select("g.needle")
			.append("circle")
				.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", radii.cap)
				.attr("stroke", needle_color)
				.attr("stroke-width", 6)
				.style("fill", "white")
		
		svgElement.select(".gauge-container").call(gauge_container);
	})

    return (
      <div className="gaugechart-container">
	<div className='tooltip hide' />
	<svg className="gaugechart-svg" ref={svgRef}  />
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
	angles["start_angle"] = (-pi / 2) + (pi * arc_complement / 2) + (rotation * rad);
	angles["end_angle"] = (pi / 2) - (pi * arc_complement / 2) + (rotation * rad);

	return angles
}

const setTicks = (angles, ticks, radii) => {
	let sub_arc = (angles.end_angle - angles.start_angle) / (ticks - 1),
		tick_pct = 100 / (ticks - 1);
	
	ticks = d3.range(ticks).map( (d) => {
		let sub_angle = angles.start_angle + (sub_arc * d);
		return {
			label: (tick_pct * d).toFixed(2) + "%",
			angle: sub_angle,
			coordinates: [[sub_angle, radii.inner],
						  [sub_angle, radii.outer_tick]]
		}
	});

	return ticks
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

const setScales = (radii, angles) => {
	let scales = {};

	scales["lineRadial"] = d3.lineRadial();

	scales["subArcScale"] = d3.arc()
		.innerRadius(radii.inner + 1)
		.outerRadius(radii.base)
		.startAngle((d) => d.start)
		.endAngle((d) => d.end)

	scales["needleScale"] = d3.scaleLinear()
		.domain([0,1])
		.range([angles.start_angle, angles.end_angle])
	
	return scales
}

// Export component  
export default withStreamlitConnection(GaugeChart)
