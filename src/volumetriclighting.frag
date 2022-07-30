
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

void main(void) {
  vec4 color = vec4(vec3(0.0), 1.0);
  vec2 pixel = 1.0/u_resolution.xy;
  vec2 st = gl_FragCoord.xy * pixel;
  vec2 uv = v_texcoord;
  
  color.rgb = vec3(st.x,st.y,abs(sin(u_time)));
  
  gl_FragColor = color;
}



vec2 hash2( vec2 p ) // replace this by something better
{
	p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}