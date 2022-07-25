#version 400
#ifdef GL_ES
precision mediump float;
#endif

layout(location = 0) out vec4 Output;

#define TAU 6.283185307179586
uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;
uniform samplerCube u_cubeMap;
uniform vec3        u_SH[9];


//finger tree
#define BONE_MAX 5
struct f_tree
{
  // NOTE(MIGUEL): index 0 is the not finger
  vec3 Bones[5*BONE_MAX+1];
  int  BCount[BONE_MAX];
  int  FCount;
};

f_tree GlobalTree;
struct hit_info
{
  float Dist;
  int   MatId;
  vec3  Pos;
};

hit_info HitInfo(in float Dist, in int MatId, in vec3 Pos)
{
  hit_info Hit;
  Hit.Dist = Dist;
  Hit.MatId = MatId;
  Hit.Pos = Pos;
  return Hit;
}

float Rand(in vec2 st)
{
  return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

float Noise (in vec2 st)
{
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = Rand(i);
  float b = Rand(i + vec2(1.0, 0.0));
  float c = Rand(i + vec2(0.0, 1.0));
  float d = Rand(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
#define OCTAVES 6
float Fbm (in vec2 st)
{
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 20.0;
  for (int i = 0; i < OCTAVES; i++)
  {
    value += amplitude * Noise(st);
    st *= 2.;
    amplitude *= .5;
  }
  return value;
}

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

float SdfLine(vec3 a, vec3 b, vec3 p, float r)
{
  float h = clamp(dot(p-a, b-a)/dot(b-a,b-a), 0.0, 1.0);
  float d = length(p-a-h*(b-a))-r;
  return d;
}

float SdfTube(vec3 a, vec3 p, float ro, float ri, float t)
{
  // TODO(MIGUEL): Need to be fixed
  vec3 tmp = vec3(a.x, a.y, a.z+t*0.5);
  float d = abs(length(p.xy-tmp.xy)-ro)-ri;
  d = max(d,  p.z-t*0.5);
  d = max(d, -p.z-t*0.5);
  return d;
}

float SdfElipsod(vec3 a, vec3 p, vec3 r)
{
  float k0 = length((p-a)/r); //[21]
  float k1 = length((p-a)/r/r);
  return k0*(k0-1.)/k1;
}

float SdfVector(vec3 s, vec3 d, vec3 p, float t, float r)
{
  vec3 a = s;
  vec3 b = d*t+s;
  return SdfLine(s, b, p, r);
}

float smin(in float a, in float b, float k)
{
#if 0
  float h = max(k-abs(a-b), 0.0);
  return min(a,b) - h*h/(k*4.0);
#else
  float h = max(k-abs(a-b), 0.0);
  return min(a,b) - h*h/(k*6.0);
#endif
}

void InitFingerTree(in out f_tree Tree, in vec3 s)
{
  Tree.Bones[0] = s;
  Tree.BCount[0] = 0;
  Tree.BCount[1] = 0;
  Tree.BCount[2] = 0;
  Tree.BCount[3] = 0;
  Tree.BCount[4] = 0;
  Tree.FCount = 0;
  return;
}

void PushFinger(in out f_tree Tree, vec3 d, float t)
{
  vec3 a = Tree.Bones[0];
  vec3 b = normalize(d)*t + a;
  Tree.Bones[Tree.FCount*BONE_MAX+1] = b;
  return;
}

void NextFinger(in out f_tree Tree)
{
  Tree.FCount++;
  return;
}


void PushBone(in out f_tree Tree, vec3 d, float t)
{
  int i = BONE_MAX*Tree.FCount;
  vec3 a = Tree.Bones[i + Tree.BCount[Tree.FCount] + 1];
  vec3 b = normalize(d)*t + a;
  Tree.BCount[Tree.FCount]++;
  Tree.Bones[i  + Tree.BCount[Tree.FCount] + 1] = b;
  return;
}

float RenderBone(in f_tree Tree, in int finger, in ivec2 bone, in float r, vec3 p)
{
  vec3 a = Tree.Bones[finger*BONE_MAX + bone.x + 1];
  vec3 b = Tree.Bones[finger*BONE_MAX + bone.y + 1];
  return SdfLine(a, b, p, r);
}

float RenderFinger(in out f_tree Tree, in int finger, in float r, vec3 p)
{
  vec3 a = Tree.Bones[0];
  vec3 b = Tree.Bones[finger*BONE_MAX + 1];
  return SdfLine(a, b, p, r);
}

f_tree BuildFingerTree()
{
  f_tree Tree;
  InitFingerTree(Tree, vec3(0.05, -0.6, 0.23));
  PushFinger(Tree, vec3(-1.3, 1.0, -0.3), 0.15);
  PushBone  (Tree, vec3(-3.0, 4.0,-1.8), 0.30);
  PushBone  (Tree, vec3(-0.1, 0.6, -0.2), 0.2);
  PushBone  (Tree, vec3(0.04, 1.0, -0.3), 0.2);
  PushBone  (Tree, vec3( 0.4, 1.0, -0.3), 0.1);
  NextFinger(Tree);
  PushFinger(Tree, vec3(-0.0, 1.0,-1.0), 0.1);
  PushBone  (Tree, vec3(-0.13, 0.7,-1.2), 0.65);
  PushBone  (Tree, vec3( 0.0, 1.0,-0.15), 0.28);
  PushBone  (Tree, vec3( 0.0, 1.0, 0.03), 0.25);
  PushBone  (Tree, vec3( 0.0, 1.0,0.06), 0.21);
  NextFinger(Tree);
  PushFinger(Tree, vec3(-1.0, 1.0,-1.0), 0.1);
  PushBone  (Tree, vec3(-0.36, 0.7,-1.1), 0.6);
  PushBone  (Tree, vec3( 0.1, 1.0, 0.2), 0.3);
  PushBone  (Tree, vec3( 0.3, -0.3, 0.6), 0.24);
  PushBone  (Tree, vec3( 0.3, -1.9,0.6), 0.15);
  NextFinger(Tree);
  PushFinger(Tree, vec3( 1.4, 1.0,-1.0), 0.1);
  PushBone  (Tree, vec3( 0.02, 0.7,-1.1), 0.63);
  PushBone  (Tree, vec3( 0.1, 1.0,-0.0), 0.3);
  PushBone  (Tree, vec3(-0.05, -0.3, 0.6), 0.24);
  PushBone  (Tree, vec3( 0.0, -1.9, 0.6), 0.15);
  NextFinger(Tree);
  PushFinger(Tree, vec3( 3.6, 1.0,-1.0), 0.12);
  PushBone  (Tree, vec3( 0.2, 0.7,-0.9), 0.6 );
  PushBone  (Tree, vec3( 0.2, 1.0, -0.0), 0.3);
  PushBone  (Tree, vec3( 0.0, -0.3, 0.6), 0.24);
  PushBone  (Tree, vec3( 0.0, -1.9,0.6), 0.14);
  return Tree;
}

hit_info Map(in vec3 pos)
{
  f_tree Tree = GlobalTree;
  vec3 a = vec3(0.0, 0.0, 1.0);
  //ring
  float d0 = SdfTube(a, pos*rot(vec3(0.0,u_time,3.14*0.5)), 0.9, 0.16, 0.05);
  float d1 = SdfTube(a, pos*rot(vec3(0.0,u_time,3.14*0.5)), 1.16, 0.01, 0.1);
  float dring = smin(d0,d1,0.4);
  //hand
  float thickness = 0.13;
  float fr = 0.025;
  float dpalm = SdfElipsod(vec3(0.0,-0.21, -0.01), pos*rot(vec3(-0.8,0.0,0.0)), vec3(0.2, 0.3, 0.1));
  InitFingerTree(Tree, vec3(0.05, -0.6, 0.23));
  float dhand = 1000.0;
  dhand = smin(dhand, RenderFinger(Tree, 0, fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 0, ivec2(0, 1), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 0, ivec2(1, 2), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 0, ivec2(2, 3), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 0, ivec2(3, 4), fr, pos), thickness);
  dhand = smin(dhand, RenderFinger(Tree, 1, fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 1, ivec2(0, 1), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 1, ivec2(1, 2), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 1, ivec2(2, 3), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 1, ivec2(3, 4), fr, pos), thickness);
  dhand = smin(dhand, RenderFinger(Tree, 2, fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 2, ivec2(0, 1), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 2, ivec2(1, 2), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 2, ivec2(2, 3), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 2, ivec2(3, 4), fr, pos), thickness);
  dhand = smin(dhand, RenderFinger(Tree, 3, fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 3, ivec2(0, 1), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 3, ivec2(1, 2), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 3, ivec2(2, 3), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 3, ivec2(3, 4), fr, pos), thickness);
  dhand = smin(dhand, RenderFinger(Tree, 4, fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 4, ivec2(0, 1), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 4, ivec2(1, 2), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 4, ivec2(2, 3), fr, pos), thickness);
  dhand = smin(dhand, RenderBone  (Tree, 4, ivec2(3, 4), fr, pos), thickness);
  //dist based on material
  hit_info Hit = HitInfo(dring, 0, pos);
  if(Hit.Dist>dhand) Hit = HitInfo(dhand, 1, pos);
  return Hit;
}

hit_info RayMarch(vec3 ro, vec3 rd, in float side)
{
  float TotalMarchDist = 0.0;
  hit_info Hit;
  Hit.Pos = rd*TotalMarchDist + ro;
  for(int i=0;i<100;i++)
  {
    Hit = Map(Hit.Pos);
    Hit.Dist*=side;
    Hit.Pos += rd*Hit.Dist;
    TotalMarchDist += Hit.Dist;
    if(abs(Hit.Dist)<0.001) break;
    if(TotalMarchDist>20.00) break;
  }
  Hit.Dist = TotalMarchDist;
  return Hit;
}

vec3 Normal(in vec3 Pos)
{
  vec2 Epsilon = vec2(0.001, 0.0);
  return normalize(vec3(Map(Pos+Epsilon.xyy).Dist-Map(Pos-Epsilon.xyy).Dist,
                        Map(Pos+Epsilon.yxy).Dist-Map(Pos-Epsilon.yxy).Dist,
                        Map(Pos+Epsilon.yyx).Dist-Map(Pos-Epsilon.yyx).Dist));
}

vec3 RefractedColor(hit_info Hit, vec3 rd)
{
  float Ior = 1.4;
  vec3 InNormal = 0.5+0.5*Normal(Hit.Pos);
  vec3 InDir = refract(rd, InNormal, 1.0/Ior);
  vec3 PosEnter = Hit.Pos - 0.001*3.0;
  hit_info HitIn = RayMarch(PosEnter, InDir, -1.0);
  
  vec3 PosExit = PosEnter+InDir*HitIn.Dist;
  vec3 OutNormal = -0.5+0.5*Normal(PosExit);
  vec3 OutDir  = refract(InDir, OutNormal, Ior);
  if(dot(OutDir, OutDir)==0.0) OutDir = reflect(InDir, OutNormal);
  return texture(u_cubeMap, OutDir).rgb;
}

void main(void) {
  vec2 um = u_mouse.xy/u_resolution.xy;
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  vec2 st = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.y;
  vec3 color = vec3(0.0);
  vec3 bga = vec3(0.8, 0.75, 0.5); //orange
  vec3 bgb = vec3(0.2, 0.75, 0.8); //blue
  color = mix(bga, bgb, uv.y);
  
  float OrbitRadius = 2.5;
  float OrbitCycle =u_time*0.6+3.0*TAU*um.x;// 3*TAU*um.x;//u_time*0.6;//3*TAU*um.x;
  vec3 ro = (vec3(OrbitRadius*sin(OrbitCycle), 0.0, OrbitRadius*cos(OrbitCycle)));//*
  //rot(vec3(OrbitCycle*um.y/um.x,0.0,0.0)));
  vec3 camz = normalize(ro);
  vec3 camx = normalize(cross(camz, vec3(0.0, 1.0, 0.0)));
  vec3 camy = normalize(cross(camx, camz));
  vec3 PixelGrid = vec3(st, -1.8);
  vec3 rd = normalize(PixelGrid.x*camx +
                      PixelGrid.y*camy +
                      PixelGrid.z*camz);
  //color = texture(u_cubeMap, rd).rgb;
  
  GlobalTree = BuildFingerTree();
  hit_info Hit = RayMarch(ro, rd, 1.0);
  
  if(Hit.Dist<20.0)
  {
    if(Hit.MatId == 0)
    {
      vec3 Light = normalize(vec3(10.8, 0.2, 0.3)-Hit.Pos);
      vec3 Diff = vec3(1.0, 0.60, 0.70);
      //color = 0.5+0.5*Normal(Hit.Pos)*1.0;
      
      color = RefractedColor(Hit, rd)*0.5*Diff;//*(0.5+0.5*dot(Normal(Hit.Pos), Light));
    }
    if(Hit.MatId == 1)
    {
      vec3 Light = normalize(vec3(10.8, 0.2, 0.3)-Hit.Pos);
      vec3 Diff = vec3(1.0);
      //color = 0.5+0.5*Normal(Hit.Pos)*1.0;//Diff*(0.5+0.5*dot(Normal(Hit.Pos), Light));
      //Diff-(0.5+0.5*dot(Normal(Hit.Pos), Light));
      color = RefractedColor(Hit, rd);
    }
  }
  color = pow(color, vec3(.4545));
  
  Output = vec4(color, 1.0);
}
