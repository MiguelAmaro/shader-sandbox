
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

#define PI 3.14159274101257324219
#define TAU 2.0 * PI
vec2 tch;
struct cam
{
  vec3 x;
  vec3 y;
  vec3 z;
};
struct ray
{
  vec3 o;
  vec3 d;
};
struct hit
{
  vec3 p;
  float d;
  int m;
};
cam CamInit()
{
  cam Cam;
  Cam.x = vec3(0.0);
  Cam.y = vec3(0.0);
  Cam.z = vec3(0.0);
  return Cam;
}
ray RayInit()
{
  ray r;
  r.o = vec3(0.0);
  r.d = vec3(0.0);
  return r;
}
hit HitInit()
{
  hit h;
  h.p = vec3(0.0);
  h.d = 0.0;
  h.m = 0;
  return h;
}
float Bias(in float a)
{
  return .5 + .5 * a;
}
vec3 Bias3(in vec3 a) { return .5 + .5 * a; }
float Sphere(in vec3 p, in float r) { return length(p) - r; }
float Cube(in vec3 p, in vec3 r)
{
  vec3 ap = abs(p);
  vec3 d = max(vec3(0.), ap - r);
  return length(d);
}
vec3 Tube(in vec3 p, in vec3 c)
{;
  p.zx = 0.04*sin(p.y);
  float d = length(p.xz-c.xy)-c.z;
  return abs(d)-0.02;
}

float Map(in vec3 p)
{
  float d = 0.;
  
  d = Tube(p.yzx, vec3(0.0,0.,0.1));
  
  return d;
}
hit Cast(in ray r, in vec3 p)
{
  hit h = HitInit();
  for (int i = 0; i < 100; i++)
  {
    h.p = r.d * h.d + r.o;
    h.d += Map(h.p);
    if (h.d < 0.001 || h.d > 20.0)
      break;
  }
  return h;
}
vec3 Normal(in vec3 p)
{
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(Map(p + e.xyy) - Map(p - e.xyy), Map(p + e.yxy) - Map(p - e.yxy), Map(p + e.yyx) - Map(p - e.yyx)));
}
void main(void)
{
  tch = u_mouse.xy / u_resolution.xy;
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 st = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
  vec3 ta = vec3(cos(2. * TAU * tch.x), 0.0, sin(2. * TAU * tch.x));
  float fcl = .8;
  cam c = CamInit();
  ray r = RayInit();
  r.o = vec3(0., 0., 0.8);
  c.z = normalize(ta);
  c.x = normalize(cross(c.z, vec3(.0, .1, .0)));
  c.y = normalize(cross(c.z, c.x));
  vec3 pix = vec3(st, fcl);
  r.d = normalize(vec3(pix.x * c.x + pix.y * c.y + pix.z * c.z));
  vec3 p = vec3(0.0);
  float d = 0.;
  hit h = Cast(r, p);
  vec3 col = vec3(uv, 1.0);
  if (h.d < 20.001)
  {
    vec3 n = Bias3(Normal(h.p));
    vec3 matte = h.d * vec3(.9, .8, .7);
    col = matte;
    col *= vec3(.4545);
  }
  gl_FragColor = vec4(col, 1.0);
}