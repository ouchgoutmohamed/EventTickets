import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import userService from '../api/userService';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginHistory, setLoginHistory] = useState([]);

  useEffect(() => {
    // Check if current user is admin or viewing their own profile
    if (!currentUser || (currentUser.role?.nom !== 'administrateur' && currentUser.id !== parseInt(id))) {
      showToast('Accès non autorisé', 'error');
      navigate('/dashboard');
      return;
    }

    fetchUserDetails();
    fetchLoginHistory();
  }, [id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await userService.getUserById(id);
      if (response.success && response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      showToast('Erreur lors du chargement de l\'utilisateur', 'error');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const response = await userService.getLoginHistory(id);
      if (response.success && response.data) {
        setLoginHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching login history:', error);
    }
  };

  const handleActivate = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir activer cet utilisateur?')) {
      return;
    }

    try {
      const response = await userService.activateUser(id);
      if (response.success) {
        showToast('Utilisateur activé avec succès', 'success');
        fetchUserDetails();
      }
    } catch (error) {
      console.error('Error activating user:', error);
      showToast(error.response?.data?.message || 'Erreur lors de l\'activation', 'error');
    }
  };

  const handleSuspend = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur?')) {
      return;
    }

    try {
      const response = await userService.suspendUser(id);
      if (response.success) {
        showToast('Utilisateur suspendu avec succès', 'success');
        fetchUserDetails();
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      showToast(error.response?.data?.message || 'Erreur lors de la suspension', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="user-detail-container">Chargement...</div>;
  }

  if (!user) {
    return <div className="user-detail-container">Utilisateur non trouvé</div>;
  }

  const isAdmin = currentUser?.role?.nom === 'administrateur';

  return (
    <Container fluid className="py-4">
      <Button 
        as={Link} 
        to="/admin/users" 
        variant="outline-secondary" 
        className="mb-3"
      >
        ← Retour
      </Button>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">Détails de l'utilisateur</h1>
        <Badge className={`badge-${user.etat}`} style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>
          {user.etat}
        </Badge>
      </div>

      <Row>
        <Col lg={8}>
          {/* User Information Card */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">Informations personnelles</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Row>
                <Col md={6} className="mb-3">
                  <div className="text-muted small mb-1">ID</div>
                  <div className="fw-semibold">{user.id}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small mb-1">Rôle</div>
                  <div><Badge bg="secondary">{user.role?.nom || 'N/A'}</Badge></div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small mb-1">Nom</div>
                  <div className="fw-semibold">{user.nom}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small mb-1">Prénom</div>
                  <div className="fw-semibold">{user.prenom}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small mb-1">Email</div>
                  <div className="fw-semibold">{user.email}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small mb-1">Email vérifié</div>
                  <div>
                    {user.emailVerifie ? (
                      <Badge bg="success">✓ Vérifié</Badge>
                    ) : (
                      <Badge bg="warning">En attente</Badge>
                    )}
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small mb-1">Date de création</div>
                  <div>{formatDate(user.dateCreation)}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small mb-1">Dernière mise à jour</div>
                  <div>{formatDate(user.createdAt)}</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Login History Card */}
          {isAdmin && loginHistory.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">Historique des connexions</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Adresse IP</th>
                      <th>Navigateur</th>
                      <th>Système</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((entry, index) => (
                      <tr key={index}>
                        <td>{formatDate(entry.dateConnexion)}</td>
                        <td><code className="text-muted">{entry.ipAddress}</code></td>
                        <td>{entry.navigateur}</td>
                        <td>{entry.systemeExploitation}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default UserDetail;
