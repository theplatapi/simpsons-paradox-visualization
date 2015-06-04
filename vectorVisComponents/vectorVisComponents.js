$(function() {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var x = d3.scale.linear()
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

  var svg = d3.select("#vectorVisComponents").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("data/students2.csv", function(err, data) {
    data.forEach(function(item) {
      item.applicants = +item.applicants;
      item.admitted = +item.admitted;
    });
    //x.domain(d3.extent(data, function(d) { return +d.applicants; })).nice();
    //y.domain(d3.extent(data, function(d) { return +d.admitted; })).nice();
    x.domain([0, 100]);
    y.domain([0, 100]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Applicant (%)");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Admitted (%)");

    svg.append("marker")
        .attr('id', 'arrowhead')
        .attr('orient', 'auto')
        .attr('markerWidth', '2')
        .attr('markerHeight', '4')
        .attr('refX', '0.1')
        .attr('refY', '2')
        .append('path')
        .attr('fill', 'red')
        .attr('d', 'M0,0 V4 L2,2 Z');

    //get all female points from data
    var female = data.filter(function(item) {
      return item.gender === 'female';
    });

    //get all male points from data
    var male = data.filter(function(item) {
      return item.gender === 'male';
    });

    //Put into function and run for male
    var femaleAggregate = female.shift();

    var prev = {x: 0, y: 0};
    for (var i = 0; i < female.length; i++) {
      var cur = {
        x: female[i].applicants / femaleAggregate.applicants * 100 + prev.x,
        y: (female[i].admitted / femaleAggregate.admitted * 100) + prev.y
      };

      svg.append("line")
          .attr("x1", x(prev.x))
          .attr("y1", y(prev.y))
          .attr("x2", x(cur.x))
          .attr("y2", y(cur.y))
          .attr("marker-end", "url(#arrowhead)")
          .attr("stroke-width", 2)
          .attr("stroke", 'pink');
      prev = cur;
      //console.log(prev);
    }


    //svg.selectAll(".dot")
    //    .data(data)
    //    .enter().append("circle")
    //    .attr("class", "dot")
    //    .attr("r", 3.5)
    //    .attr("cx", function(d) { return x(d.applicants); })
    //    .attr("cy", function(d) { return y(d.admitted); })
    //    .style("fill", function(d) { return d.gender === 'male' ? 'blue' : 'pink'; })
    //    .append('title')
    //    .text(function (d) {
    //      return d.gender + ': (Applied: ' + d.applicants + ", Admitted: " + d.admitted + '%)';
    //    });

    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

  });
});

