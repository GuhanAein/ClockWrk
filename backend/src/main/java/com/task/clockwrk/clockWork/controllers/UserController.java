package com.task.clockwrk.clockWork.controllers;

import java.security.Principal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.task.clockwrk.clockWork.dtos.ChangePasswordRequest;
import com.task.clockwrk.clockWork.dtos.UpdateProfileRequest;
import com.task.clockwrk.clockWork.dtos.UserResponse;
import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.exception.ApiException;
import com.task.clockwrk.clockWork.repository.UserRepository;
import com.task.clockwrk.clockWork.services.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            Principal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        User user = getAuthenticatedUser(principal);
        User updatedUser = userService.updateProfile(user, request);
        return ResponseEntity.ok(UserResponse.fromEntity(updatedUser));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        User user = getAuthenticatedUser(principal);
        userService.changePassword(user, request);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) {
            throw ApiException.unauthorized("Not authenticated");
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
