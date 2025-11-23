import React from 'react';
import { Routes, Route } from 'react-router-dom';

// === Imports Publics ===
import HomePage from './pages/HomePage'; 
import EventDetailsPage from './pages/EventDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/layout/Header';
import OrganizerLayout from './layouts/OrganizerLayout';
import OrganizerDashboard from './pages/OrganizerDashboard'
import MyEventsPage from './pages/MyEventsPage';
import CreateEventPage from './pages/CreateEventPage';
import ProfilePage from './pages/ProfilePage';
import PaymentPage from './pages/PaymentPage';
import MyReservationsPage from './pages/MyReservationsPage';
import AdminLayout from './layouts/AdminLayout';
import RoleManagement from './features/auth/components/RoleManagement';
import UserManagement from './features/auth/components/UserManagement';
import UserDetail from './features/auth/components/UserDetail';
import EditEventPage from './pages/EditEventPage';



export default function App() {
  return (
    <Routes>
           {/* === Routes Publiques (Avec Header public) === */}
           <Route path="/" element={<><Header /><HomePage /></>} />
           <Route path="/events/:id" element={<><Header /><EventDetailsPage /></>} />
           <Route path="/login" element={<><Header /><LoginPage /></>} />
           <Route path="/register" element={<><Header /><RegisterPage /></>} />

           {/* Route Profil accessible à tout utilisateur connecté */}
           <Route path="/profile" element={<><Header /><ProfilePage /></>} />

           {/* Routes Réservation et Paiement */}
           <Route path="/payment/:reservationId" element={<><Header /><PaymentPage /></>} />
           <Route path="/my-reservations" element={<><Header /><MyReservationsPage /></>} />

           {/* === Routes Organisateur (Avec Layout dédié) === */}
           <Route path="/organizer" element={<OrganizerLayout />}>
              <Route index element={<OrganizerDashboard />} /> 
              <Route path="dashboard" element={<OrganizerDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="create-event" element={<CreateEventPage />} />
              <Route path="my-events" element={<MyEventsPage />} /> 
              <Route path="tickets" element={<div>Page Tickets (À faire)</div>} />
              <Route path="edit-event/:id" element={<EditEventPage />} />
           </Route>

          <Route path="/admin" element={<AdminLayout />}>
         <Route index element={<div>Dashboard Admin (Stats globales)</div>} />
         <Route path="dashboard" element={<div>Dashboard Admin</div>} />
         <Route path="roles" element={<RoleManagement />} />
         
          <Route path="users/:id" element={<UserDetail />} />
         <Route path="users" element={<UserManagement />} />
         
      </Route>

    </Routes>
  );
}