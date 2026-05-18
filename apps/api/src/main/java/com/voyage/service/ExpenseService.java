package com.voyage.service;

import com.voyage.dto.ExpenseRequest;
import com.voyage.dto.ExpenseResponse;
import com.voyage.entity.Expense;
import com.voyage.entity.ExpenseSplit;
import com.voyage.entity.Trip;
import com.voyage.entity.TripMember;
import com.voyage.repository.ExpenseRepository;
import com.voyage.repository.TripMemberRepository;
import com.voyage.repository.TripRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;

    public ExpenseService(ExpenseRepository expenseRepository, TripRepository tripRepository,
                          TripMemberRepository tripMemberRepository) {
        this.expenseRepository = expenseRepository;
        this.tripRepository = tripRepository;
        this.tripMemberRepository = tripMemberRepository;
    }

    public List<ExpenseResponse> getAllForTrip(String tripId, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);
        return expenseRepository.findByTripIdOrderByCreatedAtDesc(tripId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public ExpenseResponse create(String tripId, ExpenseRequest req, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);

        TripMember paidBy = tripMemberRepository.findById(req.getPaidByMemberId())
            .orElseThrow(() -> new NoSuchElementException("Member not found: " + req.getPaidByMemberId()));

        BigDecimal exchangeRate = req.getExchangeRate() != null ? req.getExchangeRate() : BigDecimal.ONE;

        Expense.Category category = parseCategory(req.getCategory());

        Expense expense = Expense.builder()
            .trip(trip)
            .paidBy(paidBy)
            .description(req.getDescription())
            .amountCents(BigDecimal.valueOf(req.getAmountCents()))
            .currency(req.getCurrency().toUpperCase())
            .exchangeRate(exchangeRate)
            .splitType(Expense.SplitType.valueOf(req.getSplitType()))
            .category(category)
            .build();

        List<ExpenseSplit> splits = buildSplits(expense, req, trip);
        expense.setSplits(splits);
        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse update(String tripId, String expenseId, ExpenseRequest req, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);

        Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new NoSuchElementException("Expense not found"));
        if (!expense.getTrip().getId().equals(tripId)) {
            throw new AccessDeniedException("Expense does not belong to this trip");
        }

        TripMember paidBy = tripMemberRepository.findById(req.getPaidByMemberId())
            .orElseThrow(() -> new NoSuchElementException("Member not found: " + req.getPaidByMemberId()));

        BigDecimal exchangeRate = req.getExchangeRate() != null ? req.getExchangeRate() : BigDecimal.ONE;

        expense.setDescription(req.getDescription());
        expense.setAmountCents(BigDecimal.valueOf(req.getAmountCents()));
        expense.setCurrency(req.getCurrency().toUpperCase());
        expense.setExchangeRate(exchangeRate);
        expense.setPaidBy(paidBy);
        expense.setSplitType(Expense.SplitType.valueOf(req.getSplitType()));
        expense.setCategory(parseCategory(req.getCategory()));

        expense.getSplits().clear();
        expenseRepository.saveAndFlush(expense);
        expense.getSplits().addAll(buildSplits(expense, req, trip));

        return toResponse(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(String tripId, String expenseId, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);
        Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new NoSuchElementException("Expense not found"));
        if (!expense.getTrip().getId().equals(tripId)) {
            throw new AccessDeniedException("Expense does not belong to this trip");
        }
        expenseRepository.delete(expense);
    }

    private List<ExpenseSplit> buildSplits(Expense expense, ExpenseRequest req, Trip trip) {
        List<ExpenseSplit> splits = new ArrayList<>();
        List<TripMember> members = trip.getMembers();
        long totalCents = req.getAmountCents();

        if (expense.getSplitType() == Expense.SplitType.EQUAL) {
            int n = members.size();
            long base = totalCents / n;
            long remainder = totalCents % n;
            for (int i = 0; i < members.size(); i++) {
                long share = base + (i < remainder ? 1 : 0);
                splits.add(ExpenseSplit.builder()
                    .expense(expense)
                    .owedBy(members.get(i))
                    .shareAmountCents(BigDecimal.valueOf(share))
                    .build());
            }
        } else {
            long customTotal = req.getCustomSplits().stream()
                .mapToLong(ExpenseRequest.SplitEntry::getAmountCents).sum();
            if (customTotal != totalCents) {
                throw new IllegalArgumentException(
                    "Custom splits sum (" + customTotal + ") must equal total (" + totalCents + ")");
            }
            for (ExpenseRequest.SplitEntry entry : req.getCustomSplits()) {
                TripMember member = tripMemberRepository.findById(entry.getMemberId())
                    .orElseThrow(() -> new NoSuchElementException("Member not found: " + entry.getMemberId()));
                splits.add(ExpenseSplit.builder()
                    .expense(expense)
                    .owedBy(member)
                    .shareAmountCents(BigDecimal.valueOf(entry.getAmountCents()))
                    .build());
            }
        }
        return splits;
    }

    private Trip findTrip(String tripId) {
        return tripRepository.findById(tripId)
            .orElseThrow(() -> new NoSuchElementException("Trip not found: " + tripId));
    }

    private Expense.Category parseCategory(String raw) {
        if (raw == null) return Expense.Category.OTHER;
        try { return Expense.Category.valueOf(raw.toUpperCase()); }
        catch (IllegalArgumentException e) { return Expense.Category.OTHER; }
    }

    private void assertCreator(Trip trip, String userId) {
        if (!trip.getCreatedBy().getId().equals(userId)) {
            throw new AccessDeniedException("Only the trip creator can access this trip");
        }
    }

    private ExpenseResponse toResponse(Expense expense) {
        List<ExpenseResponse.SplitDto> splitDtos = expense.getSplits().stream()
            .map(s -> new ExpenseResponse.SplitDto(
                s.getId(),
                s.getOwedBy().getId(),
                s.getOwedBy().getName(),
                s.getShareAmountCents().longValue(),
                s.isSettled()))
            .toList();
        String categoryName = expense.getCategory() != null ? expense.getCategory().name() : Expense.Category.OTHER.name();
        return new ExpenseResponse(
            expense.getId(),
            expense.getDescription(),
            expense.getAmountCents().longValue(),
            expense.getCurrency(),
            expense.getExchangeRate(),
            expense.getSplitType().name(),
            categoryName,
            expense.getCreatedAt(),
            new ExpenseResponse.PaidByDto(expense.getPaidBy().getId(), expense.getPaidBy().getName()),
            splitDtos
        );
    }
}
