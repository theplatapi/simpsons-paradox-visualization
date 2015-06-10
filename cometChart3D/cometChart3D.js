/*
 * TODO:
 * Axis ticks/labels
 * Make canvas bigger
 * Add an extra time step to data
 * Change data set with dropdown
 * Change background
 */

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
  textContext.canvas.width  = width;
  textContext.canvas.height = height;
  //textContext.scale(-1, 1);
  textContext.font = "20px monospace";
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
  'pointVs.glsl',
  'pointFs.glsl',
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
    var rotation = 40;
    var pointsLoaded = false;
    var pointsBufferInfo = null;
    var points = {
      position: {numComponents: 3, data: []},
      indices: {numComponents: 2, data: []},
      color: {numComponents: 3, data: []}
    };

    //http://twgljs.org/docs/module-twgl.html
    twgl.setAttributePrefix("a_");
    var m4 = twgl.m4;
    var gl = twgl.getWebGLContext(canvas[0]);
    var axesShaderInfo = twgl.createProgramInfo(gl, [axesVs[0], axesFs[0]]);
    var pointsShaderInfo = twgl.createProgramInfo(gl, [pointVs[0], pointFs[0]]);
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
      fromCanvas: {src: makeTextCanvas("weight", 250, 52)}
    });

    //Respositon so top faces z axis
    var translateBack = m4.translation([-0.2, 0.15, 0]);
    var rotateY = m4.rotateY(identity, 90 * Math.PI / 180);
    var rotateZ = m4.rotateZ(identity, 90 * Math.PI / 180);
    var yPlaneBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.multiply(m4.multiply(rotateX, rotateZ), translateBack));
    var yTextTex = twgl.createTextures(gl, {
      fromCanvas: {src: makeTextCanvas("value", 250, 52)}
    });


    /*
     var translateBack = m4.translation([0, 0.15, -0.2]);
     var rotateX2 = m4.rotateX(identity, 180 * Math.PI / 180);
     var rotateY = m4.rotateY(identity, 90 * Math.PI / 180);
     var rotateZ = m4.rotateZ(identity, -90 * Math.PI / 180);
     var yPlaneBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.multiply(m4.multiply(rotateZ, rotateX2), translateBack));
     var yTextTex = twgl.createTextures(gl, {
     fromCanvas: {src: makeTextCanvas("value", 250, 52)}
     });
     */

    var translateForward = m4.translation([0, 0.15, 0.2]);
    var zPlaneBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.multiply(m4.multiply(rotateX, rotateY), translateForward));
    var zTextTex = twgl.createTextures(gl, {
      fromCanvas: {src: makeTextCanvas("time", 250, 52)}
    });

    var uniforms = {};
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

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
      var world = m4.rotationY(rotation);

      uniforms.u_worldViewProjection = m4.multiply(world, viewProjection);

      gl.useProgram(axesShaderInfo.program);
      twgl.setBuffersAndAttributes(gl, axesShaderInfo, axesBufferInfo);
      twgl.setUniforms(axesShaderInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.LINES, axesBufferInfo);

      if (pointsLoaded) {
        gl.useProgram(pointsShaderInfo.program);
        twgl.setBuffersAndAttributes(gl, pointsShaderInfo, pointsBufferInfo);
        twgl.setUniforms(pointsShaderInfo, uniforms);
        twgl.drawBufferInfo(gl, gl.LINES, pointsBufferInfo);
      }

      //Makes text plane translucent
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      //draw text
      gl.useProgram(textShaderInfo.program);
      twgl.setBuffersAndAttributes(gl, textShaderInfo, xPlaneBufferInfo);
      twgl.setUniforms(textShaderInfo, {u_texture: xTextTex.fromCanvas, u_worldViewProjection: uniforms.u_worldViewProjection});
      twgl.drawBufferInfo(gl, gl.TRIANGLES, xPlaneBufferInfo);

      twgl.setBuffersAndAttributes(gl, textShaderInfo, yPlaneBufferInfo);
      twgl.setUniforms(textShaderInfo, {u_texture: yTextTex.fromCanvas, u_worldViewProjection: uniforms.u_worldViewProjection});
      twgl.drawBufferInfo(gl, gl.TRIANGLES, yPlaneBufferInfo);

      twgl.setBuffersAndAttributes(gl, textShaderInfo, zPlaneBufferInfo);
      twgl.setUniforms(textShaderInfo, {u_texture: zTextTex.fromCanvas, u_worldViewProjection: uniforms.u_worldViewProjection});
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
    });

    $(document).on('mousemove', function(event) {
      if (mouseDown) {
        var deltaX = event.clientX - lastX;

        rotation += deltaX / 2 * Math.PI / 180;
        lastX = event.clientX;
      }
    });

    d3.csv("data/output2.csv", function(err, data) {
      if (err) {
        console.log(err);
        return;
      }
      var i = 0;
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
        points.position.data.push(x1(+item.startweight), y1(+item.startvalue), 0, x2(+item.endweight), y2(+item.endvalue), 1);
        points.indices.data.push(i++, i++);
        //TODO: Change start and end color like comet
        points.color.data.push(1, 0.6, 0, 1, 0.3, 0);

        // calculate aggregate line
        sizeSum = [sizeSum[0] + +item.startweight,
          sizeSum[1] + +item.endweight];
        comboSum = [comboSum[0] + +item.startweight * +item.startvalue,
          comboSum[1] + +item.endweight * +item.endvalue];
      });

      var aggregate = {
        startvalue: comboSum[0] / sizeSum[0],
        endvalue: comboSum[1] / sizeSum[1],
        startweight: sizeSum[0] / data.length,
        endweight: sizeSum[1] / data.length
      };

      points.position.data.push(x1(+aggregate.startweight), y1(+aggregate.startvalue), 0, x2(+aggregate.endweight), y2(+aggregate.endvalue), 1);
      points.indices.data.push(i++, i++);
      points.color.data.push(0, 0.6, 1, 0, 0.3, 0);

      pointsLoaded = true;
      pointsBufferInfo = twgl.createBufferInfoFromArrays(gl, points);
    });

    requestAnimationFrame(render);
  });
});