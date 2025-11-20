import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { MdConfirmationNumber } from 'react-icons/md';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.role?.nom === 'administrateur';
  const isOrganizator = user.role?.nom === 'organisateur';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <MdConfirmationNumber /> SIBE
        </Link>

        <ul className="navbar-menu">
          <li>
            <Link to="/dashboard" className="navbar-link">
              Tableau de bord
            </Link>
          </li>

          {isAdmin && (
            <>
              <li>
                <Link to="/admin/users" className="navbar-link">
                  Utilisateurs
                </Link>
              </li>
              <li>
                <Link to="/admin/roles" className="navbar-link">
                  Rôles
                </Link>
              </li>
              <li>
                <Link to="/admin/organizers/create" className="navbar-link">
                  Créer Organisateur
                </Link>
              </li>
            </>
          )}

          {(isAdmin || isOrganizator) && (
            <li>
              <Link to="/events" className="navbar-link">
                Événements
              </Link>
            </li>
          )}

          <li>
            <Link to="/tickets" className="navbar-link">
              Mes Billets
            </Link>
          </li>
        </ul>

        <div className="navbar-user">
          <Link to="/profile" className="navbar-profile">
            <span className="user-name">{user.prenom} {user.nom}</span>
            <span className="user-role">{user.role?.nom}</span>
          </Link>
          <button onClick={handleLogout} className="navbar-logout">
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
