"use client"

import { useState } from "react"
import Header from "../components/project/header"
import EventsGrid from "@/components/EventGrid"


export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
            Découvrez les événements qui vous passionnent
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explorez une large sélection d'événements culturels, sportifs et professionnels près de chez vous.
          </p>
        </div>
        <EventsGrid />
      </div>
    </main>
  )
}
