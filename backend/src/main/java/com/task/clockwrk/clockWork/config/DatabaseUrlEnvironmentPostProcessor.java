package com.task.clockwrk.clockWork.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * EnvironmentPostProcessor that constructs DATABASE_URL from individual DB_* variables
 * if DATABASE_URL is not explicitly set. This runs BEFORE Spring Boot creates beans,
 * so it can modify the environment before DataSource is created.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Check if DATABASE_URL is already set
        String databaseUrl = environment.getProperty("DATABASE_URL");
        
        // If DATABASE_URL is not set or is empty/default, construct from individual variables
        if (databaseUrl == null || databaseUrl.isEmpty() || 
            databaseUrl.equals("jdbc:postgresql://localhost:5432/Clockwrk")) {
            
            String dbHost = environment.getProperty("DB_HOST");
            String dbPort = environment.getProperty("DB_PORT", "5432");
            String dbName = environment.getProperty("DB_NAME", "postgres");
            String dbUsername = environment.getProperty("DB_USERNAME");
            String dbPassword = environment.getProperty("DB_PASSWORD");
            
            // Only construct if we have the required variables (password can be empty for local)
            if (dbHost != null && !dbHost.isEmpty() && 
                dbUsername != null && !dbUsername.isEmpty()) {
                
                // Construct JDBC URL
                // For Supabase/remote databases, add SSL mode; for localhost, skip SSL
                boolean isRemote = !dbHost.equals("localhost") && !dbHost.equals("127.0.0.1");
                String sslMode = isRemote ? "&sslmode=require" : "";
                
                String constructedUrl;
                if (dbPassword != null && !dbPassword.isEmpty()) {
                    // URL encode password to handle special characters like @
                    String encodedPassword = URLEncoder.encode(dbPassword, StandardCharsets.UTF_8);
                    constructedUrl = String.format("jdbc:postgresql://%s:%s/%s?user=%s&password=%s%s",
                        dbHost, dbPort, dbName, dbUsername, encodedPassword, sslMode);
                } else {
                    // No password (for local development)
                    constructedUrl = String.format("jdbc:postgresql://%s:%s/%s?user=%s%s",
                        dbHost, dbPort, dbName, dbUsername, sslMode);
                }
                
                // Add as highest priority property source so it overrides application.properties
                Map<String, Object> properties = new HashMap<>();
                properties.put("spring.datasource.url", constructedUrl);
                
                MutablePropertySources propertySources = environment.getPropertySources();
                propertySources.addFirst(new MapPropertySource("constructed-database-url", properties));
                
                // Log for debugging (will appear in AWS logs)
                System.out.println("✅ Constructed DATABASE_URL from DB_* variables");
                System.out.println("   Host: " + dbHost);
                System.out.println("   Port: " + dbPort);
                System.out.println("   Database: " + dbName);
                System.out.println("   Username: " + dbUsername);
            } else {
                System.out.println("⚠️  DB_* variables not fully set, using default DATABASE_URL");
            }
        } else {
            System.out.println("✅ Using explicit DATABASE_URL from environment");
        }
    }
}

