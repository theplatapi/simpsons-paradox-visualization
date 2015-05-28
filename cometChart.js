var margin = {
      top: 50,
      right: 100,
      bottom: 50,
      left: 100
    },
    width = 500,
    height = 400;

var formatAsNumber = d3.format(",.0f");

var filterName = 'state', segmentName = 'birthweight';

// introduce svg element
var svg = d3.select("#chart")
    .append("svg")
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .style("margin-left", -margin.left + "px")
    .style("margin.right", -margin.right + "px");

var segments = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "segments");

// call and use data
d3.csv("output2.csv", function(error, data) {
  if (error) return console.error('error');

  // filter by state, if desired
  /*	data = data.filter(function(d) {
   return d[filterName] == 'Ohio';
   });
   */
  // set scales
  var scales = applyData(data);

  // add the comets
  drawComets(segments, data, scales);

  // adding x axis, and y axis
  addAxis(segments, scales.size, 'bottom');
  addAxis(segments, scales.value, 'left')

});
