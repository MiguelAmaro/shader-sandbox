
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

float UnilatSin(float Freq)
{
    return 1.0+0.5*cos(u_time*Freq);
}

float Rand(vec2 Pos, float Freq)
{
    vec3 a = fract(Pos.xyx * vec3(123.45, 345.678, 567.89));
    a += dot(a, a + 345.578*UnilatSin(Freq));   
    return fract(vec2(a.x*a.y, a.y*a.z)).x;
}

void SetParams(vec2 uv, out vec2 Point, out float Params[12])
{
    // TODO(MIGUEL): Query Key Presses
    // Range A:-1.2 - Y:1.2 for .1 increments
    Point = vec2(0.);
    for(int i=0;i<12;i++)
    {
        Params[i] = 25.*Rand(uv, 1234.)/10.;
    }
}

float QuadMap(vec2 Point, float n)
{
    return 1.;
}

float GetLyapunov(float i)
{
    return 1.;
}

void main(void) {
    vec3 color = vec3(0.0);
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    
    
    float Coef[12];
    vec2 Point;
    SetParams(uv, Point, Coeffs);
    //color = vec3(Coef[0], Coef[1], Coef[2]);
    
    gl_FragColor = vec4(color, 1.);
}
