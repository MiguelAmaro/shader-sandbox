
#ifdef GL_ES
precision mediump float;
#endif

#define PI  3.14159265359
#define TAU 2.0*3.14159265359

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;
struct cam { vec3 x; vec3 y; vec3 z; };
struct hit { float d; vec3 pos; int mat; };
float Bias(in float a) { return 0.5 + 0.5*a; }

mat3 rot(vec3 rad)
{
  float cx = cos(rad.x); 
  float sx = sin(rad.x);
  float cy = cos(rad.y); 
  float sy = sin(rad.y);
  float cz = cos(rad.z); 
  float sz = sin(rad.z);
  mat3 x = mat3(1.0,  0.0, 0.0,
                0.0,   cx,  sx,
                0.0,   -sx, cx);
  mat3 y = mat3( cy, 0.0,  -sy,
                0.0, 1.0,  0.0,
                sy, 0.0,  cy);
  mat3 z = mat3(cz,  sz, 0.0,
                -sz,   cz, 0.0,
                0.0, 0.0, 1.0);
  return x*y*z;
}

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

hit Map(in vec3 pos)
{
  hit Hit;
  //- Intersect Testing
  vec3 p = rot(vec3(PI/2.0,0.0,PI/2.0))*pos;
  vec3 q0 = mod(pos,2.0)-1.0;
  q0.y = pos.y;
  float ds0 = length(q0)-0.5;
  float ds1 = length(pos-vec3(-1.0,0.3,2.0))-0.5;
  //*Bias(sin(u_time));
  float dp0 =  abs(pos.y+0.3)-0.001;
  float dp1 = -pos.y+0.4+0.8*Bias(sin(u_time));
  vec3 q = p;
  q.x = mod(abs(p.x),0.03+0.01*Bias(cos(u_time)));
  float env = pow(cos(pos.x/30.0*PI/2.0),4.9);
  float dp2 =  q.x-0.03*fbm(sin(u_time*0.223*env)+fbm(p.x*1234.03))+0.001;
  float d = 0.0;
  d = min(dp0, dp1);
  //d = min(d, dp2);
  //d = min(d, ds0);
  d = min(d, ds1);
  float dsp = max(dp2, ds0);
  d = min(d, dsp);
  
  Hit.d = d;
  Hit.pos = pos;
  Hit.mat = 0;
  //-Return dist
  return Hit;
}

vec3 Normal(in vec3 pos)
{
  vec2 e = vec2(0.001,0.0);
  return normalize(vec3(Map(pos+e.xyy).d-Map(pos-e.xyy).d,
                        Map(pos+e.yxy).d-Map(pos-e.yxy).d,
                        Map(pos+e.yyx).d-Map(pos-e.yyx).d));
}

void main(void) {
  vec3 color = vec3(0.0);
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  vec2 st = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.y;
  vec2 pixsize = 1.0/u_resolution.xy;
  vec2 m = u_mouse.xy/u_resolution.xy;
  float OrbitRad = 3.0*m.y*m.y;
  cam Cam;
  vec3 ro = vec3(sin(TAU*m.x), 0.0, cos(TAU*m.x))*OrbitRad; 
  vec3 Target = vec3(0.0);
  Cam.z = normalize(Target-ro);
  Cam.x = normalize(cross(Cam.z, vec3(0.0,1.0,0.0)));
  Cam.y = normalize(cross(Cam.x, Cam.z));
  float Focal = 1.0;
  vec3 pix = vec3(st, Focal);
  vec3 rd = normalize(pix.x*Cam.x +
                      pix.y*Cam.y +
                      pix.z*Cam.z);
  hit Hit;
  float t = 0.0;
  float d = 0.0;
  for(int i=0;i<100;i++)
  {
    Hit.pos = rd*t+ro;
    float d = 0.0;
    d = Map(Hit.pos).d;
    Hit.d = d;
    t += d;
    if(Hit.d < 0.01) break;
    if(Hit.d > 20.00) break;
  }
  if(d < 0.001)
  {
    vec3 Norm = Normal(rd*t+ro);
    vec3 light = vec3(0.0, 0.2,0.0);
    vec3 matte = (Hit.d+0.2)*Hit.pos;
    color = matte;
  }
  
  gl_FragColor = vec4(color, 1.0);
}
