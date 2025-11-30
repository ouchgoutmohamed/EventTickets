import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Lock, Phone, MapPin, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/context/ToastContext";
import userService from '@/features/auth/services/userService';

const CreateOrganizerPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmPassword: '',
    telephone: '',
    ville: '',
    pays: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nom || !formData.prenom || !formData.email || !formData.motDePasse) {
      showError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.motDePasse !== formData.confirmPassword) {
      showError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.motDePasse.length < 6) {
      showError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);

    try {
      // Préparer les données (sans confirmPassword)
      const { confirmPassword, ...organizerData } = formData;
      
      await userService.createOrganizer(organizerData);
      
      success("Le compte organisateur a été créé avec succès");
      
      // Rediriger vers la liste des utilisateurs
      navigate('/admin/users');
    } catch (error) {
      console.error('Erreur lors de la création de l\'organisateur:', error);
      showError(error.response?.data?.message || "Une erreur est survenue lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Créer un Organisateur</h1>
          <p className="text-sm text-gray-500">Ajoutez un nouveau compte organisateur au système</p>
        </div>
      </div>

      <Card className="shadow-lg bg-white">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Informations du compte</CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouveau compte organisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations personnelles</h3>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <div className="relative">
                    <User className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                    <Input
                      id="nom"
                      name="nom"
                      type="text"
                      placeholder="Doe"
                      value={formData.nom}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <div className="relative">
                    <User className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                    <Input
                      id="prenom"
                      name="prenom"
                      type="text"
                      placeholder="John"
                      value={formData.prenom}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sécurité</h3>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="motDePasse">Mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                    <Input
                      id="motDePasse"
                      name="motDePasse"
                      type="password"
                      placeholder="••••••••"
                      value={formData.motDePasse}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Coordonnées</h3>
              
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                  <Input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={formData.telephone}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ville">Ville</Label>
                  <div className="relative">
                    <MapPin className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                    <Input
                      id="ville"
                      name="ville"
                      type="text"
                      placeholder="Paris"
                      value={formData.ville}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pays">Pays</Label>
                  <div className="relative">
                    <Globe className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                    <Input
                      id="pays"
                      name="pays"
                      type="text"
                      placeholder="France"
                      value={formData.pays}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
                className="flex-1"
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? 'Création en cours...' : 'Créer le compte'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateOrganizerPage;
