
#ifdef GL_ES
precision mediump float;
#endif

#define PI (3.14159265358979323846)
uniform vec2        u_resolution;
uniform float u_time;

void main (void) {
    vec3 color = vec3(0.0);
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    
    color += smoothstep(0.5+cos(st.y*PI+u_time)*.25,
                        0.5+cos(st.y*PI+u_time)*.25+0.002,st.x);
    //color += smoothstep(0.5, 0.498,(st.y+st.x)*.5);
    
    gl_FragColor = vec4(color,1.0);
}
