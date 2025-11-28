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
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import RoleManagement from './features/auth/components/RoleManagement';
import UserManagement from './features/auth/components/UserManagement';
import UserDetail from './features/auth/components/UserDetail';
import CreateOrganizerPage from './pages/CreateOrganizerPage';
import EditEventPage from './pages/EditEventPage';



export default function App() {
  return (
    <Routes>
           {/* === Routes Publiques (Avec Header public) === */}
           <Route path="/" element={<><Header /><HomePage /></>} />
           <Route path="/events/:id" element={<><Header /><EventDetailsPage /></>} />
           {/* Login et Register sans header */}
           <Route path="/login" element={<LoginPage />} />
           <Route path="/register" element={<RegisterPage />} />

           {/* Route Profil accessible à tout utilisateur connecté */}
           <Route path="/profile" element={<><Header /><ProfilePage /></>} />

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
         <Route index element={<AdminDashboard />} />
         <Route path="dashboard" element={<AdminDashboard />} />
         <Route path="roles" element={<RoleManagement />} />
         
          <Route path="users/:id" element={<UserDetail />} />
         <Route path="users" element={<UserManagement />} />
         <Route path="create-organizer" element={<CreateOrganizerPage />} />
         
      </Route>

    </Routes>
  );
}