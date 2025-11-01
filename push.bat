@echo off
title Git Commit Menu
color 0A

:menu
cls
echo ===================================
echo      GIT COMMIT TOOL
echo ===================================
echo.
echo 1. Commit va Push (Day len nhanh)
echo 2. Chi Push (Neu da commit)
echo 3. Kiem tra Status
echo 4. Thoat
echo.
set /p choice=Chon mot chuc nang (1-4): 

if "%choice%"=="1" goto commit_push
if "%choice%"=="2" goto push_only
if "%choice%"=="3" goto status
if "%choice%"=="4" goto exit

echo Lua chon khong hop le. Nhan phim bat ky de thu lai.
pause > nul
goto menu

:commit_push
cls
echo --- 1. Commit va Push ---
echo.
set /p message=Nhap commit message cua ban: 
echo.
echo [INFO] Dang thuc hien 'git add .'
git add .
echo.
echo [INFO] Dang thuc hien 'git commit -m "%message%"'
git commit -m "%message%"
echo.
echo [INFO] Dang thuc hien 'git push'
git push
echo.
echo [SUCCESS] Da hoan thanh!
pause
goto menu

:push_only
cls
echo --- 2. Chi Push ---
echo.
echo [INFO] Dang thuc hien 'git push'
git push
echo.
echo [SUCCESS] Da hoan thanh!
pause
goto menu

:status
cls
echo --- 3. Kiem tra Status ---
echo.
git status
echo.
pause
goto menu

:exit
cls
echo Tam biet!
exit