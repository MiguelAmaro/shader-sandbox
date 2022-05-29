@echo off

set FRAGSHADER=^
mandelbrotset.frag
rem tuthappyjumping.frag
rem attractors.frag
rem buffex.frag
rem pixelspririts.frag
rem fractal.frag
rem first.frag

set GLSLVIEWER=F:\Dev_Tools\glslViewer\Release\glslViewer.exe
set VIEWCONFIG=-w 600 -h 600 -x 0 -y 0 -l

rem Look at glslviwer.help in project directory for command line options
%GLSLVIEWER% src\%FRAGSHADER% %VIEWCONFIG% 
rem data\na.png