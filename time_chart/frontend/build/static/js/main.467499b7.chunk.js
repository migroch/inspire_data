(this.webpackJsonpstreamlit_d3_timechart=this.webpackJsonpstreamlit_d3_timechart||[]).push([[0],{11:function(t,e,n){},71:function(t,e,n){t.exports=n(80)},79:function(t,e,n){},80:function(t,e,n){"use strict";n.r(e);var r=n(3),a=n.n(r),c=n(23),o=n.n(c),i=n(2),l=n(12),u=n(1),s=n(11),f=n.n(s),d=function(t,e,n,r){return[u.l().domain(u.f(t,(function(t){return t[0]}))).range([r.left,e-r.right]),u.j().domain([0,u.i(t,(function(t){return t[1]}))]).range([n-r.bottom,r.top]),u.j().domain([0,u.i(t,(function(t){return t[3]}))]).range([n-r.bottom,r.top])]},p=u.n("%m/%d/%y"),m=u.g(".2%");function h(){var t=0,e=0;return"number"==typeof window.innerWidth?(t=window.innerWidth,e=window.innerHeight):document.documentElement&&(document.documentElement.clientWidth||document.documentElement.clientHeight)?(t=document.documentElement.clientWidth,e=document.documentElement.clientHeight):document.body&&(document.body.clientWidth||document.body.clientHeight)&&(t=document.body.clientWidth,e=document.body.clientHeight),{width:t,height:e}}var y=Object(l.b)((function(t){var e=.38,n=h(),c=Object(r.useState)(n.width),o=Object(i.a)(c,2),s=o[0],y=o[1];s<600&&(e=.68);var g=Object(r.useState)(e*s),b=Object(i.a)(g,2),v=b[0],k=b[1];l.a.setFrameHeight(v);var x="".concat(11+5*s/1e3,"px"),w="".concat(11+5*s/1e3,"px"),j=.004*s;t.args.data=t.args.data.map((function(t){return[new Date("string"==typeof t[0]?t[0].split("T")[0]+"T12:00:00":t[0]),t[1],t[2],t[3],t[4],t[5]]}));var E=t.args.data,A={top:50,bottom:4*parseFloat(x),left:2*parseFloat(x)-5,right:3*parseFloat(x)},O=Object(r.useRef)(null),F=function(t){return"\n\t\t\t\t<p>Date: <strong>".concat(p(t[0]),"</strong></p>\n\t\t\t\t<p>Active Cases: <strong style='color:").concat("#ff006e","'>").concat(t[3],"</strong></p>\n\t\t\t\t<p>14-Day Positivity Rate: <strong style='color:").concat("#f77f00","'>").concat(m(t[1]),"</strong></p>\n\t\t\t\t")},z=d(E,s,v,A),H=Object(i.a)(z,3),S=H[0],W=H[1],X=H[2];return Object(r.useEffect)((function(){l.a.setFrameHeight(v),u.m(O.current).style("height",v),window.addEventListener("resize",(function(){var t=.38,e=h();y(e.width),s<600&&(t=.61),k(t*s)}))}),[s,v]),Object(r.useEffect)((function(){var t=u.m(O.current);t.append("g").classed("x-axis",!0),t.append("g").classed("y-axis-pos",!0),t.append("g").classed("y-axis-active",!0),t.append("g").classed("active-area",!0),t.append("g").classed("active-line",!0),t.append("g").classed("pos-line",!0),t.append("g").classed("active-circles",!0),t.append("g").classed("pos-circles",!0),t.append("g").classed("legend",!0),t.append("text").classed("active-axis-label",!0),t.append("text").classed("pos-axis-label",!0)}),[]),Object(r.useEffect)((function(){var t=u.m(O.current);t.select(".x-axis").call((function(t){return t.attr("transform","translate(0, ".concat(v-A.bottom,")")).transition().duration(1200).attr("font","sans-serif").attr("font-size",x).call(u.b(S).ticks(u.o).tickFormat(u.n("%b %d")).tickSize(-1*(v-A.top-A.bottom)).tickSizeOuter(0)).call((function(t){return t.selectAll("text").style("text-anchor","end").attr("transform","rotate(-65)")})).call((function(t){return t.selectAll("path").attr("stroke","black").attr("stroke-width",1).attr("stroke-opacity",1)})).call((function(t){return t.selectAll(".tick line").attr("stroke","black").attr("stroke-opacity",1).attr("stroke-dasharray","2,2").attr("stroke-width",1)}))})),t.select(".y-axis-active").call((function(t){return t.attr("transform","translate(".concat(A.left,", 0)")).transition().duration(1200).attr("font","sans-serif").attr("font-size",x).attr("font-weight","bold").attr("fill","#ff006e").call(u.c(X).ticks(5).tickSize(4)).call((function(t){return t.selectAll("text").attr("fill","#ff006e")})).call((function(t){return t.selectAll("path").attr("stroke","black").attr("stroke-width",1).attr("stroke-opacity",1)})).call((function(t){return t.selectAll("line").attr("stroke","black").attr("stroke-width",1).attr("stroke-opacity",1)}))})),t.select(".y-axis-pos").call((function(t){return t.attr("transform","translate(".concat(s-A.right,", 0)")).transition().duration(1200).attr("font","sans-serif").attr("font-size",x).attr("font-weight","bold").attr("fill","#f77f00").call(u.d(W).ticks(5,".1%").tickSize(4)).call((function(t){return t.selectAll("text").attr("fill","#f77f00")})).call((function(t){return t.selectAll("path").attr("stroke","black").attr("stroke-width",1).attr("stroke-opacity",1)})).call((function(t){return t.selectAll("line").attr("stroke","black").attr("stroke-width",1).attr("stroke-opacity",1)}))}))})),Object(r.useEffect)((function(){var t=u.m(O.current),e=["Active Cases","14-Day Positivity Rate"],n=u.k().domain(e).range(["#ff006e","#f77f00"]);t.select(".legend").selectAll("circle").data(e).join((function(t){return t.append("circle").attr("cx",(function(t,e){return(1-e)*A.left+e*(s-A.right)})).attr("cy",A.top/2).attr("r",parseInt(w)/2).style("fill",(function(t){return n(t)})).attr("opacity",0).call((function(t){return t.transition().duration(1200).attr("opacity",1)}))}),(function(t){return t.call((function(t){return t.transition().duration(1200).attr("cx",(function(t,e){return(1-e)*A.left+e*(s-A.right)})).attr("cy",A.top/2).attr("r",parseFloat(w)/2).attr("opacity",1)}))})),t.select(".legend").selectAll("text").data(e).join((function(t){return t.append("text").attr("y",A.top/2).text((function(t){return t})).attr("font-size",w).attr("font-weight","bold").attr("text-anchor","left").style("alignment-baseline","middle").style("fill",(function(t){return n(t)})).call((function(t){return t.attr("x",(function(e,n){var r=A.left+parseFloat(w)/2+3;return 1===n&&(r=s-A.right-parseFloat(w)/2-t.nodes()[1].getComputedTextLength()-3),r}))}))}),(function(t){return t.call((function(t){return t.transition().duration(1200).attr("y",A.top/2).attr("font-size",w).attr("x",(function(e,n){var r=A.left+parseFloat(w)/2+3;return 1===n&&(r=s-A.right-parseFloat(w)/2-t.nodes()[1].getComputedTextLength()-3),r}))}))}))})),Object(r.useEffect)((function(){var t=u.m(O.current),e=u.a().x((function(t){return S(t[0])})).y0(X(0)).y1((function(t){return X(t[3])}));t.select(".active-area").selectAll("path").data([E]).join((function(t){return t.append("path").classed(f.a.area,!0).attr("d",(function(t){return e(t)})).attr("fill","#ff006e").attr("fill-opacity",.3).attr("opacity",0).call((function(t){return t.transition().duration(1200).attr("opacity",1)}))}),(function(t){return t.attr("opacity",0).call((function(t){return t.transition().duration(1200).attr("d",(function(t){return e(t)})).attr("opacity",1)}))}))})),Object(r.useEffect)((function(){var t=u.m(O.current),e=u.h().x((function(t){return S(t[0])})).y((function(t){return X(t[3])}));t.select(".active-line").selectAll("path").data([E]).join((function(t){return t.append("path").classed(f.a.line,!0).attr("d",(function(t){return e(t)})).attr("stroke","#ff006e").attr("stroke-width",2).attr("fill","none").attr("opacity",0).call((function(t){return t.transition().duration(1200).attr("opacity",1)}))}),(function(t){return t.attr("opacity",0).call((function(t){return t.transition().duration(1200).attr("d",(function(t){return e(t)})).attr("opacity",1)}))}))})),Object(r.useEffect)((function(){var t=u.m(O.current),e=u.h().x((function(t){return S(t[0])})).y((function(t){return W(t[1])}));t.select(".pos-line").selectAll("path").data([E]).join((function(t){return t.append("path").classed(f.a.line,!0).attr("d",(function(t){return e(t)})).attr("stroke","#f77f00").attr("stroke-width",2).attr("fill","none").attr("opacity",0).call((function(t){return t.transition().duration(1200).attr("opacity",1)}))}),(function(t){return t.attr("opacity",0).call((function(t){return t.transition().duration(1200).attr("d",(function(t){return e(t)})).attr("opacity",1)}))}))})),Object(r.useEffect)((function(){var t=u.m(O.current),e=u.m(".tooltip");t.select(".active-circles").selectAll("circle").data(E).join((function(t){return t.append("circle").classed("circle",!0).attr("cx",(function(t){return S(t[0])})).attr("cy",(function(t){return X(t[3])})).attr("fill","#ff006e").attr("r",0).call((function(t){return t.transition().duration(1200).attr("r",j)})).on("mouseover",(function(t){e.html(F(t));var n=u.e.pageX>s/2?u.e.pageX-parseFloat(e.style("width")):u.e.pageX,r=u.e.pageY>v/2?u.e.pageY-parseFloat(e.style("height")):u.e.pageY;e.style("left","".concat(n,"px")).style("top","".concat(r,"px")),e.classed("hide",!1),e.classed("show",!0)})).on("mouseout",(function(t){e.classed("show",!1),e.classed("hide",!0)}))}),(function(t){return t.call((function(t){return t.transition().duration(1200).attr("cx",(function(t){return S(t[0])})).attr("cy",(function(t){return X(t[3])})).attr("r",j).attr("fill","#ff006e")}))}),(function(t){return t.dispatch("mouseout").on("mouseover",null).on("mouseout",null).call((function(t){return t.transition().duration(600).attr("r",0).attr("fill","#ff006e").style("opacity",0).remove()}))}))})),Object(r.useEffect)((function(){var t=u.m(O.current),e=u.m(".tooltip");t.select(".pos-circles").selectAll("circle").data(E).join((function(t){return t.append("circle").classed("circle",!0).attr("cx",(function(t){return S(t[0])})).attr("cy",(function(t){return W(t[1])})).attr("fill","#f77f00").attr("r",0).call((function(t){return t.transition().duration(1200).attr("r",j)})).on("mouseover",(function(t){var n=u.e.pageX>s/2?u.e.pageX-parseFloat(e.style("width")):u.e.pageX,r=u.e.pageY>v/2?u.e.pageY-parseFloat(e.style("height")):u.e.pageY;e.style("left","".concat(n,"px")).style("top","".concat(r,"px")),e.html(F(t)),e.classed("hide",!1),e.classed("show",!0)})).on("mouseout",(function(t){e.classed("show",!1),e.classed("hide",!0)}))}),(function(t){return t.call((function(t){return t.transition().duration(1200).attr("cx",(function(t){return S(t[0])})).attr("cy",(function(t){return W(t[1])})).attr("r",j).attr("fill","#f77f00")}))}),(function(t){return t.dispatch("mouseout").on("mouseover",null).on("mouseout",null).call((function(t){return t.transition().duration(600).attr("r",0).attr("fill","#f77f00").style("opacity",0).remove()}))}))})),a.a.createElement("div",{className:"timechart-container"},a.a.createElement("div",{className:"tooltip hide"}),a.a.createElement("svg",{className:"timechart-svg",ref:O}))}));n(79);o.a.render(a.a.createElement(a.a.StrictMode,null,a.a.createElement(y,null)),document.getElementById("root"))}},[[71,1,2]]]);
//# sourceMappingURL=main.467499b7.chunk.js.map