//var vertexShader = require('./vertex.glsl');
//var fragmentShader = require('./fragment.glsl');

$(function() {
  "use strict";
  twgl.setAttributePrefix("a_");
  var m4 = twgl.m4;
  var gl = twgl.getWebGLContext($('#chart3D')[0]);
  var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

  //var bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);

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

  var bufferInfo = twgl.createBufferInfoFromArrays(gl, axes);

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

  function render(time) {
    time *= 0.001;
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
    var world = m4.rotationY(time);

    uniforms.u_viewInverse = camera;
    uniforms.u_world = world;
    uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
    uniforms.u_worldViewProjection = m4.multiply(world, viewProjection);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    gl.drawElements(gl.LINES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
});