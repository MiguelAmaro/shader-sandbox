
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;


#define PI 3.14159265359
#define PHI 1.61803398875

// fabrice's rotation matrix
vec2 V;
#define rot(a) mat2( V= sin(vec2(1.57, 0) + a), -V.y, V.x)

// iq's HSV
vec3 hsv2rgb( in vec3 c ) {
  vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
	rgb = rgb*rgb*(3.0-2.0*rgb);
	return c.z * mix( vec3(1.0), rgb, c.y);
}

// hexagonal distance
float hexDist(vec2 p) {
#define MULT1 (1.0/tan(PI/3.0))
#define MULT2 (1.0/sin(PI/3.0))
	float dx = abs(p.x);
	float dy = abs(p.y);
	return max(dx+dy*MULT1, max(dx, dy*MULT2));
}

vec4 fractal( in vec2 p ) {
  
  // keep current scale
  float scale = 1.0;
  
  // used to smoothstep
  float aliasBase = 1.0 / u_resolution.y;
  
  // accumulated alpha
  float alpha = 0.0;
  // accumulated color
  vec3 color = vec3(0.0);
  
#define LEVELS 10
  for (int i = 0 ; i < LEVELS ; i++) {
    
    // scale
    float s = 3.0;
		
    // repeat axis according to scale ala TEXTURE_ADDRESS_MIRROR
    p = 1.0 - abs(s*fract(p-0.5)-s*0.5);
    
    // fold
    float theta = float(i) * PI * (0.5+0.5*sin(u_time*0.1));
    //theta = iTime*0.02 * float(i); // try this one
    p *= rot(theta);
    
    // update scale
    scale *= s;
    
    // jump first steps cause they're less interesting
    if (i < 4.0*(0.5+0.5*sin(u_time*0.4))) continue;
    
    // texture
    
    // borders
    vec2 uv = abs(p);
    float delt1 = abs((hexDist(uv)-0.6)-2.0);
    float delt2 = min(length(uv)-0.2, min(uv.x, uv.y));
    float m = min(delt1, delt2);
    float alias = aliasBase*0.4*scale;
    float f = smoothstep(0.10+alias, 0.10, m)*0.4 + smoothstep(0.22, 0.11, m)*0.6;
    
    // pulse
    float r = length(uv)/0.707106;
    float t = mod(u_time*1.5, float(LEVELS-4)*2.0) - float(i);
    r = (r + 1.0 - t)*step(r*0.5, 1.0);
    r = smoothstep(0.3, 0.0, r) *smoothstep(0.9, 0.5, r);
    
    // mix colors
    vec3 c = vec3(smoothstep(0.5+0.5*sin(u_time*0.8)+alias, 0.06, m));
    vec3 hue = hsv2rgb( vec3(u_time*0.001+float(i*0.2)*0.08, 0.2, 0.2) );
    c = c*hue;
    c += c*r*1.5;
    
    // front to back compositing
    color = (0.92-alpha)*c+color;
    alpha = (1.0-alpha)*f+alpha;
    
  }
  
  return vec4(color, alpha);
}

void main(void) {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy * 2.0 - 1.0;
  vec2 p = uv;
  uv.x *= u_resolution.x / u_resolution.y;
  
  if (u_mouse.y < 0.5)
    uv += vec2(0.4487, 0.17567)*(u_time+10.3312);
  else
    uv -= (u_mouse.xy-u_resolution.xy*0.5)*0.015;
  
	uv *= 0.07;
  
  vec4 frac = fractal(uv+u_time*0.01);
  
  // mix fractal with a grey background
  gl_FragColor.rgb = mix(vec3(0.5), frac.rgb, frac.a);
  // vignette
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0), dot(p, p)*0.5);
  
  gl_FragColor.a = 1.0;
}
