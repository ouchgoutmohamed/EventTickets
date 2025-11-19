-- ========================================
-- SCRIPT DE PRÉPARATION DES DONNÉES DE TEST
-- Ticket Inventory Service
-- ========================================

-- Sélectionner la base de données
USE eventtickets_inventory;

-- ========================================
-- NETTOYAGE (OPTIONNEL)
-- ========================================

-- Supprimer les données existantes (décommenter si nécessaire)
-- TRUNCATE TABLE ticket;
-- TRUNCATE TABLE reservation;
-- DELETE FROM inventory;

-- ========================================
-- CRÉATION DE L'INVENTAIRE
-- ========================================

-- Créer des inventaires pour plusieurs événements
INSERT INTO inventory (event_id, total, reserved, version, updated_at) 
VALUES 
    (1, 100, 0, 0, NOW()),
    (2, 50, 0, 0, NOW()),
    (3, 200, 0, 0, NOW()),
    (4, 25, 0, 0, NOW()),
    (5, 1000, 0, 0, NOW())
ON DUPLICATE KEY UPDATE 
    total = VALUES(total),
    reserved = VALUES(reserved),
    updated_at = NOW();

-- ========================================
-- VÉRIFICATION
-- ========================================

SELECT 
    event_id,
    total,
    reserved,
    (total - reserved) AS available,
    version,
    updated_at
FROM inventory
ORDER BY event_id;

-- ========================================
-- STATISTIQUES
-- ========================================

-- Nombre total d'événements avec inventaire
SELECT COUNT(*) AS total_events FROM inventory;

-- Capacité totale
SELECT SUM(total) AS total_capacity FROM inventory;

-- Tickets disponibles
SELECT SUM(total - reserved) AS total_available FROM inventory;

-- ========================================
-- REQUÊTES UTILES POUR LE MONITORING
-- ========================================

-- Voir toutes les réservations
-- SELECT 
--     r.id,
--     r.event_id,
--     r.user_id,
--     r.quantity,
--     r.status,
--     r.hold_expires_at,
--     r.created_at,
--     CASE 
--         WHEN r.hold_expires_at < NOW() AND r.status = 'PENDING' THEN 'EXPIRED'
--         ELSE r.status
--     END AS real_status
-- FROM reservation r
-- ORDER BY r.created_at DESC;

-- Voir l'état de l'inventaire avec les réservations
-- SELECT 
--     i.event_id,
--     i.total,
--     i.reserved,
--     (i.total - i.reserved) AS available,
--     COUNT(r.id) AS nb_reservations,
--     SUM(CASE WHEN r.status = 'PENDING' THEN r.quantity ELSE 0 END) AS pending_qty,
--     SUM(CASE WHEN r.status = 'CONFIRMED' THEN r.quantity ELSE 0 END) AS confirmed_qty
-- FROM inventory i
-- LEFT JOIN reservation r ON i.event_id = r.event_id
-- GROUP BY i.event_id, i.total, i.reserved
-- ORDER BY i.event_id;

-- ========================================
-- COMMANDES DE NETTOYAGE RAPIDE
-- ========================================

-- Pour réinitialiser complètement (décommenter si besoin)
/*
TRUNCATE TABLE ticket;
TRUNCATE TABLE reservation;
UPDATE inventory SET reserved = 0, version = 0;
*/

-- Pour supprimer les réservations expirées
/*
DELETE FROM reservation 
WHERE status = 'PENDING' 
  AND hold_expires_at < NOW();
*/

-- Pour recalculer le nombre de réservés (si désynchronisé)
/*
UPDATE inventory i
SET reserved = (
    SELECT COALESCE(SUM(r.quantity), 0)
    FROM reservation r
    WHERE r.event_id = i.event_id
      AND r.status IN ('PENDING', 'CONFIRMED')
);
*/

-- ========================================
-- FIN DU SCRIPT
-- ========================================

SELECT '✅ Données de test créées avec succès!' AS message;
SELECT '🎯 Vous pouvez maintenant tester avec Postman' AS next_step;
