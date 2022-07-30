@echo off

set FRAGSHADER=^
volumetriclightingc.frag
rem noiseexperiments.frag
rem deconunknownpleasures.frag
rem cavediving.frag
rem tutfluidsim.frag
rem deconiqvoronoi.frag
rem tutgears.frag
rem unknownpleasures3d.frag
rem spheretracing.frag
rem deconfractalpat.frag
rem feminism.frag
rem cubemapexample.frag
rem raymarcher.frag
rem landscapetut.frag
rem strangeattractors.frag
rem raymarcherfromscratch.frag
rem na.frag
rem tuthappyjumping.frag
rem mandelbrotset.frag
rem attractors.frag
rem buffex.frag
rem pixelspr  irits.frag
rem fractal.frag
rem first.frag
rem Release

set GLSLVIEWER=F:\Dev_Tools\glslViewer\Release\glslViewer.exe
set VIEWCONFIG=-w 800 -h 1000 -x 0 -y 0 -l --fps 60 -c

rem Look at glslviwer.help in project directory for command line options
%GLSLVIEWER% src\%FRAGSHADER% %VIEWCONFIG%
rem -C data\mountain.hdr
rem data\na.png