import axios from 'axios';

// 1. Définition des URLs de base (Idéalement via .env)
const URLS = {
  USERS: import.meta.env.VITE_API_USER_URL || 'http://localhost:3001/api',
  CATALOG: import.meta.env.VITE_API_CATALOG_URL || 'http://localhost:8080/events',
  TICKETS: import.meta.env.VITE_API_TICKET_URL || 'http://localhost:8083/api',  // À adapter
  //PAYMENTS: import.meta.env.VITE_API_PAYMENT_URL || 'http://localhost:8084/api' // À adapter
};

// 2. Création des instances spécifiques pour chaque microservice
export const userClient = axios.create({ baseURL: URLS.USERS, headers: { 'Content-Type': 'application/json' } });
export const catalogClient = axios.create({ baseURL: URLS.CATALOG, headers: { 'Content-Type': 'application/json' } });
//export const ticketClient = axios.create({ baseURL: URLS.TICKETS, headers: { 'Content-Type': 'application/json' } });
//export const paymentClient = axios.create({ baseURL: URLS.PAYMENTS, headers: { 'Content-Type': 'application/json' } });

// 3. Fonction partagée pour attacher les intercepteurs
const attachInterceptors = (axiosInstance) => {
  
  // --- REQUEST INTERCEPTOR (Injection du Token) ---
  axiosInstance.interceptors.request.use(
    (config) => {
      // Logs désactivés en prod pour éviter le bruit, utiles en dev
      if (import.meta.env.DEV) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      }
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  // --- RESPONSE INTERCEPTOR (Gestion du Refresh Token) ---
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Si erreur 401 (Non autorisé) et qu'on n'a pas déjà réessayé
      if (error.response?.status === 401 && !originalRequest._retry) {
        console.warn('[Auth] Token expiré, tentative de rafraîchissement...');
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          try {
            // IMPORTANT : On utilise une instance neutre ou userClient pour refresh
            // On ne veut pas utiliser l'instance actuelle qui vient de planter
            const response = await axios.post(`${URLS.USERS}/auth/refresh`, {
              refreshToken,
            });

            const { token, refreshToken: newRefreshToken } = response.data.data;

            // Mise à jour du stockage
            localStorage.setItem('accessToken', token);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            console.log('[Auth] Token rafraîchi avec succès.');

            // Mise à jour du header de la requête originale et relance
            originalRequest.headers.Authorization = `Bearer ${token}`;
            
            // On relance la requête avec l'instance qui a échoué (axiosInstance)
            return axiosInstance(originalRequest);

          } catch (refreshError) {
            console.error('[Auth] Échec du rafraîchissement, déconnexion.', refreshError);
            // Nettoyage complet
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
           // Pas de refresh token dispo
           window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

// 4. Application de la logique à TOUTES les instances
attachInterceptors(userClient);
attachInterceptors(catalogClient);
//attachInterceptors(ticketClient);
//attachInterceptors(paymentClient);