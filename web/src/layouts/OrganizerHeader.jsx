import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, LogOut, LayoutDashboard, CalendarPlus, ListMusic, Ticket } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/logo-dark.png';

const OrganizerHeader = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fonction pour déterminer le titre de la page selon l'URL
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/organizer/dashboard': return 'Tableau de bord';
      case '/organizer/my-events': return 'Mes Événements';
      case '/organizer/create-event': return 'Créer un événement';
      case '/organizer/tickets': return 'Gestion des Billets';
      default: return 'Espace Organisateur';
    }
  };

  const menuItems = [
    { path: '/organizer/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/organizer/my-events', icon: ListMusic, label: 'Mes Événements' },
    { path: '/organizer/create-event', icon: CalendarPlus, label: 'Créer un événement' },
    { path: '/organizer/tickets', icon: Ticket, label: 'Gestion Tickets' },
  ];

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm">
      
      {/* === MOBILE MENU (Sheet) === */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-6 border-b flex items-center gap-2">
             <img src={logo} alt="Logo" className="h-8 w-auto" />
             {/* <span className="font-bold">Eventify Pro</span> */}
          </div>
          <nav className="flex flex-col gap-2 p-4">
            {menuItems.map((item) => {
               const Icon = item.icon;
               return (
                 <Link
                   key={item.path}
                   to={item.path}
                   className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg"
                 >
                   <Icon size={20} />
                   {item.label}
                 </Link>
               )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* === TITRE DE PAGE (Desktop) === */}
      <h1 className="hidden md:block text-lg font-semibold text-gray-800">
        {getPageTitle()}
      </h1>

      {/* === ESPACE DROIT === */}
      <div className="ml-auto flex items-center gap-4">
        
        {/* Barre de recherche (Optionnel) */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="pl-9 h-9 bg-gray-50 border-gray-200"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-gray-500">
           <Bell className="h-5 w-5" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={user?.avatarUrl} alt={user?.nom} />
                <AvatarFallback className="bg-green-100 text-green-700 font-bold">
                  {user?.nom?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.prenom} {user?.nom}</p>
                <p className="text-xs leading-none text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/organizer/profile')}>
              Mon Profil
            </DropdownMenuItem>
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => {
                logout();
                navigate('/');
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default OrganizerHeader;