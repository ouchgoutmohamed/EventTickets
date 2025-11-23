"use client"

import { useState } from "react"
import { EventForm } from "@/components/event-form"
import EventList from "@/components/event-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"

export default function Events() {
  const [events, setEvents] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isCreating, setIsCreating] = useState(false)

  const handleEventCreated = (newEvent) => {
    setEvents([...events, newEvent])
    setIsCreating(false)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Mes Événements</h1>
              <p className="mt-2 text-muted-foreground">Créez, gérez et suivez vos événements en temps réel</p>
            </div>
            <Button onClick={() => setIsCreating(true)} className="gap-2 whitespace-nowrap" size="lg">
              <Plus className="h-5 w-5" />
              Nouvel Événement
            </Button>
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="border-b border-border bg-muted/50 p-4 sm:p-8">
          <div className="mx-auto max-w-7xl">
            <Card className="p-6">
              <h2 className="mb-6 text-2xl font-bold">✨ Créer un nouvel événement</h2>
              <EventForm onSuccess={handleEventCreated} onCancel={() => setIsCreating(false)} />
            </Card>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EventList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}
