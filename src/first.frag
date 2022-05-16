#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

void main(void)
{
  vec4 color = vec4(vec3(0.0), 1.0);
  vec2 uv = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.xy;
  uv*= 1.0;
  
  
  color.rgb = vec3(smoothstep(.0, .003, abs(uv)), 1.0);
  
  gl_FragColor = color;
}
