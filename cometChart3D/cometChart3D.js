//var vertexShader = require('./vertex.glsl');
//var fragmentShader = require('./fragment.glsl');

$(function() {
  "use strict";
  var canvas = $('#chart3D');
  var mouseDown = false;
  var lastX = 0;
  var lastY = 0;
  var rotation = 40;
  var pointsLoaded = false;
  var pointsBufferInfo = null;
  var points = {
    position: []
  };

  twgl.setAttributePrefix("a_");
  var m4 = twgl.m4;
  var gl = twgl.getWebGLContext(canvas[0]);
  var axesShader = twgl.createProgramInfo(gl, ["vs", "fs"]);
  var pointsShader = twgl.createProgramInfo(gl, ["point-vs", "point-fs"]);
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
    return item*2;
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

    gl.useProgram(axesShader.program);
    twgl.setBuffersAndAttributes(gl, axesShader, axesBufferInfo);
    twgl.setUniforms(axesShader, uniforms);
    twgl.drawBufferInfo(gl, gl.LINES, axesBufferInfo);

    if (pointsLoaded) {
      gl.useProgram(pointsShader.program);
      twgl.setBuffersAndAttributes(gl, pointsShader, pointsBufferInfo);
      twgl.setUniforms(pointsShader, uniforms);
      twgl.drawBufferInfo(gl, gl.POINTS, pointsBufferInfo);
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

  canvas.on('mousemove', function(event) {
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

    var x = d3.scale.linear()
        .domain(d3.extent(data, function(d) { return +d.startvalue; }));

    var y = d3.scale.linear()
        .domain(d3.extent(data, function(d) { return +d.startweight; }));


    data.forEach(function(item) {
      points.position.push(x(+item.startvalue), y(+item.startweight), 0);
      points.position.push(x(+item.endvalue), y(+item.endweight), 1);
    });

    console.log(points.position);

    pointsLoaded = true;
    pointsBufferInfo = twgl.createBufferInfoFromArrays(gl, points);
  });

  requestAnimationFrame(render);
});