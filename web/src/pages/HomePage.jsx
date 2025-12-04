import React, { useState, useEffect } from 'react';
import { Search, Loader2, FilterX, Sparkles, MapPin, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EventCard from '@/features/catalog/components/EventCard';

// Import du service
import { getAllEvents } from '@/features/catalog/services/eventService';
import { getStatusConfig } from '@/utils/statusHelpers';

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
      
      // 🛡️ FILTRAGE SÉCURISÉ DES DONNÉES BRUTES
      const visibleEvents = Array.isArray(data) ? data.filter(event => {
          const config = getStatusConfig(event.status);
          // On garde si configuré comme visible (tout sauf DRAFT) ET non supprimé
          return config.isVisiblePublic && !event.deleted;
      }) : [];
      
      setEvents(visibleEvents);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les événements.");
    } finally {
      setLoading(false);
    }
  };

  // === LOGIQUE DE FILTRAGE FRONTEND ===
  const filteredEvents = events.filter(event => {
    const matchCategory = selectedCategory === "Tous" || event.category?.categoryType === selectedCategory;
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = event.title.toLowerCase().includes(searchLower) || 
                        (event.venue?.city || "").toLowerCase().includes(searchLower);
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans selection:bg-green-100">
      
      {/* === HERO SECTION (Améliorée) === */}
      <div className="relative bg-white overflow-hidden border-b">
        {/* Decorative Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute top-[10%] right-[-5%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10 text-center">
          
          <Badge variant="outline" className="mb-6 px-4 py-1 border-green-200 text-green-700 bg-green-50 uppercase tracking-widest text-[10px] font-bold animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Sparkles size={12} className="mr-2" /> La billetterie nouvelle génération
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
            Vivez l'instant <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Inoubliable</span>
          </h1>
          
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
            Concerts, festivals, théâtre... Découvrez les meilleurs événements près de chez vous et réservez votre place en quelques clics.
          </p>
          
          {/* Search Bar Floating */}
          <div className="flex flex-col md:flex-row gap-2 max-w-2xl mx-auto bg-white p-2 rounded-full shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in duration-1000 delay-300 fill-mode-both">
            <div className="relative flex-grow flex items-center px-4">
              <Search className="text-slate-400 mr-3" size={20}/>
              <input 
                type="text"
                placeholder="Quel événement cherchez-vous ?" 
                className="w-full bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="h-12 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold transition-all hover:shadow-lg hover:shadow-green-200">
              Rechercher
            </Button>
          </div>

          {/* Quick Stats (Optional) */}
          <div className="mt-12 flex justify-center gap-8 text-slate-400 text-sm font-medium animate-in fade-in duration-1000 delay-500">
             <span className="flex items-center gap-2"><MapPin size={16}/> +15 Villes</span>
             <span className="flex items-center gap-2"><CalendarDays size={16}/> +100 Événements/mois</span>
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="container mx-auto px-4 py-16">
        
        {/* Filter Categories (Pills Design) */}
        <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-slate-900 hidden md:block">À l'affiche</h2>
            
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide w-full md:w-auto">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                            selectedCategory === cat 
                            ? 'bg-slate-900 text-white shadow-md transform scale-105' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-green-500 hover:text-green-600'
                        }`}
                    >
                        {cat === 'Tous' ? 'Tous' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-green-100 rounded-full animate-spin"></div>
                    <div className="w-16 h-16 border-4 border-green-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
                </div>
                <p className="text-slate-500 animate-pulse">Recherche des meilleurs plans...</p>
            </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
            <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100 mx-auto max-w-2xl">
                <p className="text-red-600 font-medium mb-2">Oups ! Une erreur est survenue.</p>
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        )}

        {/* EVENTS GRID */}
        {!loading && !error && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredEvents.map((event, index) => (
                        // Animation d'entrée en cascade (Staggered)
                        <div 
                            key={event.id} 
                            className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                            style={{ animationDelay: `${index * 100}ms` }} // Délai progressif
                        >
                            <EventCard event={event} />
                        </div>
                    ))}
                </div>
                
                {/* EMPTY STATE */}
                {filteredEvents.length === 0 && (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="bg-slate-100 p-6 rounded-full mb-6">
                            <FilterX size={48} className="text-slate-400"/>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun événement trouvé</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            Nous n'avons pas trouvé d'événement correspondant à vos critères "{searchTerm}" dans la catégorie {selectedCategory}.
                        </p>
                        <Button 
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8"
                            onClick={() => {setSelectedCategory('Tous'); setSearchTerm('');}}
                        >
                            Tout effacer et voir les événements
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