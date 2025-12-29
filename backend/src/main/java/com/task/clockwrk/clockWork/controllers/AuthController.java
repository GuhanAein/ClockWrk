package com.task.clockwrk.clockWork.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.task.clockwrk.clockWork.dtos.AuthRequest;
import com.task.clockwrk.clockWork.dtos.AuthResponse;
import com.task.clockwrk.clockWork.dtos.RefreshTokenRequest;
import com.task.clockwrk.clockWork.dtos.RegisterRequest;
import com.task.clockwrk.clockWork.services.AuthenticationService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService service;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthResponse> authenticate(
            @Valid @RequestBody AuthRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<Void> sendOtp(
            @RequestParam @Email(message = "Please provide a valid email address") 
            @NotBlank(message = "Email is required") String email
    ) {
        service.sendOtp(email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(
            @RequestParam @Email(message = "Please provide a valid email address") 
            @NotBlank(message = "Email is required") String email,
            @RequestParam @NotBlank(message = "OTP is required") 
            @Size(min = 6, max = 6, message = "OTP must be 6 digits") String otp
    ) {
        return ResponseEntity.ok(service.verifyOtp(email, otp));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifySignupEmail(
            @RequestParam @Email(message = "Please provide a valid email address") 
            @NotBlank(message = "Email is required") String email,
            @RequestParam @NotBlank(message = "OTP is required") 
            @Size(min = 6, max = 6, message = "OTP must be 6 digits") String otp
    ) {
        return ResponseEntity.ok(service.verifySignupEmail(email, otp));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        return ResponseEntity.ok(service.refreshToken(request));
    }
}
