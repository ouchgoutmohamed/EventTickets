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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
         <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
         </Button>
         <h1 className="text-2xl font-bold">Nouvel événement</h1>
      </div>
      <EventForm onSuccess={handleSuccess} onCancel={() => navigate(-1)} />
    </div>
  );
};

export default CreateEventPage;