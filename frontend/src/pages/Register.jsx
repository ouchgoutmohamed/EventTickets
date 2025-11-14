import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // For public registration, we'll hardcode the client role
    // The backend will validate and assign the correct role
    // We set a default roleId that will be used during registration
    setFormData(prev => ({ ...prev, roleId: '3' })); // Assuming 3 is the client role ID
  }, []);

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
    
    if (!formData.roleId) {
      newErrors.roleId = 'Veuillez sélectionner un rôle';
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
      const { confirmPassword, ...registrationData } = formData;
      registrationData.roleId = parseInt(registrationData.roleId);
      
      const response = await register(registrationData);
      
      if (response.success) {
        showToast('Inscription réussie! Vous pouvez maintenant vous connecter.', 'success');
        navigate('/login');
      } else {
        showToast(response.message || 'Échec de l\'inscription', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast(error.response?.data?.message || 'Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-5" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', width: '100%', margin: 0, padding: 0}}>
      <Container fluid className="px-3">
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6}>
            <Card className="border-0 shadow-lg" style={{borderRadius: '1rem'}}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="mb-4">
                    <img 
                      src="/logo-dark.png" 
                      alt="Logo" 
                      className="mb-3" 
                      style={{maxWidth: '120px', height: 'auto'}}
                      onError={(e) => {
                        // Fallback to SVG icon if logo image not found
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'inline-flex';
                      }}
                    />
                    <div 
                      className="d-none align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3"
                      style={{width: '80px', height: '80px'}}
                    >
                      <svg 
                        width="40" 
                        height="40" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                    </div>
                  </div>
                  <h2 className="h3 mb-2 fw-bold">Créer un compte</h2>
                  <p className="text-muted mb-0">Rejoignez-nous dès maintenant</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Nom</Form.Label>
                        <Form.Control
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          isInvalid={!!errors.nom}
                          placeholder="Dupont"
                          disabled={loading}
                          size="lg"
                          style={{borderRadius: '0.5rem'}}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.nom}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Prénom</Form.Label>
                        <Form.Control
                          type="text"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleChange}
                          isInvalid={!!errors.prenom}
                          placeholder="Jean"
                          disabled={loading}
                          size="lg"
                          style={{borderRadius: '0.5rem'}}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.prenom}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Adresse email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!errors.email}
                      placeholder="nom@exemple.com"
                      disabled={loading}
                      size="lg"
                      style={{borderRadius: '0.5rem'}}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <input type="hidden" name="roleId" value={formData.roleId} />

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Mot de passe</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          isInvalid={!!errors.password}
                          placeholder="••••••••"
                          disabled={loading}
                          size="lg"
                          style={{borderRadius: '0.5rem'}}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Confirmer mot de passe</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          isInvalid={!!errors.confirmPassword}
                          placeholder="••••••••"
                          disabled={loading}
                          size="lg"
                          style={{borderRadius: '0.5rem'}}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="alert alert-light border mb-4" role="alert">
                    <small className="text-muted">
                      <strong>Mot de passe requis:</strong> 8+ caractères, majuscule, minuscule, chiffre et caractère spécial
                    </small>
                  </div>

                  <Button 
                    type="submit" 
                    variant="primary"
                    className="w-100 fw-semibold"
                    disabled={loading}
                    size="lg"
                    style={{borderRadius: '0.5rem', padding: '0.75rem'}}
                  >
                    {loading ? 'Création en cours...' : 'Créer mon compte'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="mb-0 text-muted">
                    Vous avez déjà un compte ?{' '}
                    <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
