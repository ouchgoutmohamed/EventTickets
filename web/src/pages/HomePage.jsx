import React, { useState, useEffect } from 'react';
import { Search, Loader2, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EventCard from '@/features/catalog/components/EventCard';

// Import du service
import { getAllEvents } from '@/features/catalog/services/eventService';
import { getStatusConfig } from '../utils/statusHelpers';

const CATEGORIES = ["Tous", "MUSIC", "SPORTS", "CONFERENCE", "THEATRE", "FESTIVAL"];

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les filtres
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getAllEvents();
      console.log(data);
      
      
      // 🛡️ FILTRAGE SÉCURISÉ DES DONNÉES BRUTES
      const visibleEvents = Array.isArray(data) ? data.filter(event => {
          const config = getStatusConfig(event.status);
          // On garde si configuré comme visible (tout sauf DRAFT) ET non supprimé
          return config.isVisiblePublic && !event.deleted;
      }) : [];
      
      setEvents(visibleEvents);
    } catch (err) {
      // ...
    } finally {
      setLoading(false);
    }
  };
  // === LOGIQUE DE FILTRAGE FRONTEND ===
  const filteredEvents = events.filter(event => {
    // 1. Filtre par catégorie
    const matchCategory = selectedCategory === "Tous" || event.category?.categoryType === selectedCategory;
    
    // 2. Filtre par recherche (Titre ou Ville)
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = event.title.toLowerCase().includes(searchLower) || 
                        (event.venue?.city || "").toLowerCase().includes(searchLower);

    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* === HERO SECTION === */}
      <div className="bg-white border-b py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Vivez des moments <span className="text-green-600">inoubliables</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Découvrez et réservez les meilleurs événements autour de vous : concerts, conférences, ateliers et plus encore.
          </p>
          
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto relative">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
              <Input 
                placeholder="Rechercher un événement, une ville..." 
                className="pl-10 h-12 text-base shadow-sm border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md">
              Rechercher
            </Button>
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="container mx-auto px-4 py-10">
        
        {/* Filter Categories */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto">
            <div className="flex gap-2 pb-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedCategory === cat 
                            ? 'bg-green-600 text-white shadow-md' 
                            : 'bg-white text-gray-600 border hover:bg-gray-50'
                        }`}
                    >
                        {cat === 'Tous' ? 'Tous' : cat.charAt(0) + cat.slice(1).toLowerCase()} {/* Joli formatage */}
                    </button>
                ))}
            </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-green-600 h-10 w-10" />
            </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
            <div className="text-center py-20 text-red-500">
                {error}
            </div>
        )}

        {/* EVENTS GRID */}
        {!loading && !error && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
                
                {/* EMPTY STATE */}
                {filteredEvents.length === 0 && (
                    <div className="text-center py-20 flex flex-col items-center text-gray-500">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <FilterX size={32} className="text-gray-400"/>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Aucun événement trouvé</h3>
                        <p>Essayez de modifier vos filtres ou votre recherche.</p>
                        <Button 
                            variant="link" 
                            className="text-green-600 mt-2"
                            onClick={() => {setSelectedCategory('Tous'); setSearchTerm('');}}
                        >
                            Réinitialiser les filtres
                        </Button>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default HomePage;