import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import EventForm from '../features/catalog/components/EventForm';
import { getEventById } from '../features/catalog/services/eventService';
import { useToast } from "@/context/ToastContext";

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const data = await getEventById(id);
        setEventData(data);
      } catch (err) {
        console.error(err);
        showError("Impossible de charger l'événement à modifier.");
        navigate('/organizer/my-events');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id, navigate, showError]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Spinner size={40} /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header avec bouton retour */}
      <div className="mb-6 flex items-center gap-4">
         <Button variant="ghost" size="icon" onClick={() => navigate('/organizer/my-events')}>
            <ArrowLeft size={20} />
         </Button>
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifier l'événement</h1>
            <p className="text-sm text-gray-500">Mettez à jour les informations de votre événement.</p>
         </div>
      </div>

      {/* Réutilisation du formulaire en mode édition */}
      {eventData && (
        <EventForm 
            initialData={eventData} 
            isEditing={true} 
            onSuccess={() => navigate('/organizer/my-events')}
            onCancel={() => navigate('/organizer/my-events')}
        />
      )}
    </div>
  );
};

export default EditEventPage;