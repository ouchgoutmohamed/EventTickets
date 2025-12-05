import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Bookmark, MapPin, Ticket } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { getStatusConfig } from '../../../utils/statusHelpers';

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(event.status);

  // === LOGIQUE D'EXTRACTION ===
  // Fallback to a reliable placeholder image
  const defaultImage = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400&auto=format&fit=crop";
  const imageUrl = event.images && event.images.length > 0 && event.images[0].url 
    ? event.images[0].url 
    : defaultImage;
  
  // Prix min
  const minPrice = event.tickets && event.tickets.length > 0 
    ? Math.min(...event.tickets.map(t => t.price)) 
    : 0;

  // Tickets restants total
  const remainingTickets = event.tickets 
    ? event.tickets.reduce((acc, t) => acc + t.quantity, 0) 
    : 0;

  // Calcul Durée
  const getDuration = () => {
    if (!event.startTime || !event.endTime) return 0;
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const diffHrs = (end - start) / (1000 * 60 * 60);
    return Math.round(diffHrs * 10) / 10;
  };

  const categoryName = event.category?.categoryType || 'Événement';

  // Handler pour le clic sur le bouton de réservation
  const handleReserveClick = (e) => {
    e.stopPropagation(); // Empêche la propagation au card
    navigate(`/events/${event.id}`, { state: { openReservation: true } });
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-none shadow-sm bg-white h-full flex flex-col"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          onError={(e) => { e.target.src = defaultImage; }} 
        />
        
        {/* 🛡️ OVERLAY STATUT (Si pas ouvert) */}
        {event.status !== 'OPEN_FOR_BOOKING' && (
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-[2px]">
                 <span className={`px-4 py-2 rounded-lg font-bold uppercase tracking-widest shadow-lg transform -rotate-6 ${statusConfig.color}`}>
                     {statusConfig.label}
                 </span>
             </div>
        )}

        <Badge className="absolute top-3 left-3 bg-white/90 text-black hover:bg-white font-medium shadow-sm z-20">
           {categoryName}
        </Badge>
      </div>
      
      <CardContent className="p-4 flex flex-col flex-grow justify-between">
        <div>
            <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight group-hover:text-green-700 transition-colors">{event.title}</h3>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-green-600"/>
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-green-600"/>
                    <span>{getDuration()}h</span>
                </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                <MapPin size={14}/>
                <span className="truncate">{event.venue ? event.venue.city : "Lieu à définir"}</span>
            </div>
        </div>

        <div className="flex justify-between items-end border-t pt-3">
            <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">À partir de</span>
                <div className="font-bold text-green-700 text-lg">
                    {minPrice === 0 ? 'Gratuit' : `${minPrice} MAD`}
                </div>
            </div>
            
            {/* Bouton Réserver ou Badge Stock */}
            {event.status === 'OPEN_FOR_BOOKING' ? (
                <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5 shadow-sm"
                    onClick={handleReserveClick}
                >
                    <Ticket size={14} />
                    Réserver
                </Button>
            ) : (
                <span className={`text-xs px-2 py-1 rounded-full ${remainingTickets < 20 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {remainingTickets > 0 ? `${remainingTickets} dispo` : statusConfig.label}
                </span>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;