# Dockerfile pour API Gateway (Node.js)
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
