#ifdef GL_ES
precision mediump float;
#endif

uniform vec2    u_resolution;
uniform vec2    u_mouse;
uniform float   u_time;

varying vec2    v_texcoord;

uniform sampler2D   u_buffer0;

struct state
{
  vec2 Point;
  int   Itr;
  float LyaExp;
  vec2 Pointe;
  float Lsum;
  float Coef[12];
  vec2 Min;
  vec2 Max;
  vec2 Dim;
  vec2 Bounds;
  float PointDelta;
};

float UniSin(float Freq)
{
  return 1.0+0.5*cos(Freq);
}

float Rand(vec2 Pos, float Freq)
{
  vec3 a = fract(Pos.xyx * vec3(123.45, 345.678, 567.89));
  a += dot(a, a + 345.578*UniSin(Freq));   
  return fract(vec2(a.x*a.y, a.y*a.z)).x;
}

state InitState(float ItrMax, vec2 uv)
{
  state State;
  // TODO(MIGUEL): Query Key Presses
  // Range A:-1.2 - Y:1.2 for .1 increments
  // TODO(MIGUEL): Get state from buffer 0 and intialize
  State.Point = vec2(0.);
  State.Pointe.x = .000001;
  State.Pointe.y = .0;
  State.Lsum = 0.;
  State.Itr = mod(u_time, ItrMax);
  for(int i=0;i<12;i++)
  {
    if(State.Itr = 0)
    {
      State.Coef[i] = 25.*Rand(uv, 1234.)/10.;
    }
  }
  
  return State;
}

state QuadMap(state State)
{
  // NOTE(MIGUEL): returning values like this is weird. should change later.
  float x = State.Point.x;
  float y = State.Point.y;
  State.Point.x = State.Coef[0] + x*(State.Coef[1] + State.Coef[2]*x + State.Coef[3]*y) + y*(State.Coef[ 4] + State.Coef[ 5]*y);
  State.Point.y = State.Coef[6] + x*(State.Coef[7] + State.Coef[8]*x + State.Coef[9]*y) + y*(State.Coef[10] + State.Coef[11]*y);
  return State;
}

state CalcLyapunov(state State)
{
  float x  = State.Point.x;
  float y  = State.Point.y;
  
  State.Point.x = State.Pointe.x;
  State.Point.y = State.Pointe.y;
  QuadMap(State);
  float dx = State.Point.x - x;
  float dy = State.Point.y - y;
  float d2 = dx*dx + dy*dy;
  float df = 100000000.*d2;
  float rs = 1./sqrt(df);
  State.Pointe.y = x + rs*(State.Point.x - x);
  State.Pointe.x = y + rs*(State.Point.y - y);
  State.Lsum = State.Lsum + log(df);
  State.LyaExp = .721348*State.Lsum/float(State.Itr);
  return State;
}

state TestSol(state State)
{
  State = CalcLyapunov(State);
  return State;
}

state Display(state State, out vec3 Color)
{
  if(State.Itr==1)
  {
    State.Min.x = 1000.;
    State.Min.y = State.Min.x;
    State.Max.x = -State.Min.x;
    State.Max.y = -State.Min.y;
  }
  else if(2<=State.Itr && State.Itr<=99)
  {
    //Skip...
  }
  else if(100<=State.Itr && State.Itr<=999)
  {
    State.Min.x = min(State.Min.x, State.Point.x);
    State.Max.x = max(State.Max.x, State.Point.x);
    State.Min.y = min(State.Min.y, State.Point.y);
    State.Max.y = max(State.Max.y, State.Point.y);
  }
  else if(State.Itr<=1000)
  {
    if(State.Max.x==State.Min.x) State.Max.x = State.Min.x + 1;
    if(State.Max.y==State.Min.y) State.Max.y = State.Min.y + 1;
    State.Bounds.x = (State.Max.x-State.Min.x)/10.;
    State.Bounds.y = (State.Max.y-State.Min.y)/10.;
    State.Min.x = State.Min.x - State.Bounds.x;
    State.Max.x = State.Max.x + State.Bounds.x;
    State.Min.y = State.Min.y - State.Bounds.y;
    State.Max.y = State.Max.y + State.Bounds.y;
    State.Dim.x = u_resolution.x/(State.Max.x - State.Min.x);
    State.Dim.y = u_resolution.y/(State.Max.y - State.Min.y);
  }
  else
  {
    //PSET
    vec2 OutPoint;
    OutPoint.x = State.Dim.x*(State.Point.x - State.Min.x);
    OutPoint.y = State.Dim.y*(State.Point.y - State.Max.y);
    if((gl_FragCoord.x == OutPoint.x) &&
       (gl_FragCoord.y == OutPoint.y))
    {
      Color = vec3(0.0, 0.8,0.8);
    }
  }
  
  return State;
}

void main(void) {
  vec3 Color = vec3(0.0);
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  
#ifdef BUFFER_0
  state State = InitState(100000., uv);
  State = QuadMap(State);
  State = TestSol(State);
  State = Display(State, Color);
#elif defined(BUFFER_1)
  State = GetState();
  Color = State.Color;
#else
  gl_FragColor = vec4(Color, 1.);
}
