@echo off
REM ============================================================
REM   push.bat - one-click sync to GitHub
REM   Double-click this file to commit + push all changes.
REM ============================================================

cd /d "%~dp0"

echo.
echo === Checking for changes... ===
git status --short
if errorlevel 1 (
    echo.
    echo ERROR: Git command failed. Is git installed and is this a repo?
    pause
    exit /b 1
)

REM Check if there are any changes to commit
git diff --quiet
set DIFF_UNSTAGED=%errorlevel%
git diff --cached --quiet
set DIFF_STAGED=%errorlevel%
git ls-files --others --exclude-standard --error-unmatch . >nul 2>&1
set HAS_UNTRACKED=%errorlevel%

if "%DIFF_UNSTAGED%"=="0" if "%DIFF_STAGED%"=="0" if not "%HAS_UNTRACKED%"=="0" (
    echo.
    echo Nothing to commit - working tree is clean.
    echo.
    pause
    exit /b 0
)

echo.
echo === Staging all changes... ===
git add -A
if errorlevel 1 goto :error

echo.
echo === Committing... ===
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value ^| find "="') do set dt=%%I
set TIMESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2% %dt:~8,2%:%dt:~10,2%
git commit -m "Update %TIMESTAMP%"
if errorlevel 1 goto :error

echo.
echo === Pushing to GitHub... ===
git push
if errorlevel 1 goto :error

echo.
echo ============================================================
echo   SUCCESS - changes pushed to GitHub
echo ============================================================
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo   ERROR - something went wrong above. Check the message.
echo ============================================================
echo.
pause
exit /b 1
