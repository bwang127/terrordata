(function() {
	var svg = d3.select("svg"),
	    width = +svg.attr("width"),
	    height = +svg.attr("height");

	// Setup toggler
	var elem = document.querySelector('.js-dynamic-switch');
	var init = new Switchery(elem, { color: "#8A0707", secondaryColor: "#000000" });

	elem.onchange = function() {
		if (elem.checked) {
			d3.select("input[value=\"sumBySize\"]")
		        .property("checked", true)
		        .dispatch("change");
	    } else {
	    	d3.select("input[value=\"sumByCount\"]")
		        .property("checked", true)
		        .dispatch("change");
	    }
	};

	var colorArray = ["#D2505E", "#A6A6A7", "#D3D2D3", "#D0A3C1", "#837482", "#383C67"];
	var nameArray = ["Middle East", "South America", "Asia", "Central America", "Europe", "Africa"];

	var color = d3.scaleOrdinal().range(colorArray);
	var format = d3.format(",d");

	var treemap = d3.treemap()
	    .tile(d3.treemapResquarify)
	    .size([width, height])
	    .round(true)
	    .paddingInner(1);

	var legend = d3.select("#treemap-legend-div").append("div")
		.attr("class", "legend-div")
	    .style("margin-left", 2 + "px")
	    .style("width", 250 + "px")
	    .style("height", 160 + "px");

	var tool = d3.select("body").append("div").attr("class", "toolTip");

	d3.json("groups/group_filtered_data.json", function(error, data) {
	  if (error) throw error;

	  var root = d3.hierarchy(data)
	      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.gname; })
	      .sum(sumByCount)
	      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

	  treemap(root);

	  var cell = svg.selectAll("g")
	    .data(root.leaves())
	    .enter().append("g")
	      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

	  cell.append("rect")
	      .attr("id", function(d) { return d.data.id; })
	      .attr("width", function(d) { return d.x1 - d.x0; })
	      .attr("height", function(d) { return d.y1 - d.y0; })
	      .attr("fill", function(d) { return color(d.parent.data.id); });

	  cell.append("clipPath")
	      .attr("id", function(d) { return "clip-" + d.data.id; })
	    .append("use")
	      .attr("xlink:href", function(d) { return "#" + d.data.id; });

	  cell.append("text")
	      .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
	      .attr("fill", function(d) { return d.data.origin == "Africa" ? "#ffffff" : "#000000"; })
	    .selectAll("tspan")
	      .data(function(d) { return d.data.gname.split(/(?=[A-Z][^A-Z])/g); })
	    .enter().append("tspan")
	      .attr("x", 4)
	      .attr("y", function(d, i) { return 13 + i * 10; })
	      .text(function(d) { return d; });

	  cell.on("mousemove", function (d) {
		        tool.style("left", d3.event.pageX + 10 + "px")
		        tool.style("top", d3.event.pageY - 20 + "px")
		        tool.style("display", "inline-block");
		        tool.html(d.children ? null : d.data.gname + "<br>" + format(d.value));
		    }).on("mouseout", function (d) {
		        tool.style("display", "none");
		    });

	  d3.selectAll("input[type=\"radio\"]")
	      .data([sumByCount, sumBySize])
	      .on("change", changed);

	  var timeout = d3.timeout(function() {
	    d3.select("input[type=\"checkbox\"]")
	        .property("checked", true)
	        .dispatch("change");
	  }, 1500);

	  function changed(sum) {
	    timeout.stop();

	    treemap(root.sum(sum));

	    cell.transition()
	        .duration(750)
	        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
	      .select("rect")
	        .attr("width", function(d) { return d.x1 - d.x0; })
	        .attr("height", function(d) { return d.y1 - d.y0; });
	  }

	  // Setup legend
	  legend.append('div')
		  .style("text-anchor", "left")
		  .attr("class", "legend-title")
		  .html("Geographic Origin of Group")
		  .style("left", "5px")
		  .style("top", "34px");

      for (i = 0; i < 6; i++) {
	      legend.append('div')
	          .attr("class","legend")
	          .style("width", "150px")
	          .style("height", "15px")
	          .style("left", "5px")
	          .style("top", function (d) { return (55 + 18*i) + "px" })
	          .text(function (d) { return nameArray[i] })
	          .style("color", function (d) { return colorArray[i] })
      };
	});

	function sumByCount(d) {
	  return d.count;
	}

	function sumBySize(d) {
	  return d.nkill;
	}
}) ();