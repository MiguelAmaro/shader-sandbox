
#ifdef GL_ES
precision mediump float;
#endif

//https://www.youtube.com/watch?v=BFld4EBO2RE

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;
varying vec2    v_texcoord;

void main(void) {
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  vec2 st = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.y;
  vec4 col = vec4(vec3(0.0), 1.0);
  
  vec3 ro = vec3(0.0,0.0, -1.8);
  vec3 rd = normalize(vec3(st, 0.0)-ro);
  
  float t = 0.0;
  vec3 ray = rd*t + ro;
  vec3 sphere = vec3(0.0, 0.0, 0.0);
  float r = 1.7;
  t = length(ray-sphere)-r;
  ray = rd*t + ray;
  t = length(ray-sphere)-r;
  ray = rd*t + ray;
  
  if(t<0.001)
  {
    col.rgb = vec3(t*100.0);///smoothstep(1.0,0.0,t));
  }
  gl_FragColor = col;
}



/*NOTE(MIGUEL): 
*               
*               
*               
*               
*               
*               
*/