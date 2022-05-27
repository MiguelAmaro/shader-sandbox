set GLSLVIEWER=F:\Dev_Tools\glslViewer\Release\glslViewer.exe

set FRAGSHADER=^
buffex.frag
rem attractors.frag
rem pixelspririts.frag
rem fractal.frag
rem first.frag

rem Look at glslviwer.help in project directory for command line options
%GLSLVIEWER% src\%FRAGSHADER% -l
rem data\na.png