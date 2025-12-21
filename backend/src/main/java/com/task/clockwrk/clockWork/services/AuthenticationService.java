package com.task.clockwrk.clockWork.services;

import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.controllers.RefreshToken;
import com.task.clockwrk.clockWork.dtos.AuthRequest;
import com.task.clockwrk.clockWork.dtos.AuthResponse;
import com.task.clockwrk.clockWork.dtos.RegisterRequest;
import com.task.clockwrk.clockWork.repository.RefreshTokenRepository;
import com.task.clockwrk.clockWork.repository.UserRepository;
import com.task.clockwrk.clockWork.security.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository repository;
    private final RefreshTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthResponse register(RegisterRequest request) {
        if(repository.existsByEmail(request.getEmail())) {
             throw new RuntimeException("Email already exists");
        }
        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        var savedUser = repository.save(user);
        
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("USER")
                .build();

        var jwtToken = jwtService.generateToken(userDetails);
        var refreshToken = jwtService.generateRefreshToken(userDetails);
        
        saveUserRefreshToken(savedUser, refreshToken);

        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Transactional
    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
                
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("USER")
                .build();
                
        var jwtToken = jwtService.generateToken(userDetails);
        var refreshToken = jwtService.generateRefreshToken(userDetails);
        
        tokenRepository.revokeByUserId(user.getId());
        saveUserRefreshToken(user, refreshToken);
        
        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    public void sendOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        User user = repository.findByEmail(email)
                .orElseGet(() -> {
                     // Auto-create user for passwordless signup/login
                     return repository.save(User.builder()
                             .email(email)
                             .name(email.split("@")[0]) // approximate name
                             .passwordHash(passwordEncoder.encode("OTP-USER-" + System.currentTimeMillis())) // placeholder password
                             .build());
                });
        
        user.setOtp(otp);
        user.setOtpExpiry(Instant.now().plusSeconds(300)); // 5 mins
        repository.save(user);
        
        emailService.sendEmail(email, "Your Login OTP", "Your OTP is: " + otp);
    }

    public AuthResponse verifyOtp(String email, String otp) {
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (user.getOtp() == null || user.getOtpExpiry() == null) {
            throw new RuntimeException("Invalid OTP request");
        }
        
        if (Instant.now().isAfter(user.getOtpExpiry())) {
            throw new RuntimeException("OTP expired");
        }
        
        if (!user.getOtp().equals(otp)) {
             throw new RuntimeException("Invalid OTP");
        }
        
        user.setOtp(null);
        user.setOtpExpiry(null);
        repository.save(user);
        
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("USER")
                .build();
                
        var jwtToken = jwtService.generateToken(userDetails);
        var refreshToken = jwtService.generateRefreshToken(userDetails);
        
        saveUserRefreshToken(user, refreshToken);
        
        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    private void saveUserRefreshToken(User user, String token) {
        var refreshToken = RefreshToken.builder()
                .userId(user.getId())
                .token(token)
                .revoked(false)
                .expiresAt(Instant.now().plusMillis(1000L * 60 * 60 * 24 * 7))
                .build();
        tokenRepository.save(refreshToken);
    }
}
