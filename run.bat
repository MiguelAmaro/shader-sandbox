@echo off

set FRAGSHADER=^
raymarcherfromscratch.frag
rem tuthappyjumping.frag
rem mandelbrotset.frag
rem attractors.frag
rem buffex.frag
rem pixelspririts.frag
rem fractal.frag
rem first.frag
rem Release
set GLSLVIEWER=F:\Dev_Tools\glslViewer\Debug\glslViewer.exe
set VIEWCONFIG=-w 900 -h 1080 -x 0 -y 0 -l

rem Look at glslviwer.help in project directory for command line options
%GLSLVIEWER% src\%FRAGSHADER% %VIEWCONFIG% 
rem data\na.png