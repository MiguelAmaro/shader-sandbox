
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_resolution;
uniform float       u_time;
varying vec2        v_texcoord;

float line(vec2 p, vec2 a,vec2 b) { 
    p -= a,
    b -= a;
    float h = clamp(dot(p, b) / dot(b, b), 0., 1.);   // proj coord on line
    float l = length(p - b * h);                         // dist to segment
    return smoothstep(0.001, 0.0, l);
}

float UVDot(float UVRadius, vec2 UVPos, float Fade, vec2 uv, float UVRange)
{
    float UVFade = UVRange - Fade;
    return smoothstep(UVRange-UVFade, UVRange, length(uv-UVPos)/UVRadius);
}

float rand(vec2 uv, float freq)
{
    float result = 0.0; 
    vec3 a = fract(uv.xyx * vec3(123.45, 345.678, 567.89));
    a += dot(a, a + 345.578*(1.0+0.5*cos(u_time*freq)));   
    result = fract(a.x*a.y*a.z);
    return result;
}

void main (void) {
    vec3 color = vec3(0.0);
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    
    
    color += vec3(uv.x, uv.y, abs(sin(u_time)))*0.3;
    
    //~ Tent Map I think???
    float x0 = 1.0*(.5+.5*sin(u_time*0.4));
    float c0 = 0.0;
    float c1 = 0.0;
    float c2 = 0.0;
#if 1
    //Tent Map Plot
    for(int i=0;i<10;i++)
    {
        float r = 2.*(.5+.5*sin(u_time*0.2));
        float x1 = (r/2.0)-r*abs(x0-1./2.);
        vec2 Point = vec2(x0,x1);
        c0 += 1.-UVDot(0.006, Point, 0.5, uv, 1.0);
        c0 += line(uv, vec2(x0, 0.0), vec2(x0, x1));
        c0 += line(uv, vec2(0.0, x1), vec2(x0, x1));
        x0 = x1;
    }
#endif
#if 1
    //Logistic Map Plot
    float x = mod(u_time*0.000002, 10.0)/10.0;
    int itr= 50;
    for(int i=0;i<itr;i++)
    {
        float r = 3.9973474;
        float x1 = x*r*(1.-x);
        float x0 = float(i)/float(itr);
        vec2 Point = vec2(x0,x1);
        c1 += 1.-UVDot(0.006, Point, 0.5, uv, 1.0);
        c1 += line(uv, vec2(x0, 0.0), vec2(x0, x1));
        c1 += line(uv, vec2(0.0, x1), vec2(x0, x1));
        x = x1;
    }
#endif
#if 1
    {
        //Logistic Map Bifurcation Diagram
        float x = mod(u_time*0.00000001, 100.0)/100.0;
        int itr= 50;
        for(int i=0;i<itr;i++)
        {
            float r = uv.x*4.0;
            float x1 = x*r*(1.-x);
            float x0 = float(i)/float(itr);
            vec2 Point = vec2(x0,x1);
            c2 += 1.-UVDot(0.002, Point, 0.5, uv, 1.0);
            c2 += line(uv, vec2(x0, 0.0), vec2(x0, x1));
            c2 += line(uv, vec2(0.0, x1), vec2(x0, x1));
            x = x1;
        }
    }
#endif
    color += c0*vec3(1.0,0.,1.) + c1*vec3(1.,1.,0.) + c2*vec3(0.,1.,1.);
    gl_FragColor = vec4(color,1.0);
}
