package com.task.clockwrk.clockWork.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private CustomOAuth2UserService customOAuth2UserService;

    @Autowired(required = false)
    private OAuth2LoginSuccessHandler oauth2LoginSuccessHandler;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**", 
                                "/oauth2/**", 
                                "/login/oauth2/**",
                                "/api/health",
                                "/actuator/health"
                        ).permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        // Only configure OAuth2 if credentials are provided
        if (isOAuth2Configured()) {
            log.info("OAuth2 login enabled");
            http.oauth2Login(oauth2 -> oauth2
                    .userInfoEndpoint(userInfo -> userInfo
                            .userService(customOAuth2UserService)
                    )
                    .successHandler(oauth2LoginSuccessHandler)
            );
        } else {
            log.info("OAuth2 login disabled - no credentials configured");
        }

        log.info("Security configuration initialized - Frontend URL: {}", frontendUrl);
        return http.build();
    }

    private boolean isOAuth2Configured() {
        return googleClientId != null && !googleClientId.isBlank() 
                && customOAuth2UserService != null 
                && oauth2LoginSuccessHandler != null;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Default allowed origins
        List<String> allowedOrigins = new java.util.ArrayList<>(Arrays.asList(
                "http://localhost:4200",
                "https://localhost:4200",
                "https://clockwrk.in",
                "http://clockwrk.in",
                "https://clockwrk.netlify.app",
                "http://clockwrk.netlify.app"
        ));
        
        // Add frontendUrl and split it by comma in case there are multiple
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            String[] urls = frontendUrl.split(",");
            for (String url : urls) {
                String trimmed = url.trim();
                if (trimmed.isEmpty()) continue;
                
                // Add protocol if not present
                if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
                    trimmed = "https://" + trimmed;
                }
                
                if (!allowedOrigins.contains(trimmed)) {
                    allowedOrigins.add(trimmed);
                }
                
                // Add the alternative HTTP/HTTPS protocol
                String alternative = trimmed.startsWith("http://") 
                        ? trimmed.replace("http://", "https://") 
                        : trimmed.replace("https://", "http://");
                        
                if (!allowedOrigins.contains(alternative)) {
                    allowedOrigins.add(alternative);
                }
            }
        }
        
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of(
                "Authorization", 
                "Content-Type", 
                "X-Requested-With",
                "Accept",
                "Origin"
        ));
        configuration.setExposedHeaders(List.of(
                "X-Token-Expired",
                "Content-Disposition"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
