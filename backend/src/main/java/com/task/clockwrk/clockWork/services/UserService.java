package com.task.clockwrk.clockWork.services;

import com.task.clockwrk.clockWork.dtos.ChangePasswordRequest;
import com.task.clockwrk.clockWork.dtos.UpdateProfileRequest;
import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User updateProfile(User user, UpdateProfileRequest request) {
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
        }
        return userRepository.save(user);
    }

    public void changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect current password");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
