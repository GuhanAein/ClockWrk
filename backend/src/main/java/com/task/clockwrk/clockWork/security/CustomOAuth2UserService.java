package com.task.clockwrk.clockWork.security;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String OAUTH_PASSWORD_PREFIX = "OAUTH_";
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");
        String provider = userRequest.getClientRegistration().getRegistrationId();

        log.info("OAuth2 login attempt - Provider: {}, Email: {}", provider, email);

        if (email == null) {
            log.error("OAuth2 login failed - no email provided by {}", provider);
            throw new OAuth2AuthenticationException("Email not provided by OAuth2 provider");
        }

        // Find or create user
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update profile picture if changed
            if (picture != null && !picture.equals(user.getProfilePictureUrl())) {
                user.setProfilePictureUrl(picture);
                userRepository.save(user);
                log.debug("Updated profile picture for OAuth user: {}", email);
            }
            log.info("Existing user logged in via OAuth2: {}", email);
        } else {
            // Create new user for OAuth login with secure random password
            String secureRandomPassword = generateSecureRandomPassword();
            
            User user = User.builder()
                    .email(email)
                    .name(name != null ? name : email.split("@")[0])
                    .profilePictureUrl(picture)
                    .passwordHash(passwordEncoder.encode(OAUTH_PASSWORD_PREFIX + secureRandomPassword))
                    .emailVerified(true) // OAuth emails are pre-verified
                    .createdAt(Instant.now())
                    .build();
            
            userRepository.saveAndFlush(user);
            log.info("Created new OAuth2 user: {} (Provider: {})", email, provider);
        }

        return oauth2User;
    }

    private String generateSecureRandomPassword() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : randomBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
