import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdPeople, MdEventNote, MdConfirmationNumber } from 'react-icons/md';
import userService from '../api/userService';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalTickets: 0
  });

  const isAdmin = user?.role?.nom === 'administrateur';
  const isOrganizator = user?.role?.nom === 'organisateur';
  const isClient = user?.role?.nom === 'client';

  useEffect(() => {
    // Redirect clients to home page
    if (isClient) {
      navigate('/home');
      return;
    }
    
    if (user && user.role) {
      fetchStats();
    }
  }, [user, isAdmin, isClient, navigate]);

  const fetchStats = async () => {
    try {
      // Fetch users count if admin
      if (user?.role?.nom === 'administrateur') {
        const usersResponse = await userService.getAllUsers(1, 1, {});
        if (usersResponse.success && usersResponse.data) {
          const totalUsers = usersResponse.data.pagination?.totalItems || 0;
          setStats(prev => ({
            ...prev,
            totalUsers: totalUsers
          }));
        }
      }
      // TODO: Fetch events and tickets stats when those services are implemented
      // For now, show 0 as placeholder
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h1 className="h2">Tableau de bord</h1>
        <p className="text-muted">Vue d'ensemble de votre activité</p>
      </div>

      <Row className="g-4">
        {isAdmin && (
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <div className="bg-primary bg-gradient rounded-circle d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                    <MdPeople size={30} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="h2 mb-0">{stats.totalUsers}</h3>
                  <p className="text-muted mb-0">Utilisateurs</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {(isAdmin || isOrganizator) && (
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <div className="bg-success bg-gradient rounded-circle d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                    <MdEventNote size={30} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="h2 mb-0">{stats.totalEvents}</h3>
                  <p className="text-muted mb-0">Événements</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-shrink-0 me-3">
                <div className="bg-info bg-gradient rounded-circle d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                  <MdConfirmationNumber size={30} className="text-white" />
                </div>
              </div>
              <div>
                <h3 className="h2 mb-0">{stats.totalTickets}</h3>
                <p className="text-muted mb-0">Billets</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
