import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { MdPerson, MdLogout } from 'react-icons/md';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadgeVariant = () => {
    const role = user?.role?.nom;
    if (role === 'administrateur') return 'danger';
    if (role === 'organisateur') return 'warning';
    return 'info';
  };

  if (!user) return null;

  const isClient = user?.role?.nom === 'client';

  return (
    <Navbar bg="white" className="border-bottom shadow-sm" style={{position: 'fixed', top: 0, left: isClient ? 0 : '260px', right: 0, zIndex: 999, height: '70px'}}>
      <Container fluid>
        <Navbar.Brand className="mb-0 d-flex align-items-center">
          <img 
            src="/logo-dark.png" 
            alt="EventTickets Logo" 
            style={{height: '40px'}}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect fill="%2310b981" width="40" height="40" rx="8"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="20" font-weight="bold">ET</text></svg>';
            }}
          />
        </Navbar.Brand>

        <Dropdown align="end">
          <Dropdown.Toggle variant="link" className="text-decoration-none d-flex align-items-center" style={{color: 'inherit'}}>
            <div className="d-flex align-items-center">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '40px', height: '40px', fontWeight: 'bold'}}>
                {getInitials()}
              </div>
              <div className="text-start me-2">
                <div className="fw-semibold">{user.prenom} {user.nom}</div>
                <Badge bg={getRoleBadgeVariant()} className="small">
                  {user.role?.nom}
                </Badge>
              </div>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Header>
              <div className="fw-semibold">{user.prenom} {user.nom}</div>
              <div className="text-muted small">{user.email}</div>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item as={Link} to="/profile">
              <MdPerson className="me-2" />
              Mon Profil
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout} className="text-danger">
              <MdLogout className="me-2" />
              Déconnexion
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Container>
    </Navbar>
  );
};

export default Header;
