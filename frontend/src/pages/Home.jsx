import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { MdEventNote, MdConfirmationNumber, MdExplore } from 'react-icons/md';

const Home = () => {
  return (
    <Container className="py-4" style={{maxWidth: '1200px'}}>
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">Bienvenue sur EventTickets</h1>
        <p className="lead text-muted">Découvrez et réservez vos billets pour les meilleurs événements</p>
      </div>

      <div className="text-center mt-5 py-5">
        <div className="bg-light rounded p-5">
          <h3 className="mb-3">Cette section est en cours de développement</h3>
          <p className="text-muted">Notre équipe travaille actuellement sur cette fonctionnalité.</p>
        </div>
      </div>
    </Container>
  );
};

export default Home;
