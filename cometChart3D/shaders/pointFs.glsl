precision mediump float;

varying vec3 v_color;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

void main() {
  gl_FragColor = vec4(v_color, 1);
}