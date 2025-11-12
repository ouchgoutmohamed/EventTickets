import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MdLock } from 'react-icons/md';
import userService from '../api/userService';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || ''
      });
    }
  }, [user]);

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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
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

  const validateProfileForm = () => {
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.oldPassword) {
      newErrors.oldPassword = 'L\'ancien mot de passe est requis';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/[a-z]/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins une lettre minuscule';
    } else if (!/[A-Z]/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins une lettre majuscule';
    } else if (!/[0-9]/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins un chiffre';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins un caractère spécial';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await userService.updateProfile(formData);
      
      if (response.success) {
        updateUser(response.data.user);
        showToast('Profil mis à jour avec succès', 'success');
        setIsEditing(false);
      } else {
        showToast(response.message || 'Échec de la mise à jour', 'error');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      showToast(error.response?.data?.message || 'Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir changer votre mot de passe?')) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await userService.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword
      );
      
      if (response.success) {
        showToast('Mot de passe modifié avec succès', 'success');
        setIsChangingPassword(false);
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showToast(response.message || 'Échec du changement de mot de passe', 'error');
      }
    } catch (error) {
      console.error('Change password error:', error);
      showToast(error.response?.data?.message || 'Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">Chargement...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h2 mb-1">Mon Profil</h1>
              <span className="badge bg-primary">{user.role?.nom || 'Utilisateur'}</span>
            </div>
          </div>

          {/* Profile Information Card */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Informations personnelles</h5>
              {!isEditing && (
                <Button 
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                 Modifier
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {isEditing ? (
                <Form onSubmit={handleProfileSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nom</Form.Label>
                        <Form.Control
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          isInvalid={!!errors.nom}
                          disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.nom}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Prénom</Form.Label>
                        <Form.Control
                          type="text"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleChange}
                          isInvalid={!!errors.prenom}
                          disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.prenom}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!errors.email}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-flex gap-2 justify-content-end">
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          nom: user.nom || '',
                          prenom: user.prenom || '',
                          email: user.email || ''
                        });
                        setErrors({});
                      }}
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </Form>
              ) : (
                <Row className="g-3">
                  <Col md={6}>
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Nom</small>
                      <strong>{user.nom}</strong>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Prénom</small>
                      <strong>{user.prenom}</strong>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Email</small>
                      <strong>{user.email}</strong>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Rôle</small>
                      <strong>{user.role?.nom || 'N/A'}</strong>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">État</small>
                      <span className={`badge badge-${user.etat}`}>{user.etat}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Date d'inscription</small>
                      <strong>{formatDate(user.dateCreation)}</strong>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* Change Password Card */}
          <Card className="shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Sécurité</h5>
              {!isChangingPassword && (
                <Button 
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setIsChangingPassword(true)}
                >
                  <MdLock className="me-1" /> Changer le mot de passe
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {isChangingPassword ? (
                <Form onSubmit={handlePasswordSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ancien mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      isInvalid={!!errors.oldPassword}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.oldPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Nouveau mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      isInvalid={!!errors.newPassword}
                      placeholder="Ex: Password@123"
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.newPassword}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Le mot de passe doit contenir: 8+ caractères, majuscule, minuscule, chiffre et caractère spécial
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      isInvalid={!!errors.confirmPassword}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-flex gap-2 justify-content-end">
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          oldPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                        setErrors({});
                      }}
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? 'Modification...' : 'Modifier'}
                    </Button>
                  </div>
                </Form>
              ) : (
                <p className="text-muted mb-0">
                  Cliquez sur "Changer le mot de passe" pour modifier votre mot de passe.
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
