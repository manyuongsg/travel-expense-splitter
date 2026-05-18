package com.voyage.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.voyage.service.GoogleAuthService;

class GoogleAuthServiceTest {

    @Test
    void invalidToken_throwsSecurityException() {
        GoogleAuthService svc = new GoogleAuthService();
        SecurityException ex = assertThrows(SecurityException.class, () -> svc.verifyIdToken("invalid-token"));
        assertTrue(ex.getMessage().contains("Google token verification failed") || ex.getMessage().contains("Invalid Google ID token"));
    }
}
