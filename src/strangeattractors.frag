
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

void main(void) {
  vec4 color = vec4(vec3(0.0), 1.0);
  vec2 pixel = 1.0/u_resolution.xy;
  vec2 st = gl_FragCoord.xy * pixel;
  vec2 uv = v_texcoord;
  
  color.rgb = vec3(st.x,st.y,abs(sin(u_time)));
  
  gl_FragColor = color;
}

#version 330

// ping pong inputs
uniform sampler2DRect particles0;
uniform sampler2DRect particles1;

uniform float timestep;

in vec2 texCoordVarying;

layout(location = 0) out vec4 posOut;
layout(location = 1) out vec4 velOut;


// Lorenz Attractor parameters
float a = 10.0;
float b = 28.0;
float c = 2.6666666667;


void main()
{
  
  int id = int(texCoordVarying.s) + int(texCoordVarying.t)*int(textureSize(particles0).x);
  vec3 pos = texture(particles0, texCoordVarying.st).xyz;
  vec3 vel = texture(particles1, texCoordVarying.st).xyz;
  
  // Previous positions
  float x = pos.x;
  float y = pos.y;
  float z = pos.z;
  
  // Increments calculation
  float dx = (a * (y - x))   * timestep;
  float dy = (x * (b-z) - y) * timestep;
  float dz = (x*y - c*z)     * timestep;
  
	// Add the new increments to the previous position
  vec3 attractorForce = vec3(dx, dy, dz) ;
  pos +=attractorForce;
  
  
  
  posOut = vec4(pos, id);
  velOut = vec4(vel, 0.0);
}