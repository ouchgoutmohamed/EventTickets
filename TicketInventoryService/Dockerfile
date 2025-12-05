# Dockerfile pour Ticket Inventory Service (Spring Boot)
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copier le pom.xml et télécharger les dépendances
COPY pom.xml .
RUN mvn dependency:go-offline

# Copier les fichiers de configuration (checkstyle)
COPY checkstyle.xml .

# Copier le code source et construire
COPY src ./src
RUN mvn clean package -DskipTests -Dcheckstyle.skip=true

# Image finale
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copier le JAR depuis l'étape de build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
