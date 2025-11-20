import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { MdDashboard, MdPeople, MdSecurity, MdPersonAdd, MdEventNote, MdConfirmationNumber, MdHome } from 'react-icons/md';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role?.nom === 'administrateur';
  const isOrganizator = user?.role?.nom === 'organisateur';
  const isClient = user?.role?.nom === 'client';

  const isActive = (path) => location.pathname === path;

  return (
    <aside 
      className="d-flex flex-column" 
      style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        bottom: 0, 
        width: '260px', 
        zIndex: 1000,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
      }}
    >
      <div className="p-4 border-bottom border-secondary border-opacity-25">
        <Link to="/dashboard" className="d-block">
          <img src="/logo-light.png" alt="SIBE Logo" className="img-fluid" style={{maxWidth: '150px'}} />
        </Link>
      </div>

      <Nav className="flex-column px-3 py-4 overflow-auto">
        {/* Home/Dashboard link based on role */}
        {isClient ? (
          <Nav.Link 
            as={Link} 
            to="/home" 
            active={isActive('/home')}
            className="d-flex align-items-center mb-2 px-3 py-2 rounded"
          >
            <MdHome className="me-2" size={20} />
            <span>Accueil</span>
          </Nav.Link>
        ) : (
          <Nav.Link 
            as={Link} 
            to="/dashboard" 
            active={isActive('/dashboard')}
            className="d-flex align-items-center mb-2 px-3 py-2 rounded"
          >
            <MdDashboard className="me-2" size={20} />
            <span>Tableau de bord</span>
          </Nav.Link>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="mt-3 mb-2 px-3 text-white text-opacity-50 text-uppercase small fw-bold">
              Administration
            </div>
            <Nav.Link 
              as={Link} 
              to="/admin/users" 
              active={isActive('/admin/users')}
              className="d-flex align-items-center mb-2 px-3 py-2 rounded"
            >
              <MdPeople className="me-2" size={20} />
              <span>Utilisateurs</span>
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/roles" 
              active={isActive('/admin/roles')}
              className="d-flex align-items-center mb-2 px-3 py-2 rounded"
            >
              <MdSecurity className="me-2" size={20} />
              <span>Rôles</span>
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/admin/organizers/create" 
              active={isActive('/admin/organizers/create')}
              className="d-flex align-items-center mb-2 px-3 py-2 rounded"
            >
              <MdPersonAdd className="me-2" size={20} />
              <span>Créer Organisateur</span>
            </Nav.Link>
          </>
        )}

        {/* Organizer Section */}
        {(isAdmin || isOrganizator) && (
          <>
            <div className="mt-3 mb-2 px-3 text-white text-opacity-50 text-uppercase small fw-bold">
              Événements
            </div>
            <Nav.Link 
              as={Link} 
              to="/events" 
              active={isActive('/events')}
              className="d-flex align-items-center mb-2 px-3 py-2 rounded"
            >
              <MdEventNote className="me-2" size={20} />
              <span>Mes Événements</span>
            </Nav.Link>
          </>
        )}

        {/* Client Section */}
        <div className="mt-3 mb-2 px-3 text-white text-opacity-50 text-uppercase small fw-bold">
          Mes Billets
        </div>
        <Nav.Link 
          as={Link} 
          to="/tickets" 
          active={isActive('/tickets')}
          className="d-flex align-items-center mb-2 px-3 py-2 rounded"
        >
          <MdConfirmationNumber className="me-2" size={20} />
          <span>Billets Achetés</span>
        </Nav.Link>
      </Nav>
    </aside>
  );
};

export default Sidebar;
