import { useEffect, useState } from "react"
import { getAllEvents } from "@/api/eventService"
import EventCard from "./EventCard"

export default function EventsGrid() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await getAllEvents()
        setEvents(data)
      } catch (error) {
        console.error("Erreur lors du chargement des événements :", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading)
    return <div className="py-20 text-center text-muted-foreground">Chargement des événements...</div>

  if (events.length === 0)
    return <p className="text-center text-muted-foreground py-10">Aucun événement disponible pour le moment.</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
          title={event.title}
          date={event.date}
          image={event.images?.[0]?.url}
          category={event.category?.nom}
          location={event.venueId} 
        />
      ))}
    </div>
  )
}