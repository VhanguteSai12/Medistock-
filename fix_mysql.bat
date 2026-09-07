@echo off
echo Fixing MySQL permissions...

:: Take ownership of MySQL data directory
takeown /F "C:\ProgramData\MySQL" /R /D Y

:: Grant full permissions to MySQL service account and Administrators
icacls "C:\ProgramData\MySQL" /grant "NT Service\MySQL80:(OI)(CI)F" /T
icacls "C:\ProgramData\MySQL" /grant "SYSTEM:(OI)(CI)F" /T
icacls "C:\ProgramData\MySQL" /grant "Administrators:(OI)(CI)F" /T

echo Permissions fixed! Starting MySQL service...
net start MySQL80

echo.
echo Done! Check if MySQL started successfully.
pause
