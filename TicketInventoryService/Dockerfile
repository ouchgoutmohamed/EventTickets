# Dockerfile pour Ticket Inventory Service (Spring Boot)
# Optimisé pour utiliser le cache Docker

FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# 1. Copier uniquement pom.xml d'abord pour le cache des dépendances
COPY pom.xml .

# 2. Télécharger les dépendances (cette étape est mise en cache si pom.xml ne change pas)
RUN mvn dependency:go-offline -B

# 3. Copier le code source
COPY src ./src

# 4. Construire le projet (skip tests pour accélérer)
RUN mvn clean package -DskipTests -B

# Image finale légère
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copier le JAR depuis l'étape de build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
