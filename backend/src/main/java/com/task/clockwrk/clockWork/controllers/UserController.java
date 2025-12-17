package com.task.clockwrk.clockWork.controllers;

import com.task.clockwrk.clockWork.dtos.ChangePasswordRequest;
import com.task.clockwrk.clockWork.dtos.UpdateProfileRequest;
import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.repository.UserRepository;
import com.task.clockwrk.clockWork.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            Principal principal,
            @RequestBody UpdateProfileRequest request
    ) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(userService.updateProfile(user, request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            Principal principal,
            @RequestBody ChangePasswordRequest request
    ) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        userService.changePassword(user, request);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }
}
