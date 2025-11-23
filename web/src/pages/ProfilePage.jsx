import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Lock, User, Loader2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import userService from '@/features/auth/services/userService';

// === SCHÉMAS DE VALIDATION (Zod) ===
const profileSchema = z.object({
  prenom: z.string().min(2, "Le prénom est trop court"),
  nom: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit faire 6 caractères min."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { success, error: showError } = useToast();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // --- FORMULAIRE PROFIL ---
  const formProfile = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { prenom: '', nom: '', email: '' }
  });

  // Remplir le formulaire quand l'user est chargé
  useEffect(() => {
    if (user) {
      formProfile.reset({
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
      });
    }
  }, [user, formProfile]);

  const onProfileSubmit = async (data) => {
    setLoadingProfile(true);
    try {
      const response = await userService.updateProfile(data);
      if (response.success) {
        updateUser(response.data); // Met à jour le contexte et le localStorage
        success("Profil mis à jour avec succès !");
      }
    } catch (err) {
      showError("Erreur lors de la mise à jour du profil.");
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- FORMULAIRE MOT DE PASSE ---
  const formPassword = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data) => {
    setLoadingPassword(true);
    try {
      await userService.changePassword(data.oldPassword, data.newPassword);
      success("Mot de passe modifié avec succès !");
      formPassword.reset(); // Vider les champs
    } catch (err) {
      showError(err.response?.data?.message || "Erreur lors du changement de mot de passe.");
    } finally {
      setLoadingPassword(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8">
      
      {/* HEADER DE LA PAGE */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-20 w-20 border-2 border-green-100">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback className="text-2xl bg-green-100 text-green-700">
            {user.nom?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{user.prenom} {user.nom}</h1>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="outline" className="text-green-600 border-green-200">
                {user.role?.nom || 'Utilisateur'}
             </Badge>
             <span className="text-sm text-gray-500">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* === CARTE 1 : INFOS PERSO === */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500"/> Informations personnelles
            </CardTitle>
            <CardDescription>Mettez à jour vos informations d'identité.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={formProfile.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input {...formProfile.register('prenom')} />
                  {formProfile.formState.errors.prenom && <p className="text-xs text-red-500">{formProfile.formState.errors.prenom.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input {...formProfile.register('nom')} />
                  {formProfile.formState.errors.nom && <p className="text-xs text-red-500">{formProfile.formState.errors.nom.message}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...formProfile.register('email')} disabled className="bg-gray-50 opacity-70 cursor-not-allowed" title="Contactez le support pour changer l'email"/>
                <p className="text-xs text-gray-400">L'email ne peut pas être modifié directement.</p>
              </div>

              <div className="flex justify-end">
                 <Button type="submit" disabled={loadingProfile} className="bg-green-600 hover:bg-green-700">
                    {loadingProfile ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
                    Enregistrer
                 </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* === CARTE 2 : SÉCURITÉ === */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-gray-500"/> Sécurité
            </CardTitle>
            <CardDescription>Modifiez votre mot de passe.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={formPassword.handleSubmit(onPasswordSubmit)} className="space-y-4">
               <div className="space-y-2">
                  <Label>Mot de passe actuel</Label>
                  <Input type="password" {...formPassword.register('oldPassword')} />
                  {formPassword.formState.errors.oldPassword && <p className="text-xs text-red-500">{formPassword.formState.errors.oldPassword.message}</p>}
               </div>

               <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input type="password" {...formPassword.register('newPassword')} />
                  {formPassword.formState.errors.newPassword && <p className="text-xs text-red-500">{formPassword.formState.errors.newPassword.message}</p>}
               </div>

               <div className="space-y-2">
                  <Label>Confirmer le mot de passe</Label>
                  <Input type="password" {...formPassword.register('confirmPassword')} />
                  {formPassword.formState.errors.confirmPassword && <p className="text-xs text-red-500">{formPassword.formState.errors.confirmPassword.message}</p>}
               </div>

               <div className="flex justify-end">
                 <Button type="submit" variant="outline" disabled={loadingPassword}>
                    {loadingPassword ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : "Changer le mot de passe"}
                 </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default ProfilePage;