// applicants admitted
//Men	  8442	44%
//Women	4321	35%


//Department	Men	Women
//Applicants	Admitted	Applicants	Admitted
//A	825	62%	108	82%
//B	560	63%	25	68%
//C	325	37%	593	34%
//D	417	33%	375	35%
//E	191	28%	393	24%
//F	272	6%	341	7%

document.addEventListener("DOMContentLoaded", function(event) {
  var data = [
    {
      applicants: 0,
      admitted: 0
    },
    {
      applicants: 40,
      admitted: 44
    }
  ];

  var lineFunction = d3.svg.line()
                            .x(function(data) { return data.applicants; })
                            .y(function(data) { return data.admitted; })
                            .interpolate("linear");

  var svg = d3.select("#vectorVis")
      .append("svg")
        .attr('width', 400)
        .attr('height', 400)
      .append('path')
        .attr('d', lineFunction(data))
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("fill", "none");
});

