import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarPlus, ListMusic, Ticket } from 'lucide-react';
import logo from '@/assets/logo-dark.png';
import OrganizerHeader from './OrganizerHeader'; // Import du Header

const OrganizerLayout = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/organizer/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/organizer/my-events', icon: ListMusic, label: 'Mes Événements' },
    { path: '/organizer/create-event', icon: CalendarPlus, label: 'Créer un événement' },
    { path: '/organizer/tickets', icon: Ticket, label: 'Gestion Tickets' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* === SIDEBAR (Desktop uniquement : hidden sur mobile) === */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white fixed inset-y-0 z-50">
        <div className="flex h-16 items-center border-b px-6 gap-2">
           <img src={logo} alt="Logo" className="h-8 w-auto" />
           {/* <span className="font-bold text-lg tracking-tight text-gray-900">Eventify Pro</span> */}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  isActive 
                    ? 'bg-green-50 text-green-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        {/* Footer Sidebar (Optionnel : Lien retour accueil public) */}
        <div className="p-4 border-t mt-auto">
            <Link to="/" className="text-xs text-gray-500 hover:text-green-600 text-center block">
                Retourner au site public
            </Link>
        </div>
      </aside>

      {/* === MAIN CONTENT AREA === */}
      {/* Le margin-left (ml-64) pousse le contenu pour laisser la place à la sidebar */}
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 ease-in-out">
        
        {/* NAVBAR (Haut) */}
        <OrganizerHeader />

        {/* CONTENU DE LA PAGE */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
           {/* Outlet affiche le Dashboard, CreateEvent, etc. */}
           <Outlet /> 
        </main>
      </div>

    </div>
  );
};

export default OrganizerLayout;