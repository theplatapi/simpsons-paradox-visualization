//functions to convert hex to rgb values
function hexToR(h) {
  return parseInt((cutHex(h)).substring(0, 2), 16) / 255;
}

function hexToG(h) {
  return parseInt((cutHex(h)).substring(2, 4), 16) / 255;
}

function hexToB(h) {
  return parseInt((cutHex(h)).substring(4, 6), 16) / 255;
}

function cutHex(h) {
  return (h.charAt(0) == "#") ? h.substring(1, 7) : h;
}

$.getScripts = function(arr, path) {
  var _arr = $.map(arr, function(src) {
    return $.get((path || "") + src);
  });

  _arr.push($.Deferred(function(deferred) {
    $(deferred.resolve);
  }));

  return $.when.apply($, _arr);
};

//Puts text in center of canvas.
var makeTextCanvas = function(text, width, height) {
  var textContext = document.createElement("canvas").getContext("2d");
  textContext.canvas.width = width;
  textContext.canvas.height = height;
  textContext.font = "20px Arial";
  textContext.textAlign = "center";
  textContext.textBaseline = "middle";
  textContext.fillStyle = "black";
  textContext.clearRect(0, 0, textContext.canvas.width, textContext.canvas.height);
  textContext.fillText(text, width / 2, height / 2);
  return textContext.canvas;
};

var shaders = [
  'axesVs.glsl',
  'axesFs.glsl',
  'vanillaVs.glsl',
  'vanillaFs.glsl',
  'textVs.glsl',
  'textFs.glsl'
];

$.getScripts(shaders, 'cometChart3D/shaders/').done(function(axesVs, axesFs, pointVs, pointFs, textVs, textFs) {
  "use strict";

  $(function() {
    var canvas = $('#chart3D');
    var mouseDown = false;
    var lastX = 0;
    var lastY = 0;
    var yRotation = 40;
    var xRotation = 0;
    var pointsLoaded = false;
    var rotateYWithMouse = false;
    var weightValueBufferInfo = null;
    var employmentBufferInfo = null;
    var employment2BufferInfo = null;
    var currentLineBufferInfo = null;
    var weightValuePoints = {
      position: {numComponents: 3, data: []},
      indices: {numComponents: 2, data: []},
      color: {numComponents: 3, data: []}
    };
    var employmentPoints = {
      position: {numComponents: 3, data: []},
      indices: {numComponents: 2, data: []},
      color: {numComponents: 3, data: []}
    };
    var employment2Points = {
      position: {numComponents: 3, data: []},
      indices: {numComponents: 2, data: []},
      color: {numComponents: 3, data: []}
    };

    //http://twgljs.org/docs/module-twgl.html
    twgl.setAttributePrefix("a_");
    var m4 = twgl.m4;
    var gl = twgl.getWebGLContext(canvas[0]);
    var axesShaderInfo = twgl.createProgramInfo(gl, [axesVs[0], axesFs[0]]);
    var vanillaShaderInfo = twgl.createProgramInfo(gl, [pointVs[0], pointFs[0]]);
    var textShaderInfo = twgl.createProgramInfo(gl, [textVs[0], textFs[0]]);

    var axes = {
      position: [
        0, 0, 0,
        0, 1, 0,
        1, 0, 0,
        0, 0, 1
      ],
      indices: [
        0, 1,
        0, 2,
        0, 3
      ]
    };

    axes.position = axes.position.map(function(item) {
      return item * 2;
    });

    var axesBufferInfo = twgl.createBufferInfoFromArrays(gl, axes);

    var identity = m4.identity();
    var rotateX = m4.rotateX(identity, 90 * Math.PI / 180);
    var translateOver = m4.translation([0.2, 0.15, 0]);
    var xPlaneBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.multiply(rotateX, translateOver));
    var xTextTex = twgl.createTextures(gl, {
      fromCanvas: {src: makeTextCanvas("weight", 200, 150)}
    });

    var translateBack = m4.translation([-0.2, 0.15, 0]);
    var rotateY = m4.rotateY(identity, 90 * Math.PI / 180);
    var rotateZ = m4.rotateZ(identity, 90 * Math.PI / 180);
    var yPlaneBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.multiply(m4.multiply(rotateX, rotateZ), translateBack));
    var yTextTex = twgl.createTextures(gl, {
      fromCanvas: {src: makeTextCanvas("value", 200, 150)}
    });

    var translateForward = m4.translation([0, 0.15, 0.2]);
    var zPlaneBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.multiply(m4.multiply(rotateX, rotateY), translateForward));
    var zTextTex = twgl.createTextures(gl, {
      fromCanvas: {src: makeTextCanvas("time", 200, 150)}
    });

    var uniforms = {};
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.lineWidth(2.0);

    function render() {
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10);
      var eye = [1, 4, -6];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(view, projection);
      var world = m4.multiply(m4.rotationY(yRotation), m4.rotationX(xRotation));

      uniforms.u_worldViewProjection = m4.multiply(world, viewProjection);

      gl.useProgram(axesShaderInfo.program);
      twgl.setBuffersAndAttributes(gl, axesShaderInfo, axesBufferInfo);
      twgl.setUniforms(axesShaderInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.LINES, axesBufferInfo);

      if (pointsLoaded) {
        gl.useProgram(vanillaShaderInfo.program);
        twgl.setBuffersAndAttributes(gl, vanillaShaderInfo, currentLineBufferInfo);
        twgl.setUniforms(vanillaShaderInfo, uniforms);
        twgl.drawBufferInfo(gl, gl.LINES, currentLineBufferInfo);
      }

      //Makes text plane translucent
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      //draw text
      gl.useProgram(textShaderInfo.program);
      twgl.setBuffersAndAttributes(gl, textShaderInfo, xPlaneBufferInfo);
      twgl.setUniforms(textShaderInfo, {
        u_texture: xTextTex.fromCanvas,
        u_worldViewProjection: uniforms.u_worldViewProjection
      });
      twgl.drawBufferInfo(gl, gl.TRIANGLES, xPlaneBufferInfo);

      twgl.setBuffersAndAttributes(gl, textShaderInfo, yPlaneBufferInfo);
      twgl.setUniforms(textShaderInfo, {
        u_texture: yTextTex.fromCanvas,
        u_worldViewProjection: uniforms.u_worldViewProjection
      });
      twgl.drawBufferInfo(gl, gl.TRIANGLES, yPlaneBufferInfo);

      twgl.setBuffersAndAttributes(gl, textShaderInfo, zPlaneBufferInfo);
      twgl.setUniforms(textShaderInfo, {
        u_texture: zTextTex.fromCanvas,
        u_worldViewProjection: uniforms.u_worldViewProjection
      });
      twgl.drawBufferInfo(gl, gl.TRIANGLES, zPlaneBufferInfo);

      requestAnimationFrame(render);
    }

    canvas.on('mousedown', function(event) {
      mouseDown = true;
      lastX = event.clientX;
      lastY = event.clientY;
    });

    $(document).on('mouseup', function() {
      mouseDown = false;
    }).on('mousemove', function(event) {
      if (mouseDown) {
        var deltaX = event.clientX - lastX;
        var deltaY = lastY - event.clientY;

        yRotation += deltaX / 2 * Math.PI / 180;
        if (rotateYWithMouse) {
          xRotation += deltaY / 2 * Math.PI / 180;
        }

        lastX = event.clientX;
        lastY = event.clientY;
      }
    }).on("keydown", function(event) {
      //y key
      if (event.which == 89) {
        rotateYWithMouse = true;
      }
    }).on("keyup", function(event) {
      //y key
      if (event.which == 89) {
        rotateYWithMouse = false;
      }
    });

    $("#weightData").on('click', function(event) {
      currentLineBufferInfo = weightValueBufferInfo;

      xTextTex = twgl.createTextures(gl, {
        fromCanvas: {src: makeTextCanvas("weight", 200, 150)}
      });

      yTextTex = twgl.createTextures(gl, {
        fromCanvas: {src: makeTextCanvas("value", 200, 150)}
      });

      zTextTex = twgl.createTextures(gl, {
        fromCanvas: {src: makeTextCanvas("time", 200, 150)}
      });
    });

    $("#employmentData").on('click', function(event) {
      currentLineBufferInfo = employmentBufferInfo;

      xTextTex = twgl.createTextures(gl, {
        fromCanvas: {src: makeTextCanvas("size", 200, 150)}
      });

      yTextTex = twgl.createTextures(gl, {
        fromCanvas: {src: makeTextCanvas("jobless %", 200, 150)}
      });

      zTextTex = twgl.createTextures(gl, {
        fromCanvas: {src: makeTextCanvas("time", 200, 150)}
      });
    });

    $("#employmentData2").on('click', function(event) {
      currentLineBufferInfo = employment2BufferInfo;

      xTextTex = twgl.createTextures(gl, {
        fromCanvas: {src: makeTextCanvas("size", 200, 150)}
      });

      yTextTex = twgl.createTextures(gl, {
        fromCanvas: {src: makeTextCanvas("jobless %", 200, 150)}
      });

      zTextTex = twgl.createTextures(gl, {
        fromCanvas: {src: makeTextCanvas("time", 200, 150)}
      });
    });

    var parseEmployment = function(data, points) {
      var index = 0;
      var maxDiff = 0;
      var dates = data.dates;
      var aggregate = data.aggregate;
      delete data.dates;
      delete data.aggregate;
      var xScale = d3.scale.linear().domain([58000, 115000]).range([0, 1.5]).nice();
      var yScale = d3.scale.linear().domain([6, 18]).range([0, 1.5]).nice();

      _.mapObject(data, function(val, key) {
        val.diff = [];
        for (var i = 0; i < dates.length; i++) {
          points.position.data.push(xScale(val.laborSizes[i]), yScale(val.unemploymentRates[i]), i/2);

          if (i < dates.length-1) {
            points.indices.data.push(index+i, index+i+1);

            //calculate diffs for color
            var curDiff = val.laborSizes[i+1] - val.laborSizes[i];
            val.diff.push(curDiff);

            if (Math.abs(curDiff) > maxDiff) {
              maxDiff = Math.abs(curDiff)
            }
          }
        }
        index += dates.length;
      });

      //add color
      var colorScale = d3.scale.linear()
          .domain([-maxDiff, 0, maxDiff])
          .range(['orange', 'grey', 'blue']);

      _.mapObject(data, function(val, key) {
        var color;
        for (var i = 0; i < val.diff.length; i++) {
          color = colorScale(val.diff[i]);

          points.color.data.push(hexToR(color), hexToG(color), hexToB(color));
        }
        points.color.data.push(hexToR(color), hexToG(color), hexToB(color));
      });

      //add aggregate
      for (var i = 0; i < dates.length; i++) {
        points.position.data.push(xScale(aggregate.laborSizes[i]), yScale(aggregate.unemploymentRates[i]), i/2);

        if (i < dates.length - 1) {
          points.indices.data.push(index+i, index+i+1);
          points.color.data.push(1, 0, 0);
        }
        points.color.data.push(1, 0, 0);
      }

      return twgl.createBufferInfoFromArrays(gl, points);
    };

    d3.json("data/employment.json", function(err, data) {
      if (!err) {
        employmentBufferInfo = parseEmployment(data, employmentPoints);
        pointsLoaded = true;
      }
      else {
        console.log(err);
      }
    });

    d3.json("data/employment2.json", function(err, data) {
      if (!err) {
        employment2BufferInfo = parseEmployment(data, employment2Points);
        pointsLoaded = true;
      }
      else {
        console.log(err);
      }
    });

    d3.csv("data/output2.csv", function(err, data) {
      if (err) {
        console.log(err);
        return;
      }
      var i = 0, diff = 0;
      var sizeSum = [0, 0], comboSum = [0, 0];

      var x1 = d3.scale.log()
          .domain(d3.extent(data, function(d) {
            return +d.startweight;
          }))
          .range([0, 1.5]);

      var x2 = d3.scale.log()
          .domain(d3.extent(data, function(d) {
            return +d.endweight;
          }))
          .range([0, 1.5]);

      var y1 = d3.scale.log()
          .domain(d3.extent(data, function(d) {
            return +d.startvalue;
          }))
          .range([0, 1.5]);

      var y2 = d3.scale.log()
          .domain(d3.extent(data, function(d) {
            return +d.endvalue;
          }))
          .range([0, 1.5]);

      data.forEach(function(item) {
        weightValuePoints.position.data.push(x1(+item.startweight), y1(+item.startvalue), 0, x2(+item.endweight), y2(+item.endvalue), 1);
        weightValuePoints.indices.data.push(i++, i++);

        // calculate aggregate line
        sizeSum = [sizeSum[0] + +item.startweight, sizeSum[1] + +item.endweight];
        comboSum = [comboSum[0] + +item.startweight * +item.startvalue, comboSum[1] + +item.endweight * +item.endvalue];

        //calculate diff for color
        item.weightDiff = +item.endweight - +item.startweight;
        if (Math.abs(item.weightDiff) > diff) {
          diff = Math.abs(item.weightDiff);
        }
      });

      var colorScale = d3.scale.linear()
          .domain([-diff, 0, diff])
          .range(['orange', 'grey', 'blue']);

      //second loop to compute colors
      data.forEach(function(item) {
        var color = colorScale(item.weightDiff);
        weightValuePoints.color.data.push(hexToR(color), hexToG(color), hexToB(color), hexToR(color), hexToG(color), hexToB(color));
      });

      var aggregate = {
        startvalue: comboSum[0] / sizeSum[0],
        endvalue: comboSum[1] / sizeSum[1],
        startweight: sizeSum[0] / data.length,
        endweight: sizeSum[1] / data.length
      };

      weightValuePoints.position.data.push(x1(+aggregate.startweight), y1(+aggregate.startvalue), 0, x2(+aggregate.endweight), y2(+aggregate.endvalue), 1);
      weightValuePoints.indices.data.push(i++, i++);
      weightValuePoints.color.data.push(1, 0, 0, 0.7, 0, 0);


      weightValueBufferInfo = twgl.createBufferInfoFromArrays(gl, weightValuePoints);
      currentLineBufferInfo = weightValueBufferInfo;
      pointsLoaded = true;
    });

    requestAnimationFrame(render);
  });
});