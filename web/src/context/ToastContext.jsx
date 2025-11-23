import React, { createContext, useContext } from 'react';
import { toast, Toaster } from 'sonner';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  
  // On garde exactement les mêmes noms de fonctions que tu avais
  const success = (message, duration = 3000) => toast.success(message, { duration });
  const error = (message, duration = 3000) => toast.error(message, { duration });
  const info = (message, duration = 3000) => toast.info(message, { duration });
  const warning = (message, duration = 3000) => toast.warning(message, { duration });

  // Alias pour compatibilité
  const showToast = (message, type = 'info', duration) => {
    if (type === 'success') return success(message, duration);
    if (type === 'error') return error(message, duration);
    if (type === 'warning') return warning(message, duration);
    return info(message, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Le composant d'affichage de Shadcn/Sonner */}
      <Toaster position="top-right" richColors closeButton /> 
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};