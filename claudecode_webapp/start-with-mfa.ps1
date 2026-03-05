# Claude File Uploader - Start with MFA Update (PowerShell)
# 自动更新 AWS 凭证然后启动应用

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Claude File Uploader - MFA Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# First, update AWS credentials
Write-Host "正在更新 AWS 凭证..." -ForegroundColor Yellow
Set-Location "C:\Users\li.yang\.claude"

# Run Python script to update credentials
python update_aws_credentials.py

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "错误：AWS 凭证更新失败" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

# Now start the uploader
Write-Host ""
Write-Host "凭证更新完成，正在启动应用..." -ForegroundColor Green
Write-Host ""

Set-Location "C:\Users\li.yang\Desktop\claude-file-uploader"
npm start

Read-Host "按 Enter 键退出"
