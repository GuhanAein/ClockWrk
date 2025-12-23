package com.task.clockwrk.clockWork.security;

import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        System.out.println("=== OAuth2 Success Handler Called ===");
        
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        
        System.out.println("OAuth2 User Email: " + email);
        System.out.println("OAuth2 User Attributes: " + oauth2User.getAttributes());

        if (email == null) {
            System.err.println("ERROR: Email is null from OAuth2 provider");
            // Redirect to error page if email is not provided
            String errorUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/login")
                    .queryParam("error", "oauth_email_missing")
                    .build().toUriString();
            System.out.println("Redirecting to error URL: " + errorUrl);
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
            return;
        }

        try {
            // Find or create user
            User user = userRepository.findByEmail(email).orElse(null);
            
            if (user == null) {
                // User doesn't exist - create new user for OAuth
                System.out.println("User not found, creating new OAuth user...");
                String name = oauth2User.getAttribute("name");
                String picture = oauth2User.getAttribute("picture");
                
                user = User.builder()
                        .email(email)
                        .name(name != null ? name : email.split("@")[0])
                        .profilePictureUrl(picture)
                        .passwordHash("OAUTH_USER_NO_PASSWORD")
                        .emailVerified(true)
                        .createdAt(java.time.Instant.now())
                        .build();
                
                user = userRepository.saveAndFlush(user);
                System.out.println("Created new OAuth user: " + email + " (ID: " + user.getId() + ")");
            } else {
                System.out.println("User found: " + user.getEmail() + " (ID: " + user.getId() + ")");
            }

            // Create a simple UserDetails wrapper for JWT generation
            UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    "", // No password for OAuth users
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
            );

            String token = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);
            
            System.out.println("Generated JWT token (first 20 chars): " + token.substring(0, Math.min(20, token.length())) + "...");
            System.out.println("Generated refresh token (first 20 chars): " + refreshToken.substring(0, Math.min(20, refreshToken.length())) + "...");

            // Redirect to frontend with tokens
            String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                    .queryParam("token", token)
                    .queryParam("refreshToken", refreshToken)
                    .build().toUriString();

            System.out.println("Frontend URL: " + frontendUrl);
            System.out.println("Redirecting to: " + targetUrl);
            System.out.println("=== End OAuth2 Success Handler ===");

            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            
        } catch (Exception e) {
            System.err.println("ERROR in OAuth2 Success Handler: " + e.getMessage());
            e.printStackTrace();
            
            // Redirect to login with error message instead of showing whitelabel error
            String errorUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/login")
                    .queryParam("error", "oauth_failed")
                    .queryParam("message", "Authentication failed. Please try again.")
                    .build().toUriString();
            
            System.out.println("Redirecting to error URL: " + errorUrl);
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
        }
    }
}
