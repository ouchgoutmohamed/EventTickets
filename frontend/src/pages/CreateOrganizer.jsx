import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../api/authService';

const CreateOrganizer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Check if user is admin
  React.useEffect(() => {
    if (!user || user.role?.nom !== 'administrateur') {
      showToast('Accès non autorisé', 'error');
      navigate('/dashboard');
    }
  }, [user, navigate, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
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
      newErrors.nom = 'Le nom est requis';
    } else if (formData.nom.length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    } else if (formData.prenom.length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une lettre minuscule';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une lettre majuscule';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins un chiffre';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins un caractère spécial';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const { confirmPassword, ...organizerData } = formData;
      // Set role to organizer
      organizerData.roleNom = 'organisateur';
      
      const response = await authService.register(organizerData);
      
      if (response.success) {
        showToast('Organisateur créé avec succès!', 'success');
        navigate('/admin/users');
      } else {
        showToast(response.message || 'Échec de la création', 'error');
      }
    } catch (error) {
      console.error('Create organizer error:', error);
      showToast(error.response?.data?.message || 'Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h1 className="h2 mb-1">Créer un compte Organisateur</h1>
        <p className="text-muted">Remplissez les informations pour créer un nouveau compte organisateur</p>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nom *</Form.Label>
                      <Form.Control
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        isInvalid={!!errors.nom}
                        placeholder="Nom de famille"
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.nom}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prénom *</Form.Label>
                      <Form.Control
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        isInvalid={!!errors.prenom}
                        placeholder="Prénom"
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.prenom}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    placeholder="email@exemple.com"
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mot de passe *</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!errors.password}
                        placeholder="Ex: Password@123"
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        8+ caractères, majuscule, minuscule, chiffre et caractère spécial
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirmer le mot de passe *</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        isInvalid={!!errors.confirmPassword}
                        placeholder="Retaper le mot de passe"
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-2 justify-content-end mt-4">
                  <Button 
                    variant="outline-secondary"
                    onClick={() => navigate('/admin/users')}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="primary"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Création...' : 'Créer l\'organisateur'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateOrganizer;
