
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;
varying vec2    v_texcoord;

struct globals
{
  vec2 mu; // mouse [-1,1]
  vec2 ms; // mouse [0,1]
  vec2 s; // st [-1,1]
  vec2 u; // uv [0,1]
  vec2 r; // resolution
  float p; // norm pixel size
  float a; // aspect ratio
  float t; // time
};
globals g;

globals InitGlobals(in vec2 res, in vec2 fc, in vec2 m, in float t)
{
  globals glb;
  glb.r = res.xy;
  glb.s = (2.0*fc.xy-res.xy)/res.y;
  glb.u = fc.xy/res.xy;
  glb.mu = m.xy/res.xy;
  glb.ms = (2.0*m.xy-res.xy)/res.y;
  glb.p = length(2./glb.r);
  glb.a = glb.r.y/glb.r.x;
  glb.t = t;
  return glb;
}

float Bias(in float a) { return 0.5 + 0.5*a; }

vec2 hash2( vec2 p ) // replace this by something better
{
	p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float hash3(vec3 p)  // replace this by something better
{
  p  = fract( p*0.3183099+.1 );
	p *= 17.0;
  return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
}

float noise1( in float x )
{
  //IQ basic noise
  // setup    
  float i = floor(x);
  float f = fract(x);
  float s = sign(fract(x/2.0)-0.5);
  
  // use some hash to create a random value k in [0..1] from i
  //float k = hash(uint(i));
  //float k = 0.5+0.5*sin(i);
  float k = fract(i*.1731);
  
  // quartic polynomial
  return s*f*(f-1.0)*((16.0*k-4.0)*f*(f-1.0)-1.0);
}

float noise2( in vec2 p )
{
  const float K1 = 0.366025404; // (sqrt(3)-1)/2;
  const float K2 = 0.211324865; // (3-sqrt(3))/6;
  
	vec2  i = floor( p + (p.x+p.y)*K1 );
  vec2  a = p - i + (i.x+i.y)*K2;
  float m = step(a.y,a.x); 
  vec2  o = vec2(m,1.0-m);
  vec2  b = a - o + K2;
	vec2  c = a - 1.0 + 2.0*K2;
  vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
	vec3  n = h*h*h*h*vec3( dot(a,hash2(i+0.0)), dot(b,hash2(i+o)), dot(c,hash2(i+1.0)));
  return dot( n, vec3(70.0) );
}

float noise3( in vec3 x )
{
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
	
  return mix(mix(mix( hash3(i+vec3(0,0,0)), 
                     hash3(i+vec3(1,0,0)),f.x),
                 mix( hash3(i+vec3(0,1,0)), 
                     hash3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix( hash3(i+vec3(0,0,1)), 
                     hash3(i+vec3(1,0,1)),f.x),
                 mix( hash3(i+vec3(0,1,1)), 
                     hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
}

vec3 Viz1()
{
  vec3 col;
  vec3 a = vec3(1.);
  vec3 b = vec3(1.);
  a *= vec3(smoothstep(0.0,g.p, abs(g.s.y-0.5+.5*noise1(g.s.x+g.t))-0.02));
  a *= vec3(smoothstep(0.0,g.p, abs(g.s.y+0.5+.5*noise1(g.s.x+g.t+120.))-0.02));
  vec2 q = g.s*3.0-g.t;
  q.x += g.t;
  //col determined by noise
  b *= vec3(smoothstep(0.0,g.p*(0.2+399.8*Bias(sin(g.t*0.7))), abs(g.s.y-noise2(q))-0.02));
  //col determined by noise
  b -= vec3(.2,0.4,0.8)*vec3(smoothstep(0.0,g.p, noise2(q)))*Bias(cos(g.t));
  col = a*b;
  return col;
}

vec3 Viz2()
{
  vec3 col;
  vec2 q = g.s*5.0-g.t;
  q.x += g.t;
  mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
  col.r  = 0.5000*noise2( q ); q = m*q;
  col.r += 0.2500*noise2( q ); q = m*q;
  col.r += 0.1250*noise2( q ); q = m*q;
  col.r += 0.0250*noise2( q ); q = m*q;
  
  col.r = 0.5 + 0.5*col.r;
  return col;
}


vec3 Viz3()
{
  vec3 col;
  vec3 q = vec3(g.s*20.0-g.t, g.t*2.);
  q.x += g.t;
  const mat3 m = mat3( 0.00,  0.80,  0.60,
                      -0.80,  0.36, -0.48,
                      -0.60, -0.48,  0.64 );
  col  = 0.5000*noise3( q ); q = m*q;
  col += 0.2500*noise3( q ); q = m*q;
  col += 0.1250*noise3( q ); q = m*q;
  col += 0.0225*noise3( q ); q = m*q;
  
  col = 0.5 + 0.5*col;
  return col;
}

void main(void)
{
  g = InitGlobals(u_resolution.xy, gl_FragCoord.xy, u_mouse.xy, u_time);
  float s = 0.1;
  vec3 vp = vec3(smoothstep(0.0001,0., g.u.y-s),
                 smoothstep(0.,0.0001, g.u.y-s),
                 smoothstep(0.,0.0001, g.u.x-0.5));
  vec3 col = vp.y*Viz1()+vp.x*vp.z*Viz2()+vp.x*(1.-vp.z)*Viz3();
  
  gl_FragColor = vec4(col,1.);
}
