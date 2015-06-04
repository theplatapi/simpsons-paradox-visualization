//var vertexShader = require('./vertex.glsl');
//var fragmentShader = require('./axesFs.glsl');

/*
 * TODO:
 * Add aggregate line
 * Axis ticks
 * Make canvas bigger
 * Add an extra time step to data
 */

$.getMultiScripts = function(arr, path, cb) {
  var _arr = $.map(arr, function(src) {
    return $.get((path || "") + src);
  });

  _arr.push($.Deferred(function(deferred) {
    $(deferred.resolve);
  }));

  $.when.apply($, _arr).done(function(axesVs, axesFs, pointVs, pointFs) {
    cb(axesVs[0], axesFs[0], pointVs[0], pointFs[0]);
  });
};

var shaders = [
  'axesVs.glsl',
  'axesFs.glsl',
  'pointVs.glsl',
  'pointFs.glsl'
];

$.getMultiScripts(shaders, 'cometChart3D/shaders/', function(axesVs, axesFs, pointVs, pointFs) {
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
      position: [],
      indices: []
    };

    twgl.setAttributePrefix("a_");
    var m4 = twgl.m4;
    var gl = twgl.getWebGLContext(canvas[0]);
    var axesShaderInfo = twgl.createProgramInfo(gl, [axesVs, axesFs]);
    var pointsShaderInfo = twgl.createProgramInfo(gl, [pointVs, pointFs]);

    //var axesShader = twgl.createProgramInfo(gl, ["vs", "fs"]);
    //var pointsShader = twgl.createProgramInfo(gl, ["point-vs", "point-fs"]);
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
      ],
      normal: [
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0
      ],
      texcoord: [
        0, 0,
        0, 1,
        1, 0,
        1, 1
      ]
    };

    axes.position = axes.position.map(function(item) {
      return item * 2;
    });

    var axesBufferInfo = twgl.createBufferInfoFromArrays(gl, axes);

    var tex = twgl.createTexture(gl, {
      min: gl.NEAREST,
      mag: gl.NEAREST,
      src: [
        255, 255, 255, 255,
        192, 192, 192, 255,
        192, 192, 192, 255,
        255, 255, 255, 255
      ]
    });

    var uniforms = {
      u_lightWorldPos: [1, 8, -10],
      u_lightColor: [1, 0.8, 0.8, 1],
      u_ambient: [0, 0, 0, 1],
      u_specular: [1, 1, 1, 1],
      u_shininess: 50,
      u_specularFactor: 1,
      u_diffuse: tex
    };

    function render() {
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10);
      var eye = [1, 4, -6];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(view, projection);
      var world = m4.rotationY(rotation);

      uniforms.u_viewInverse = camera;
      uniforms.u_world = world;
      uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
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
        points.position.push(x1(+item.startweight), y1(+item.startvalue), 0);
        points.position.push(x2(+item.endweight), y2(+item.endvalue), 1);

        points.indices.push(i++);
        points.indices.push(i++);
      });

      pointsLoaded = true;
      pointsBufferInfo = twgl.createBufferInfoFromArrays(gl, points);
    });

    requestAnimationFrame(render);
  });
});