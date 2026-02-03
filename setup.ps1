$env:Path = "C:\Program Files\nodejs;" + $env:Path
Set-Location "C:\Users\jackb\Claude\fee-calculator"

Write-Host "Installing dependencies..."
& npm install

Write-Host "Installing Vercel CLI..."
& npm install -g vercel

Write-Host "Done! Run 'vercel' to deploy."
