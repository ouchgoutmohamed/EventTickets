import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventForm from '../features/catalog/components/EventForm';

const CreateEventPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Rediriger vers la liste après création
    navigate('/organizer/my-events');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
         <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
         </Button>
         <div>
           <h1 className="text-2xl font-bold tracking-tight">Nouvel événement</h1>
           <p className="text-sm text-gray-500">Créez et publiez un nouvel événement</p>
         </div>
      </div>
      <EventForm onSuccess={handleSuccess} onCancel={() => navigate(-1)} />
    </div>
  );
};

export default CreateEventPage;