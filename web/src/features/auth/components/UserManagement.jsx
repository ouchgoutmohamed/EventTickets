import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/context/ToastContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import userService from "../services/userService";
import { Spinner } from "@/components/ui/spinner"; 

const UserManagement = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", etat: "" });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers(1, 100, filters);

      console.log("Réponse API complète :", response); // Pour vérifier

      if (response.data && response.data.items) {
        setUsers(response.data.items);
      } else if (response.items) {
        setUsers(response.items); // Au cas où la structure changerait
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(err);
      showError("Erreur chargement utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, action) => {
    try {
      if (action === "activate") await userService.activateUser(id);
      if (action === "suspend") await userService.suspendUser(id);
      if (action === "delete") await userService.deleteUser(id);

      success("Action effectuée");
      fetchUsers();
    } catch (err) {
      showError("Erreur lors de l'action");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>

        <Button
          onClick={() => navigate('/admin/create-organizer')}
          className="bg-green-600 hover:bg-green-700"
        >
          Créer un organisateur
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Filtres */}
        <div className="flex gap-2 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Rechercher..."
              className="pl-9"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
          <Select
            onValueChange={(value) =>
              setFilters({ ...filters, etat: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les états" />
            </SelectTrigger>

            <SelectContent className="bg-white">
              <SelectItem value="all">Tous les états</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
           {/* 2. Utilisation du Spinner ici */}
           {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                 {/* Tu peux changer la taille via className ou la prop size */}
                 <Spinner className="h-10 w-10 text-blue-600" /> 
                 <p className="text-sm text-muted-foreground">Chargement des utilisateurs...</p>
              </div>
           ) : users.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Aucun utilisateur trouvé</div>
           ) : (
          <Table>
            <TableHeader className="bg-slate-900 text-white">
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.prenom} {u.nom}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role?.nom}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        u.etat === "actif" ? "bg-green-500" : "bg-red-500"
                      }
                    >
                      {u.etat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Voir détails
                        </DropdownMenuItem>
                        {u.etat !== "actif" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(u.id, "activate")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />{" "}
                            Activer
                          </DropdownMenuItem>
                        )}
                        {u.etat === "actif" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(u.id, "suspend")}
                          >
                            <Ban className="mr-2 h-4 w-4 text-orange-600" />{" "}
                            Suspendre
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(u.id, "delete")}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
