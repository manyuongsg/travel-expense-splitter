package com.voyage.security;

import java.lang.reflect.Field;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.voyage.security.JwtService;

class JwtServiceTest {

    @Test
    void generateAndValidateToken() throws Exception {
        JwtService svc = new JwtService();

        // set secret and expirations via reflection
        String raw = "0123456789ABCDEF0123456789ABCDEF"; // 32 bytes
        String b64 = Base64.getEncoder().encodeToString(raw.getBytes());

        Field secretField = JwtService.class.getDeclaredField("secret");
        secretField.setAccessible(true);
        secretField.set(svc, b64);

        Field expField = JwtService.class.getDeclaredField("expirationMs");
        expField.setAccessible(true);
        expField.setLong(svc, 1000L * 60 * 60);

        Field refreshField = JwtService.class.getDeclaredField("refreshExpirationMs");
        refreshField.setAccessible(true);
        refreshField.setLong(svc, 1000L * 60 * 60 * 24);

        String token = svc.generateToken("U1", "a@b.com");
        assertNotNull(token);
        assertTrue(svc.isTokenValid(token));
        assertEquals("U1", svc.extractUserId(token));
    }

    @Test
    void invalidTokenIsNotValid() throws Exception {
        JwtService svc = new JwtService();
        Field secretField = JwtService.class.getDeclaredField("secret");
        secretField.setAccessible(true);
        secretField.set(svc, Base64.getEncoder().encodeToString("0123456789ABCDEF0123456789ABCDEF".getBytes()));

        assertFalse(svc.isTokenValid("not-a-token"));
    }
}
