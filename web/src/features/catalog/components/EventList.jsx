import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Calendar, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { getStatusConfig } from "../../../utils/statusHelpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/context/ToastContext";
import { getMyEvents, deleteEvent } from "../services/eventService";

const EventList = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // État pour gérer la suppression (stocke l'ID à supprimer)
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getMyEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  // Fonction appelée quand on clique sur "Confirmer" dans la modale
  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEvent(eventToDelete);
      success("Événement supprimé avec succès");
      setEvents(events.filter((e) => e.id !== eventToDelete));
    } catch (err) {
      showError("Impossible de supprimer l'événement");
    } finally {
      setEventToDelete(null); // Fermer la modale
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la liste */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Événements</h2>
          <p className="text-gray-500">
            Gérez vos concerts, ateliers et conférences.
          </p>
        </div>
        <Button
          onClick={() => navigate("/organizer/create-event")}
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          <Plus size={18} /> Créer un événement
        </Button>
      </div>

      {/* Liste vide */}
      {events.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed rounded-xl">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Aucun événement</h3>
          <p className="text-gray-500 mb-6">
            Commencez par créer votre premier événement.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/organizer/create-event")}
          >
            Créer maintenant
          </Button>
        </div>
      ) : (
        /* Tableau des événements */
        <div className="border rounded-lg bg-white overflow-hidden shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-600 hover:to-green-700">
                <TableHead className="w-[300px] text-white font-semibold">Événement</TableHead>
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white font-semibold">Lieu</TableHead>
                <TableHead className="text-white font-semibold">Statut</TableHead>
                <TableHead className="text-right text-white font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const eventImage = event.images && event.images.length > 0 && event.images[0].url 
                  ? event.images[0].url 
                  : null;
                return (
                <TableRow key={event.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {eventImage && (
                        <img
                          src={eventImage}
                          alt=""
                          className="h-10 w-10 rounded object-cover bg-gray-100"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {event.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.category?.categoryType || 'Événement'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(event.date).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {event.startTime?.slice(0, 5)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin size={14} /> {event.venue?.city || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const {
                        label,
                        color,
                        icon: Icon,
                      } = getStatusConfig(event.status);
                      return (
                        <Badge
                          className={`${color} hover:${color} flex w-fit items-center gap-1`}
                        >
                          <Icon size={12} /> {label}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(`/organizer/edit-event/${event.id}`)
                        }
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit size={16} />
                      </Button>

                      {/* Bouton Supprimer qui déclenche la modale */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEventToDelete(event.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
      )}
      <AlertDialog
        open={!!eventToDelete}
        onOpenChange={() => setEventToDelete(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera
              définitivement cet événement et toutes les données associées
              (tickets, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventList;
