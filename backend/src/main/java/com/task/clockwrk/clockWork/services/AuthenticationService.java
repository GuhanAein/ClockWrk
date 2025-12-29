package com.task.clockwrk.clockWork.services;

import java.security.SecureRandom;
import java.time.Instant;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.task.clockwrk.clockWork.dtos.AuthRequest;
import com.task.clockwrk.clockWork.dtos.AuthResponse;
import com.task.clockwrk.clockWork.dtos.RefreshTokenRequest;
import com.task.clockwrk.clockWork.dtos.RegisterRequest;
import com.task.clockwrk.clockWork.entity.RefreshToken;
import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.exception.ApiException;
import com.task.clockwrk.clockWork.repository.RefreshTokenRepository;
import com.task.clockwrk.clockWork.repository.UserRepository;
import com.task.clockwrk.clockWork.security.JwtService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {
    
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_LENGTH = 6;
    private static final long OTP_VALIDITY_SECONDS = 300; // 5 minutes
    
    private final UserRepository repository;
    private final RefreshTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (repository.existsByEmail(request.getEmail())) {
            throw ApiException.conflict("An account with this email already exists");
        }
        
        // Create user but mark as unverified
        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .emailVerified(false)
                .build();
        repository.save(user);
        
        // Send verification OTP
        String otp = generateSecureOtp();
        user.setOtp(otp);
        user.setOtpExpiry(Instant.now().plusSeconds(OTP_VALIDITY_SECONDS));
        repository.save(user);
        
        emailService.sendEmail(
            request.getEmail(), 
            "Welcome to ClockWrk! Verify your account", 
            "Hi " + request.getName() + ",\n\n" +
            "Welcome to ClockWrk! We're thrilled to have you on board.\n\n" +
            "To get started, please verify your email using the following code:\n\n" +
            otp + "\n\n" +
            "This code is valid for 5 minutes.\n\n" +
            "Happy focusing,\nThe ClockWrk Team"
        );
        
        log.info("User registered: {}", request.getEmail());
        
        // Return response indicating verification needed (no tokens yet)
        return AuthResponse.builder()
                .accessToken(null)
                .refreshToken(null)
                .requiresVerification(true)
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
                .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));
        
        // Check if email is verified
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            // Send new OTP for verification
            String otp = generateSecureOtp();
            user.setOtp(otp);
            user.setOtpExpiry(Instant.now().plusSeconds(OTP_VALIDITY_SECONDS));
            repository.save(user);
            
            emailService.sendEmail(
                user.getEmail(),
                "Verify your ClockWrk account",
                "Hi " + user.getName() + ",\n\n" +
                "Please verify your email to continue:\n\n" +
                otp + "\n\n" +
                "This code is valid for 5 minutes.\n\n" +
                "The ClockWrk Team"
            );
            
            return AuthResponse.builder()
                    .accessToken(null)
                    .refreshToken(null)
                    .requiresVerification(true)
                    .build();
        }
                
        return generateTokensForUser(user);
    }

    @Transactional
    public void sendOtp(String email) {
        User user = repository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("No account found with this email"));
        
        String otp = generateSecureOtp();
        user.setOtp(otp);
        user.setOtpExpiry(Instant.now().plusSeconds(OTP_VALIDITY_SECONDS));
        repository.save(user);
        
        emailService.sendEmail(
            email, 
            "Your ClockWrk Login Code", 
            "Hi " + user.getName() + ",\n\n" +
            "Welcome back to ClockWrk!\n\n" +
            "Use the following One-Time Password (OTP) to log in to your account:\n\n" +
            otp + "\n\n" +
            "This code will expire in 5 minutes. If you didn't request this code, please ignore this email.\n\n" +
            "Best,\nThe ClockWrk Team"
        );
        
        log.info("OTP sent to: {}", email);
    }

    @Transactional
    public AuthResponse verifySignupEmail(String email, String otp) {
        User user = repository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("User not found"));
                
        validateOtp(user, otp);
        
        // Mark email as verified
        user.setEmailVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        repository.save(user);
        
        log.info("Email verified for user: {}", email);
        
        return generateTokensForUser(user);
    }

    @Transactional
    public AuthResponse verifyOtp(String email, String otp) {
        User user = repository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        
        validateOtp(user, otp);
        
        // Clear OTP after successful verification
        user.setOtp(null);
        user.setOtpExpiry(null);
        
        // Also mark as verified if not already
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            user.setEmailVerified(true);
        }
        
        repository.save(user);
        
        log.info("OTP verified for user: {}", email);
        
        return generateTokensForUser(user);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        
        if (refreshToken == null || refreshToken.isBlank()) {
            throw ApiException.badRequest("Refresh token is required");
        }
        
        String userEmail;
        try {
            userEmail = jwtService.extractUsername(refreshToken);
        } catch (Exception e) {
            throw ApiException.unauthorized("Invalid refresh token");
        }
        
        if (userEmail == null) {
            throw ApiException.unauthorized("Invalid refresh token");
        }
        
        var user = repository.findByEmail(userEmail)
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("USER")
                .build();

        // Check if JWT token is valid
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw ApiException.unauthorized("Refresh token is expired or invalid");
        }
        
        // Check if token exists in database and is not revoked/expired
        RefreshToken storedToken = tokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> ApiException.unauthorized("Refresh token not found"));
        
        if (!storedToken.isValid()) {
            throw ApiException.unauthorized("Refresh token is revoked or expired");
        }
        
        // Generate new access token only (keep the same refresh token)
        var accessToken = jwtService.generateToken(userDetails);
        
        log.info("Token refreshed for user: {}", userEmail);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtService.getAccessTokenExpiration())
                .build();
    }

    private AuthResponse generateTokensForUser(User user) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities("USER")
                .build();
                
        var jwtToken = jwtService.generateToken(userDetails);
        var refreshToken = jwtService.generateRefreshToken(userDetails);
        
        // Revoke old tokens and save new one
        tokenRepository.revokeByUserId(user.getId());
        saveUserRefreshToken(user, refreshToken);
        
        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtService.getAccessTokenExpiration())
                .build();
    }

    private void validateOtp(User user, String otp) {
        if (user.getOtp() == null || user.getOtpExpiry() == null) {
            throw ApiException.badRequest("No OTP request found. Please request a new OTP.");
        }
        
        if (Instant.now().isAfter(user.getOtpExpiry())) {
            // Clear expired OTP
            user.setOtp(null);
            user.setOtpExpiry(null);
            repository.save(user);
            throw ApiException.badRequest("OTP has expired. Please request a new one.");
        }
        
        if (!user.getOtp().equals(otp)) {
            throw ApiException.badRequest("Invalid OTP. Please check and try again.");
        }
    }

    private String generateSecureOtp() {
        int otp = SECURE_RANDOM.nextInt((int) Math.pow(10, OTP_LENGTH));
        return String.format("%0" + OTP_LENGTH + "d", otp);
    }

    private void saveUserRefreshToken(User user, String token) {
        var refreshToken = RefreshToken.builder()
                .userId(user.getId())
                .token(token)
                .revoked(false)
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpiration()))
                .build();
        tokenRepository.save(refreshToken);
    }
}
