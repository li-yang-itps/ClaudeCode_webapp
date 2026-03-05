@echo off
REM Claude File Uploader - Start with MFA Update

echo.
echo ========================================
echo  Claude File Uploader - MFA Update
echo ========================================
echo.

REM First, update AWS credentials
echo Updating AWS credentials...
cd /d "C:\Users\li.yang\.claude"
python update_aws_credentials.py

REM Check if update was successful
if errorlevel 1 (
    echo.
    echo Error: AWS credentials update failed
    pause
    exit /b 1
)

REM Now start the uploader
echo.
echo Credentials updated successfully
echo Starting the application...
echo.

cd /d "C:\Users\li.yang\Desktop\claude-file-uploader"
npm start

pause
