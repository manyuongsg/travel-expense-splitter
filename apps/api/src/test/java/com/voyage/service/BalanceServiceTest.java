package com.voyage.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.voyage.dto.BalanceResponse;
import com.voyage.entity.Expense;
import com.voyage.entity.ExpenseSplit;
import com.voyage.entity.Trip;
import com.voyage.entity.TripMember;
import com.voyage.entity.User;
import com.voyage.repository.ExpenseRepository;
import com.voyage.repository.TripRepository;
import com.voyage.service.BalanceService;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BalanceServiceTest {

    @Test
    void calculateBalances_emptyExpenses() {
        TripRepository tripRepo = mock(TripRepository.class);
        ExpenseRepository expenseRepo = mock(ExpenseRepository.class);

        BalanceService svc = new BalanceService(tripRepo, expenseRepo);

        User creator = new User();
        creator.setId("u1");

        Trip trip = Trip.builder().name("T").baseCurrency("USD").createdBy(creator).build();

        TripMember m1 = new TripMember(); m1.setId("m1"); m1.setName("A"); m1.setLinkedUserId("uA"); m1.setTrip(trip);
        TripMember m2 = new TripMember(); m2.setId("m2"); m2.setName("B"); m2.setLinkedUserId("uB"); m2.setTrip(trip);
        trip.getMembers().add(m1); trip.getMembers().add(m2);

        when(tripRepo.findById("t1")).thenReturn(Optional.of(trip));
        when(expenseRepo.findByTripIdOrderByCreatedAtDesc("t1")).thenReturn(List.of());

        BalanceResponse resp = svc.calculateBalances("t1", "u1");

        assertNotNull(resp);
        assertEquals(2, resp.getMemberBalances().size());
        assertTrue(resp.getSettlements().isEmpty());
    }

    @Test
    void calculateBalances_singleExpenseSettlement() {
        TripRepository tripRepo = mock(TripRepository.class);
        ExpenseRepository expenseRepo = mock(ExpenseRepository.class);

        BalanceService svc = new BalanceService(tripRepo, expenseRepo);

        User creator = new User(); creator.setId("u1");
        Trip trip = Trip.builder().name("T").baseCurrency("USD").createdBy(creator).build();

        TripMember m1 = new TripMember(); m1.setId("m1"); m1.setName("Alice"); m1.setLinkedUserId("uA"); m1.setTrip(trip);
        TripMember m2 = new TripMember(); m2.setId("m2"); m2.setName("Bob"); m2.setLinkedUserId("uB"); m2.setTrip(trip);
        trip.getMembers().add(m1); trip.getMembers().add(m2);

        Expense expense = Expense.builder()
                .trip(trip)
                .paidBy(m1)
                .description("Lunch")
                .amountCents(new BigDecimal(1000))
                .currency("USD")
                .exchangeRate(new BigDecimal("1.000000"))
                .splitType(Expense.SplitType.CUSTOM)
                .build();

        ExpenseSplit s1 = ExpenseSplit.builder().expense(expense).owedBy(m1).shareAmountCents(new BigDecimal(500)).build();
        ExpenseSplit s2 = ExpenseSplit.builder().expense(expense).owedBy(m2).shareAmountCents(new BigDecimal(500)).build();
        expense.getSplits().add(s1); expense.getSplits().add(s2);

        when(tripRepo.findById("t1")).thenReturn(Optional.of(trip));
        when(expenseRepo.findByTripIdOrderByCreatedAtDesc("t1")).thenReturn(List.of(expense));

        BalanceResponse resp = svc.calculateBalances("t1", "u1");

        assertNotNull(resp);
        // one creditor (m1 with +500) and one debtor (m2 with -500)
        assertEquals(2, resp.getMemberBalances().size());
        assertEquals(1, resp.getSettlements().size());

        BalanceResponse.Settlement settlement = resp.getSettlements().get(0);
        assertEquals("m2", settlement.getFromUser().getId());
        assertEquals("m1", settlement.getToUser().getId());
        assertEquals(500L, settlement.getAmountCents());
    }
}
