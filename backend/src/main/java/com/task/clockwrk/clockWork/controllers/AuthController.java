package com.task.clockwrk.clockWork.controllers;

import com.task.clockwrk.clockWork.dtos.AuthRequest;
import com.task.clockwrk.clockWork.dtos.AuthResponse;
import com.task.clockwrk.clockWork.dtos.RegisterRequest;
import com.task.clockwrk.clockWork.services.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService service;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthResponse> authenticate(
            @RequestBody AuthRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<Void> sendOtp(
            @RequestParam String email
    ) {
        service.sendOtp(email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(
            @RequestParam String email,
            @RequestParam String otp
    ) {
        return ResponseEntity.ok(service.verifyOtp(email, otp));
    }
}
