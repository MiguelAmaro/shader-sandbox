
#ifdef GL_ES
precision mediump float;
#endif

#define PI  3.14159265359
#define TAU 2.0*3.14159265359

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;
uniform int   u_frame;

varying vec2    v_texcoord;

//SAVE POINTS
//[01:46:45] (07/19/2022)
//
//

// Created by inigo quilez - iq/2019
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// Step #1 of the LIVE Shade Deconstruction tutorials for "Spere Gears"

// Part 1: https://www.youtube.com/watch?v=sl9x19EnKng
// Part 2: https://www.youtube.com/watch?v=bdICU2uvOdU
//   Step 1: https://www.shadertoy.com/view/ws3GD2
//   Step 2: https://www.shadertoy.com/view/wdcGD2
//   Step 3: https://www.shadertoy.com/view/td3GDX
//   Step 4: https://www.shadertoy.com/view/wd33DX
//   Step 5: https://www.shadertoy.com/view/tdc3DX
//   Step 6: https://www.shadertoy.com/view/td3GDf
//   Step 7: https://www.shadertoy.com/view/wssczn
//   Step 8: https://www.shadertoy.com/view/wdlyRr
//   Final : https://www.shadertoy.com/view/tt2XzG


/* NOTES:
** [ 0][00:17:30] sdfbox
** [ 1][00:24:32] Rounding corners and edges of sdfs
** [ 2][00:29:43] sdf repetition
** [ 3][00:42:00] sdf Torus
** [ 4][00:48:30] Clipping Cylinders
** [ 5][00:49:50] sdf Cylinder to Ring
** [ 6][00:57:45] Clipping Cylinder Bottom
** [ 7][01:00:30] Extruding 2D sdf Box(was 3D) and Clipping with cylinder
** [ 8][  :05:20] SmoothMax
** [ 9][  :23:38] sdf Cross
** [10][  :26:07] Optimizing sdf Cross
** [11][  :31:22] Spherical Clipping
** [12][  :42:15] Constrain Evaluations to Postive Plane Space
** [13][  :43:46] Simple Rotations of p
** [14][  :46:45] Animating Gears 
** [][::]
** [][::]
** [][::]
** [][::]
** [][::]
** [][::]
**
*/

#define AA 2

float smax(in float a, in float b, in float k) //[8]
{
  float h = max(k-abs(a-b), 0.0);
  return max(a,b)+(0.25/k)*h*h;
}

float Bias(in float Input)
{
  return 0.5+0.5*Input;
}

float SdBox( in vec2 p, in vec2 r ) //[0]
{
  float d = 0.0;
  return length(max(abs(p)-r,0));
}

float SdSphere( in vec3 p, in float r )
{
  return length(p)-r;
}

float SdCross(in vec3 p, in vec3 r)//[9]
{
  p = abs(p);
  p.xz = (p.z>p.x)?p.zx:p.xz; //[10]
  return length(max(abs(p.xyz)-r,0));
}

float SdVStick(in vec3 p, in float h)
{
  float d = max(p.y-h,0.0);
  return sqrt(p.x*p.x + p.z*p.z + d*d);  
}

vec4 Gear(in vec3 p, in float time)
{
  //float d = SdSphere( p, 0.2 );
  p.y = abs(p.y); //[12]
  float anim = time;
  p.xz = mat2(cos(anim),-sin(anim),sin(anim),cos(anim))*p.xz;
  float Angle = TAU/12.0;
  float Sec = round(atan(p.z, p.x)/Angle);
  float An = Sec*Angle;
  vec3 q = p;
  q.xz = mat2(cos(An), -sin(An), sin(An), cos(An)) * q.xz;
  float d1 = SdBox(q.xz-vec2(0.17,0.0),
                   vec2(0.04, 0.018))-0.01*Bias(sin(u_time)); //[1]  
  float d2 = abs(length(p.xz)-0.155)-0.018; //[5]
  d1 = min(d1,d2);
  d2 = SdCross(p-vec3(0.0,0.5,0.0), vec3(0.15, 0.01, 0.005));
  d1 = min(d1,d2);
  float spherer = length(p);
  d1 = smax(d1, abs(spherer-0.5)-0.03, 0.005*Bias(sin(u_time))); //[4][6]
  d2 = SdVStick(p, 0.5)-0.01;
  d1 = min(d1,d2);
  return vec4( d1, p );
}

vec4 Map( in vec3 p, in float time )
{
  vec4 d1 = Gear(p, time);
  vec4 d2 = vec4(0.0);
  d2 = Gear(p.yzx, time); d1 = (d2.x<d1.x)? d2:d1;//[12]
  d2 = Gear(p.yzx, time); d1 = (d2.x<d1.x)? d2:d1;//[12]
  d2 = Gear(p.zxy, time); d1 = (d2.x<d1.x)? d2:d1;//[12]
  return d1;
}

#define ZERO min(u_frame,0)

vec3 Normal( in vec3 pos, in float time )
{
  vec3 n = vec3(0.0);
  for( int i=ZERO; i<4; i++ )
  {
    vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
    n += e*Map(pos+0.0005*e,time).x;
  }
  return normalize(n);
}

float CalcAO( in vec3 pos, in vec3 nor, in float time )
{
  float occ = 0.0;
  float sca = 1.0;
  for( int i=ZERO; i<5; i++ )
  {
    float h = 0.01 + 0.12*float(i)/4.0;
    float d = Map( pos+h*nor, time ).x;
    occ += (h-d)*sca;
    sca *= 0.95;
  }
  return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );
}

float Softshadow( in vec3 ro, in vec3 rd, in float k, in float time )
{
  float res = 1.0;
  
  float tmax = 2.0;
  float t    = 0.001;
  for( int i=0; i<64; i++ )
  {
    float h = Map( ro + rd*t, time ).x;
    res = min( res, k*h/t );
    t += clamp( h, 0.012, 0.2 );
    if( res<0.001 || t>tmax ) break;
  }
  
  return clamp( res, 0.0, 1.0 );
}

vec4 Intersect( in vec3 ro, in vec3 rd, in float time )
{
  vec4 res = vec4(-1.0);
  
  float t = 0.001;
  float tmax = 5.0;
  for( int i=0; i<128 && t<tmax; i++ )
  {
    vec4 h = Map(ro+t*rd,time);
    if( h.x<0.001 ) { res=vec4(t,h.yzw); break; }
    t += h.x;
  }
  
  return res;
}

mat3 SetCamera( in vec3 ro, in vec3 ta, float cr )
{
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv =          ( cross(cu,cw) );
  return mat3( cu, cv, cw );
}

void main(void) {
  vec3 tot = vec3(0.0);
  
#if AA>1
  for( int m=ZERO; m<AA; m++ )
    for( int n=ZERO; n<AA; n++ )
  {
    // pixel coordinates
    vec2 o = vec2(float(m),float(n)) / float(AA) - 0.5;
    vec2 p = (2.0*(gl_FragCoord+o)-u_resolution.xy)/u_resolution.y;
    float d = 0.5*sin(gl_FragCoord.x*147.0)*sin(gl_FragCoord.y*131.0);
    float time = u_time;
#else    
    vec2 p = (2.0*gl_FragCoord-u_resolution.xy)/u_resolution.y;
    float time = u_time;
#endif
    
    // camera
    vec2 m = u_mouse.xy/u_resolution.xy;
    float orbitrad = 2.5;
    float an = TAU*time/40.0+TAU*m;
    vec3 ta = vec3( 0.0, 0.0, 0.0 );
    vec3 ro = ta + vec3( orbitrad*cos(an), 0.8, orbitrad*sin(an) );
    
    // camera-to-world transformation
    mat3 ca = SetCamera( ro, ta, 0.0);
    
    // ray direction
    float fl = 4.0;
    vec3 rd = ca * normalize( vec3(p,fl) );
    
    // background
    vec3 col = vec3(1.0+rd.y)*0.03;
    
    // raymarch geometry
    vec4 tuvw = Intersect( ro, rd, time );
    if( tuvw.x>0.0 )
    {
      // shading/lighting	
      vec3 pos = ro + tuvw.x*rd;
      vec3 nor = Normal(pos, time);
      
      col = 0.5 + 0.5*nor;
    }
    
    
    // gamma        
    tot += pow(col,vec3(0.45) );
#if AA>1
  }
  tot /= float(AA*AA);
#endif
  
  // cheap dithering
  tot += sin(gl_FragCoord.x*114.0)*sin(gl_FragCoord.y*211.1)/512.0;
  
  gl_FragColor = vec4( tot, 1.0 );
}
