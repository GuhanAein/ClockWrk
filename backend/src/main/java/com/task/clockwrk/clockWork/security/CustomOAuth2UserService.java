package com.task.clockwrk.clockWork.security;

import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        System.out.println("=== CustomOAuth2UserService.loadUser called ===");
        
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");
        String provider = userRequest.getClientRegistration().getRegistrationId();

        System.out.println("OAuth2 Provider: " + provider);
        System.out.println("Email: " + email);
        System.out.println("Name: " + name);
        System.out.println("Picture: " + picture);

        // Find or create user
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;
        
        if (existingUser.isPresent()) {
            System.out.println("User already exists, updating...");
            user = existingUser.get();
            // Update profile picture if changed
            if (picture != null && !picture.equals(user.getProfilePictureUrl())) {
                user.setProfilePictureUrl(picture);
                userRepository.save(user);
                System.out.println("Updated profile picture for user: " + email);
            }
        } else {
            System.out.println("Creating new user for OAuth login...");
            // Create new user for OAuth login
            user = User.builder()
                    .email(email)
                    .name(name != null ? name : email.split("@")[0])
                    .profilePictureUrl(picture)
                    .passwordHash("") // OAuth users don't have password
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(user);
            System.out.println("Created new user: " + email + " (ID: " + user.getId() + ")");
        }

        System.out.println("=== End CustomOAuth2UserService.loadUser ===");
        return oauth2User;
    }
}
