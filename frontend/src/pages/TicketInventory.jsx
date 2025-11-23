import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { MdEventNote, MdConfirmationNumber, MdCancel } from 'react-icons/md';
import ticketInventoryService from '../api/ticketInventoryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * TicketInventory component
 * Displays ticket availability and allows users to reserve, confirm, and release reservations
 */
const TicketInventory = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [eventId, setEventId] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userReservations, setUserReservations] = useState([]);
  const [reservationLoading, setReservationLoading] = useState(false);

  // Load availability on mount or when eventId changes
  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Load user reservations on mount
  useEffect(() => {
    if (user?.id) {
      loadUserReservations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await ticketInventoryService.getAvailability(eventId);
      setAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
      showToast('Erreur lors du chargement de la disponibilité', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserReservations = async () => {
    try {
      setReservationLoading(true);
      const data = await ticketInventoryService.getUserReservations(user.id);
      setUserReservations(data.items || []);
    } catch (error) {
      console.error('Error loading user reservations:', error);
    } finally {
      setReservationLoading(false);
    }
  };

  const handleReserveTickets = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      showToast('Vous devez être connecté pour réserver des billets', 'warning');
      return;
    }

    try {
      setLoading(true);
      const idempotencyKey = `${user.id}-${eventId}-${Date.now()}`;
      const response = await ticketInventoryService.reserveTickets(
        eventId,
        user.id,
        quantity,
        idempotencyKey
      );
      
      showToast(
        `Réservation créée avec succès! ID: ${response.reservationId}. Expire à ${new Date(response.holdExpiresAt).toLocaleString()}`,
        'success'
      );
      
      // Reload availability and user reservations
      await loadAvailability();
      await loadUserReservations();
      
      // Reset quantity
      setQuantity(1);
    } catch (error) {
      console.error('Error reserving tickets:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la réservation';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async (reservationId) => {
    try {
      setLoading(true);
      await ticketInventoryService.confirmReservation(reservationId);
      showToast('Réservation confirmée avec succès!', 'success');
      
      // Reload user reservations
      await loadUserReservations();
    } catch (error) {
      console.error('Error confirming reservation:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la confirmation';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseReservation = async (reservationId) => {
    try {
      setLoading(true);
      await ticketInventoryService.releaseReservation(reservationId);
      showToast('Réservation annulée avec succès!', 'success');
      
      // Reload availability and user reservations
      await loadAvailability();
      await loadUserReservations();
    } catch (error) {
      console.error('Error releasing reservation:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'annulation';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badgeMap = {
      PENDING: { bg: 'warning', text: 'En attente' },
      CONFIRMED: { bg: 'success', text: 'Confirmée' },
      CANCELED: { bg: 'secondary', text: 'Annulée' },
      EXPIRED: { bg: 'danger', text: 'Expirée' },
    };
    
    const badge = badgeMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={badge.bg}>{badge.text}</Badge>;
  };

  return (
    <Container className="py-4" style={{ maxWidth: '1200px' }}>
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold mb-2">
          <MdConfirmationNumber className="me-2" />
          Gestion des Billets
        </h1>
        <p className="lead text-muted">Consultez la disponibilité et gérez vos réservations</p>
      </div>

      {/* Availability Section */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <MdEventNote className="me-2" />
            Disponibilité des Billets
          </h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleReserveTickets}>
            <Form.Group className="mb-3">
              <Form.Label>Événement ID</Form.Label>
              <Form.Control
                type="number"
                value={eventId}
                onChange={(e) => setEventId(parseInt(e.target.value))}
                min="1"
              />
            </Form.Group>

            {loading && !availability ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </Spinner>
              </div>
            ) : availability ? (
              <>
                <Alert variant="info">
                  <strong>Total de billets:</strong> {availability.total}
                  <br />
                  <strong>Billets disponibles:</strong> {availability.available}
                  <br />
                  <strong>Billets réservés:</strong> {availability.total - availability.available}
                </Alert>

                {availability.available > 0 && user ? (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantité à réserver (max: 10)</Form.Label>
                      <Form.Control
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        min="1"
                        max={Math.min(10, availability.available)}
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading || availability.available === 0}
                    >
                      {loading ? 'Réservation...' : 'Réserver des billets'}
                    </Button>
                  </>
                ) : !user ? (
                  <Alert variant="warning">
                    Vous devez être connecté pour réserver des billets.
                  </Alert>
                ) : (
                  <Alert variant="danger">
                    Aucun billet disponible pour cet événement.
                  </Alert>
                )}
              </>
            ) : null}
          </Form>
        </Card.Body>
      </Card>

      {/* User Reservations Section */}
      {user && (
        <Card>
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">
              <MdConfirmationNumber className="me-2" />
              Mes Réservations
            </h5>
          </Card.Header>
          <Card.Body>
            {reservationLoading ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </Spinner>
              </div>
            ) : userReservations.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Événement</th>
                      <th>Quantité</th>
                      <th>Statut</th>
                      <th>Date de création</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userReservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td>{reservation.id}</td>
                        <td>{reservation.eventId}</td>
                        <td>{reservation.quantity}</td>
                        <td>{getStatusBadge(reservation.status)}</td>
                        <td>{new Date(reservation.createdAt).toLocaleString()}</td>
                        <td>
                          {reservation.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                className="me-2"
                                onClick={() => handleConfirmReservation(reservation.id)}
                                disabled={loading}
                              >
                                Confirmer
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleReleaseReservation(reservation.id)}
                                disabled={loading}
                              >
                                <MdCancel className="me-1" />
                                Annuler
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Alert variant="info">Aucune réservation trouvée.</Alert>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default TicketInventory;
