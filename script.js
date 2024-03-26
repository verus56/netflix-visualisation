var margin = {top: 80, right: 80, bottom: 80, left: 80},
    width = 700 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

var parse = d3.timeParse("%Y-%m");

function type(d) {
  d.date = parse(d.date);
  d.title = +d.title;
  return d;
}


var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    xAxis = d3.axisBottom(x).tickSize(-height),
    yAxis = d3.axisLeft(y).tickArguments(4);


var area = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x(d.date); })
    .y0(height)
    .y1(function(d) { return y(d.title); });


var line = d3.line()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.title); });


d3.csv("./processing/group.csv", function(error, data) {


  data.forEach(function(d) {
      d = type(d);
  });



  var values = data.filter(function(d) {
    return d.type == "TV Show";
  });

  var msft = data.filter(function(d) {
    return d.type == "Movie";
  });


  x.domain([values[0].date, values[values.length - 1].date]);
  y.domain([0, d3.max(msft, function(d) { return d.title; })]).nice();


  var svg = d3.select("#linechart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      


  svg.append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height);


  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);


  svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + width + ",0)")
      .call(yAxis);

  var tooltip = d3.select("body").append("div")
	    	.attr("id","tooltip").style("font-size","20px");    
  var colors = d3.scaleOrdinal(d3.schemeCategory10);
  svg.selectAll('.line')
    .data([values, msft])
    .enter()
      .append('path')
        .attr('class', 'line')
        .style('stroke', function(d) {
          return colors(Math.random() * 50);
        })
        .attr('clip-path', 'url(#clip)')
        .attr('d', function(d) {
          return line(d);
        })
        .on("mousemove", function(d,i){

          d3.select(this).style("stroke-width", 4);
          tooltip.style("visibility", "visible")
          .html(`<b>${d[i].type}</b>`)
          .style("top", (d3.event.pageY-60)+"px")
          .style("left",d3.event.pageX+10+"px");
        })
        .on("mouseout", function (d) { 
          d3.select(this).style("stroke-width", 2);
          d3.selectAll("#tooltip").style("visibility", "hidden");
        })

  var curtain = svg.append('rect')
    .attr('x', -1 * width)
    .attr('y', -1 * height)
    .attr('height', height)
    .attr('width', width)
    .attr('class', 'curtain')
    .attr('transform', 'rotate(180)')
    .style('fill', '#ffffff');
    

  var guideline = svg.append('line')
    .attr('stroke', '#333')
    .attr('stroke-width', 0)
    .attr('class', 'guide')
    .attr('x1', 1)
    .attr('y1', 1)
    .attr('x2', 1)
    .attr('y2', height)
    

  var t = svg.transition()
    .delay(750)
    .duration(6000)
    .ease(d3.easeLinear)
    .on('end', function() {
      d3.select('line.guide')
        .transition()
        .style('opacity', 0)
        .remove()
    });
  
  t.select('rect.curtain')
    .attr('width', 0);
  t.select('line.guide')
    .attr('transform', 'translate(' + width + ', 0)')

  d3.select("#show_guideline").on("change", function(e) {
    guideline.attr('stroke-width', this.checked ? 1 : 0);
    curtain.attr("opacity", this.checked ? 0.75 : 1);
  })
  

});




$(document).ready(function(){

    // map his 
	d3.csv("./processing/processed.csv", function(error,data){
		if (error)  throw error;

		var global_country = "global";

		map(data);
        var barchart = barchart(data);
		
		function reset_all_charts(){
			global_country = "global";
            barchart.updatebc(data);
		}

		function map(data){
			var transformation;
			var iszoomed = false;
			var circle_radius;
			var selected_year;
			var new_data = data;

			var active = d3.select(null);

			var zoom = d3.zoom()
				.scaleExtent([1,100])
				.on("zoom", zoomed);


			var netflix_map = d3.select("#netflix_map")
			.append("svg")
			.attr("class", "netflix_map")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("padding-right", '0px');


			var cp_width = $("#netflix_map").width(),
			cp_height = $("#netflix_map").height();


			var netflix_map_legend = d3.select("#netflix_map_legend")
			.append("svg")
			.attr("class", "netflix_map_legend")
			.attr("width", 150)
			.attr("height", cp_height);


			var projection = d3.geoMercator()
			.scale(1)
			.translate([0, 0]); 


			var path = d3.geoPath()
			.projection(projection);

			var cp_div = d3.select("#jason").append("div")
			.attr("id", "tooltip")
			.style("opacity", 0);

			netflix_map.append("rect")
			.attr("class", "background")
			.attr("width", cp_width)
			.attr("height", cp_height);

			var g = netflix_map.append("g");

		    data.forEach(function(d) {
		    	if (d.country == "United States")
		    		d.country = "USA";
 
		    });



	        d3.select('div#loadingbar')
	        .transition().delay(1000).duration(500)
	        .style("opacity", 0);

	        d3.select('div#slider-range')
	        .transition().delay(1000).duration(500)
	        .style("opacity", 1);

	       	


	        d3.json("world_map.json", function(map) {
	        	var bounds = path.bounds(map);
	        	var s = 0.95 / Math.max((bounds[1][0] - bounds[0][0]) / cp_width, (bounds[1][1] - bounds[0][1]) / cp_height);
	        	var t = [(cp_width - s * (bounds[1][0] + bounds[0][0])) / 2, (cp_height - s * (bounds[1][1] + bounds[0][1])) / 2];
	        	projection
	        	.scale(s)
	        	.translate(t);

	        	d3.select("g")
	        	.attr("class", "tracts")
	        	.selectAll("path")
	        	.data(map.features)
	        	.enter()
	        	.append('path')
	        	.attr("d", path)
	        	.on("click", clicked)
	        	.attr("stroke", "white")
	        	.attr("stroke-width", 0.5)
	        	.attr("fill", "white")
	        	.attr("fill-opacity", 0.7);


		       	var map_data = _.countBy(data, "country");
		        updateTooltip(map_data);
		        updateMapIntensity(map_data);

		    })

	        function clicked(d) {
	        	if (active.node() === this) {
	        		iszoomed = false;
	        		global_country = "global";

	  				netflix_map.selectAll("circle").remove();
	  				reset_all_charts();
	  				reset();
	  			}
  				else{
	  				if(iszoomed){

	  					netflix_map.selectAll("circle").remove();
		  				reset();
		  			}
		  			iszoomed = true;
		  			global_country = d.properties.name;

		  			active.classed("active", false);
		  			active = d3.select(this).classed("active", true);

		      		netflix_map.selectAll('path')
		      		.transition().duration(1000)
		      		.attr("opacity", 0.3);

		      		var bounds = path.bounds(d),
		      		dx = bounds[1][0] - bounds[0][0],
		      		dy = bounds[1][1] - bounds[0][1],
		      		x = (bounds[0][0] + bounds[1][0]) / 2,
		      		y = (bounds[0][1] + bounds[1][1]) / 2,
		      		scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / cp_width, dy / cp_height))),
		      		translate = [cp_width / 2 - scale * x, cp_height / 2 - scale * y];

		      		netflix_map.transition()
		      		.duration(750)
				      	.call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); 
				}
			}

			function reset() {
				active.classed("active", false);
				active = d3.select(null);

			  	// reset opacity
			  	netflix_map.selectAll('path')
			  	.transition().delay(10)
			  	.attr("opacity", 1);

			  	netflix_map.transition()
			  	.duration(750)
			      	.call( zoom.transform, d3.zoomIdentity ); 
			}

			function zoomed() {
				transformation = d3.event.transform;
				g.attr("transform", d3.event.transform);
				netflix_map.selectAll("circle").attr("transform", d3.event.transform);
			}

			function stopped() {
				if (d3.event.defaultPrevented) d3.event.stopPropagation();
			}

			function updateTooltip(map_data){
				netflix_map.selectAll("path")
				.on("mouseover", function(d) {
					d3.select(this)
					.style("fill-opacity", 1);
					cp_div.transition().duration(300)
					.style("opacity", 1);
					cp_div.html(`<span style="font-size:20px;font-weight:bold">Country: ${d.properties.name}<br></span><span style="font-size:20px;">Number of shows: ${map_data[d.properties.name]}</span>`).style("visibility", "visible")
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY -30) + "px");
				})
				.on("mouseout", function() {
					d3.select(this)
					.style("fill-opacity", 0.7);
					cp_div.style("visibility", "none").transition().duration(300)
					.style("opacity", 0);
				});
			}

			function updateMapIntensity(map_data){ 

				var array = Object.values(map_data);


	        	var min = getPercentile(array, 1);
	        	var q1 = getPercentile(array, 25);
	        	var mean = getPercentile(array, 50);
	        	var q3 = getPercentile(array, 75);
	        	var max = getPercentile(array, 99);

	        	var color_domain = [min, q1, mean, q3, max];
	

				
				var cp_color = d3.scaleThreshold()
				.range(d3.schemeOrRd[6])
				.domain(color_domain);

	     
	            netflix_map.selectAll('path')
	            .transition().duration(500)
	            .attr("fill", function(d) {
	            	if(map_data[d.properties.name]){
	            		return cp_color(map_data[d.properties.name]);
	            	}
	            	else{
	            		return cp_color(0);
	            	}
	            });


	        	var legend_labels = [];
	        	var ext_color_domain = [];
	        	ext_color_domain.push(0);

	        	for(var i=0; i<color_domain.length; i++){
	        		ext_color_domain.push(color_domain[i]);
	        	}

	        	for(var i=0; i<color_domain.length; i++){
	        		if(i==0)
	        			legend_labels.push("< " + color_domain[i]);
	        		else
	        			legend_labels.push((parseInt(color_domain[i-1])+1) + " - " + color_domain[i]);
	        	}
	        	legend_labels.push("> " + color_domain[color_domain.length-1]);



	            netflix_map.selectAll("g.legend").select("text")
	            .transition().duration(500)
	            .on("start", function(){
	            	var t = d3.active(this)
	            	.style("opacity", 0);
	            })
	            .on("end", function(){
	            	netflix_map.selectAll("g.legend").select("text")
	            	.text(function(d, i){ return legend_labels[i]; })
	            	.transition().delay(500).duration(1000)
	            	.style("opacity", 1);
	            });

				netflix_map_legend.selectAll("g.legend").exit();
				netflix_map_legend.selectAll("g").remove();

				var legend = netflix_map_legend.selectAll("g.legend")
				.data(ext_color_domain)
				.enter().append("g")
				.attr("class", "legend");

				var ls_w = 25, ls_h = cp_height/10, n = 6;

				legend.append("rect")
				.attr("x", 20)
				.attr("y", function(d, i){ return ls_h*i+50;})
				.attr("width", ls_w)
				.attr("height", ls_h)
				.style("fill", function(d, i) { return cp_color(d); })
				.style("opacity", 0.7);

				legend.append("text")
				.attr("x", 50)
				.attr("y", function(d, i){ return ls_h*i+60+ls_h/2;})
				.text(function(d, i){ return legend_labels[i]; });

				netflix_map_legend.append("g")
				.attr("class", "title")
				.append("text")
				.attr("x", 20)
				.attr("y", parseInt(30))
				.text("No. of shows:");
			}


			function getPercentile(data, percentile) {
				data.sort(numSort);
				var index = (percentile/100) * data.length;
				var result;
				if (Math.floor(index) == index) {
					result = (data[(index-1)] + data[index])/2;
				}
				else {
					result = data[Math.floor(index)];
				}
				if (result==0){
					result = 1;
				}
				return result;
			}

			function numSort(a,b) { 
				return a - b; 
			}
	    }

	    function barchart(data){

	    	// Create barchart SVG
		    var margin = {top: 20, right: 20, bottom: 45, left: 60};

		    var bar_chart = d3.select("#barchart")
		    .append("svg")
		    .attr("class", "bar_chart")
		    .attr("width", "100%")
		    .attr("height", "100%")
		    .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		    var bc_width = $(".bar_chart").width() - margin.left - margin.right,
		    bc_height = $(".bar_chart").height() - margin.top - margin.bottom;

	    	var preprocessed_data = preprocess_barchart(data);

	        // text label for the x axis title
	        bar_chart.append("g")
	        .attr("class", "bc_xaxis")
	        .attr("transform", "translate(" + (bc_width/2) + " ," + (bc_height + margin.top + 20) + ")")
	        .append("text")
	        .text("Genre");

      		updateBarchart(preprocessed_data);

      		function preprocess_barchart(data){

      			var barchart_array = [];
	  			data.forEach(function(d) {
	  				if(d.country_txt == global_country){
	  					temp_dict = {}
	  					temp_dict["rating"] = d.rating;
	  					temp_dict["count"] = +d.count;
	  					barchart_array.push(temp_dict);
	  				}
	  				else{
	  					temp_dict = {}
	  					temp_dict["rating"] = d.rating;
	  					temp_dict["count"] = +d.count;
	  					barchart_array.push(temp_dict);
	  				}
	  			});

	      		var groups = _(barchart_array).groupBy('rating');

	      		var barchart_array = _(groups).map(function(g, key) {
	      			return { rating: key, 
	      				count: _(g).reduce(function(m,x) { return m + x.count; }, 0) };
	      			});

	      		return barchart_array;
      		}

      		function updateBarchart(barchart_array){

		      	var x = d3.scaleBand().range([0, bc_width]).padding(0.1);
		      	y = d3.scaleLinear().range([bc_height, 15]);

	      		// make new chart
	        	x.domain(barchart_array.map(function(d){ return d.rating; })); 
	        	y.domain(d3.extent(barchart_array, function(d){ return d.count; })).nice();

	        	bar_chart.selectAll(".axis.axis--x").remove();

	        	bar_chart.append("g")
	        	.attr("class", "axis axis--x")
	        	.attr("transform", "translate(0," + bc_height + ")")
	            .call(d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return !(i%5)}))); 
	            bar_chart.selectAll(".axis.axis--y").remove();

	            // remove all info window
	            bar_chart.selectAll(".infowin").remove();

	            // text label for the selected barchart text 1
		        bar_chart.append("g")
		        .attr("class", "infowin")
		        .attr("transform", "translate(100, 5)")
		        .append("text")
		        .attr("id", "text_1");

		        // text label for the selected barchart text 2
		        bar_chart.append("g")
		        .attr("class", "infowin")
		        .attr("transform", "translate(250, 5)")
		        .append("text")
		        .attr("id","text_2");

	            bar_chart.append("g")
	            .attr("class", "axis axis--y")
	            .call(d3.axisLeft(y).ticks(10))
	            .append("text")
	            .attr("transform", "translate(60,0)")
	            .attr("y", 6)
	            .attr("dy", "0.71em")
	            .attr("text-anchor", "end")
	            .text("Frequency");

	            bar_chart.selectAll(".bar").remove();

	            bar_chart.selectAll(".bar")
	            .data(barchart_array)
	            .enter().append("rect")
	            .attr("class", "bar")
	            .attr("x", function(d) { return x(d.rating); })
	            .attr("y", bc_height)  
	        	.attr("width", x.bandwidth()) 
	        	.attr("height", 0)
	        	.on("mouseover", function(d){
	        		d3.select("#text_1")
	        		.html("Rating :  " + d.rating);
	        		d3.select("#text_2")
	        		.html("No. of movies : " + d.count);
	        	})
	        	.transition().delay(250).duration(500)
	            .attr("y", function(d) { return y(d.count); }) 
	            .attr("height", function(d) { return bc_height - y(d.count); }) 
	            .style("opacity", 1);
		    }

		    this.updatebc = function(data){
		    	var barchart_array = preprocess_barchart(data);
      			updateBarchart(barchart_array);
			}  
			return this;
      	}

	});   
    

    // piechart 
    d3.csv("./processing/res1.csv", function(error,data){
		if (error)  throw error;

	
        function pie(data){

            var width = 250
            height = 250
            margin = {top: 200, right: 40, bottom: 40, left: 195};

            var radius = Math.min(width, height) / 2 + 10

            var svg = d3.select("#distribution_of_shows")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");            

            var predata = preprocess_piechart(data);
            updatePieChart(predata);
            console.log(predata);

            function preprocess_piechart(data){

                var piechart_array = [];
                data.forEach(function(d) {
                    temp_dict = {}
                    temp_dict["type"] = d.type;
                    temp_dict["count"] = +d.count;
                    piechart_array.push(temp_dict);
                });

                var groups = _(piechart_array).groupBy('type');

                var piechart_array = _(groups).map(function(g, key) {
                    return { type: key, 
                        count: _(g).reduce(function(m,x) { return m + x.count; }, 0) };
                    });

                return piechart_array;
            }

            function updatePieChart(data){
            
                var color = d3.scaleOrdinal()
                .range(["steelblue", "firebrick"])

                var pie = d3.pie()
                .value(function(d) {return d.value.count; })
                var data_ready = pie(d3.entries(data));

                var arc = d3.arc()
                .innerRadius(radius * 0)         
                .outerRadius(radius * 0.5)

                var outerArc = d3.arc()
                .innerRadius(radius * 0.9)
                .outerRadius(radius * 0.9)

                svg
                .selectAll('allSlices')
                .data(data_ready)
                .enter()
                .append('path')
                .transition()
                .duration(1000)
                .attr('d', arc)
                .attr('fill', function(d){ return(color(d.data.key)) })
                .attr("stroke", "white")
                .style("stroke-width", "3px")
                .style("opacity", 1)

                var u = svg.selectAll("path")
                .data(data_ready)

                var tooltip = d3.select("body").append("div").attr("id","tooltip").style("font-size","20px"); 
                u
                .enter()
                .append('path')
                .merge(u)
                .on("mousemove", function(d){
                    tooltip
                    .style("visibility", "visible")
                    .html((d.data.value.count) + " shows")
                    .style("top", (d3.event.pageY-60)+"px")
                    .style("left",d3.event.pageX+10+"px");
                })
                .on("mouseout", function (d) { 
                    d3.selectAll("#tooltip").style("visibility", "hidden");
                })
                .transition()
                .duration(1000)
                .attr('d', d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius * 0.8)
                )
                .attr('fill', function(d){ return(color(d.data.key)) })
                .attr("stroke", "white")
                .style("stroke-width", "3px")
                .style("opacity", 0.8)

                svg
                .selectAll('allPolylines')
                .data(data_ready)
                .enter()
                .append('polyline')
                    .attr("stroke", "black")
                    .style("fill", "none")
                    .attr("stroke-width", 1)
                    .attr('points', function(d) {
                    var posA = arc.centroid(d) 
                    var posB = outerArc.centroid(d) 
                    var posC = outerArc.centroid(d); 
                    var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 
                    posC[0] = radius * 0.85 * (midangle < Math.PI ? 1 : -1); 
                    return [posA, posB, posC]
                    })

                
                svg
                .selectAll('allLabels')
                .data(data_ready)
                .enter()
                .append('text')
                    .text( function(d) { console.log(d.data.key) ; return d.data.value.type } )
                    .attr('transform', function(d) {
                        var pos = outerArc.centroid(d);
                        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        pos[0] = radius * 0.89 * (midangle < Math.PI ? 1 : -1);
                        return 'translate(' + pos + ')';
                    })
                    .style('text-anchor', function(d) {
                        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        return (midangle < Math.PI ? 'start' : 'end')
                    })
            }

            this.updatepc = function(data){
                var piechart_array = preprocess_piechart(data);
                updatePieChart(piechart_array);
            }

            return this;
        }

        pie(data);
    });  
    
    // bubb director
    d3.csv("./processing/netflix_titles.csv", function(error,data){
		if (error)  throw error;

	    function bubble(data){
	    	var preprocess = function(data){
	    		var a = []
                var cnt = 0
	    		var df = _.map(data, function(d) {
	    			return {
	    				'director'   : d.director,
	    				'movies' : d.title,
	    			}
	    		}); 
                df1 = d3.nest().key(function(d){ return d.director}).entries(df);
	    		dfcount = d3.nest().key(function(d){ return d.director}).rollup(
                    function(leaves) { return leaves.length; }).entries(df);
  
	    		a.children = _.map(df1, function(d){
	    			var key = d.key;

                    var counts = d.values.length;
	    			return { name:key, counts: +counts}
	    		}).filter(d => isNaN(d.name));    
	    		a.children = _.sortBy(a.children,function(d) {
	    			return d.counts;
	    		}).reverse(); 
                console.log(a.children);

	    		return a;
	    	}
	    	var tooltip = d3.select("#bubblechart2").append("div")
	    	.attr("id","tooltip").style("font-size","20px");
	    	var svg = d3.select("#bubblechart2")
	    	.append("svg")
	    	.attr("width", "100%")
	    	.attr("height", "100%")
	    	.attr("class", "bubble");  

	    	var height = $("#bubblechart2").height() , width = $("#bubblechart2").width();

	    	var color = d3.scaleOrdinal(d3.schemeCategory20c);  

	    	var df = preprocess(data);

	    	var pack = d3.pack(df)
	    	.size([width-5, height-5])
	    	.padding(1.5);  

	    	draw(df);

	    	function draw(df){

            	df.children = df.children.slice(0,20);
            	var top10 = _.map(df.children.slice(0,20), function(d){
            		return d.name;
            	});

		 		var t = d3.transition()
		 		.duration(750);

		 		var h = d3.hierarchy(df)
		 		.sum(function(d) { return d.counts; });   

		 		var circle = svg.selectAll("circle")
		 		.data(pack(h).leaves(), function(d){ return d.data.name; });

		 		var text = svg.selectAll("text")
		 		.data(pack(h).leaves(), function(d){ return d.data.name; });


          		circle.exit()
          		.style("fill", "#b26745")
          		.transition(t)
          		.attr("r", 1e-6)
          		.remove();

          		text.exit()
          		.transition(t)
          		.attr("opacity", 1e-6)
          		.remove();

          		console.log(df.children.length);

          		if(df.children.length > 1){
          			//UPDATE
	                circle
	                .transition(t)
	                .style("fill", function(d){ return color(d); })
	                .attr("r", function(d){ return d.r })
	                .attr("cx", function(d){ return d.x; })
	                .attr("cy", function(d){ return d.y; })

	                text
	                .attr("x", function(d){ return d.x; })
	                .attr("y", function(d){ return d.y; })
	                .text(function(d){ return $.inArray(d.data.name, top10) > -1 ? (d.r == 0 ? "":d.data.name) : ""; })
	                .style("pointer-events","none")
	                .each(wrap)

				      circle.enter().append("circle")
				      .attr("r", 1e-6)
				      .attr("cx", function(d){ return d.x; })
				      .attr("cy", function(d){ return d.y; })
				      .style("fill", "#fff")
				      .on("mousemove", function(d,i){
				      	d3.select(this).style("fill", "#E74C3C");
				      	tooltip
				      	.style("visibility", "visible")
				      	.html(`<b>${d.data.name}</b><br>${d.data.counts} movies`)
				      	.style("top", (d3.event.pageY-60)+"px")
				      	.style("left",d3.event.pageX+10+"px");
				      })
				      .on("mouseout", function (d) { 
				      	d3.select(this).style("fill", "#831010");
				      	d3.selectAll("#tooltip").style("visibility", "hidden");
				      })
				      .transition(t)
				      .style("fill", "#831010" )
				      .attr("r", function(d){ return d.r });

				      var mytext = text.enter().append("text")
				      .attr("opacity", 1e-6)
				      .attr("x", function(d){ return d.x; })
				      .attr("y", function(d){ return d.y; })
				      .style("text-anchor", "middle")
				      .text(function(d){ return $.inArray(d.data.name, top10) > -1 ? (d.r == 0 ? "":d.data.name) : ""; })
				      .style("pointer-events","none")
				      .transition(t)
				      .style("fill","#FFF")
				      .attr("opacity", 1).each(wrap);
          		}

			      function wrap(d) {
			      	if ( $.inArray(d.data.name, top10) > -1 && d.r > 0){
			      		var text = d3.select(this),
			      		width = (d.r * 2)-10,
			      		x = d.x,
			      		y = d.y,
			      		words = d.data.name.split(/\s+/),
			      		word,
			      		line = [],
			      		lineNumber = 0,
			      		lineHeight = 1.1;
			      		var tspan = text.text(null).append("tspan").attr("x", x).attr("y", y);
			      		if (words.length > 4){
			      			words = words.splice(0,4);
			      			words.push("...")
			      			words = words.reverse();
			      		}else{
			      			words = words.reverse();
			      		}
			      		if(d.r > 50){
				      		while (word = words.pop()) {
				      			line.push(word);
				      			tspan.text(line.join(" "));
				      			if (tspan.node().getComputedTextLength() > width) {
				      				line.pop();
				      				tspan.text(line.join(" "));
				      				line = [word];
				      				tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").text(word);
				      			}
				      		}
				      	}
			      	}
			      }
			  }

			  this.updatebubble = function(data){
			  	var df = preprocess(data);
			  	draw(df);
			  }
			  return this;
		}

		bubble(data);


	});      


    // bubb cast
    d3.csv("./processing/netflix_titles.csv", function(error,data){
		if (error)  throw error;

		var bubblechart = bubble(data);


	    function bubble(data){
	    	var preprocess = function(data){
	    		var a = []
                var cnt = 0
	    		var df = _.map(data, function(d) {
	    			return {
	    				'director'   : d.cast,
	    				'movies' : d.title,
	    			}
	    		}); 
                df1 = d3.nest().key(function(d){ return d.director}).entries(df);
	    		dfcount = d3.nest().key(function(d){ return d.director}).rollup(
                    function(leaves) { return leaves.length; }).entries(df);
   
	    		a.children = _.map(df1, function(d){
	    			var key = d.key;
                    var counts = d.values.length;
	    			return { name:key, counts: +counts}
	    		}).filter(d => isNaN(d.name));    
	    		a.children = _.sortBy(a.children,function(d) {
	    			return d.counts;
	    		}).reverse(); 
                console.log(a.children);

	    		return a;
	    	}
	    	var tooltip = d3.select("#bubblechart").append("div")
	    	.attr("id","tooltip").style("font-size","20px");
	    	var svg = d3.select("#bubblechart")
	    	.append("svg")
	    	.attr("width", "100%")
	    	.attr("height", "100%")
	    	.attr("class", "bubble");  

	    	var height = $("#bubblechart").height() , width = $("#bubblechart").width();
	    	var color = d3.scaleOrdinal(d3.schemeCategory20c);  
	    	var df = preprocess(data);

	    	var pack = d3.pack(df)
	    	.size([width-5, height-5])
	    	.padding(1.5);  

	    	draw(df);

	    	function draw(df){

            	df.children = df.children.slice(0,20);
            	var top10 = _.map(df.children.slice(0,20), function(d){
            		return d.name;
            	});

		 		var t = d3.transition()
		 		.duration(750);

		 		var h = d3.hierarchy(df)
		 		.sum(function(d) { return d.counts; });   

		 		var circle = svg.selectAll("circle")
		 		.data(pack(h).leaves(), function(d){ return d.data.name; });

		 		var text = svg.selectAll("text")
		 		.data(pack(h).leaves(), function(d){ return d.data.name; });

          		circle.exit()
          		.style("fill", "#b26745")
          		.transition(t)
          		.attr("r", 1e-6)
          		.remove();

          		text.exit()
          		.transition(t)
          		.attr("opacity", 1e-6)
          		.remove();

          		console.log(df.children.length);

          		if(df.children.length > 1){

	                circle
	                .transition(t)
	                .style("fill", function(d){ return color(d); })
	                .attr("r", function(d){ return d.r })
	                .attr("cx", function(d){ return d.x; })
	                .attr("cy", function(d){ return d.y; })

	                text
	                .attr("x", function(d){ return d.x; })
	                .attr("y", function(d){ return d.y; })
	                .text(function(d){ return $.inArray(d.data.name, top10) > -1 ? (d.r == 0 ? "":d.data.name) : ""; })
	                .style("pointer-events","none")
	                .each(wrap)

				      circle.enter().append("circle")
				      .attr("r", 1e-6)
				      .attr("cx", function(d){ return d.x; })
				      .attr("cy", function(d){ return d.y; })
				      .style("fill", "#fff")
				      .on("mousemove", function(d,i){
				      	d3.select(this).style("fill", "#E74C3C");
				      	tooltip
				      	.style("visibility", "visible")
				      	.html(`<b>${d.data.name}</b><br>${d.data.counts} movies`)
				      	.style("top", (d3.event.pageY-60)+"px")
				      	.style("left",d3.event.pageX+10+"px");
				      })
				      .on("mouseout", function (d) { 
				      	d3.select(this).style("fill", "#831010");
				      	d3.selectAll("#tooltip").style("visibility", "hidden");
				      })
				      .transition(t)
				      .style("fill", "#831010" )
				      .attr("r", function(d){ return d.r });

				      var mytext = text.enter().append("text")
				      .attr("opacity", 1e-6)
				      .attr("x", function(d){ return d.x; })
				      .attr("y", function(d){ return d.y; })
				      .style("text-anchor", "middle")
				      .text(function(d){ return $.inArray(d.data.name, top10) > -1 ? (d.r == 0 ? "":d.data.name) : ""; })
				      .style("pointer-events","none")
				      .transition(t)
				      .style("fill","#FFF")
				      .attr("opacity", 1).each(wrap);
          		}

			      function wrap(d) {
			      	if ( $.inArray(d.data.name, top10) > -1 && d.r > 0){
			      		var text = d3.select(this),
			      		width = (d.r * 2)-10,
			      		x = d.x,
			      		y = d.y,
			      		words = d.data.name.split(/\s+/),
			      		word,
			      		line = [],
			      		lineNumber = 0,
			      		lineHeight = 1.1;
			      		var tspan = text.text(null).append("tspan").attr("x", x).attr("y", y);
			      		if (words.length > 4){
			      			words = words.splice(0,4);
			      			words.push("...")
			      			words = words.reverse();
			      		}else{
			      			words = words.reverse();
			      		}
			      		if(d.r > 50){
				      		while (word = words.pop()) {
				      			line.push(word);
				      			tspan.text(line.join(" "));
				      			if (tspan.node().getComputedTextLength() > width) {
				      				line.pop();
				      				tspan.text(line.join(" "));
				      				line = [word];
				      				tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").text(word);
				      			}
				      		}
				      	}
			      	}
			      }
			  }

			  this.updatebubble = function(data){
			  	var df = preprocess(data);
			  	draw(df);
			  }
			  return this;
		}

	}); 


    // hist_tot
    d3.csv("./processing/res1.csv", function(error,data){
		if (error)  throw error;
        
        function hist_tot(){
            var tvshows = [
                {duration: "1 Season", counts: 1608},
                {duration: "2 Seasons", counts: 382},
                {duration: "3 Seasons", counts: 184},
                {duration: "4 Seasons", counts: 87},
                {duration: "5 Seasons", counts: 58},
                {duration: "6 Seasons", counts: 30},
                {duration: "7 Seasons", counts: 19},
                {duration: "8 Seasons", counts: 18},
                {duration: "9 Seasons", counts: 8},
                {duration: "10 Seasons", counts: 6},
                {duration: "11 Seasons", counts: 3},
                {duration: "12 Seasons", counts: 2},
                {duration: "13 Seasons", counts: 2},
                {duration: "15 Seasons", counts: 2},
                {duration: "16 Seasons", counts: 1}
            ];

            var movies = [
                {duration: "0 - 60 mins", counts: 420},
                {duration: "60 - 90 mins", counts: 1233},
                {duration: "90 - 95 mins ", counts: 636},
                {duration: "95 - 120 mins", counts: 2031},
                {duration: "120 - 150 mins", counts: 815},
                {duration: "150 - 300 mins", counts: 242}
            ];


            var margin = {top: 30, right: 30, bottom: 70, left: 60},
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

            var tooltip = d3.select("body").append("div").attr("id","tooltip").style("font-size","20px"); 


            var svg = d3.select("#total_tv_shows")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "94%")
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


            var x = d3.scaleBand()
            .range([ 0, width ])
            .padding(0.2);
            var xAxis = svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .style("text-anchor", "end")
            .style("fill", "white"); 
           


            var y = d3.scaleLinear()
            .range([ height, 0]);
            var yAxis = svg.append("g")
            .attr("class", "myYaxis")
            .style("text-anchor", "end")
            .style("fill", "white"); 


            function update(data) {

                // Update the X axis
                x.domain(data.map(function(d) { return d.duration; }))
                xAxis.call(d3.axisBottom(x))
                .selectAll("text")
                    .attr("transform", "translate(-10,10)rotate(-45)")
                    .style("text-anchor", "end")



                y.domain([0, d3.max(data, function(d) { return d.counts }) ]);
                yAxis.transition().duration(1000).call(d3.axisLeft(y));


                var u = svg.selectAll("rect")
                .data(data)

                u
                .enter()
                .append("rect") 
                .merge(u) 
                .on("mousemove", function(d){
                    console.log(d.counts)
                    d3.select(this).style("fill", "#E74C3C");
                    tooltip
                    .style("visibility", "visible")
                    .html("Duration: " + (d.duration) + "<br>" + "No. of shows: " + (d.counts))
                    .style("top", (d3.event.pageY-60)+"px")
                    .style("left",d3.event.pageX+10+"px");
                })
                .on("mouseout", function (d) { 
                    d3.select(this).style("fill", "firebrick");
                    d3.selectAll("#tooltip").style("visibility", "hidden");
                })
                .transition() 
                .duration(1000)
                    .attr("x", function(d) { return x(d.duration); })
                    .attr("y", function(d) { return y(d.counts); })
                    .attr("width", x.bandwidth())
                    .attr("height", function(d) { return height - y(d.counts); })
                    .attr("fill", "firebrick")
                    .attr("opacity", 0.8)
                u
                .exit()
                .remove()
            }


            update(tvshows)
            
            this.update = function(data){
                update(movies)
            }
        }

        hist_tot();

    });  

})