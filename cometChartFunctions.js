// graph elements
function addAxis(element, scale, location, margin, height) {
  var axis = d3.svg.axis().scale(scale).orient(location)
      .ticks(10, ",.1s");

  element.append("g").attr("class", "axis")
      .attr("transform", placeAxis(location, margin, height))
      .call(axis);

}

function placeAxis(location, margin, height) {
  if (location == 'bottom') {
    return "translate(" + margin.left + "," + (height) + ")";
  } else if (location == 'left') {
    return "translate(" + margin.left + ",0)";
  }
}

function applyData(data, segmentName, width, height) {
  // initialize counter variables
  var maxValue = 0, maxWeight = 0, diff = 0, sizeSum = [0, 0], comboSum = [0, 0];

  // use data to define max value, weight, weight diffs, and sum size and combo
  data.forEach(function(d) {
    d.weightDiff = +d.endweight - +d.startweight;
    if (Math.abs(d.weightDiff) > diff) {
      diff = Math.abs(d.weightDiff)
    }
    maxValue = Math.max(maxValue, +d.startvalue, +d.endvalue);
    maxWeight = Math.max(maxWeight, +d.startweight, +d.endweight);

    // calculate for aggregate
    sizeSum = [sizeSum[0] + +d.startweight,
      sizeSum[1] + +d.endweight];
    comboSum = [comboSum[0] + +d.startweight * +d.startvalue,
      comboSum[1] + +d.endweight * +d.endvalue];
  });

  // calculate and append aggregate data
  // assumes same number of segments for start & end
  // assumes no missing values
  var aggregate = {
    startvalue: comboSum[0] / sizeSum[0],
    endvalue: comboSum[1] / sizeSum[1],
    startweight: sizeSum[0] / data.length,
    endweight: sizeSum[1] / data.length,
  };
  aggregate[segmentName] = 'aggregate';
  data.push(aggregate);

  // sets x and y scale to determine size of visible boxes
  var sizeScale = d3.scale.log().clamp(true)
      .domain([100, maxWeight])
      .range([0, width]);

  var valueScale = d3.scale.log().clamp(true)
      .domain([maxValue, .9])
      .range([0, height]);

  // color scale, based on data diffs
  var colorScale = d3.scale.linear()
      .domain([-diff, 0, diff])
      .range(['orange', 'grey', 'blue']);

  return {size: sizeScale, value: valueScale, color: colorScale}

}

// data to polygons
function valuesToPoints(startweight, endweight, startvalue, endvalue, halfWidth) {
  var points = [[startweight, startvalue]];
  var a = startweight - endweight;
  var b = startvalue - endvalue;
  var dist = Math.sqrt(a * a + b * b);
  var newPoint1 = [halfWidth / dist * b + endweight, -halfWidth / dist * a + endvalue];
  var newPoint2 = [-halfWidth / dist * b + endweight, halfWidth / dist * a + endvalue];
  points.push(newPoint1, newPoint2);
  return points.join(" ")
}

// function to draw comets
function drawComets(element, data, scales, filterName, segmentName) {
  element.selectAll("polygon")
      .data(data)
      .enter()
      .append("polygon")
      .attr("points", function(d) {
        return valuesToPoints(scales.size(+d.startweight),
            scales.size(+d.endweight),
            scales.value(+d.startvalue),
            scales.value(+d.endvalue),
            3);
      })
      .attr("fill", function(d) {
        if (d[segmentName] == 'aggregate') {
          return 'black';
        } else {
          return scales.color(d.weightDiff)
        }
      })
      .append("title")
      .text(function(d) {
        return d[filterName] + '; ' +
            segmentName + ': ' +
            d[segmentName] +
            '; value: ' +
            d.startvalue + ', ' +
            d.endvalue +
            '; weights: ' +
            d.startweight + ', ' +
            d.endweight;
      });

}
