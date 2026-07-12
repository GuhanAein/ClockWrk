# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy the pom.xml and download dependencies to leverage Docker caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built executable jar from the build stage (renaming it to app.jar)
# Wildcard matching avoids issues if the version changes, but avoids copying *.jar.original
COPY --from=build /app/target/clockWork-[0-9]*.jar app.jar

# Expose port 8080 (the default port for Spring Boot)
EXPOSE 8080

# IPv6 support for Supabase connection pooler
ENV JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=false -Djava.net.preferIPv6Addresses=true"

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
