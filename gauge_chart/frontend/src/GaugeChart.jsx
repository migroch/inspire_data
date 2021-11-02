import React, {useEffect, useState, useRef} from "react";
import { Streamlit, withStreamlitConnection,} from "streamlit-component-lib";
import * as d3 from "d3";
import './GaugeChart.css';

// Create GaugeChart component
const GaugeChart = (props) => {
  const {data, rotation, thickness, arc, ticks, color_scheme, color_step, tick_color, needle_color} = props.args;
  if(data[2] > data[1]) {
    data[1] = data[2];
  }
  
  const max_width = 250;
  const aspectRatio = 0.35;
  let dimensions = get_client_dimensions();
  let width = dimensions.width > max_width ? max_width : dimensions.width;
  const [svgWidth, setWidth ] = useState(width);
  
  let ticks_font_size = `${11+5*svgWidth/1000}px`;
  let caption_font_size  = `${10+5*svgWidth/400}px`;
  let label_font_size = caption_font_size;
  const margin = {"top":5*parseFloat(ticks_font_size), "bottom": 1.25*parseFloat(ticks_font_size), "left": 2*parseFloat(ticks_font_size), "right": 2*parseFloat(ticks_font_size)};
  const [svgHeight, setHeight ] = useState(aspectRatio*svgWidth + margin.top);
  
  const svgRef = useRef(null);
  Streamlit.setFrameHeight(svgHeight + 2*parseFloat(label_font_size));
  d3.select(svgRef.current).style("width", svgWidth).style("height", svgHeight);

  const transitionMillisec = 1200;
	
  // Get properties
  const pi = Math.PI;
  const rad = pi / 180;
  const deg = 180 / pi;
	
  // Set svg values
  let needlePercent = data[2],
      center = setCenter(svgWidth, svgHeight, margin),
      radii = setRadii(svgWidth, margin, thickness),
      angles = setAngles(arc, pi, rotation, rad),
      gauge_ticks = setTicks(angles, ticks, radii, data[1]),
      gradient = setGradient(color_scheme, color_step, angles),
      scales = setScales(radii, angles, data[1]);

  // Set svgHeight and update it on window resize
  useEffect(() => {
    const handleResize = () =>{
      let dimensions = get_client_dimensions();
      let width = dimensions.width > max_width ? max_width : dimensions.width;
      setWidth(width);
      setHeight( aspectRatio*svgWidth + margin.top);
    }
    
    Streamlit.setFrameHeight(svgHeight + 2*parseFloat(label_font_size));
    d3.select(svgRef.current).style("width", svgWidth).style("height", svgHeight);
    window.addEventListener('resize', handleResize)
  }, [svgWidth, svgHeight, aspectRatio, margin.top, label_font_size]);
    
  // On mount, create group containers for circles, path and both axis
  useEffect(() => {
    const svgElement = d3.select(svgRef.current);
    svgElement.append("g").classed("gauge-arc", true);
    svgElement.append("g").classed("gauge-ticks", true);
    svgElement.append("g").classed("needle", true);
    svgElement.append("g").classed("needle-circle", true);
    svgElement.append("g").classed("caption", true);
  }, []);

  // Hook to create / update gauge 
  useEffect(() => {
    const svgElement = d3.select(svgRef.current);
    
    svgElement.select(".gauge-arc").selectAll("path")
	    .data(gradient)
	    .join(enter => enter.append("path").attr("transform", `translate(${center.x}, ${center.y})`)
			        .attr("d", scales.subArcScale)
			        .attr("fill", (d) => d.fill)
			        .attr("stroke-width", 0.5)
			        .attr("stroke", (d) => d.fill)
			        .call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
		        update => update.attr("opacity", 0)
				      .call(el => el.transition().duration(transitionMillisec)
                .attr("transform", `translate(${center.x}, ${center.y})`)
					      .attr("d", scales.subArcScale)
					      .attr("opacity", 1)),
	    );
		
    svgElement.select(".gauge-ticks").selectAll("path")
	    .data(gauge_ticks)
	    .join(enter => enter.append("path")
              .attr("transform", `translate(${center.x}, ${center.y})`)
			        .attr("d", (d) => scales.lineRadial(d.coordinates))
			        .attr("stroke", tick_color)
			        .attr("stroke-width", 2)
			        .attr("stroke-linecap", "round")
			        .attr("fill", "none")
			        .call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
		        update => update.attr("opacity", 0)
				      .call(el => el.transition().duration(transitionMillisec)
              .attr("transform", `translate(${center.x}, ${center.y})`)
					      .attr("d", (d) => scales.lineRadial(d.coordinates))
					      .attr("opacity", 1)),
	    );

    svgElement.select(".gauge-ticks").selectAll("text")
	    .data(gauge_ticks)
	    .join(enter => enter.append("text")
			        .attr("transform", (d) => {
				        let rot_angle = d.angle * deg - pi;
				        // if ([angles.start_angle, angles.end_angle].includes(d.angle)) rot_angle = 0;
				        return `translate(${center.x + (radii.tick_label * Math.sin(d.angle))}, ${center.y + (-radii.tick_label * Math.cos(d.angle))}) rotate(${rot_angle})`
			        })
			        .attr("dy", "0.35em")
			        .attr("text-anchor", "middle")
			        .attr("font-size", ticks_font_size)
			        .text((d) => d.label)
			        .call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
		        update => update.attr("opacity", 0)
				      .call(el => el.transition().duration(transitionMillisec)
					      .attr("transform", (d) => {
						      let rot_angle = d.angle * deg - pi;
						      // if ([angles.start_angle, angles.end_angle].includes(d.angle)) rot_angle = 0;
						      return `translate(${center.x + (radii.tick_label * Math.sin(d.angle))}, ${center.y + (-radii.tick_label * Math.cos(d.angle))}) rotate(${rot_angle})`
					      })
					.text((d) => d.label)
					 .attr("opacity", 1)),
			);
		
    svgElement.select(".needle").selectAll("path")
	    .data([needlePercent])
	    .join(enter => enter.append("path")
              .attr("transform", `translate(${center.x}, ${center.y})`)
              .attr("d", (d) => scales.lineRadial([[0,0], [scales.needleScale(d), radii.outer_tick]]))
			        .attr("stroke", needle_color)
			        .attr("stroke-width", 3)
			        .attr("stroke-linecap", "round")
			        .attr("fill", "white")
			        .call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
		        update => update.attr("opacity", 0)
				      .call(el => el.transition().duration(transitionMillisec)
              .attr("transform", `translate(${center.x}, ${center.y})`)
					      .attr("d", (d) => scales.lineRadial([[0,0], [scales.needleScale(d), radii.outer_tick]]))
					      .attr("opacity", 1)),
	    );
		
    svgElement.select(".needle-circle").selectAll("circle")
      .data([0])
	    .join(enter=> enter.append("circle")
              .attr("cx", center.x)
			        .attr("cy", center.y)
			        .attr('r', radii.cap)
              .attr("stroke", needle_color)
              .attr("stroke-width", 3)
              .attr("fill", "white")
              .call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
            update => update.attr("opacity", 0)
              .attr("stroke", needle_color)
              .attr("stroke-width", 3)
              .attr("fill", "white")
              .call(el => el.transition().duration(transitionMillisec)
                .attr("cx", center.x)
                .attr("cy", center.y)
                .attr('r', radii.cap)
                .attr("opacity", 1)),
	      );

/*     svgElement.select(".caption").selectAll("text")
      .data([0])
      .join(enter => enter.append("text")
	      .attr("transform", `translate(${center.x}, ${svgHeight-parseFloat(caption_font_size)} )`)
	      .attr("fill", "#F77F00")
	      .attr("font-weight", "bold")
              .attr("text-anchor", "middle")
	      .attr("font-size", caption_font_size)
	      .text(`14-Day Positivity Rate: ${formatPercent(data[2])}`)
	      .call(el => el.transition().duration(transitionMillisec).attr("opacity", 1)),
            update => update.attr("opacity", 0)
              .call(el => el.transition().duration(transitionMillisec)
			    .attr("transform", `translate(${center.x}, ${svgHeight-parseFloat(caption_font_size)})`)
			    .attr("font-size", caption_font_size)
			    .text(`14-Day Positivity Rate: ${formatPercent(data[2])}`)
                           .attr("opacity", 1))
      ); */
	});

    return (
      <>
        <div className="gaugechart-container">
          <div><svg className="gaugechart-svg"  ref={svgRef}/></div>
        </div>
        <div className="legend-container" >
          <p style={{fontSize:label_font_size}}>
            14-day positivity rate: <span style={{color:"#F77F00", fontWeight:"bold"}}>{formatPercentLegend(data[2])}</span>
          </p>
        </div>
      </>
    )
    
}

// Build svg values
const setCenter = (svgWidth, svgHeight, margin) => {
  let center = {};
  
  center["x"] = svgWidth / 2;
  center["y"] = svgHeight - margin.bottom;
  
  return center
}

const setRadii = (svgWidth, margin, thickness) => {
  let radii = {};
  let base = svgWidth - margin.left - margin.right;
  
  radii["base"] = base;
  radii["cap"] = base/20;
  radii["inner"] = (base/2) - (base*thickness/2);
  radii["outer"] = base/2;
  radii["outer_tick"] = (base/2) + 5;
  radii["tick_label"] = (base/2) + 15;
  
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
      coordinates: [[sub_angle, radii.inner],  [sub_angle, radii.outer_tick]]
    }
  });
  
  return gauge_ticks
}

const setGradient = (color_scheme, color_step, angles) => {
  let  samples = color_step,
      total_arc = angles.end_angle - angles.start_angle,
      sub_arc = total_arc / (samples);

  let color = d3.scaleLinear().domain([0, 1])
		.interpolate(d3.interpolateHcl)
		.range([ d3.rgb('#09ab3b'), d3.rgb("#ff006e")]);
  
  const gradient = d3.range(samples).map( (d) => {
    let sub_color = d / (samples - 1),
	sub_start_angle = angles.start_angle + (sub_arc * d),
	sub_end_angle = sub_start_angle + sub_arc;
    return {
      fill: color(sub_color),
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
			    .outerRadius(radii.outer)
			    .startAngle((d) => d.start)
			    .endAngle((d) => d.end);

  scales["needleScale"] = d3.scaleLinear()
			    .domain([0, max_pct])
			    .range([angles.start_angle, angles.end_angle]);
	
  return scales
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

const formatPercent = d3.format(".1%");
const formatPercentLegend = d3.format(".2%");

  
// Export component  
export default withStreamlitConnection(GaugeChart)
