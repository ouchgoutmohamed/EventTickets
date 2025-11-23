"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Edit2, Trash2, X, Search } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EventForm } from "./event-form"
import {
  getMyEvents,
  deleteEvent,
  updateEventStatus,
  getEventsByCategory,
  getEventsByStatus,
  searchEvents,
  getEventsBetweenDates,
} from "@/api/eventService"

export const CategoryType = {
  MUSIC: "MUSIC",
  SPORTS: "SPORTS",
  CONFERENCE: "CONFERENCE",
  THEATRE: "THEATRE",
  FESTIVAL: "FESTIVAL",
  OTHER: "OTHER",
}

export const EventStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CANCELLED: "CANCELLED",
}

export default function EventList() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [editingEvent, setEditingEvent] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await getMyEvents()
      setEvents(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return
    try {
      await deleteEvent(selectedEvent.id)
      setEvents(events.filter((e) => e.id !== selectedEvent.id))
      setSelectedEvent(null)
    } catch (error) {
      console.error(error)
      alert("Erreur lors de la suppression")
    }
  }

  const handleStatusChange = async (event, status) => {
    try {
      const updated = await updateEventStatus(event.id, status)
      setEvents(events.map((e) => (e.id === updated.id ? updated : e)))
    } catch (error) {
      console.error(error)
    }
  }

  const handleSearch = async () => {
    if (!searchKeyword) return fetchEvents()
    const results = await searchEvents(searchKeyword)
    setEvents(results)
  }

  const handleEditClick = (event) => {
    setEditingEvent(event)
    setShowEditModal(true)
  }

  const handleEditSuccess = (updatedEvent) => {
    setEvents(events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)))
    setShowEditModal(false)
    setEditingEvent(null)
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingEvent(null)
  }

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: "secondary",
      PUBLISHED: "default",
      CANCELLED: "destructive",
    }
    const labels = {
      DRAFT: "📝 Brouillon",
      PUBLISHED: "✅ Publié",
      CANCELLED: "❌ Annulé",
    }
    return <Badge variant={variants[status]}>{labels[status] || status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement des événements...</p>
      </div>
    )
  }

  if (!events.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="mb-4 text-lg font-medium text-foreground">Aucun événement trouvé</p>
        <p className="text-sm text-muted-foreground mb-6">Commencez par créer votre premier événement</p>
        <Button onClick={fetchEvents}>Actualiser</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un événement..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="gap-2"
                prefix={<Search className="h-4 w-4" />}
              />
            </div>
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" /> Rechercher
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={filterCategory}
              onValueChange={async (value) => {
                setFilterCategory(value)
                if (value === "ALL") return fetchEvents()
                const results = await getEventsByCategory(value)
                setEvents(results)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes catégories</SelectItem>
                {Object.values(CategoryType).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={async (value) => {
                setFilterStatus(value)
                if (value === "ALL") return fetchEvents()
                const results = await getEventsByStatus(value)
                setEvents(results)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous statuts</SelectItem>
                {Object.values(EventStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Date début"
              value={dateRange.start}
              onChange={async (e) => {
                const start = e.target.value
                setDateRange((prev) => ({ ...prev, start }))
                if (!start || !dateRange.end) return
                const results = await getEventsBetweenDates(start, dateRange.end)
                setEvents(results)
              }}
            />
            <Input
              type="date"
              placeholder="Date fin"
              value={dateRange.end}
              onChange={async (e) => {
                const end = e.target.value
                setDateRange((prev) => ({ ...prev, end }))
                if (!dateRange.start || !end) return
                const results = await getEventsBetweenDates(dateRange.start, end)
                setEvents(results)
              }}
            />
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Titre</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Lieu</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(event.date).toLocaleDateString("fr-FR")}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{event.venue?.name || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{event.category?.categoryType || "N/A"}</span>
                </TableCell>
                <TableCell>{getStatusBadge(event.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(event)} className="gap-2">
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer l'événement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer "{event.title}" ? Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Select value={event.status} onValueChange={(status) => handleStatusChange(event, status)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(EventStatus).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showEditModal && editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background p-6">
              <h2 className="text-2xl font-bold">Modifier l'événement</h2>
              <Button variant="ghost" size="sm" onClick={handleEditCancel}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <EventForm
                initialData={editingEvent}
                isEditing={true}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
