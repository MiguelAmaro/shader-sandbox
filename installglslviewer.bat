echo !!!shell.bat must be set to 2022 to access v143 build tools!!!
F:\Dev\shell.bat

pushd F:\Dev_Tools
if not exist glslViewer mkdir glslViewer
call :PULLFROMGITHUB
pushd glslViewer
msbuild.exe .\glslViewer.sln /v:q /nologo /p:Configuration=Release
popd
popd
goto :eof

:PULLFROMGITHUB
git clone https://github.com/patriciogonzalezvivo/glslViewer.git
pushd glslViewer
git submodule init
git submodule update
popd
exit /b 0

:eof