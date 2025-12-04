# Dockerfile pour Frontend (React + Vite)
FROM node:18-alpine AS build

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build de production
RUN npm run build

# Image finale avec Nginx
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
