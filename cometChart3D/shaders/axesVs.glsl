uniform mat4 u_worldViewProjection;

attribute vec3 a_position;

void main() {
  gl_Position = (u_worldViewProjection * vec4(a_position, 1));
}