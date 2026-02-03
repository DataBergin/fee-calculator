$env:Path = "C:\Program Files\nodejs;C:\Users\jackb\AppData\Roaming\npm;" + $env:Path
Set-Location "C:\Users\jackb\Claude\fee-calculator"

Write-Host "Deploying updated UI to Vercel..."
& vercel --prod --yes
