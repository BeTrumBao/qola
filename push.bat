@echo off
REM Tool nhỏ để add, commit, và push lên GitHub nhanh chóng

REM Kiểm tra xem có nhập lời nhắn commit không
if "%~1"=="" (
    echo Le loi roi: Phai nhap loi nhan commit chu!
    echo Cach dung: pushgit.bat "Loi nhan cua cau"
    pause
    exit /b 1
)

REM Lấy toàn bộ nội dung sau tên file làm lời nhắn commit
set commit_message=%*

REM Lấy tên nhánh hiện tại
echo Dang lay ten nhanh hien tai...
for /f %%i in ('git rev-parse --abbrev-ref HEAD') do set current_branch=%%i

if "%current_branch%"=="" (
   echo Le loi roi: Khong tim thay ten nhanh. Cau dang o trong thu muc Git chua?
   pause
   exit /b 1
)
echo Nhannh hien tai la: %current_branch%
echo.

REM Chạy git add .
echo Dang chay 'git add .' ...
git add .
echo.

REM Chạy git commit
echo Dang chay 'git commit -m "%commit_message%"' ...
git commit -m %commit_message%
if errorlevel 1 (
    echo Co loi khi commit. Co the khong co gi thay doi de commit?
    pause
    exit /b 1
)
echo.

REM Chạy git push
echo Dang chay 'git push origin %current_branch%' ...
git push origin %current_branch%
if errorlevel 1 (
    echo Co loi khi push. Kiem tra lai ket noi hoac cau hinh remote 'origin'.
    pause
    exit /b 1
)
echo.

echo Xong! Da day code len GitHub. ^_^
pause