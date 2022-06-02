#ifdef GL_ES
precision mediump float;
#endif

//iq tutorial link
//https://youtu.be/Cfe5UQ-1L9Q

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

float SdSphere(in vec3 pos, float rad)
{
  float d = length(pos) - rad;
  return d;
}

float SdElipsoid(in vec3 pos, vec3 rad)
{
  float k0 = length(pos/rad); //[21]
  float k1 = length(pos/rad/rad);
  return k0*(k0-1.)/k1;
}

float SdStick(in vec3 p, vec3 a, vec3 b, float ra, float rb)
{
  vec3 ba = b-a;
  vec3 pa = p-a;
  float h = clamp(dot(pa, ba)/dot(ba,ba),0.0,1.0);
  
  float r = mix(ra, rb, h);
  return length(pa-h*ba) - r;
}

float smin(in float a, in float b, float k)
{
  float h = max(k-abs(a-b), 0.0);
  return min(a,b) - h*h/(k*4.0);
}

float smax(in float a, in float b, float k)
{
  float h = max(k-abs(a-b), 0.0);
  return max(a,b) + h*h/(k*4.0); //[29]
}

vec2 SdGuy(in vec3 pos)
{
  float t = fract(u_time);
  float y = 4.0*t*(1.-t);
  float dy = 4.0*(1.0 - 2.0*t);
  vec2 u = vec2(1.0, dy);
  vec2 v = vec2(-dy, 1.0);
  vec3 cen = vec3(0.0,y,0.0);
  float sy = 0.5+0.5*y; //[22]
  float sz = 1.0/sy;
  vec3 rad= vec3(0.25, 0.25 *sy, 0.25*sz);
  vec3 q = pos-cen;
  //q.yz = vec2(dot(u, q.yz), dot(v, q.yz));
  float d = SdElipsoid(q,rad);
  
  vec3 h = q;
  vec3 sh = vec3(abs(h.x), h.yz); //[24]
  //Head
  float d2 = SdElipsoid(h-vec3(0.0, 0.28,0.0), vec3(0.15, 0.2, 0.23));
  float d3 = SdElipsoid(h-vec3(0.0, 0.28,-0.1), vec3(0.23, 0.2, 0.2));
  d2= smin(d2,d3, 0.03); //[23]
  d= smin(d,d2, 0.1); //[23]
  
  //Head:Eyebrow
  vec3 eb = sh-vec3(0.12, 0.34, 0.15);
  eb.xy = (mat2(3.0,4.0,-4.0,3.0)/5.0)*eb.xy;
  d2= SdElipsoid(eb, vec3(0.06,0.035,0.05));
  d= smin(d,d2, 0.04); //[23]
  
  //Head:Mouth
  d2 = SdElipsoid(h-vec3(0.0, 0.15 + 4.0*h.x*h.x, 0.15), vec3(0.1, 0.04, 0.2));
  d = smax(d, -d2, 0.03); //[29]
  //Head:Ears
  d2 = SdStick(sh, vec3(0.1,0.4,-0.02), vec3(0.2, 0.55 +  t*0.2, 0.05), 0.01, 0.03);
  d = smin(d, d2, 0.03); //[31]
  
  vec2 res = vec2(d, 2.0); //Set Head material
  //Eye
  float d4 = SdSphere(sh-vec3(0.08, 0.28, 0.16), 0.05);
  if(d4<d) { res = vec2(d4,3.0); } //Set Eye material
  //Eye:Iris
  d4 = SdSphere(sh-vec3(0.09, 0.28, 0.18), 0.02);
  if(d4<d) { res = vec2(d4,4.0); }
  
  return res;
}

vec2 map(in vec3 pos)
{
  //equations of a sphere????
  vec2 d1 = SdGuy(pos);
  float d2 = pos.y - (-0.25);
  return (d2<d1.x)?vec2(d2, 1.0):d1; //[11]
}

mat3 RotY3d(in float t)
{
  return mat3(cos(t),0.0,sin(t),
              0.0,1.0, 0.0,
              -sin(t),0.0,cos(t));
}

mat3 RotX3d(in float t)
{
  return mat3(cos(t),0.0,sin(t),
              0.0,1.0, 0.0,
              -sin(t),0.0,cos(t));
}

vec3 LookAroundByChangingUV(in vec2 uv)
{
  vec2 st = (2.0*u_mouse.xy-u_resolution.xy)/u_resolution.y;
  vec3 newrd=vec3(uv.x, uv.y, -2.0); //fov controller/depth of view cone
  return newrd*RotY3d(-st.x*6.3);
}

vec3 CalcNormal(in vec3 pos)
{
  vec2 e = vec2(0.0001, 0.);
  return normalize(vec3(map(pos+e.xyy).x-map(pos-e.xyy).x,
                        map(pos+e.yxy).x-map(pos-e.yxy).x,
                        map(pos+e.yyx).x-map(pos-e.yyx).x));
}

float CastShadow(in vec3 ro, vec3 rd)
{
  float res = 1.0;
  return res;
  float t=0.;
  for(int i=0; i<100; i++)
  {
    vec3 pos = ro + t*rd;
    float h = map(pos).x;
    res = min(res, 16.0*h/t);
    if(res<0.0001) break;
    t+=h;
    if(t>2.0) break;
  }
  return res;
}

vec2 CastRay(in vec3 ro, vec3 rd)
{
  float m = -1.0;
  float t=0.;
  for(int i=0; i<100; i++)
  {
    vec3 pos = ro + t*rd;
    vec2 h = map(pos);
    m = h.y;
    if(h.x<0.001) break;
    t += h.x;
    if(t>20.0) break;
  }
  if(t>20.){ m=-1.0; }//[13]
  
  return vec2(t, m);
}

float Bias(in float val)
{
  return 0.5 + 0.5*val; //[10]
}

void main(void) {
  
  vec2 uv = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.y;
  
  //Camera Stuff
  float an = 10.0*u_mouse.x/u_resolution.y;
  
  vec3 ta = vec3(.0,.95,.0);
  
  vec3 ro = ta + vec3(1.5*sin(an),0.,1.5*cos(an));
  
  vec3 ww = normalize(ta-ro);
  vec3 uu = normalize(cross(ww, vec3(0.,1.,.0)));
  vec3 vv = normalize(cross(uu, ww));
  //vec3 p = LookAroundByChangingUV(uv); //Completely wrong. Create a camera system and adjust the look point.
  float LenseLength = 1.8;
  vec3 p = vec3(uv, LenseLength);//[20]
  vec3 rd = normalize(p.x*uu + p.y*vv + p.z*ww);
  
  vec3 col = vec3(0.3,.55, 0.9) - 0.7*rd.y; //[16]
  col = mix(col, vec3(.7,0.75,0.8), exp(-10.*rd.y)); //[17]
  
  vec2 tm = CastRay(ro, rd);
  if(tm.y>0.0) //[13]
  {
    float t = tm.x;
    vec3 pos= ro+t*rd;
    vec3 nor = CalcNormal(pos);
    vec3 mate = vec3(0.18);
    if(tm.y<1.5)
    {
      mate = vec3(0.05, 0.1,0.002);
    }
    else if(tm.y<2.5)
    {
      mate = vec3(0.2, 0.1,0.02);
    }
    else if(tm.y<3.5)
    {
      mate = vec3(0.5,0.5,0.5);
    }
    else if(tm.y<4.5)
    {
      mate = vec3(0.0,0.0,0.0);
    }
    
    vec3  sun_dir = vec3(.8, .4, .2);
    float sun_dif = clamp(dot(nor, sun_dir),.0,1.);  //[8]
    float sun_sha = CastShadow(pos+nor*0.001, sun_dir); //[12]
    float sky_dif = clamp(Bias(dot(nor, vec3(0.,1.,0.))),0.0,1.); //[8]
    float bou_dif = clamp(Bias(dot(nor, vec3(0.,-1.,0.))),0.0,1.); //[15]
    col  = mate*vec3(7.,4.5,3.0)*sun_dif*sun_sha; //[9][13]
    col += mate*vec3(0.5,.8,.9)*sky_dif;
    col += mate*vec3(0.7,.3,.1)*bou_dif;
  }
  
  col = pow(col, vec3(0.4545)); //[14]
  gl_FragColor = vec4(col,1.0);
}

/*Notes:
*        Gl coored system is positive x to the right, positive y up, positive z toward you.
*        TLight: strongest light in the sceen
*         [8][29.41] Calc alignment of sundirection and surface normal use as influence on final color. Same is done for sky light 
*                    and bounce lighting of the floor.
*         [9][31:10] Sun yellow and sky blue are complemntary colors.
*        [10][32:58] Biasing dot prod to get color on bottom side.
*        [11][34:46] min and sdf to combine objects. Quering the the closest obj.
*        [12][36:47] Same question different point of view. Is obj visible from light src. Casting rays to calc shadow.
*        [13][37:33] Some confusing stuff for getting shadows to work
*        [14][38:19] Camera space and gama correcting from the beginning. Deafault mat color given to obj
*        [15][42:20] Bounce lighting 
*        [16][46:35] Sky gradient
*        [17][50:00] Horizon
*        [18][52:22] Camera Transformation and orbiting around the sphrere
*        [19][56:20] Parabola and normalizeing signals(functions) using graphtoy and creating repetition using fract
*        [20][59:02] Making camera feel closer by adjusting fov by enlongatign the lense.
*        [21][1:00:02] Sdf of ellipsoid stratching space compute distance and reset. using vec3 radii  
*        [22][1:03:00] Maintaing volume when stretch. By taking inverse of of y streatch
*        [23][1:12:34] Blending a 2 combined but discontinuous functions using smin. Using graphtoy to derive soothmin
*        [24][1:20:25] Using e values and sdfs to duplicate features that are symetric.
*        [25][1:22:00] Returning object ids along with distance
*        [26][1:27:00] Better shadows. And subshadows
*        [27][1:34:00] Adding color to surfaces.Materisl system
*        [28][1:40:00] Rotating ohj by making a coordinate system using matricis and pathgoryan tripplets
*        [29][1:44:00] Carving using sdf and smooth max 
*        [30][1:47:00] Shaping the elipsoid on an axis by asjusting the pos(test point) with a function
*        [31][1:51:00] making ears with an Sdf stick
*        [][]
*        [][]
*        [][]
*        [][]
*        [][]
*        [][]
*        [][]
*        [][]
*        
*        
*/
