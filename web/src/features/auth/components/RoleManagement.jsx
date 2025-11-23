import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/context/ToastContext";
import roleService from '../services/roleService';
import { Spinner } from "@/components/ui/spinner";

const RoleManagement = () => {
  const { success, error: showError } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ nom: '', description: '' });

  useEffect(() => {
    fetchRoles();
  }, []);

const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleService.getAllRoles();
      console.log("Rôles chargés :", response);const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleService.getAllRoles();
      console.log("Rôles chargés :", response);

      // 👇 CORRECTION ICI : on accède à response.data.roles
      if (response.data && response.data.roles) {
          setRoles(response.data.roles);
      } else {
          setRoles([]);
      }
      
    } catch (err) {
      showError('Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  };
      if (response.data && response.data.roles) {
          setRoles(response.data.roles);
      } else {
          setRoles([]);
      }
      
    } catch (err) {
      showError('Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role = null) => {
    setEditingRole(role);
    setFormData(role ? { nom: role.nom, description: role.description } : { nom: '', description: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, formData);
        success("Rôle mis à jour");
      } else {
        await roleService.createRole(formData);
        success("Rôle créé");
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      showError("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rôle ?")) return;
    try {
      await roleService.deleteRole(id);
      success("Rôle supprimé");
      fetchRoles();
    } catch (err) {
      showError("Impossible de supprimer");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Rôles</h1>
        <Button onClick={() => handleOpenModal()} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Nouveau Rôle
        </Button>
      </div>

     <Card>
        <CardHeader>
            <CardTitle>Liste des rôles</CardTitle>
        </CardHeader>
        <CardContent>
            {/* 2. Utilisation du Spinner */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Spinner className="h-8 w-8 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Récupération des rôles...</p>
                </div>
            ) : (
            <Table>
                <TableHeader className="bg-slate-900 text-white">
                    <TableRow >
                        <TableHead>Nom</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.map(role => (
                        <TableRow key={role.id}>
                            <TableCell className="font-medium">{role.nom}</TableCell>
                            <TableCell>{role.description}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(role)}>
                                    <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)}>
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
       )}
        </CardContent>
      </Card>

      {/* Dialog (Modal) Shadcn */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white max-w-lg">
            <DialogHeader>
                <DialogTitle>{editingRole ? 'Modifier le rôle' : 'Créer un rôle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Nom</label>
                    <Input 
                        value={formData.nom} 
                        onChange={(e) => setFormData({...formData, nom: e.target.value})} 
                        required 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                    <Button type="submit" className="bg-blue-600">Enregistrer</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;