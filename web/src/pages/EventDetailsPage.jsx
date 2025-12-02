import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, MapPin, Calendar as CalIcon, ArrowLeft, Share2, Clock } from "lucide-react";

// Composants UI
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";

// Contextes & Services
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { getEventById } from '@/features/catalog/services/eventService';
import { getStatusConfig } from '../utils/statusHelpers';
import { useReservation } from '@/features/inventory/hooks/useReservation';
import AvailabilityBadge from '@/features/inventory/components/AvailabilityBadge';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { isAuthenticated } = useAuth();
  const { reserve, loading: reserving } = useReservation();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // État pour gérer les quantités par type de billet { ticketId: quantity }
  const [ticketQuantities, setTicketQuantities] = useState({});

  // Calcul du compte à rebours
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  // 1. Chargement des données
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const data = await getEventById(id);
        setEvent(data);
        
        // Initialiser les compteurs à 0 pour chaque type de billet existant
        const initialQuantities = {};
        if (data.tickets && Array.isArray(data.tickets)) {
            data.tickets.forEach(t => initialQuantities[t.id] = 0);
        }
        setTicketQuantities(initialQuantities);

      } catch (err) {
        console.error(err);
        showError("Impossible de charger les détails de l'événement");
        navigate('/'); // Redirection si événement introuvable
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate, showError]);

  // 2. Logique du Compte à rebours (Timer)
  useEffect(() => {
    if (!event?.startTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const eventDate = new Date(event.startTime).getTime();
      const distance = eventDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [event]);

  // 3. Helpers Logique Métier
  const updateQuantity = (ticketId, delta) => {
    setTicketQuantities(prev => ({
        ...prev,
        [ticketId]: Math.max(0, (prev[ticketId] || 0) + delta)
    }));
  };

  const calculateTotal = () => {
    if (!event?.tickets) return 0;
    return event.tickets.reduce((total, ticket) => {
        return total + (ticket.price * (ticketQuantities[ticket.id] || 0));
    }, 0);
  };

  const getTotalQuantity = () => {
    return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const handleReservation = async () => {
    // Vérifier l'authentification
    if (!isAuthenticated) {
      showError('Vous devez être connecté pour réserver des tickets');
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    const totalQuantity = getTotalQuantity();
    
    // Vérifier qu'au moins un ticket est sélectionné
    if (totalQuantity === 0) {
      showError('Veuillez sélectionner au moins un ticket');
      return;
    }

    try {
      // Créer la réservation via l'API
      const response = await reserve(id, totalQuantity);
      
      // Préparer les détails de la réservation pour la page de paiement
      const reservationDetails = {
        reservationId: response.reservationId,
        holdExpiresAt: response.holdExpiresAt,
        eventTitle: event.title,
        eventDate: event.startTime,
        quantity: totalQuantity,
        unitPrice: event.tickets?.[0]?.price || 0,
        totalPrice: calculateTotal()
      };

      // Rediriger vers la page de paiement
      navigate(`/payment/${response.reservationId}`, {
        state: { reservation: reservationDetails }
      });
    } catch (err) {
      // Les erreurs sont déjà gérées dans le hook useReservation
      console.error('Erreur lors de la réservation:', err);
    }
  };

  const getImageUrl = () => {
      if (event?.images && event.images.length > 0) return event.images[0].url;
      return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop"; 
  };

  const getDateParts = (dateString) => {
      if (!dateString) return { month: '', day: '', fullDate: '', time: '' };
      const date = new Date(dateString);
      return {
          month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
          day: date.getDate(),
          fullDate: date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
  };

  // 4. Gestion de l'affichage (Loading / Error)
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner size={40} /></div>;
  if (!event) return <div className="h-screen flex items-center justify-center text-red-500">Événement introuvable</div>;

  // 5. Configuration Statut (Est-ce réservable ?)
  const statusConfig = getStatusConfig(event.status);
  const isBookable = statusConfig.canBook;
  const { month, day, fullDate, time } = getDateParts(event.startTime);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      
      {/* Bouton Retour */}
      <div className="mb-6">
        <Button variant="ghost" className="pl-0 gap-2 text-gray-500 hover:text-gray-900" onClick={() => navigate(-1)}>
            <ArrowLeft size={20}/> Retour aux événements
        </Button>
      </div>

      {/* En-tête : Date & Titre */}
      <div className="mb-8">
        <div className="flex items-start md:items-center gap-6 mb-4">
           <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-center min-w-[80px] hidden md:block">
              <span className="block text-xs font-bold tracking-wide">{month}</span>
              <span className="block text-3xl font-extrabold">{day}</span>
           </div>
           <div>
             <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{event.title}</h1>
                {/* Badge Catégorie */}
                <Badge variant="secondary" className="text-sm hidden sm:flex">
                    {event.category?.categoryType || 'Événement'}
                </Badge>
             </div>
             
             <div className="flex flex-wrap items-center gap-4 text-gray-500 font-medium">
                <div className="flex items-center gap-1.5">
                    <MapPin size={18} className="text-green-600"/>
                    <span>{event.venue ? `${event.venue.name}, ${event.venue.city}` : "Lieu à définir"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={18} className="text-green-600"/>
                    <span>{time}</span>
                </div>
                {/* Badge Statut (Visible sur mobile ou desktop) */}
                <Badge className={`${statusConfig.badgeColor} border-none`}>
                    {statusConfig.label}
                </Badge>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === COLONNE GAUCHE : Image & Description === */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl overflow-hidden shadow-md border bg-gray-100 h-[300px] md:h-[500px] relative">
             <img src={getImageUrl()} alt={event.title} className="w-full h-full object-cover" />
             
             {/* Overlay si annulé ou complet */}
             {!statusConfig.isVisiblePublic && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                     <span className="text-white text-3xl font-bold uppercase tracking-widest border-4 border-white p-4 rounded transform -rotate-12">
                         {statusConfig.label}
                     </span>
                 </div>
             )}
          </div>
          
          <div className="prose max-w-none">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">À propos</h3>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {event.description || "Aucune description fournie pour cet événement."}
            </div>
            
            {/* Artistes */}
            {event.artists && event.artists.length > 0 && (
                <div className="mt-8">
                    <h4 className="text-lg font-bold mb-3">Artistes invités</h4>
                    <div className="flex gap-3 flex-wrap">
                        {event.artists.map((artist, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                                <span>🎤</span>
                                <span>{artist.name}</span>
                                {artist.genre && <span className="text-gray-400 text-xs">({artist.genre})</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* === COLONNE DROITE : Sidebar Réservation === */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-2xl p-6 sticky top-24 shadow-lg space-y-6">
            
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-gray-900">Billetterie</h3>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-600"><Share2 size={20}/></Button>
            </div>

            {/* 1. ALERTE STATUT (Si réservation impossible) */}
            {!isBookable && (
                <Alert variant={event.status === 'CANCELLED' ? 'destructive' : 'default'} className={`border-l-4 ${statusConfig.badgeColor} bg-opacity-10`}>
                    <statusConfig.icon className="h-4 w-4" />
                    <AlertTitle className="ml-2 font-bold">{statusConfig.label}</AlertTitle>
                    <AlertDescription className="ml-2 text-xs mt-1">
                        {event.status === 'PUBLISHED' 
                            ? "La billetterie n'est pas encore ouverte. Revenez bientôt !" 
                            : event.status === 'SOLDOUT' 
                                ? "Victime de son succès, cet événement est complet." 
                                : "Les réservations sont fermées pour le moment."}
                    </AlertDescription>
                </Alert>
            )}

            {/* 2. COMPTE A REBOURS */}
            <div className="grid grid-cols-4 gap-2">
               {[
                   { label: 'Jours', val: timeLeft.days },
                   { label: 'Heures', val: timeLeft.hours },
                   { label: 'Mins', val: timeLeft.mins },
                   { label: 'Secs', val: timeLeft.secs }
               ].map((item, i) => (
                 <div key={i} className="bg-green-50/50 border border-green-100 p-2 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-900 leading-tight">{item.val}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-green-600">{item.label}</div>
                 </div>
               ))}
            </div>

            <Separator />

            {/* 3. INFOS PRATIQUES */}
            <div className="space-y-4">
               <div className="flex items-start gap-3">
                   <div className="bg-gray-100 p-2 rounded-full"><CalIcon size={18} className="text-gray-600"/></div>
                   <div>
                       <p className="font-semibold text-sm text-gray-900">Date et Heure</p>
                       <p className="text-sm text-gray-500">{fullDate} à {time}</p>
                   </div>
               </div>
               <div className="flex items-start gap-3">
                   <div className="bg-gray-100 p-2 rounded-full"><MapPin size={18} className="text-gray-600"/></div>
                   <div>
                       <p className="font-semibold text-sm text-gray-900">Localisation</p>
                       <p className="text-sm text-gray-500">{event.venue?.address || "Adresse non précisée"}</p>
                       <p className="text-sm text-gray-500">{event.venue?.city}</p>
                   </div>
               </div>
            </div>

            <Separator />

            {/* 4. SÉLECTEUR DE BILLETS (Conditionnel) */}
            {isBookable ? (
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">Choisir vos billets</label>
                    
                    {(!event.tickets || event.tickets.length === 0) ? (
                        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded text-center">Aucune catégorie de billet disponible.</p>
                    ) : (
                        <div className="space-y-3">
                            {event.tickets.map(ticket => (
                                <div key={ticket.id} className="space-y-2">
                                   <div className="flex justify-between items-center p-3 border rounded-lg hover:border-green-200 transition-colors bg-gray-50/50">
                                      <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                              <div className="font-bold text-gray-800">{ticket.name}</div>
                                              {/* Badge basé sur la quantité du ticket */}
                                              {ticket.quantity <= 0 ? (
                                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 border border-red-200">Épuisé</span>
                                              ) : ticket.quantity <= 10 ? (
                                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700 border border-orange-200">Plus que {ticket.quantity}</span>
                                              ) : (
                                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 border border-green-200">Disponible</span>
                                              )}
                                          </div>
                                          <div className="text-sm text-green-700 font-medium">{ticket.price} MAD</div>
                                          <div className="text-xs text-gray-400 mt-0.5">{ticket.quantity} restants</div>
                                      </div>
                                      <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-full border shadow-sm">
                                         <button 
                                             onClick={() => updateQuantity(ticket.id, -1)} 
                                             className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-30"
                                             disabled={!ticketQuantities[ticket.id]}
                                         >
                                             <Minus size={14}/>
                                         </button>
                                         <span className="w-4 text-center font-bold text-sm">{ticketQuantities[ticket.id] || 0}</span>
                                         <button 
                                             onClick={() => updateQuantity(ticket.id, 1)} 
                                             className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-30"
                                             disabled={(() => {
                                               const selectedQty = ticketQuantities[ticket.id] || 0;
                                               return ticket.quantity <= 0 || selectedQty >= ticket.quantity || selectedQty >= 10;
                                             })()}
                                         >
                                             <Plus size={14}/>
                                         </button>
                                      </div>
                                   </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total & Action */}
                    <div className="pt-4">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-gray-600 font-medium">Total à payer</span>
                           <span className="text-2xl font-extrabold text-gray-900">{calculateTotal().toFixed(2)} <span className="text-sm font-normal text-gray-500">MAD</span></span>
                        </div>

                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold shadow-lg shadow-green-100 transition-all hover:shadow-green-200"
                            disabled={calculateTotal() === 0 || reserving}
                            onClick={handleReservation}
                        >
                          {reserving ? 'Réservation en cours...' : 'Réserver maintenant'}
                        </Button>
                        <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                            <Shield size={10} /> Paiement 100% sécurisé
                        </p>
                    </div>
                </div>
            ) : (
                /* Bouton Désactivé si non réservable */
                <Button variant="outline" className="w-full py-6 text-gray-400 bg-gray-50 cursor-not-allowed border-dashed" disabled>
                    Réservation indisponible
                </Button>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;