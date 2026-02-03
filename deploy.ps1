$env:Path = "C:\Program Files\nodejs;C:\Users\jackb\AppData\Roaming\npm;" + $env:Path
Set-Location "C:\Users\jackb\Claude\fee-calculator"

Write-Host "Logging into Vercel..."
& vercel login

Write-Host ""
Write-Host "Deploying to Vercel..."
& vercel --yes
