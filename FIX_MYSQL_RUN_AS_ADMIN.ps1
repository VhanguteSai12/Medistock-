Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MySQL Fix Script - Running as Admin  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Stop MySQL80 service forcefully
Write-Host "`n[Step 1] Stopping MySQL80 service..." -ForegroundColor Yellow
Stop-Service -Name "MySQL80" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Kill any remaining mysqld processes
Get-Process -Name "mysqld" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "MySQL80 stopped." -ForegroundColor Green

# Step 2: Start MySQL in skip-grant-tables mode
Write-Host "`n[Step 2] Starting MySQL in password-bypass mode..." -ForegroundColor Yellow
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$myIni    = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"

$proc = Start-Process -FilePath $mysqlExe `
    -ArgumentList "--defaults-file=`"$myIni`"", "--skip-grant-tables", "--skip-networking" `
    -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 10
Write-Host "MySQL started (PID: $($proc.Id))" -ForegroundColor Green

# Step 3: Reset root password to blank
Write-Host "`n[Step 3] Resetting root password to blank..." -ForegroundColor Yellow
$mysqlClient = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

$result = & $mysqlClient -u root --connect-timeout=5 -e `
    "UPDATE mysql.user SET authentication_string='' WHERE User='root'; FLUSH PRIVILEGES;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Password reset SUCCESS!" -ForegroundColor Green
} else {
    Write-Host "Result: $result" -ForegroundColor Red
}

# Step 4: Stop skip-grant instance
Write-Host "`n[Step 4] Stopping bypass MySQL..." -ForegroundColor Yellow
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Step 5: Fix MySQL80 data directory permissions
Write-Host "`n[Step 5] Fixing MySQL data directory permissions..." -ForegroundColor Yellow
$dataDir = "C:\ProgramData\MySQL\MySQL Server 8.0\Data"
takeown /F $dataDir /R /D Y | Out-Null
icacls $dataDir /grant "NT Service\MySQL80:(OI)(CI)F" /T | Out-Null
icacls $dataDir /grant "SYSTEM:(OI)(CI)F" /T | Out-Null
Write-Host "Permissions fixed." -ForegroundColor Green

# Step 6: Start MySQL80 service normally
Write-Host "`n[Step 6] Starting MySQL80 service normally..." -ForegroundColor Yellow
Start-Service -Name "MySQL80" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5

$svc = Get-Service -Name "MySQL80"
Write-Host "MySQL80 Status: $($svc.Status)" -ForegroundColor $(if ($svc.Status -eq 'Running') { 'Green' } else { 'Red' })

# Step 7: Test connection
Write-Host "`n[Step 7] Testing connection..." -ForegroundColor Yellow
$test = & $mysqlClient -u root -h 127.0.0.1 -P 3306 "--password=" --connect-timeout=5 `
    -e "SELECT 'Connected!' AS Result; SHOW DATABASES;" 2>&1
Write-Host $test

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Done! Open phpMyAdmin now.           " -ForegroundColor Cyan
Write-Host "   http://localhost/phpmyadmin          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Read-Host "`nPress Enter to exit"
