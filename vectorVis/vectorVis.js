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

  var svg = d3.select("#vectorVis").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("data/students.csv", function(err, data) {
    x.domain([0, 9000]);
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
        .text("Applicants");

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


    for (var i = 0; i < data.length; i+=2) {
      var lineColor = +data[i].admitted > +data[i+1].admitted ? 'blue' : 'pink';

      svg.append("line")
          .attr("x1", x(data[i].applicants))
          .attr("y1", y(data[i].admitted))
          .attr("x2", x(data[i+1].applicants))
          .attr("y2", y(data[i+1].admitted))
          //.attr("marker-end", "url(#arrowhead)")
          .attr("stroke-width", 2)
          //.attr("stroke", color(data[i].department));
          //pink line if more women admitted then men
          .attr("stroke", lineColor);
    }

    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", function(d) { return x(d.applicants); })
        .attr("cy", function(d) { return y(d.admitted); })
        .style("fill", function(d) { return d.gender === 'male' ? 'blue' : 'pink'; })
        .append('title')
        .text(function (d) {
          return d.gender + ': (Applied: ' + d.applicants + ", Admitted: " + d.admitted + '%)';
        });

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

