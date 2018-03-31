var margin = {top: 20, right: 80, bottom: 30, left: 50},
	width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
    height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

var parseDate = d3.time.format("%m-%Y").parse,
	bisectDate = d3.bisector(function(d) { return d.date; }).left,
	formatValue = d3.format(","),
    formatCurrency = function(d) { return "£" + formatValue(d); };

var URL = "data/house-prices.csv";

var x = d3.time.scale()
.range([0, width]);

var y = d3.scale.linear()
.range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
.scale(x)
.orient("bottom");

var yAxis = d3.svg.axis()
.scale(y)
.orient("left");

var line = d3.svg.line()
.interpolate("basis")
.x(function(d) { return x(d.date); })
.y(function(d) { return y(d.price); });

var svg = d3.select("#chart")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv(URL, function(error, data) {
	color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

	data.forEach(function(d) {
		d.date = parseDate(d.date);
	});

	var regions = color.domain().map(function(name) {
		return {
			name: name,
			values: data.map(function(d) {
				return {date: d.date, price: +d[name]};
			})
		};
	});

	x.domain(d3.extent(data, function(d) { return d.date; }));

	y.domain([
		d3.min(regions, function(c) { return d3.min(c.values, function(v) { return v.price; }); }),
		d3.max(regions, function(c) { return d3.max(c.values, function(v) { return v.price; }); })
	]);
	
	function pathTween(p) {
		var interpolate = d3.scale.quantile()
		.domain([0,1])
		.range(d3.range(1, p.length + 1));
		return function(t) {
			return line(p.slice(0, interpolate(t)));
		};
	}

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Price (£)");

	var region = svg.selectAll(".region")
	.data(regions)
	.enter().append("g")
	.attr("class", "region");

	region.append("path")
		.attr("class", "line")
		.attr("d", function(d) { return line(d.values); })
		.style("stroke", function(d) { return color(d.name); })
		.transition()
        .duration(2000)
        .attrTween("d", function(d) { return pathTween(d.values); });

	region.append("text")
		.datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
		.attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.price) + ")"; })
		.attr("x", 3)
		.attr("dy", ".35em")
		.style("fill", function(d) { return color(d.name); })
		.text(function(d) { return d.name; });
	
	// Overlay focus
	// For each region
	var helper = region.append("g")
		.attr("class", "helper")
		.style("display", "none")
	
	helper.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", 0)
		.attr("y2", height);
	
	var focus = region.append("g")
		.attr("class", "focus")
		.style("display", "none");

	focus.append("circle")
		.attr("r", 4.5);

	focus.append("text")
		.attr("x", 9)
		.attr("dy", ".35em");

	svg.append("rect")
		.attr("class", "overlay")
		.attr("width", width)
		.attr("height", height)
		.on("mouseover", function() { 
			focus.style("display", null)
			helper.style("display", null); 
		})
		.on("mouseout", function() { 
			focus.style("display", "none")
			helper.style("display", "none"); 
		})
		.on("mousemove", mousemove);

	function mousemove() {
		var x0 = x.invert(d3.mouse(this)[0]),
			i = bisectDate(data, x0, 1),
			d0 = data[i - 1],
			d1 = data[i],
			d = x0 - d0.date > d1.date - x0 ? d1 : d0;
		
		helper.attr("transform", "translate(" + x(d.date) + "," + 0 + ")");
		focus.attr("transform", "translate(" + x(d.date) + "," + y(d.London) + ")");
		focus.select("text").text(formatCurrency(d.London));
		
		//console.log(x(d.date) + ',' + y(d.London));
	}

});