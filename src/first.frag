#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

uniform sampler2D u_tex0;
uniform vec2 u_tex0Resolution;

float Circle(vec2 uv, vec2 Pos, float Rad)
{
    //TODO(): How tf do i do radius correctly????
    return smoothstep(0.05, 0.044, 1./Rad*length(uv-Pos));
}

void main(void)
{
    vec3 color = vec3(0.0);
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 uv = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.xy;
    uv*=uv.y;
    //uv = vec2(atan(uv.y, uv.x), length(uv));
    uv*= 10.0;
    uv+=u_time;
    if ( u_tex0Resolution != vec2(0.0) ){
        float imgAspect = u_tex0Resolution.x/u_tex0Resolution.y;
        //vec2 polar = vec2(atan(uv.y, uv.x), length(uv));
        vec4 img = texture2D(u_tex0,uv*vec2(1.,imgAspect));
        color = mix(color, img.rgb,img.a);
    }
    
    color += vec3(floor(4*st), abs(sin(u_time*0.1)));
    color -= vec3(0., smoothstep(0.,0.2, st.x), smoothstep(0.,0.2, st.x));
    color += Circle(st, vec2(.5), .5);
    gl_FragColor = vec4(color, 1.0);
}
