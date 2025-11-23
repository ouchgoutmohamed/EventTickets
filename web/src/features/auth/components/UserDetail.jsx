import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Calendar, Mail, MapPin, Phone, History, Monitor, Globe } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import userService from '@/features/auth/services/userService';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginHistory, setLoginHistory] = useState([]);

  useEffect(() => {
    // Sécurité : Seul l'admin ou l'utilisateur lui-même peut voir ces détails
    const isAdmin = currentUser?.role?.nom?.toUpperCase().includes('ADMIN');
    const isOwner = currentUser?.id === parseInt(id);

    if (!currentUser || (!isAdmin && !isOwner)) {
      showError('Accès non autorisé');
      navigate('/');
      return;
    }

    fetchData();
  }, [id, currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Récupérer les infos user
      const userResponse = await userService.getUserById(id);
      // Adaptation robuste selon la structure de ton API
      const userData = userResponse.data?.user || userResponse.data || userResponse;
      setUser(userData);

      // 2. Récupérer l'historique (Admin seulement)
      if (currentUser?.role?.nom?.toUpperCase().includes('ADMIN')) {
         try {
            const historyResponse = await userService.getLoginHistory(id);
            
            // 🛡️ PROTECTION : On s'assure que c'est bien un tableau
            let historyData = historyResponse.data?.history || historyResponse.data || [];
            
            if (!Array.isArray(historyData)) {
                console.warn("Format historique invalide reçu, fallback sur tableau vide.");
                historyData = [];
            }
            setLoginHistory(historyData);

         } catch (e) {
            console.warn("Historique non disponible ou erreur API", e);
            setLoginHistory([]); // En cas d'erreur, tableau vide pour éviter le crash
         }
      }
    } catch (err) {
      console.error(err);
      showError("Impossible de charger l'utilisateur");
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Chargement des informations...</div>;
  if (!user) return <div className="p-10 text-center text-red-500">Utilisateur introuvable</div>;

  const isAdmin = currentUser?.role?.nom?.toUpperCase().includes('ADMIN');

  // Helpers UI pour les badges
  const getStatusBadge = (status) => {
    switch (status) {
        case 'actif': return <Badge className="bg-green-600">Actif</Badge>;
        case 'suspendu': return <Badge variant="destructive">Suspendu</Badge>;
        case 'inactif': return <Badge variant="secondary">Inactif</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Détails Utilisateur</h1>
            <p className="text-sm text-muted-foreground">ID: #{user.id}</p>
        </div>
        <div className="ml-auto">
            {getStatusBadge(user.etat)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* === COLONNE GAUCHE : Info Principales === */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600"/> Informations Personnelles
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Nom complet</label>
                        <p className="text-lg font-medium">{user.prenom} {user.nom}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{user.email}</span>
                            {user.emailVerifie && <Badge variant="outline" className="text-green-600 border-green-200 text-[10px] h-5">Vérifié</Badge>}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Rôle</label>
                        <p className="capitalize flex items-center gap-2">
                            <Badge variant="secondary">{user.role?.nom || 'N/A'}</Badge>
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Date d'inscription</label>
                        <p className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {user.dateCreation ? new Date(user.dateCreation).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>

                <Separator />

                {/* Section Profil (Adresse, Tel...) si dispo */}
                <div>
                    <h4 className="font-semibold mb-4">Coordonnées</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400"/> 
                            {user.profil?.telephone || "Non renseigné"}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400"/> 
                            {user.profil?.ville ? `${user.profil.ville}, ${user.profil.pays}` : "Non renseigné"}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* === COLONNE DROITE : Historique (Admin Only) === */}
        {isAdmin && (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <History className="h-4 w-4"/> Dernières connexions
                        </CardTitle>
                        <CardDescription>5 dernières activités</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-xs">IP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* 🛡️ PROTECTION JSX : On vérifie Array.isArray AVANT de map/slice */}
                                {!Array.isArray(loginHistory) || loginHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-4">
                                            Aucun historique disponible
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    loginHistory.slice(0, 5).map((log, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="text-xs font-medium">
                                                {new Date(log.dateConnexion).toLocaleDateString()} <br/>
                                                <span className="text-gray-400 font-normal">
                                                    {new Date(log.dateConnexion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex items-center gap-1" title={log.navigateur}>
                                                    <Globe className="h-3 w-3 text-gray-400"/> {log.ipAddress || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-400 mt-1" title={log.systemeExploitation}>
                                                    <Monitor className="h-3 w-3"/> {log.systemeExploitation || 'System'}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;