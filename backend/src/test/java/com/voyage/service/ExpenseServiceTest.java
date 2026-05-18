package com.voyage.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.voyage.dto.ExpenseRequest;
import com.voyage.dto.ExpenseResponse;
import com.voyage.entity.Trip;
import com.voyage.entity.TripMember;
import com.voyage.repository.ExpenseRepository;
import com.voyage.repository.TripMemberRepository;
import com.voyage.repository.TripRepository;

class ExpenseServiceTest {

    @Test
    void create_equalSplit_createsExpectedSplits() {
        ExpenseRepository expenseRepo = mock(ExpenseRepository.class);
        TripRepository tripRepo = mock(TripRepository.class);
        TripMemberRepository memberRepo = mock(TripMemberRepository.class);

        ExpenseService svc = new ExpenseService(expenseRepo, tripRepo, memberRepo);

        Trip trip = new Trip(); trip.setBaseCurrency("USD");
        com.voyage.entity.User creator = new com.voyage.entity.User(); creator.setId("U1");
        trip.setCreatedBy(creator);
        TripMember m1 = new TripMember(); m1.setId("m1"); m1.setName("A"); m1.setTrip(trip);
        TripMember m2 = new TripMember(); m2.setId("m2"); m2.setName("B"); m2.setTrip(trip);
        trip.getMembers().add(m1); trip.getMembers().add(m2);

        when(tripRepo.findById("t1")).thenReturn(Optional.of(trip));
        when(memberRepo.findById("m1")).thenReturn(Optional.of(m1));
        when(expenseRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ExpenseRequest req = new ExpenseRequest();
        req.setDescription("Lunch");
        req.setAmountCents(1000L);
        req.setCurrency("usd");
        req.setPaidByMemberId("m1");
        req.setSplitType("EQUAL");

        ExpenseResponse created = svc.create("t1", req, "U1");

        assertNotNull(created);
        assertEquals(2, created.getSplits().size());
        long sum = created.getSplits().stream().mapToLong(s -> s.getShareAmountCents()).sum();
        assertEquals(1000L, sum);
    }
}
