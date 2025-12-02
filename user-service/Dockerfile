# Dockerfile pour User Service (Node.js)
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
