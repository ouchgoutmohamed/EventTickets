"use client"

import { Link } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export default function Header({ isLoggedIn, setIsLoggedIn }) {
  const [logoError, setLogoError] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          {!logoError ? (
            <img
              src="/logo-dark.png"
              alt="Logo"
              className="h-8 w-auto"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">

              {/* Avatar */}
              <Avatar>
                <AvatarImage src="/user.png" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>

              {/* Logout */}
              <Button
                variant="ghost"
                onClick={() => setIsLoggedIn(false)}
              >
                Se déconnecter
              </Button>

            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button asChild>
                <Link to="/register">S'inscrire</Link>
              </Button>

              <Button variant="outline" asChild>
                <Link to="/login">Se connecter</Link>
              </Button>
            </div>
          )}
        </nav>

      </div>
    </header>
  )
}
