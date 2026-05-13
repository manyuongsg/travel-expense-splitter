package com.voyage.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.voyage.dto.AuthRequest;
import com.voyage.dto.AuthResponse;
import com.voyage.entity.Expense;
import com.voyage.entity.Trip;
import com.voyage.entity.User;
import com.voyage.repository.ExpenseRepository;
import com.voyage.repository.TripRepository;
import com.voyage.repository.UserRepository;
import com.voyage.security.JwtService;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleAuthService googleAuthService;
    private final TripRepository tripRepository;
    private final ExpenseRepository expenseRepository;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, GoogleAuthService googleAuthService,
                       TripRepository tripRepository, ExpenseRepository expenseRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleAuthService = googleAuthService;
        this.tripRepository = tripRepository;
        this.expenseRepository = expenseRepository;
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
        user.setId(generateNextUserId());
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

        User user = userRepository.findByGoogleId(googleId).orElse(null);
        if (user == null) {
            user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                user.setGoogleId(googleId);
                user = userRepository.save(user);
            } else {
                User newUser = User.builder()
                    .email(email)
                    .googleId(googleId)
                    .displayName(name != null ? name : email)
                    .build();
                newUser.setId(generateNextUserId());
                user = userRepository.save(newUser);
            }
        }

        return buildResponse(user);
    }

    private synchronized String generateNextUserId() {
        List<String> ids = userRepository.findTopUserIdBySequence(PageRequest.of(0, 1));
        long nextNum = 1;
        if (!ids.isEmpty()) {
            String lastId = ids.get(0);
            // Parse the numeric portion after "A#"
            nextNum = Long.parseLong(lastId.substring(2)) + 1;
        }
        // Pad to minimum 4 digits; naturally expands for numbers > 9999
        return String.format("A#%04d", nextNum);
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

    public AuthResponse.UserDto updateProfile(String userId, String displayName) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setDisplayName(displayName);
        user = userRepository.save(user);
        return new AuthResponse.UserDto(user.getId(), user.getEmail(), user.getDisplayName());
    }

    public void changePassword(String userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadCredentialsException("User not found"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(String userId) {
        List<Trip> trips = tripRepository.findAllByCreatedByIdOrderByCreatedAtDesc(userId);
        for (Trip trip : trips) {
            List<Expense> expenses = expenseRepository.findByTripIdOrderByCreatedAtDesc(trip.getId());
            expenseRepository.deleteAll(expenses);
        }
        tripRepository.deleteAll(trips);
        userRepository.deleteById(userId);
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        return new AuthResponse(token, refreshToken,
            new AuthResponse.UserDto(user.getId(), user.getEmail(), user.getDisplayName()));
    }
}
