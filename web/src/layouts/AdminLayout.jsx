import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, LogOut, User, Settings, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/admin/users', icon: Users, label: 'Utilisateurs' },
    { path: '/admin/roles', icon: Shield, label: 'Gestion des Rôles' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 text-white bg-slate-900">
        <div className="flex items-center gap-2 p-6 border-b border-slate-700">
           <img src={logo} alt="Logo" className="w-auto h-8 brightness-0 invert" />
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

      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Top Header */}
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {location.pathname === '/admin/dashboard' && 'Tableau de bord'}
              {location.pathname === '/admin/users' && 'Gestion des Utilisateurs'}
              {location.pathname.includes('/admin/users/') && 'Détails Utilisateur'}
              {location.pathname === '/admin/roles' && 'Gestion des Rôles'}
              {location.pathname === '/admin/create-organizer' && 'Créer un Organisateur'}
            </h2>
            <p className="text-sm text-gray-500">Panel d'administration</p>
          </div>

          {/* Profile Dropdown - Top Right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 transition-colors rounded-lg hover:bg-gray-50">
                <Avatar className="w-10 h-10 border-2 border-green-600">
                  <AvatarImage src={user?.avatarUrl} alt={user?.prenom} />
                  <AvatarFallback className="font-semibold text-green-700 bg-green-100">
                    {user?.prenom?.charAt(0) || user?.nom?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                <Settings className="w-4 h-4 mr-2" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;