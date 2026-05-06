package com.splitandshare.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.splitandshare.dto.AuthRequest;
import com.splitandshare.dto.AuthResponse;
import com.splitandshare.entity.User;
import com.splitandshare.repository.UserRepository;
import com.splitandshare.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleAuthService googleAuthService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, GoogleAuthService googleAuthService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleAuthService = googleAuthService;
    }

    public AuthResponse register(AuthRequest.Register req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = User.builder()
            .email(req.getEmail())
            .passwordHash(passwordEncoder.encode(req.getPassword()))
            .displayName(req.getDisplayName())
            .build();
        userRepository.save(user);
        return buildResponse(user);
    }

    public AuthResponse login(AuthRequest.Login req) {
        User user = userRepository.findByEmail(req.getEmail())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        return buildResponse(user);
    }

    public AuthResponse googleLogin(AuthRequest.Google req) {
        GoogleIdToken.Payload payload = googleAuthService.verifyIdToken(req.getIdToken());
        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");

        User user = userRepository.findByGoogleId(googleId)
            .orElseGet(() -> userRepository.findByEmail(email)
                .map(existing -> {
                    existing.setGoogleId(googleId);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                    .email(email)
                    .googleId(googleId)
                    .displayName(name != null ? name : email)
                    .build())));

        return buildResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new BadCredentialsException("Invalid refresh token");
        }
        String userId = jwtService.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadCredentialsException("User not found"));
        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        return new AuthResponse(token, refreshToken,
            new AuthResponse.UserDto(user.getId(), user.getEmail(), user.getDisplayName()));
    }
}
