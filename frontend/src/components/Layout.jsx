import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Don't show Sidebar and Header on login/register pages
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (isPublicRoute || !user) {
    return <>{children}</>;
  }

  const isClient = user?.role?.nom === 'client';

  return (
    <>
      {!isClient && <Sidebar />}
      <Header />
      <div className="page-content" style={isClient ? { marginLeft: 0 } : {}}>
        {children}
      </div>
    </>
  );
};

export default Layout;
