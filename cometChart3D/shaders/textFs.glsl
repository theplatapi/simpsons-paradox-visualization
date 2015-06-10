precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
  if (gl_FrontFacing) {
    gl_FragColor = texture2D(u_texture, v_texcoord);
  }
  else {
    gl_FragColor = texture2D(u_texture, vec2(1.0 - v_texcoord.s, v_texcoord.t));
  }
}