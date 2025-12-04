import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Import de nos contextes custom
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext'; // Notre wrapper Sonner
import logo from '@/assets/logo-dark.png'; 

// Schéma de validation
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const LoginPage = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });


  const onSubmit = async (data) => {
    try {
      // 1. Appel API
      const response = await login(data.email, data.password);
      
      // 2. Vérification du succès
      if (response.success) {
        success("Connexion réussie !");
        
        // 3. Extraction et Normalisation du Rôle
        // Le JSON montre : response.data.user.role.nom = "administrateur"
        const user = response.data.user;
        const rawRole = user.role?.nom || ""; 
        
        // On met en MAJUSCULES pour éviter les erreurs (ex: "Administrateur" vs "administrateur")
        const role = rawRole.toUpperCase().trim();

        console.log("Rôle détecté :", role); // Pour vérifier dans la console F12

        // 4. Redirection selon le rôle
        if (['ADMINISTRATEUR', 'ADMIN'].includes(role)) {
          // -> Vers le Dashboard Admin
          navigate('/admin/dashboard'); 
        } 
        else if (['ORGANISATEUR', 'ORGANIZER', 'ORGANIZATOR'].includes(role)) {
          // -> Vers le Dashboard Organisateur
          navigate('/organizer/dashboard');
        } 
        else {
          // -> Vers l'Accueil Public (Client)
          navigate('/');
        }
        
      } else {
        error(response.message || "Email ou mot de passe incorrect");
      }
    } catch (err) {
      console.error("Erreur login:", err);
      error("Une erreur inattendue est survenue");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-green-600">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img src={logo} alt="Eventify" className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Connexion</CardTitle>
          <CardDescription>
            Entrez vos identifiants pour accéder à votre compte
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nom@exemple.com" 
                  className="pl-10 focus-visible:ring-green-600"
                  {...register('email')} 
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link to="/forgot-password" className="text-xs text-green-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 focus-visible:ring-green-600"
                  {...register('password')} 
                />
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-green-600 font-medium hover:underline">
              S'inscrire
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;