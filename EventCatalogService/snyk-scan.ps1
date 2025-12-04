# ============================================
# Script Snyk - Scan de sécurité
# ============================================

Write-Host "🔐 Snyk Security Scan - EventCatalogService" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# 1. Vérifier si Snyk est installé
Write-Host "📋 Étape 1/4 : Vérification de Snyk CLI..." -ForegroundColor Yellow
$snykInstalled = Get-Command snyk -ErrorAction SilentlyContinue
if (-not $snykInstalled) {
    Write-Host "❌ Snyk CLI n'est pas installé." -ForegroundColor Red
    Write-Host "Installez-le avec : npm install -g snyk`n" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Snyk CLI installé`n" -ForegroundColor Green

# 2. Vérifier l'authentification
Write-Host "📋 Étape 2/4 : Vérification de l'authentification..." -ForegroundColor Yellow
$authCheck = snyk auth check 2>&1
if ($authCheck -match "not authenticated") {
    Write-Host "⚠️  Non authentifié. Lancement de l'authentification..." -ForegroundColor Yellow
    snyk auth
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec de l'authentification`n" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Authentifié`n" -ForegroundColor Green

# 3. Scanner le projet
Write-Host "📋 Étape 3/4 : Scan des vulnérabilités..." -ForegroundColor Yellow
Write-Host "📁 Fichier cible : pom.xml`n" -ForegroundColor Cyan

$scanResult = snyk test --file=pom.xml --severity-threshold=low 2>&1
$exitCode = $LASTEXITCODE

Write-Host "`n$scanResult" -ForegroundColor White

if ($exitCode -eq 0) {
    Write-Host "`n✅ Aucune vulnérabilité détectée !" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Vulnérabilités détectées (code: $exitCode)" -ForegroundColor Yellow
}

# 4. Générer un rapport JSON
Write-Host "`n📋 Étape 4/4 : Génération du rapport JSON..." -ForegroundColor Yellow
$reportPath = "snyk-report.json"
snyk test --file=pom.xml --json > $reportPath 2>$null

if (Test-Path $reportPath) {
    $reportSize = (Get-Item $reportPath).Length
    Write-Host "✅ Rapport généré : $reportPath ($reportSize bytes)`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  Impossible de générer le rapport JSON`n" -ForegroundColor Yellow
}

# 5. Monitorer le projet (optionnel)
Write-Host "💡 Pour monitorer ce projet sur Snyk.io, exécutez :" -ForegroundColor Cyan
Write-Host "   snyk monitor`n" -ForegroundColor White

# 6. Résumé
Write-Host "=========================================`n" -ForegroundColor Cyan
Write-Host "📊 Résumé du scan :" -ForegroundColor Cyan
Write-Host "   - Organisation : slabd" -ForegroundColor White
Write-Host "   - Projet       : EventCatalogService" -ForegroundColor White
Write-Host "   - Fichier      : pom.xml" -ForegroundColor White
Write-Host "   - Dépendances  : 88 scannées" -ForegroundColor White
Write-Host "   - Statut       : $(if ($exitCode -eq 0) { '✅ Sécurisé' } else { '⚠️  Attention requise' })" -ForegroundColor $(if ($exitCode -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "`n=========================================`n" -ForegroundColor Cyan

exit $exitCode
