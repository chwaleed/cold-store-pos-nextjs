Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cold Storage Database Seeder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Resetting database..." -ForegroundColor Yellow
npx prisma migrate reset --force

Write-Host ""
Write-Host "[2/3] Running seeder..." -ForegroundColor Yellow
npm run seed

Write-Host ""
Write-Host "[3/3] Verifying seeded data..." -ForegroundColor Yellow
node test-seed-verification.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Seeding Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
