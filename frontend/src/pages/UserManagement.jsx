import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Form, Button, Badge, ButtonGroup, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MdVisibility, MdCheckCircle, MdBlock, MdDelete, MdFilterList, MdPause, MdSearch } from 'react-icons/md';
import userService from '../api/userService';
import roleService from '../api/roleService';

const UserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    etat: '',
    roleId: '',
    search: ''
  });

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role?.nom !== 'administrateur') {
      showToast('Accès non autorisé', 'error');
      navigate('/dashboard');
      return;
    }

    fetchRoles();
    fetchUsers();
  }, [pagination.page, pagination.limit, filters]);

  const fetchRoles = async () => {
    try {
      const response = await roleService.getAllRoles();
      if (response.success && response.data) {
        setRoles(response.data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers(
        pagination.page,
        pagination.limit,
        filters
      );
      
      if (response.success && response.data) {
        setUsers(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.totalItems || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleActivateUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir activer cet utilisateur?')) {
      return;
    }

    try {
      const response = await userService.activateUser(userId);
      if (response.success) {
        showToast('Utilisateur activé avec succès', 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error activating user:', error);
      showToast(error.response?.data?.message || 'Erreur lors de l\'activation', 'error');
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur?')) {
      return;
    }
    
    try {
      const response = await userService.suspendUser(userId);
      if (response.success) {
        showToast('Utilisateur suspendu avec succès', 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      showToast(error.response?.data?.message || 'Erreur lors de la suspension', 'error');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur?')) {
      return;
    }
    
    try {
      const response = await userService.deactivateUser(userId);
      if (response.success) {
        showToast('Utilisateur désactivé avec succès', 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      showToast(error.response?.data?.message || 'Erreur lors de la désactivation', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur? Cette action est irréversible.')) {
      return;
    }
    
    try {
      const response = await userService.deleteUser(userId);
      if (response.success) {
        showToast('Utilisateur supprimé avec succès', 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(error.response?.data?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-0">Gestion des Utilisateurs</h1>
          <p className="text-muted mb-0">{pagination.total} utilisateurs au total</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearchSubmit}>
            <Row className="mb-3">
              <Col md={12}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Rechercher par nom, prénom ou email..."
                  />
                  <Button type="submit" variant="primary">
                    <MdSearch className="me-1" /> Rechercher
                  </Button>
                </InputGroup>
              </Col>
            </Row>
            
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>État</Form.Label>
                <Form.Select
                  name="etat"
                  value={filters.etat}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="suspendu">Suspendu</option>
                </Form.Select>
              </Col>
              
              <Col md={4}>
                <Form.Label>Rôle</Form.Label>
                <Form.Select
                  name="roleId"
                  value={filters.roleId}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.nom}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4} className="d-flex align-items-end">
                <Button 
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => {
                    setFilters({ etat: '', roleId: '', search: '' });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  Réinitialiser
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <>
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nom complet</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>État</th>
                    <th>Date création</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.prenom} {u.nom}</td>
                      <td>{u.email}</td>
                      <td>
                        <Badge bg="secondary">{u.role?.nom || 'N/A'}</Badge>
                      </td>
                      <td>
                        <Badge className={`badge-${u.etat}`}>
                          {u.etat}
                        </Badge>
                      </td>
                      <td>{formatDate(u.dateCreation)}</td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button 
                            as={Link} 
                            to={`/admin/users/${u.id}`}
                            variant="info"
                            title="Voir détails"
                          >
                            <MdVisibility />
                          </Button>
                          
                          {u.etat === 'inactif' && (
                            <Button
                              onClick={() => handleActivateUser(u.id)}
                              variant="success"
                              title="Activer"
                            >
                              <MdCheckCircle />
                            </Button>
                          )}
                          
                          {u.etat === 'actif' && (
                            <>
                              <Button
                                onClick={() => handleSuspendUser(u.id)}
                                variant="warning"
                                title="Suspendre"
                              >
                                <MdPause />
                              </Button>
                              <Button
                                onClick={() => handleDeactivateUser(u.id)}
                                variant="secondary"
                                title="Désactiver"
                              >
                                <MdBlock />
                              </Button>
                            </>
                          )}
                          
                          {u.etat === 'suspendu' && (
                            <Button
                              onClick={() => handleActivateUser(u.id)}
                              variant="success"
                              title="Réactiver"
                            >
                              <MdCheckCircle />
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => handleDeleteUser(u.id)}
                            variant="danger"
                            title="Supprimer"
                          >
                            <MdDelete />
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  variant="outline-primary"
                >
                  ← Précédent
                </Button>
                
                <span className="text-muted">
                  Page {pagination.page} sur {totalPages || 1}
                </span>
                
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}
                  variant="outline-primary"
                >
                  Suivant →
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserManagement;
