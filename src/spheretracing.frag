
#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415927410125
#define TAU 2.0*PI

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;
varying vec2    v_texcoord;

// GLOBALS
vec2  res;
vec2  px;
float t;
vec2  m;

struct cam { vec3 x; vec3  y; vec3 z; };
struct ray { vec3 o; vec3  d; };
struct hit { vec3 p; float d; vec4 c; };

cam CamInit(in vec3 ta)
{  
  cam c;
  c.z = normalize(ta);
  c.x = normalize(cross(c.z, vec3(.0,.1,.0)));
  c.y = normalize(cross(c.z, c.x));
  return c;
}

ray RayInit(in vec3 ro,  in vec2 st, in cam c, in float fcl)
{  
  ray r;
  r.o = ro;
  vec3 pix = vec3(st, fcl);
  r.d = normalize(vec3(pix.x*c.x +
                       pix.y*c.y +
                       pix.z*c.z));
  return r;
}

hit HitInit()
{  
  hit h;
  h.p = vec3(0.0);
  h.d = 0.0;
  h.c.a = 1.0;
  h.c.rgb = vec3(0.);
  return h;
}

float Bias(in float a) { return .5+.5*a; }
vec3  Bias3(in vec3 a) { return .5+.5*a; }

// SDFS
float Ring(in vec3 p, in float r, in float t)
{  
  vec2 q = vec2(length(p.xz)-r,p.y);
  return length(q)-t;
}

float Circle(in vec3 p, in float r)
{
  return length(p)-r;
}

float Spiral(in vec3 p, in float k)
{
  float b = .1759*k;
  float a = 1.0;
  float dt = atan(p.y, p.x) + t*8.0;
  float r = length(p.xy);
  float n = (log(r/a)/b-dt)/(2.*PI);
  // Cap the spiral
  float upper_r=a*exp(b*(dt+2.*PI*ceil(n)));
  float lower_r=a*exp(b*(dt+2.*PI*floor(n)));
  return min(abs(upper_r-r)-.0,abs(r-lower_r)-.00001*length (p));
}

float Map(in vec3 p)
{
  float d = 1000.0;
  float d1 = 1000.0;
  vec3 q = p;
  q.xyz = mod(abs(q.xyz), 3.0)-1.5;
  d = Circle(q,.4);
  d1 = Ring(p.xzy-vec3(1.5,1.5,1.5),.4,.2);
  //d1 = Spiral(p, .4);
  //d = min(d, d1);
  return d;
}

vec3 Normal(in vec3 p)
{   vec2 e = vec2(0.001,0.0);
  return normalize(vec3(Map(p+e.xyy)-Map(p-e.xyy),
                        Map(p+e.yxy)-Map(p-e.yxy),
                        Map(p+e.yyx)-Map(p-e.yyx)));
}

float Specular(in vec3 n, in vec3 rd)
{
  vec3 h = normalize(n - rd);
  float SpecCoef = 200.;
  return pow(max(0.,dot(h, n)), SpecCoef);
}

vec3 Color(in vec3 ro, in vec3 rd, in float d)
{
  vec3 sl = vec3(3.*cos(t),.2,3.*sin(t)); //scene light
  float amb = 0.2;
  vec3 col = vec3(.84,.55,.2);
  vec3 p = rd*d*0.995 + ro; //why assign to ro
  vec3 n = Normal(p);
  float dfl = max(0.,dot(n, sl))+2.*amb;
  float spl = Specular(n, rd);
  //col *= vec3(.4545);w
  return (dfl + spl) * col;
}

hit Cast(in ray r)
{  
  hit h = HitInit();
  float dt = 0.0015;
  float zoom = 0.15;
  // this is the radius of the sphere that models the cone.
  // formula from https://www.scratchapixel.com/lessons/advanced-rendering/rendering-distance-fields/basic-sphere-tracer
  float vfov = 0.9; //vfov is the vertical camera field-of-view (in radians)  
  float radius = (2.0*tan(vfov/2.0)) /(res.y*zoom);
  for(int i=0;i<64;i++)
  {
    float rad = h.d*radius;    // move the center of the sphere along the ray
    h.p = r.d*h.d+r.o;
    dt = Map(h.p);
    
    if(dt<rad)
    {
      float a = smoothstep(rad, -rad, dt);
      vec3 col = Color(r.o, r.d, h.d);
      h.c.rgb += h.c.a*(a*col);
      h.c.a *= (1.0-a);
      if(h.c.a<0.0015) break;
    }
    h.d += max(abs(dt*0.85), 0.001);
    if(h.d>20.0) break;
  }
  return h;
}

void main(void)
{
  res = u_resolution.xy;
  t = u_time;
  m = u_mouse.xy/res.xy;
  px = 1.0/res;
  //Norm
  vec2 st = (2.0*gl_FragCoord.xy-res.xy)/res.y;
  vec2 uv = gl_FragCoord.xy/res.xy;
  //Setup
  vec3 a = vec3(cos (2.*TAU*m.x),0.0, sin(2.*TAU*m.x));
  vec3 b = vec3(0.);
  cam c = CamInit(a);
  ray r = RayInit(a, st, c, 1.8);
  //Shading
  vec3 col = vec3(0.);
  hit h = Cast(r);
  
  vec3 n = Normal(h.p);
  r.d = reflect(n, r.d);
  hit hr = Cast(r);
  col = mix(h.c.rgb, col, h.c.a);
  col *= mix(hr.c.rgb, h.c.rgb, max(0,dot(n,r.d))*0.4);
  //Out
  gl_FragColor = vec4(col, 1.0);
}