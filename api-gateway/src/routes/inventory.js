const express = require('express');
const axios = require('axios');
const config = require('../config');

const router = express.Router();

// Instance axios pour le service d'inventaire
const inventoryClient = axios.create({
  baseURL: config.services.ticketInventory,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

/**
 * POST /inventory/reserve - Réserver des tickets
 */
router.post('/reserve', async (req, res) => {
  try {
    console.log('[Inventory] Reserve request:', req.body);
    const response = await inventoryClient.post('/tickets/reserve', req.body);
    console.log('[Inventory] Reserve success:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('[Inventory] Reserve error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la réservation'
    });
  }
});

/**
 * POST /inventory/confirm - Confirmer une réservation
 */
router.post('/confirm', async (req, res) => {
  try {
    const response = await inventoryClient.post('/tickets/confirm', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('[Inventory] Confirm error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la confirmation'
    });
  }
});

/**
 * POST /inventory/release - Libérer une réservation
 */
router.post('/release', async (req, res) => {
  try {
    const response = await inventoryClient.post('/tickets/release', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('[Inventory] Release error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la libération'
    });
  }
});

/**
 * GET /inventory/availability/:eventId - Consulter la disponibilité
 */
router.get('/availability/:eventId', async (req, res) => {
  try {
    const response = await inventoryClient.get(`/tickets/availability/${req.params.eventId}`);
    res.json(response.data);
  } catch (error) {
    console.error('[Inventory] Availability error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la consultation'
    });
  }
});

/**
 * GET /inventory/user/:userId - Réservations d'un utilisateur
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const response = await inventoryClient.get(`/tickets/user/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('[Inventory] User reservations error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la consultation'
    });
  }
});

module.exports = router;
