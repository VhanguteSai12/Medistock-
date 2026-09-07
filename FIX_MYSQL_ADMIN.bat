@echo off
color 0A
echo ==========================================
echo    MYSQL FIX SCRIPT - ADMIN REQUIRED
echo ==========================================

echo.
echo [1/5] Stopping MySQL80 service...
net stop MySQL80 2>nul
taskkill /F /IM mysqld.exe 2>nul
timeout /t 4 /nobreak >nul
echo Done.

echo.
echo [2/5] Fixing folder permissions...
takeown /F "C:\ProgramData\MySQL" /R /D Y
icacls "C:\ProgramData\MySQL" /grant "NT Service\MySQL80:(OI)(CI)F" /T
icacls "C:\ProgramData\MySQL" /grant "SYSTEM:(OI)(CI)F" /T
icacls "C:\ProgramData\MySQL" /grant "Administrators:(OI)(CI)F" /T
echo Done.

echo.
echo [3/5] Resetting MySQL root password...
set MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe
set MYSQL_CLI=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
set MYSQL_INI=C:\ProgramData\MySQL\MySQL Server 8.0\my.ini

start "" /B "%MYSQL_EXE%" --defaults-file="%MYSQL_INI%" --skip-grant-tables --skip-networking
timeout /t 10 /nobreak >nul

"%MYSQL_CLI%" -u root --connect-timeout=5 -e "UPDATE mysql.user SET authentication_string='' WHERE User='root' AND Host='localhost'; UPDATE mysql.user SET plugin='mysql_native_password' WHERE User='root'; FLUSH PRIVILEGES;"
echo Done.

echo.
echo [4/5] Stopping bypass MySQL...
taskkill /F /IM mysqld.exe 2>nul
timeout /t 4 /nobreak >nul

echo.
echo [5/5] Starting MySQL80 normally...
net start MySQL80
timeout /t 5 /nobreak >nul

echo.
echo [TEST] Connecting to MySQL...
"%MYSQL_CLI%" -u root -h 127.0.0.1 -P 3306 --connect-timeout=5 -e "SELECT 'SUCCESS - MySQL is working!' AS Result; SHOW DATABASES;"

echo.
echo ==========================================
echo  DONE! Now open: http://localhost/phpmyadmin
echo  Username: root     Password: (leave blank)
echo ==========================================
pause
