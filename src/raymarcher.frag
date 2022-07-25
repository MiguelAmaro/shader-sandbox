
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;
varying vec2    v_texcoord;

vec3 lightpos;
struct hit_info
{
  float Dist;
  int MatId;
};

//~ fbm stuff
float UniSin(float x)
{
  return 0.5+0.5*sin(x);
}

float UniCos(float x)
{
  return 0.5+0.5*cos(x);
}

float random (in vec2 _uv) {
  return fract(sin(dot(_uv.xy,
                       vec2(12.9898,78.233)))*
               43758.5453123);
}

float noise (in vec2 _uv) {
  vec2 i = floor(_uv);
  vec2 f = fract(_uv);
  
  // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) +
    (c - a)* u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 8
float fbm ( in vec2 _uv) {
  float v = 0.0;
  float a = 0.8;
  vec2 shift = vec2(10.0);
  // Rotate to reduce axial bias
  mat2 rot = mat2(cos(0.5), sin(0.5),
                  -sin(0.5), cos(0.50));
  for (int i = 0; i < NUM_OCTAVES; ++i) {
    v += a * noise(_uv);
    _uv = rot * _uv * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

hit_info HitInfo(float Dist, int MatId)
{
  hit_info Hit;
  Hit.Dist = Dist;
  Hit.MatId = MatId;
  return Hit;
}

float smin(in float a, in float b, float k)
{
  float h = max(k-abs(a-b), 0.0);
  return min(a,b) - h*h/(k*4.0);
}

float SDLine(vec3 a, vec3 b, vec3 p, float r)
{
  float h = clamp(dot(p-a, b-a)/dot(b-a,b-a),0.0, 1.0);
  float d = length(p-a-h*(b-a))-r;
  return d;
}

float SDTorus(vec3 a, vec3 p, float r, float t )
{
  vec2 q = vec2(length(a.xz-p.xz)-r,p.y);
  return length(q)-t;
}

float SDSphere(vec3 a, vec3 p, float r)
{
  float d = length(p-a)-r;
  return d;
}

mat3 Rotate(vec3 rad)
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

// NOTE(MIGUEL): This is pulled out of the raytrace loop so that normals can be conveniently calculated
//               for all objects in the scene.
hit_info Map(in vec3 pos)
{
  //objects
  vec3 o0a = vec3(-0.25, -0.25, 0.0);
  vec3 o0b = vec3(0.25, 0.25, 0.0);
  //lights
  lightpos =  vec3(0.3*-cos(u_time), 0.5*cos(u_time), 0.8*sin(u_time));
  vec3 l0 = lightpos;
  float d0 = SDLine(o0a, o0b, pow(Rotate(vec3(0.0, u_time*0.3, u_time*0.6))*pos*2.0, vec3(3.0)), 0.05+0.15*UniSin(u_time));
  float d1 = SDSphere(l0, Rotate(vec3(0.0, u_time*0.3, u_time*0.6))*pos, 0.13);
  
  vec3 Trajectory = Rotate(vec3(0.0, 0.0, u_time*0.4))*vec3((pos*4.0)+u_time*0.001);
  float d2 = 0.15*length(vec3(fbm(Trajectory.xy)));
  hit_info Hit = HitInfo(d0, 0);
  if(d1<Hit.Dist) { Hit = HitInfo(d1, 1); }
  if(d2<Hit.Dist) { Hit = HitInfo(d2, .4); }
  Hit.Dist = smin(d2, d0, UniSin(u_time));
  Hit.Dist = smin(Hit.Dist, d1, UniCos(u_time));
  return Hit;
}

hit_info RayCast(in vec3 ro, vec3 rd, out vec3 pos)
{
  hit_info Hit = HitInfo(0.0, 0);
  pos = rd*Hit.Dist + ro;
  for(int i=0;i<100;i++)
  {
    Hit = Map(pos);
    pos += rd*Hit.Dist;
    if(Hit.Dist<0.001) break;
    if(Hit.Dist>1.0) break;
  }
  return Hit;
}

vec3 SDLineNormal(in vec3 pos)
{
  vec2 e = vec2(0.0001, 0.);
  return normalize(vec3(Map(pos+e.xyy).Dist-Map(pos-e.xyy).Dist,
                        Map(pos+e.yxy).Dist-Map(pos-e.yxy).Dist,
                        Map(pos+e.yyx).Dist-Map(pos-e.yyx).Dist));
}

void main(void) 
{
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  vec2 st = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.y;
  vec4 col = vec4(vec3(0.0), 1.0);
  
  
  float bg = smoothstep(0.0,fbm(u_time*0.2), length(st));
  col.rgb = mix(vec3(bg), vec3(0.9,0.8,0.7), 0.24);
  vec3 ro = vec3(0.0, 0.0, -3.8);
  vec3 rd = normalize(vec3(st, 0.0)-ro);
  hit_info Result;
  vec3 pos = vec3(0.0);
  Result = RayCast(ro, rd, pos);
  if(Result.Dist<0.001)
  {
    vec3 RodDiff = vec3(0.3, 0.5, 0.4);
    vec3 BallDiff = vec3(1.0,0.0,0.0);
    vec3 LightEmit = 0.5+0.5*SDLineNormal(-pos);
    if(Result.MatId == 0)
    {
      float Lighting = 0.5+0.5*dot(normalize(lightpos-pos), SDLineNormal(pos));
      float Lighting2 = 0.5+0.5*dot(normalize(vec3(0.8,0.2,0.0)-pos), SDLineNormal(pos));
      col.rgb = mix(RodDiff,1.8*LightEmit, 1.0-length(lightpos-pos));
      col.rgb = col.bgr*Lighting+Lighting2;
    }
    if(Result.MatId == 1)
    {
      col.rgb = LightEmit*(0.5+0.5*SDLineNormal(pos)).rgg;
    }
  }
  
  gl_FragColor = col,0.8;
}


