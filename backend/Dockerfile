# Use Java 21 runtime
FROM eclipse-temurin:21-jdk

# App working directory
WORKDIR /app

# Copy the built jar into the container
COPY target/*.jar app.jar

# Expose Spring Boot port
EXPOSE 8080

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]