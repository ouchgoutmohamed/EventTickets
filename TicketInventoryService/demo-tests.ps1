# ========================================
# 🎯 DEMO API - Ticket Inventory Service
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEMO API - Ticket Inventory Service  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8082"

# Fonction pour afficher les résultats
function Show-Result {
    param($Title, $Response)
    Write-Host ""
    Write-Host "✅ $Title" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    $Response | ConvertTo-Json -Depth 10
    Write-Host ""
}

# ========================================
# ÉTAPE 0 : Préparer les données
# ========================================
Write-Host "📦 ÉTAPE 0 : Insertion des données de test..." -ForegroundColor Yellow

mysql -u root -e "USE eventtickets_inventory; DELETE FROM ticket; DELETE FROM reservation; DELETE FROM inventory; INSERT INTO inventory (event_id, total, reserved, version, updated_at) VALUES (1, 100, 0, 0, NOW()), (2, 50, 0, 0, NOW()), (3, 200, 0, 0, NOW());"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Données insérées avec succès!" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de l'insertion des données" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2

# ========================================
# TEST 1 : Vérifier la disponibilité
# ========================================
Write-Host ""
Write-Host "📊 TEST 1 : Vérifier la disponibilité de l'événement 1" -ForegroundColor Yellow

$response1 = Invoke-RestMethod -Uri "$baseUrl/tickets/availability/1" -Method Get -ContentType "application/json"
Show-Result "Disponibilité initiale" $response1

Start-Sleep -Seconds 1

# ========================================
# TEST 2 : Réserver des tickets
# ========================================
Write-Host "🎫 TEST 2 : Réserver 3 tickets pour l'événement 1" -ForegroundColor Yellow

$reserveBody = @{
    eventId = 1
    userId = 1
    quantity = 3
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Idempotency-Key" = "demo-reservation-001"
}

$response2 = Invoke-RestMethod -Uri "$baseUrl/tickets/reserve" -Method Post -Body $reserveBody -Headers $headers
Show-Result "Réservation créée" $response2

$reservationId = $response2.reservationId
Write-Host "💾 ReservationId sauvegardé : $reservationId" -ForegroundColor Magenta

Start-Sleep -Seconds 1

# ========================================
# TEST 3 : Vérifier la disponibilité mise à jour
# ========================================
Write-Host "📊 TEST 3 : Vérifier la disponibilité après réservation" -ForegroundColor Yellow

$response3 = Invoke-RestMethod -Uri "$baseUrl/tickets/availability/1" -Method Get -ContentType "application/json"
Show-Result "Disponibilité après réservation (97/100)" $response3

Start-Sleep -Seconds 1

# ========================================
# TEST 4 : Consulter les réservations de l'utilisateur
# ========================================
Write-Host "👤 TEST 4 : Consulter les réservations de l'utilisateur 1" -ForegroundColor Yellow

$response4 = Invoke-RestMethod -Uri "$baseUrl/tickets/user/1" -Method Get -ContentType "application/json"
Show-Result "Réservations de l'utilisateur" $response4

Start-Sleep -Seconds 1

# ========================================
# TEST 5 : Confirmer la réservation
# ========================================
Write-Host "✅ TEST 5 : Confirmer la réservation $reservationId" -ForegroundColor Yellow

$confirmBody = @{
    reservationId = $reservationId
} | ConvertTo-Json

$response5 = Invoke-RestMethod -Uri "$baseUrl/tickets/confirm" -Method Post -Body $confirmBody -ContentType "application/json"
Show-Result "Réservation confirmée" $response5

Start-Sleep -Seconds 1

# ========================================
# TEST 6 : Créer une deuxième réservation
# ========================================
Write-Host "🎫 TEST 6 : Créer une nouvelle réservation de 5 tickets" -ForegroundColor Yellow

$reserve2Body = @{
    eventId = 1
    userId = 2
    quantity = 5
} | ConvertTo-Json

$headers2 = @{
    "Content-Type" = "application/json"
    "Idempotency-Key" = "demo-reservation-002"
}

$response6 = Invoke-RestMethod -Uri "$baseUrl/tickets/reserve" -Method Post -Body $reserve2Body -Headers $headers2
Show-Result "Deuxième réservation créée" $response6

$reservationId2 = $response6.reservationId

Start-Sleep -Seconds 1

# ========================================
# TEST 7 : Annuler la deuxième réservation
# ========================================
Write-Host "❌ TEST 7 : Annuler la réservation $reservationId2" -ForegroundColor Yellow

$releaseBody = @{
    reservationId = $reservationId2
} | ConvertTo-Json

$response7 = Invoke-RestMethod -Uri "$baseUrl/tickets/release" -Method Post -Body $releaseBody -ContentType "application/json"
Show-Result "Réservation annulée" $response7

Start-Sleep -Seconds 1

# ========================================
# TEST 8 : Vérifier la disponibilité finale
# ========================================
Write-Host "📊 TEST 8 : Vérifier la disponibilité finale" -ForegroundColor Yellow

$response8 = Invoke-RestMethod -Uri "$baseUrl/tickets/availability/1" -Method Get -ContentType "application/json"
Show-Result "Disponibilité finale (97/100 car 3 confirmés)" $response8

Start-Sleep -Seconds 1

# ========================================
# TEST 9 : Test d'erreur - Stock insuffisant
# ========================================
Write-Host "❌ TEST 9 : Test d'erreur - Réserver plus que disponible (150 tickets)" -ForegroundColor Yellow

$errorBody = @{
    eventId = 1
    userId = 3
    quantity = 150
} | ConvertTo-Json

try {
    $errorResponse = Invoke-RestMethod -Uri "$baseUrl/tickets/reserve" -Method Post -Body $errorBody -ContentType "application/json"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Erreur attendue - Code HTTP: $statusCode" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# TEST 10 : Vérifier l'idempotence
# ========================================
Write-Host "🔄 TEST 10 : Test d'idempotence - Même clé d'idempotence" -ForegroundColor Yellow

$idempotentBody = @{
    eventId = 2
    userId = 5
    quantity = 2
} | ConvertTo-Json

$idempHeaders = @{
    "Content-Type" = "application/json"
    "Idempotency-Key" = "unique-key-123"
}

Write-Host "Première requête..." -ForegroundColor Gray
$idempResponse1 = Invoke-RestMethod -Uri "$baseUrl/tickets/reserve" -Method Post -Body $idempotentBody -Headers $idempHeaders
Show-Result "Première réservation" $idempResponse1

Write-Host "Deuxième requête avec la même clé..." -ForegroundColor Gray
$idempResponse2 = Invoke-RestMethod -Uri "$baseUrl/tickets/reserve" -Method Post -Body $idempotentBody -Headers $idempHeaders
Show-Result "Même réservation retournée (idempotence)" $idempResponse2

if ($idempResponse1.reservationId -eq $idempResponse2.reservationId) {
    Write-Host "✅ IDEMPOTENCE VALIDÉE : Même reservationId retourné!" -ForegroundColor Green
} else {
    Write-Host "❌ ERREUR : ReservationIds différents" -ForegroundColor Red
}

# ========================================
# RÉSUMÉ
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           RÉSUMÉ DES TESTS             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

mysql -u root -e "USE eventtickets_inventory; SELECT 'INVENTAIRE :' AS Info; SELECT * FROM inventory; SELECT 'RÉSERVATIONS :' AS Info; SELECT id, event_id, user_id, quantity, status, created_at FROM reservation ORDER BY created_at DESC; SELECT 'TICKETS :' AS Info; SELECT * FROM ticket;"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "     ✅ DÉMO TERMINÉE AVEC SUCCÈS !    " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Accédez à Swagger UI : http://localhost:8082/swagger-ui.html" -ForegroundColor Cyan
Write-Host "📚 Documentation API : http://localhost:8082/api-docs" -ForegroundColor Cyan
Write-Host ""
