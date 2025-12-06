import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Assure-toi de mettre ton logo ici
import logo from '@/assets/logo-dark.png';

const Header = () => {
  const navigate = useNavigate();
  // Simuler l'état auth (à remplacer plus tard par ton Context ou Redux)
  const isAuthenticated = !!localStorage.getItem('accessToken'); 
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    window.location.reload(); // Pour reset l'état simple
  };

  return (
    <header className="border-b bg-white py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        
        {/* 1. LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Eventify Logo" className="h-8 w-auto" />
          {/* <span className="font-bold text-xl tracking-tight text-gray-900">Eventify</span> */}
        </Link>

        {/* 2. NAVIGATION (Desktop) */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          <Link to="/" className="hover:text-green-600 transition">Explorer</Link>
          <Link to="/about" className="hover:text-green-600 transition">À propos</Link>
          {/* Lien conditionnel pour les organisateurs */}
          {user.role === 'ORGANIZER' && (
             <Link to="/create-event" className="text-green-600">Créer un événement</Link>
          )}
        </nav>

        {/* 3. AUTH SECTION (Ta demande spécifique) */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            // CAS : CONNECTÉ -> AVATAR
            <DropdownMenu className="cursor-pointer bg-white">
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer h-9 w-9 border border-gray-200 hover:border-green-500 transition">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-green-100 text-green-700">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger  >
              <DropdownMenuContent align="end" className="w-56 ">
                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>Profil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-reservations')}>Mes Réservations</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-tickets')}>🎟️ Mes Billets</DropdownMenuItem>
                {user.role === 'ADMIN' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>Dashboard Admin</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // CAS : DÉCONNECTÉ -> BOUTONS
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Connexion
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate('/register')}>
                S'inscrire
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;