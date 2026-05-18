package com.voyage.security;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.security.core.userdetails.UserDetails;

import com.voyage.entity.User;
import com.voyage.repository.UserRepository;

class UserDetailsServiceImplTest {

    @Test
    void loadUserByUsername_andById_returnUserDetails() {
        UserRepository repo = mock(UserRepository.class);
        User u = new User(); u.setId("U1"); u.setEmail("a@b.com"); u.setPasswordHash("h"); u.setDisplayName("A");
        when(repo.findByEmail("a@b.com")).thenReturn(Optional.of(u));
        when(repo.findById("U1")).thenReturn(Optional.of(u));

        UserDetailsServiceImpl svc = new UserDetailsServiceImpl(repo);

        UserDetails byEmail = svc.loadUserByUsername("a@b.com");
        assertNotNull(byEmail);
        assertEquals("U1", byEmail.getUsername());

        UserDetails byId = svc.loadUserById("U1");
        assertNotNull(byId);
        assertEquals("U1", byId.getUsername());
    }
}
