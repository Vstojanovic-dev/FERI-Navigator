FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app/backend

COPY backend/pom.xml .
COPY backend/src ./src

RUN mvn -DskipTests package

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/backend/target/*.jar app.jar
COPY database/maps ./database/maps

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
