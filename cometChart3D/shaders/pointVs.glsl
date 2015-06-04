uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

attribute vec3 a_position;

varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
  vec4 position = vec4(a_position, 1);

  v_surfaceToLight = u_lightWorldPos - (u_world * position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * position)).xyz;
  gl_PointSize = 5.0;
  gl_Position = (u_worldViewProjection * position);
}