
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;


uniform sampler2D   u_tex0;
uniform vec2        u_tex0Resolution;

uniform sampler2D   u_tex1;
uniform vec2        u_tex1Resolution;


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

float Bias(in float Transcendental)
{
  return 0.5+0.5*Transcendental;
}

float Sphere(in vec3 Ray, in float Radius)
{
  float uv = gl_FragCoord.xy/u_resolution.xy;
  float d = length(Ray) - Radius;
  d -= fbm(fbm(uv+noise(uv+u_time)));
  return d;
}

float CastRay(in vec3 Ray)
{
  float Wave0 = 0.5+0.5*sin(u_time*0.8);
  float Wave1 = 0.5+0.5*sin(u_time)*0.2;
  float Radius = 1.0+0.25-smoothstep(0.02,0.8,0.5+0.5*-sin(0.5+u_time));
  float d = Sphere(Ray, Radius);
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

void main(void) {
  vec2 uv = (gl_FragCoord.xy-0.5*u_resolution.xy)/u_resolution.y;
  vec3 TiltedAxis = vec3(0.0,0.0,0.0);
  vec3 RayOrigin = TiltedAxis + vec3(10.5*sin(3.14),0.0,10.5*cos(3.14)); 
  vec3 LightPos = vec3(-1.0);
  
  vec3 CamZ = normalize(TiltedAxis-RayOrigin);
  vec3 CamX = normalize(cross(CamZ, vec3(0.0,1.0,0.0)));
  vec3 CamY = normalize(cross(CamX, CamZ));
  
  float FocalLength = 6.8;
  vec3 RayOriginToPixel = vec3(uv, FocalLength);
  vec3 RayDir = normalize(RayOriginToPixel.x*CamX +
                          RayOriginToPixel.y*CamY +
                          RayOriginToPixel.z*CamZ);
  
  
  //~ fbm uvuff
  vec3 color = vec3(0.0);
  
  vec2 q = vec2(0.);
  q.x = fbm( uv + 0.464*u_time);
  q.y = fbm( uv + vec2(1.0));
  
  vec2 r = vec2(0.);
  r.x = fbm( uv + 1.0*q + vec2(0.950,0.440)+ 0.15*u_time );
  r.y = fbm( uv + 1.0*q + vec2(8.3,2.8)+ 0.126*u_time);
  
  float f = fbm(13.0*sin(u_time)*fbm(20.0*fbm(3.0*(uv+r)+q)+q)+q);
  
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
  
  //~ texure stuff
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  st*=20.0;
  vec3 texcol = vec3(0.0);
  float tex0_aspect = u_tex0Resolution.x/u_tex0Resolution.y;
  vec4 tex0 = texture2D(u_tex0, st);
  //texcol += tex0.rgb;
  /*
  float tex1_aspect = u_tex1Resolution.x/u_tex1Resolution.y;
  vec4 tex1 = texture2D(u_tex1, uv);
  texcol += tex1.rgb * step(abs(uv.x), 0.5);
  */
  //~ texure stuff
  
  //Bounce
  float t = 0.0;
  for(int i=0;i<100;i++)
  {
    RayOrigin += t*RayDir;
    t = CastRay(RayOrigin);
  }
  
  vec3 RayPos = RayOrigin + t*RayDir;
  vec3 Normal = CalcNormal(RayPos);
  vec3 FinalColor = vec3(1.0)-texcol;
  if(t<0.001)
  {
    vec3 Mate = dot(Normal,vec3(0.0,0.0,-4.0))-Normal-(8.0+10.0*Bias(sin(u_time)))*f;
    //vec3 Mate = Bias(pow(dot(Normal, RayOrigin),500.0))*Normal*Normal*f;
    vec3 Diffuse = clamp(Bias(dot(Normal,LightPos)),0.0,1.0);
    vec3 SkyDiffuse = clamp(Bias(dot(Normal,vec3(0.0,1.0,0.0))),0.0,1.0);
    FinalColor = (Mate*Diffuse + texcol);
  }
  gl_FragColor= vec4(FinalColor,1.0);
}

//vec3 FinalColor = clamp(0.7*dot(Normal,TLightPos)-Normal-11.0*f, 0.2, 0.9999);