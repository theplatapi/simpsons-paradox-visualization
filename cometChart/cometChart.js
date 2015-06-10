$(function() {
  var margin = {
    top: 50,
    right: 100,
    bottom: 50,
    left: 100
  };
  var width = 500;
  var height = 400;
  var segmentName = 'birthweight';
  var filterName = 'state';

  var svg = d3.select("#chart")
      .append("svg")
      .attr('width', "100%")
      .attr('height', height + margin.top + margin.bottom);

  var segments = svg.append("g")
      .attr("transform", "translate(0, 30)")
      .attr("class", "segments");

  d3.csv("data/output2.csv", function(err, data) {
    var scales = getDataScales(data, segmentName, width, height);

    drawComets(segments, data, scales, filterName, segmentName);
    addAxis(segments, scales.size, 'bottom', margin, height);
    addAxis(segments, scales.value, 'left', margin, height)
  });
});
