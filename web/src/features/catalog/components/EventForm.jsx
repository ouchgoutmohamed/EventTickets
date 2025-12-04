import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { useToast } from "@/context/ToastContext"; // Utilisation de notre contexte Toast

// Import des services (Architecture propre)
import {
  createEvent,
  updateEvent,
} from "@/features/catalog/services/eventService";

const EventForm = ({
  onSuccess,
  onCancel,
  initialData = null,
  isEditing = false,
}) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    category: "MUSIC",
    status: "DRAFT",
    venue: { name: "", address: "", city: "", capacity: 0 },
  });

  const [ticketTypes, setTicketTypes] = useState([
    { name: "Standard", price: 0, quantity: 100 },
  ]);
  const [images, setImages] = useState([{ url: "" }]);
  const [artists, setArtists] = useState([
    { name: "", genre: "", country: "" },
  ]);

  // Initialisation des données si mode édition
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        date: initialData.date ? initialData.date.split("T")[0] : "",
        startTime: initialData.startTime
          ? initialData.startTime.split("T")[1]?.slice(0, 5)
          : "",
        endTime: initialData.endTime
          ? initialData.endTime.split("T")[1]?.slice(0, 5)
          : "",
        category: initialData.category || "MUSIC",
        status: initialData.status || "DRAFT",
        venue: initialData.venue || {
          name: "",
          address: "",
          city: "",
          capacity: 0,
        },
      });
      setTicketTypes(
        initialData.tickets?.length
          ? initialData.tickets
          : [{ name: "", price: 0, quantity: 0 }]
      );
      setImages(
        initialData.images?.length ? initialData.images : [{ url: "" }]
      );
      setArtists(
        initialData.artists?.length
          ? initialData.artists
          : [{ name: "", genre: "", country: "" }]
      );
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVenueChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      venue: { ...prev.venue, [field]: value },
    }));
  };

  // Gestion des tableaux dynamiques (Tickets, Images, Artistes)
  const updateArrayItem = (setter, index, field, value) => {
    setter((prev) => {
        const updated = [...prev];
      // Si field est null, on update l'item directement (cas des images string ou objet simple)
      if (field) updated[index][field] = value;
      else updated[index].url = value; // Cas spécifique images
        return updated;
    });
  };

  const addItem = (setter, template) => setter((prev) => [...prev, template]);
  const removeItem = (setter, index) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Formatage des Dates (ISO 8601)
      // Le backend attend souvent "YYYY-MM-DDTHH:mm:ss" pour LocalDateTime
      const formattedDate = formData.date ? `${formData.date}T00:00:00Z` : null;
      
      // Gestion sécurisée des heures (ajout des secondes :00 si absentes)
      const startDateTime = (formData.date && formData.startTime) 
        ? `${formData.date}T${formData.startTime.length === 5 ? formData.startTime + ':00' : formData.startTime}` 
        : null;
        
      const endDateTime = (formData.date && formData.endTime) 
        ? `${formData.date}T${formData.endTime.length === 5 ? formData.endTime + ':00' : formData.endTime}` 
        : null;

      // 2. Sécurité Catégorie (Correction de l'erreur 400)
      // Si la catégorie est vide ou undefined, on force une valeur valide de l'Enum Java
      const validCategory = (formData.category && formData.category.trim() !== "") 
        ? formData.category 
        : "MUSIC";

      // 3. Construction du Payload
      const payload = {
        title: formData.title,
        description: formData.description,
        date: formattedDate,
        startTime: startDateTime,
        endTime: endDateTime,
        status: formData.status || "DRAFT",
        
        category: validCategory, // ✅ Valeur sécurisée

        // Objet Venue
        venue: {
          name: formData.venue.name,
          address: formData.venue.address,
          city: formData.venue.city,
          capacity: parseInt(formData.venue.capacity) || 0 // Force un entier
        },

        // Liste Artistes
        artists: artists
          .filter(a => a.name.trim() !== "") // Ignore les vides
          .map(a => ({
            name: a.name,
            genre: a.genre,
            country: a.country
          })),

        // Liste TicketTypes (⚠️ Nom clé modifié pour matcher le Java : ticketTypes)
        ticketTypes: ticketTypes
          .filter(t => t.name.trim() !== "")
          .map(t => ({
            name: t.name,
            price: parseFloat(t.price) || 0, // Force un décimal
            quantity: parseInt(t.quantity) || 0 // Force un entier
          })),

        // Liste Images
        images: images
          .filter(img => img.url.trim() !== "")
          .map(img => ({
            url: img.url
          }))
      };

      console.log("📤 Payload envoyé :", payload); // Pour débugger si besoin

      // 4. Appel API
      let response;
      if (isEditing) {
        response = await updateEvent(initialData.id, payload);
        success("Événement modifié avec succès !");
      } else {
        response = await createEvent(payload);
        success("Événement créé avec succès !");
      }

      if (onSuccess) onSuccess(response);

    } catch (err) {
      console.error("❌ Erreur API :", err);
      // Extraction propre du message d'erreur du backend
      const errorMessage = err.response?.data?.message || err.message || "Une erreur est survenue.";
      showError(`Erreur : ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full bg-white shadow-lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Section Informations Générales */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 pb-3 text-lg font-semibold border-b">
            <div className="w-1 h-6 bg-green-600 rounded"></div>
            Informations Générales
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Titre de l'événement *
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Concert de Jazz"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                Description
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Date & Heure */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1 text-sm font-medium">Date *</label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
                </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Début *</label>
            <Input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Fin *</label>
            <Input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Catégorie & Lieu */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm font-medium">Catégorie</label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MUSIC">🎵 Musique</SelectItem>
                <SelectItem value="SPORTS">⚽ Sport</SelectItem>
                <SelectItem value="CONFERENCE">🎤 Conférence</SelectItem>
                <SelectItem value="THEATRE">🎭 Théâtre</SelectItem>
                <SelectItem value="FESTIVAL">🎪 Festival</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 space-y-3 border rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium">Localisation</h4>
            <Input
              placeholder="Nom de la salle (ex: Grand Théâtre)"
              value={formData.venue.name}
              onChange={(e) => handleVenueChange("name", e.target.value)}
              required
            />
            <div className="flex gap-2">
              <Input
                placeholder="Ville"
                value={formData.venue.city}
                onChange={(e) => handleVenueChange("city", e.target.value)}
                required
              />
              <Input
                placeholder="Capacité"
                type="number"
                value={formData.venue.capacity}
                onChange={(e) => handleVenueChange("capacity", e.target.value)}
                required
              />
            </div>
                      </div>
                  </div>

        {/* TABS : Billets / Images / Artistes */}
        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets">🎫 Billets</TabsTrigger>
            <TabsTrigger value="images">🖼️ Images</TabsTrigger>
            <TabsTrigger value="artists">🎤 Artistes</TabsTrigger>
          </TabsList>

          {/* Contenu TABS (Simplifié pour la lecture, logique identique à ton code) */}
          <TabsContent value="tickets" className="mt-4 space-y-3">
            {ticketTypes.map((t, i) => (
              <div key={i} className="flex items-end gap-2">
                  <Input 
                  placeholder="Nom (ex: Standard)"
                  value={t.name}
                  onChange={(e) =>
                    updateArrayItem(setTicketTypes, i, "name", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="Prix"
                  className="w-24"
                  value={t.price}
                  onChange={(e) =>
                    updateArrayItem(
                      setTicketTypes,
                      i,
                      "price",
                      parseFloat(e.target.value)
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder="Qté"
                  className="w-24"
                  value={t.quantity}
                  onChange={(e) =>
                    updateArrayItem(
                      setTicketTypes,
                      i,
                      "quantity",
                      parseInt(e.target.value)
                    )
                  }
                  />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeItem(setTicketTypes, i)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button
                                  type="button"
              variant="outline"
              onClick={() =>
                addItem(setTicketTypes, { name: "", price: 0, quantity: 0 })
              }
              className="w-full border-dashed"
                              >
              <Plus size={16} /> Ajouter un type de billet
            </Button>
          </TabsContent>

          <TabsContent value="images" className="mt-4 space-y-3">
            {images.map((img, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="URL de l'image (https://...)"
                  value={img.url}
                  onChange={(e) =>
                    updateArrayItem(setImages, i, null, e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeItem(setImages, i)}
                >
                  <Trash2 size={16} />
                </Button>
                        </div>
                    ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addItem(setImages, { url: "" })}
              className="w-full border-dashed"
            >
              <Plus size={16} /> Ajouter une image
            </Button>
          </TabsContent>

          <TabsContent value="artists" className="mt-4 space-y-3">
            {artists.map((a, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Nom de l'artiste"
                  value={a.name}
                  onChange={(e) =>
                    updateArrayItem(setArtists, i, "name", e.target.value)
                  }
                />
                <Input
                  placeholder="Genre"
                  value={a.genre}
                  onChange={(e) =>
                    updateArrayItem(setArtists, i, "genre", e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeItem(setArtists, i)}
                >
                  <Trash2 size={16} />
                </Button>
                        </div>
                    ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                addItem(setArtists, { name: "", genre: "", country: "" })
              }
              className="w-full border-dashed"
            >
              <Plus size={16} /> Ajouter un artiste
            </Button>
          </TabsContent>
        </Tabs>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="w-64">
            {" "}
            {/* Agrandir un peu le select */}
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                      <SelectItem value="DRAFT">📝 Brouillon</SelectItem>
                <SelectItem value="PUBLISHED">📅 Publié (Visible)</SelectItem>
                <SelectItem value="OPEN_FOR_BOOKING">
                  🎟️ Billetterie Ouverte
                </SelectItem>
                      <SelectItem value="SOLDOUT">❌ Complet</SelectItem>
                <SelectItem value="POSTPONED">⚠️ Reporté</SelectItem>
                      <SelectItem value="CANCELLED">🚫 Annulé</SelectItem>
                <SelectItem value="COMPLETED">🏁 Terminé</SelectItem>
                  </SelectContent>
              </Select>
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white gap-2 min-w-[140px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditing ? "Enregistrer" : "Créer l'événement"}
              </Button>
          </div>
      </div>
    </form>
    </Card>
  );
};

export default EventForm;
