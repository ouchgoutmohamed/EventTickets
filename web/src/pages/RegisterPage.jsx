import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, User, Mail, Lock } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import logo from '@/assets/logo-dark.png'; 

// Schéma plus complet pour l'inscription
const registerSchema = z.object({
  prenom: z.string().min(2, "Le prénom est trop court"),
  nom: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
  password: z.string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Le mot de passe doit contenir au moins un caractère spécial"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const RegisterPage = () => {
  const { register: registerUser } = useAuth(); // Renommé pour éviter conflit avec useForm
  const { success, error } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    // Préparation de l'objet pour le backend
    const userData = {
      prenom: data.prenom,
      nom: data.nom,
      email: data.email,
      password: data.password,
      roleNom: 'client' // Le backend attend roleNom comme string
    };

    try {
      const response = await registerUser(userData);
      
      if (response.success) {
        success("Compte créé avec succès ! Veuillez vous connecter.");
        navigate('/login');
      } else {
        error(response.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      error("Impossible de joindre le serveur");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-green-600">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src={logo} alt="Eventify" className="h-10 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>Rejoignez Eventify pour découvrir des événements</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Nom & Prénom Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" placeholder="John" {...register('prenom')} />
                {errors.prenom && <p className="text-xs text-red-500">{errors.prenom.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" placeholder="Doe" {...register('nom')} />
                {errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@exemple.com" 
                    className="pl-10"
                    {...register('email')} 
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                    id="password" 
                    type="password" 
                    className="pl-10"
                    {...register('password')} 
                />
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input 
                  id="confirmPassword" 
                  type="password" 
                  {...register('confirmPassword')} 
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "S'inscrire"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{" "}
            <Link to="/login" className="text-green-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;