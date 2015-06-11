uniform mat4 u_worldViewProjection;

attribute vec3 a_position;
attribute vec3 a_color;

varying vec3 v_color;

void main() {
  vec4 position = vec4(a_position, 1);

  v_color = a_color;
  gl_Position = (u_worldViewProjection * position);
}