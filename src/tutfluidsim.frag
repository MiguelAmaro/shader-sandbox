
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

uniform sampler2D   u_buffer0;
uniform sampler2D   u_buffer1;
varying vec2    v_texcoord;

float Noise()
{
	return fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);  
}

void main(void)
{
  vec2 st = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.y;
  vec2 px = 1.0/u_resolution.xy;
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  vec2 m = u_mouse.xy/u_resolution.xy;
  vec3 col = vec3(st,1.0);
#if defined(BUFFER_0)
  vec3 tex = texture2D(u_buffer1, uv).rgb;
  tex += smoothstep(0.01, 0.0, length(m-uv)-0.03);
  col = tex*Noise();
#elif defined(BUFFER_1)
  vec3 tex = texture2D(u_buffer0, uv).rgb;
  col = tex;
#else
  vec3 tex = texture2D(u_buffer1, uv).rgb;
  col = tex;
#endif
  gl_FragColor = vec4(col*vec3(uv,1.0), 1.0);
}
