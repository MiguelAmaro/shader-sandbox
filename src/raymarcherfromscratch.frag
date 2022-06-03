
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

float Bias(in float Transcendental)
{
  return 0.5+0.5*Transcendental;
}

float Sphere(in vec3 Ray, in float Radius)
{
  return length(Ray) - Radius;
}

float CastRay(in vec3 Ray)
{
  float Wave0 = 0.5+0.5*sin(u_time*0.8);
  float Wave1 = 0.5+0.5*sin(u_time)*0.2;
  float Radius = 1.0+0.25-smoothstep(0.02,0.8,0.5+0.5*-sin(0.5+u_time));
  float d = Sphere(Ray, 0.25);
  return d;
}

vec3 CalcNormal(vec3 Ray)
{
  vec3 Delta = vec3(0.001,0.0,0.0);
  vec3 Normal = normalize(vec3(CastRay(Ray+Delta.xyy)-CastRay(Ray-Delta.xyy),
                               CastRay(Ray+Delta.yxy)-CastRay(Ray-Delta.yxy),
                               CastRay(Ray+Delta.yyx)-CastRay(Ray-Delta.yyx)));
  return Normal;
}
//~ fbm stuff

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

#define NUM_OCTAVES 4

float fbm ( in vec2 _uv) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
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

//~ fbm stuff

void main(void) {
  vec2 uv = (gl_FragCoord.xy-0.5*u_resolution.xy)/u_resolution.y;
  float FocalLength = 1.4;
  vec3 TiltedAxis = vec3(0.0,0.95,0.0);
  vec3 RayOrigin = vec3(0.0,0.0,-FocalLength); 
  vec3 TLightPos = vec3(10.0*cos(u_time), 5.0, 10.0*sin(u_time));
  
  vec3 CamY = normalize(TiltedAxis-RayOrigin);
  vec3 CamX = normalize(cross(CamY, vec3(0.0,1.0,0.0)));
  vec3 CamZ = normalize(cross(CamX, CamY));
  
  vec3 RayDir    = vec3(uv, 0.0)-RayOrigin;
  RayDir = normalize(RayDir.x*CamX + RayDir.y*CamY + RayDir.z*CamZ);
  
  
  //~ fbm uvuff
  vec3 color = vec3(0.0);
  
  vec2 q = vec2(0.);
  q.x = fbm( uv + 0.464*u_time);
  q.y = fbm( uv + vec2(1.0));
  
  vec2 r = vec2(0.);
  r.x = fbm( uv + 1.0*q + vec2(0.950,0.440)+ 0.15*u_time );
  r.y = fbm( uv + 1.0*q + vec2(8.3,2.8)+ 0.126*u_time);
  
  float f = fbm(13.0*sin(u_time)*fbm(20.0*fbm(4.0*(uv+r)+q)+q)+q);
  
  color = mix(vec3(0.101961,0.619608,0.666667),
              vec3(0.024,0.221,0.667),
              clamp((f*f)*4.0,0.0,1.0));
  
  color = mix(color,
              vec3(0.137,0.165,0.088),
              clamp(length(q),0.0,1.0));
  
  color = mix(color,
              vec3(0.860,0.990,1.000),
              clamp(length(r.x),0.0,1.0));
  
  //~ fbm stuff
  
  
  //Bounce
  float t = 0.0;
  for(int i=0;i<100;i++)
  {
    RayOrigin += t*RayDir;
    t = CastRay(RayOrigin);
  }
  
  vec3 RayPos = RayOrigin + t*RayDir;
  vec3 Normal = CalcNormal(RayPos);
  vec3 FinalColor = vec3(1.0);
  if(t<0.001)
  {
    vec3 Mate = dot(Normal,vec3(0.0,0.0,-4.0))-Normal-(8.0+10.0*Bias(sin(u_time)))*f;
    
    //vec3 FinalColor = clamp(0.7*dot(Normal,TLightPos)-Normal-11.0*f, 0.2, 0.9999);
    vec3 Diffuse = clamp(Bias(dot(Normal,TLightPos)),0.0,1.0);
    vec3 SkyDiffuse = clamp(0.5+0.5*dot(Normal,vec3(0.0,1.0,0.0)),0.0,1.0);
    FinalColor = (Mate*Diffuse);
  }
  gl_FragColor= vec4(FinalColor,1.0);
}
