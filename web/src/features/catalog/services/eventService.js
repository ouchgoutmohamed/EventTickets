import { catalogClient as axiosInstance } from "../../../api/axiosClients";

// Récupérer tous les événements
export const getAllEvents = async () => {
  const response = await axiosInstance.get("/list-events");
  return response.data;
};

// Récupérer MES événements
export const getMyEvents = async () => {
  const response = await axiosInstance.get("/my-events");
  return response.data;
};

// Récupérer un événement par ID
export const getEventById = async (id) => {
  const response = await axiosInstance.get(`/${id}`);
  return response.data;
};

// Créer un événement
export const createEvent = async (payload) => {
  const response = await axiosInstance.post("/create", payload);
  return response.data;
};

// Mettre à jour un événement
export const updateEvent = async (id, payload) => {
  const response = await axiosInstance.put(`/${id}`, payload);
  return response.data;
};

// Supprimer un événement
export const deleteEvent = async (id) => {
  await axiosInstance.delete(`/${id}`);
};

// Rechercher par mot-clé
export const searchEvents = async (keyword) => {
  const response = await axiosInstance.get(`/search?keyword=${encodeURIComponent(keyword)}`);
  return response.data;
};

// Filtrer par catégorie
export const getEventsByCategory = async (category) => {
  const response = await axiosInstance.get(`/category/${category}`);
  return response.data;
};

// Filtrer par status
export const getEventsByStatus = async (status) => {
  const response = await axiosInstance.get(`/status/${status}`);
  return response.data;
};

// Filtrer par date
export const getEventsBetweenDates = async (start, end) => {
  const response = await axiosInstance.get(`/date-range?start=${start}&end=${end}`);
  return response.data;
};

// Mettre à jour le status
export const updateEventStatus = async (id, status) => {
  const response = await axiosInstance.patch(`/${id}/status?status=${status}`);
  return response.data;
};
