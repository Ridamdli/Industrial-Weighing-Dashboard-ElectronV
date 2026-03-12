@echo off
setlocal enabledelayedexpansion
set "BINDIR=%CD%\node_modules\.bin"
echo Cleaning old dist...
if exist dist rmdir /s /q dist
echo Building TypeScript + Vite frontend...
"%BINDIR%\tsc.cmd" 
if errorlevel 1 exit /b 1
"%BINDIR%\vite.cmd" build
if errorlevel 1 exit /b 1
echo Packaging with electron-builder...
"%BINDIR%\electron-builder.cmd"
if errorlevel 1 exit /b 1
echo.
echo Build complete!
