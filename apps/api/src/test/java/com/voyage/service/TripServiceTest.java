package com.voyage.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;

import com.voyage.dto.TripRequest;
import com.voyage.dto.TripResponse;
import com.voyage.entity.User;
import com.voyage.repository.ExpenseRepository;
import com.voyage.repository.TripRepository;
import com.voyage.repository.UserRepository;
import com.voyage.service.TripService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TripServiceTest {

    @Test
    void createTrip_setsCreatorAndAddsMember() {
        TripRepository tripRepo = mock(TripRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        ExpenseRepository expenseRepo = mock(ExpenseRepository.class);

        TripService svc = new TripService(tripRepo, userRepo, expenseRepo);

        User creator = new User(); creator.setId("U1"); creator.setDisplayName("Alice");
        when(userRepo.findById("U1")).thenReturn(Optional.of(creator));

        TripRequest.Create req = new TripRequest.Create();
        req.setName("Holiday");
        req.setBaseCurrency("usd");

        when(tripRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TripResponse resp = svc.create(req, "U1");

        assertNotNull(resp);
        assertEquals("Holiday", resp.getName());
        assertEquals("USD", resp.getBaseCurrency());
        assertEquals(1, resp.getMemberCount());
    }
}
