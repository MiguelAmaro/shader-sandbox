
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

#define PI 3.14159
//#define LINEWIDTH 3.2
//#define WAVEHEIGHT 6.0
//#define WIDTH 0.6

float random (in float x) {
  return fract(sin(x)* 43758.5453123);
}

float noise (in float x) {
  float i = floor(x);
  float f = fract(x);
  float a = random(i);
  float b = random(i + 1.);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u);
}

#define OCTAVES 3
float fbm (in float x) {
  float value = 0.0;
  float amplitude = .5;
  float frequency = 0.;
  
  for (int i = 0; i < OCTAVES; i++) {
    value += amplitude * noise(x);
    x *= 2.;
    amplitude *= .7;
  }
  return value;
}

float Bias(in float a) { return 0.5 + 0.5*a; }

void main(void) {
  vec4 color = vec4(vec3(0.0), 1.0);
  vec2 st = (2.*gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
  vec2 uv = (2.*gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
  
  float LineRange = 45.0;
  st.y *= LineRange;
  float H = 35.0;
  
  float LINEWIDTH = 2.0;
  float WAVEHEIGHT  = 6.6;
  float WIDTH  = 0.9;
  
  float linewidth = 45.*LINEWIDTH / u_resolution.y;
  
  vec3 val = 0.0;
  
#if 1
  if(st.x < WIDTH)
  {
    float env = pow(cos(st.x/WIDTH*PI/2.),4.9);
    
    float i = floor(st.y);
    
    for (float n = max(-H,i-6.0); n <= min(H, i); n++) 
    {
      float YOffset = 0.5;
      float f = st.y - n - YOffset;
      float y = f + 0.5;
      float Dampen = 1.0;
      y -= WAVEHEIGHT 
        * pow(fbm(st.x*10.0 +n*432.0 + 0.5*u_time), Dampen)
        * env
        + (fbm(st.x*25.+n*1203.21)-0.32)*2. * 0.15;
      
      
      float grid = abs(y);
      val += (smoothstep(linewidth,0.00,grid));
      
      //val *= vec3(grid);
      if(y < 0.1)
        break;
    }
  }
  
#endif
  gl_FragColor = vec4(val*smoothstep(0.004, 0.0,length(uv)-.53), 1.0);
}