package com.task.clockwrk.clockWork.services;

import com.task.clockwrk.clockWork.dtos.ChangePasswordRequest;
import com.task.clockwrk.clockWork.dtos.UpdateProfileRequest;
import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.exception.ApiException;
import com.task.clockwrk.clockWork.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User updateProfile(User user, UpdateProfileRequest request) {
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
        }
        
        log.info("Updated profile for user: {}", user.getEmail());
        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        // Check if user is an OAuth user (no password set)
        if (user.getPasswordHash() != null && user.getPasswordHash().startsWith("OAUTH_")) {
            throw ApiException.badRequest("Password cannot be changed for OAuth accounts. Please use your OAuth provider to manage your password.");
        }
        
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        
        if (request.getNewPassword().equals(request.getCurrentPassword())) {
            throw ApiException.badRequest("New password must be different from current password");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        log.info("Password changed for user: {}", user.getEmail());
    }
}
