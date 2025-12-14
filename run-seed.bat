@echo off
echo ========================================
echo Cold Storage Database Seeder
echo ========================================
echo.

echo [1/3] Resetting database...
call npx prisma migrate reset --force

echo.
echo [2/3] Running seeder...
call npm run seed

echo.
echo [3/3] Verifying seeded data...
call node test-seed-verification.js

echo.
echo ========================================
echo Seeding Complete!
echo ========================================
pause
