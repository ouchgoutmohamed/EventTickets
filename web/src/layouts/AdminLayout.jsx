import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/logo-dark.png';

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Utilisateurs' },
    { path: '/admin/roles', icon: Shield, label: 'Rôles & Permissions' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-2 border-b border-slate-700">
           <img src={logo} alt="Logo" className="h-8 w-auto brightness-0 invert" />
           {/* <span className="font-bold text-lg">Admin Panel</span> */}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-green-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                    {user?.nom?.charAt(0) || 'A'}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.prenom} {user?.nom}</p>
                    <p className="text-xs text-slate-400">Administrateur</p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-400 hover:bg-slate-800 w-full px-4 py-2 rounded-lg transition"
            >
                <LogOut size={18} />
                <span>Déconnexion</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;