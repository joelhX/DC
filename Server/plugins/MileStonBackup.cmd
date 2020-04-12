@ECHO off
set USER=%1
set PASS=%2
set DIR=%3
set NAME=%4
SET NAME1="NONE123"
SET currentschema=rm_

if "%NAME%"=="%NAME1%" (
    SET schemaname=%currentschema%%date%
) else (
    SET schemaname=%currentschema%%NAME%
)
echo %schemaname%
mysqladmin.exe --user=%USER% --password=%PASS% create %schemaname%
mysqldump.exe --user=%USER% --password=%PASS% --default-character-set=utf8 --single-transaction=TRUE --skip-triggers "rm" > %schemaname%.sql
mysql --user=%USER% --password=%PASS% %schemaname% < %schemaname%.sql