import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, ButtonGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md';
import roleService from '../api/roleService';
import Modal from '../components/Modal';

const RoleManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role?.nom !== 'administrateur') {
      showToast('Accès non autorisé', 'error');
      navigate('/dashboard');
      return;
    }

    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleService.getAllRoles();
      if (response.success && response.data) {
        setRoles(response.data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showToast('Erreur lors du chargement des rôles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        nom: role.nom,
        description: role.description || ''
      });
    } else {
      setEditingRole(null);
      setFormData({
        nom: '',
        description: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({
      nom: '',
      description: ''
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du rôle est requis';
    } else if (formData.nom.length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        nom: formData.nom,
        description: formData.description
      };

      let response;
      if (editingRole) {
        response = await roleService.updateRole(editingRole.id, payload);
      } else {
        response = await roleService.createRole(payload);
      }

      if (response.success) {
        showToast(
          editingRole ? 'Rôle mis à jour avec succès' : 'Rôle créé avec succès',
          'success'
        );
        handleCloseModal();
        fetchRoles();
      }
    } catch (error) {
      console.error('Error saving role:', error);
      showToast(error.response?.data?.message || 'Une erreur est survenue', 'error');
    }
  };

  const handleDelete = async (roleId, roleName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${roleName}"? Cette action est irréversible.`)) {
      return;
    }

    try {
      const response = await roleService.deleteRole(roleId);
      if (response.success) {
        showToast('Rôle supprimé avec succès', 'success');
        fetchRoles();
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showToast(error.response?.data?.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">Gestion des Rôles</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <MdAdd className="me-1" /> Créer un rôle
        </Button>
      </div>

      {/* Roles Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>Aucun rôle trouvé</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Date de création</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id}>
                    <td>{role.id}</td>
                    <td>
                      <strong>{role.nom}</strong>
                    </td>
                    <td>
                      {role.description || <span className="text-muted">Aucune description</span>}
                    </td>
                    <td>{formatDate(role.createdAt)}</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="warning"
                          onClick={() => handleOpenModal(role)}
                          title="Modifier"
                        >
                          <MdEdit />
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(role.id, role.nom)}
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
          )}
        </Card.Body>
      </Card>

      {/* Modal for Create/Edit Role */}
      <Modal 
        isOpen={showModal} 
        onClose={handleCloseModal}
        title={editingRole ? 'Modifier le rôle' : 'Créer un rôle'}
        footer={
          <div className="d-flex gap-2 justify-content-end">
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="roleForm">
              {editingRole ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        }
      >
        <Form id="roleForm" onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nom du rôle *</Form.Label>
            <Form.Control
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              isInvalid={!!errors.nom}
              placeholder="Ex: ADMIN, CLIENT, ORGANIZATOR"
              disabled={editingRole !== null}
            />
            <Form.Control.Feedback type="invalid">
              {errors.nom}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              isInvalid={!!errors.description}
              placeholder="Description du rôle..."
              rows={3}
            />
            <Form.Control.Feedback type="invalid">
              {errors.description}
            </Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal>
    </Container>
  );
};

export default RoleManagement;
