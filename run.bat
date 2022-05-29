@echo off
set GLSLVIEWER=F:\Dev_Tools\glslViewer\Release\glslViewer.exe
set VIEWINFO=-w 600 -h 600 -x 0 -y 0

set FRAGSHADER=^
attractors.frag
run buffex.frag
rem pixelspririts.frag
rem fractal.frag
rem first.frag

rem Look at glslviwer.help in project directory for command line options
%GLSLVIEWER% src\%FRAGSHADER% %VIEWINFO% -l
rem data\na.png