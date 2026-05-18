package com.voyage.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.voyage.dto.AuthRequest;
import com.voyage.dto.AuthResponse;
import com.voyage.repository.ExpenseRepository;
import com.voyage.repository.TripRepository;
import com.voyage.repository.UserRepository;
import com.voyage.security.JwtService;
import com.voyage.service.AuthService;
import com.voyage.service.GoogleAuthService;

class AuthServiceTest {

    @Test
    void register_createsUserAndReturnsTokens() {
        UserRepository userRepo = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        JwtService jwt = mock(JwtService.class);
        GoogleAuthService google = mock(GoogleAuthService.class);
        TripRepository tripRepo = mock(TripRepository.class);
        ExpenseRepository expenseRepo = mock(ExpenseRepository.class);

        when(userRepo.existsByEmail("a@b.com")).thenReturn(false);
        when(encoder.encode("pwd")).thenReturn("hash");
        when(jwt.generateToken(any(), any())).thenReturn("tok");
        when(jwt.generateRefreshToken(any())).thenReturn("ref");
        when(userRepo.findTopUserIdBySequence(any())).thenReturn(List.of());

        AuthService svc = new AuthService(userRepo, encoder, jwt, google, tripRepo, expenseRepo);

        AuthRequest.Register req = new AuthRequest.Register();
        req.setEmail("a@b.com"); req.setPassword("pwd"); req.setDisplayName("Alice");

        AuthResponse resp = svc.register(req);

        assertNotNull(resp);
        assertEquals("tok", resp.getToken());
        assertEquals("ref", resp.getRefreshToken());
        assertNotNull(resp.getUser());
        assertTrue(resp.getUser().getId().startsWith("A#"));
    }
}
