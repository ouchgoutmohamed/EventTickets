import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
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
      const response = await login(formData.email, formData.password);
      
      if (response.success) {
        showToast('Connexion réussie!', 'success');
        navigate('/dashboard');
      } else {
        showToast(response.message || 'Échec de la connexion', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast(error.response?.data?.message || 'Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', width: '100%', margin: 0, padding: 0}}>
      <Container fluid className="px-3">
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={5}>
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
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  <h2 className="h3 mb-2 fw-bold">Bienvenue</h2>
                  <p className="text-muted mb-0">Connectez-vous pour continuer</p>
                </div>

                <Form onSubmit={handleSubmit}>
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

                  <Form.Group className="mb-4">
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

                  <Button 
                    type="submit" 
                    variant="primary"
                    className="w-100 fw-semibold"
                    disabled={loading}
                    size="lg"
                    style={{borderRadius: '0.5rem', padding: '0.75rem'}}
                  >
                    {loading ? 'Connexion en cours...' : 'Se connecter'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="mb-0 text-muted">
                    Pas encore de compte ?{' '}
                    <Link to="/register" className="text-primary text-decoration-none fw-semibold">
                      Créer un compte
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

export default Login;
