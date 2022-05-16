#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

uniform sampler2D u_tex0;
uniform vec2 u_tex0Resolution;

void main(void)
{
  vec3 color = vec3(0.0);
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  vec2 uv = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.xy;
  //uv = vec2(atan(uv.y, uv.x), length(uv));
  uv*= 10.0;
  uv+=u_time;
  if ( u_tex0Resolution != vec2(0.0) ){
    float imgAspect = u_tex0Resolution.x/u_tex0Resolution.y;
    //vec2 polar = vec2(atan(uv.y, uv.x), length(uv));
    vec4 img = texture2D(u_tex0,uv*vec2(1.,imgAspect));
    color = mix(color, img.rgb,img.a);
  }
  
  color += vec3(fract(10.*st), abs(sin(u_time*0.1)));
  
  gl_FragColor = vec4(color, 1.0);
}
