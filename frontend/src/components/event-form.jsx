"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2 } from "lucide-react"
import axiosInstance from "@/api/axiosConfig"

const EventForm = ({ onSuccess, onCancel, initialData = null, isEditing = false }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    category: "MUSIC",
    status: "DRAFT",
    venue: { name: "", address: "", city: "", capacity: 0 },
  })

  const [ticketTypes, setTicketTypes] = useState([{ name: "", price: 0, quantity: 0 }])
  const [images, setImages] = useState([{ url: "" }])
  const [artists, setArtists] = useState([{ name: "", genre: "", country: "" }])

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        date: initialData.date.split("T")[0],
        startTime: initialData.startTime.split("T")[1].slice(0, 5),
        endTime: initialData.endTime.split("T")[1].slice(0, 5),
        category: initialData.category?.categoryType || "MUSIC",
        status: initialData.status,
        venue: initialData.venue || { name: "", address: "", city: "", capacity: 0 },
      })
      setTicketTypes(initialData.tickets?.length ? initialData.tickets : [{ name: "", price: 0, quantity: 0 }])
      setImages(initialData.images?.length ? initialData.images : [{ url: "" }])
      setArtists(initialData.artists?.length ? initialData.artists : [{ name: "", genre: "", country: "" }])
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVenueChange = (field, value) => {
    setFormData((prev) => ({ ...prev, venue: { ...prev.venue, [field]: value } }))
  }

  const handleStatusChange = (value) => setFormData((prev) => ({ ...prev, status: value }))
  const handleCategoryChange = (value) => setFormData((prev) => ({ ...prev, category: value }))

  const handleTicketChange = (index, field, value) => {
    setTicketTypes((prev) => {
      const updated = [...prev]
      updated[index][field] = field === "price" || field === "quantity" ? Number(value) : value
      return updated
    })
  }
  const addTicket = () => setTicketTypes((prev) => [...prev, { name: "", price: 0, quantity: 0 }])
  const removeTicket = (index) => setTicketTypes((prev) => prev.filter((_, i) => i !== index))

  const handleImageChange = (index, value) => {
    setImages((prev) => {
      const updated = [...prev]
      updated[index].url = value
      return updated
    })
  }
  const addImage = () => setImages((prev) => [...prev, { url: "" }])
  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index))

  const handleArtistChange = (index, field, value) => {
    setArtists((prev) => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }
  const addArtist = () => setArtists((prev) => [...prev, { name: "", genre: "", country: "" }])
  const removeArtist = (index) => setArtists((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = `${formData.date}T${formData.startTime}:00`
      const endDateTime = `${formData.date}T${formData.endTime}:00`

      const payload = {
        ...formData,
        startTime: startDateTime,
        endTime: endDateTime,
        tickets: ticketTypes,
        images,
        artists,
      }

      const endpoint = isEditing ? `/update/${initialData.id}` : "/create"
      const response = await axiosInstance.post(endpoint, payload)
      onSuccess(response.data)
    } catch (error) {
      console.error(error.response?.data || error.message)
      alert("Erreur : " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Titre de l'événement *</label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Concert de Jazz"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez votre événement..."
              rows={4}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-medium">Date *</label>
            <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div>
            <label className="text-sm font-medium">Heure de début *</label>
            <Input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
          </div>
          <div>
            <label className="text-sm font-medium">Heure de fin *</label>
            <Input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
          </div>
          <div>
            <label className="text-sm font-medium">Catégorie *</label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MUSIC">🎵 Musique</SelectItem>
                <SelectItem value="SPORTS">⚽ Sport</SelectItem>
                <SelectItem value="CONFERENCE">🎤 Conférence</SelectItem>
                <SelectItem value="THEATRE">🎭 Théâtre</SelectItem>
                <SelectItem value="FESTIVAL">🎪 Festival</SelectItem>
                <SelectItem value="OTHER">📍 Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 rounded-lg bg-accent/50 p-4">
          <h3 className="font-semibold">Lieu</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              placeholder="Nom du lieu *"
              value={formData.venue.name}
              onChange={(e) => handleVenueChange("name", e.target.value)}
              required
            />
            <Input
              placeholder="Adresse *"
              value={formData.venue.address}
              onChange={(e) => handleVenueChange("address", e.target.value)}
              required
            />
            <Input
              placeholder="Ville *"
              value={formData.venue.city}
              onChange={(e) => handleVenueChange("city", e.target.value)}
              required
            />
            <Input
              type="number"
              placeholder="Capacité *"
              value={formData.venue.capacity}
              onChange={(e) => handleVenueChange("capacity", e.target.value)}
              required
            />
          </div>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets">Billets</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="artists">Artistes</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            {ticketTypes.map((t, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-end">
                <Input
                  placeholder="Nom du billet"
                  value={t.name}
                  onChange={(e) => handleTicketChange(i, "name", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Prix"
                  value={t.price}
                  onChange={(e) => handleTicketChange(i, "price", e.target.value)}
                  className="sm:w-32"
                />
                <Input
                  type="number"
                  placeholder="Quantité"
                  value={t.quantity}
                  onChange={(e) => handleTicketChange(i, "quantity", e.target.value)}
                  className="sm:w-32"
                />
                <Button type="button" variant="destructive" size="sm" onClick={() => removeTicket(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addTicket} className="w-full gap-2 bg-transparent">
              <Plus className="h-4 w-4" /> Ajouter un billet
            </Button>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            {images.map((img, i) => (
              <div key={i} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Input
                  placeholder="URL de l'image"
                  value={img.url}
                  onChange={(e) => handleImageChange(i, e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="destructive" size="sm" onClick={() => removeImage(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addImage} className="w-full gap-2 bg-transparent">
              <Plus className="h-4 w-4" /> Ajouter une image
            </Button>
          </TabsContent>

          <TabsContent value="artists" className="space-y-4">
            {artists.map((a, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-end">
                <Input
                  placeholder="Nom"
                  value={a.name}
                  onChange={(e) => handleArtistChange(i, "name", e.target.value)}
                />
                <Input
                  placeholder="Genre"
                  value={a.genre}
                  onChange={(e) => handleArtistChange(i, "genre", e.target.value)}
                />
                <Input
                  placeholder="Pays"
                  value={a.country}
                  onChange={(e) => handleArtistChange(i, "country", e.target.value)}
                />
                <Button type="button" variant="destructive" size="sm" onClick={() => removeArtist(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addArtist} className="w-full gap-2 bg-transparent">
              <Plus className="h-4 w-4" /> Ajouter un artiste
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">Statut</label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">📝 Brouillon</SelectItem>
                <SelectItem value="PUBLISHED">✅ Publié</SelectItem>
                <SelectItem value="CANCELLED">❌ Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? "Envoi..." : isEditing ? "📝 Modifier" : "✨ Créer"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}

export { EventForm }
