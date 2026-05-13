package com.voyage.service;

import com.voyage.dto.BalanceResponse;
import com.voyage.entity.Expense;
import com.voyage.entity.ExpenseSplit;
import com.voyage.entity.Trip;
import com.voyage.entity.TripMember;
import com.voyage.repository.ExpenseRepository;
import com.voyage.repository.TripRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class BalanceService {

    private final TripRepository tripRepository;
    private final ExpenseRepository expenseRepository;

    public BalanceService(TripRepository tripRepository, ExpenseRepository expenseRepository) {
        this.tripRepository = tripRepository;
        this.expenseRepository = expenseRepository;
    }

    public BalanceResponse calculateBalances(String tripId, String requestingUserId) {
        Trip trip = tripRepository.findById(tripId)
            .orElseThrow(() -> new NoSuchElementException("Trip not found: " + tripId));

        if (!trip.getCreatedBy().getId().equals(requestingUserId)) {
            throw new AccessDeniedException("Only the trip creator can view balances");
        }

        List<Expense> expenses = expenseRepository.findByTripIdOrderByCreatedAtDesc(tripId);
        Map<String, Long> net = new HashMap<>();
        Map<String, TripMember> memberLookup = new HashMap<>();

        for (TripMember m : trip.getMembers()) {
            net.put(m.getId(), 0L);
            memberLookup.put(m.getId(), m);
        }

        for (Expense expense : expenses) {
            String payerId = expense.getPaidBy().getId();
            long totalCents = expense.getAmountCents().longValue();
            net.merge(payerId, totalCents, Long::sum);
            for (ExpenseSplit split : expense.getSplits()) {
                String owedById = split.getOwedBy().getId();
                net.merge(owedById, -split.getShareAmountCents().longValue(), Long::sum);
            }
        }

        List<BalanceResponse.MemberBalance> memberBalances = net.entrySet().stream()
            .map(e -> new BalanceResponse.MemberBalance(toUserDto(memberLookup.get(e.getKey())), e.getValue()))
            .sorted(Comparator.comparingLong(BalanceResponse.MemberBalance::getNetAmountCents).reversed())
            .toList();

        List<BalanceResponse.Settlement> settlements = computeSettlements(net, memberLookup);

        return new BalanceResponse(memberBalances, settlements);
    }

    private List<BalanceResponse.Settlement> computeSettlements(Map<String, Long> net,
                                                                  Map<String, TripMember> memberLookup) {
        PriorityQueue<long[]> creditors = new PriorityQueue<>((a, b) -> Long.compare(b[0], a[0]));
        PriorityQueue<long[]> debtors = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));

        List<String> memberIds = new ArrayList<>(net.keySet());
        for (int i = 0; i < memberIds.size(); i++) {
            long balance = net.get(memberIds.get(i));
            if (balance > 0) creditors.offer(new long[]{balance, i});
            else if (balance < 0) debtors.offer(new long[]{balance, i});
        }

        List<BalanceResponse.Settlement> settlements = new ArrayList<>();
        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            long[] creditor = creditors.poll();
            long[] debtor = debtors.poll();
            long amount = Math.min(creditor[0], -debtor[0]);

            String creditorId = memberIds.get((int) creditor[1]);
            String debtorId = memberIds.get((int) debtor[1]);

            settlements.add(new BalanceResponse.Settlement(
                toUserDto(memberLookup.get(debtorId)),
                toUserDto(memberLookup.get(creditorId)),
                amount
            ));

            long remainingCredit = creditor[0] - amount;
            long remainingDebt = debtor[0] + amount;
            if (remainingCredit > 0) creditors.offer(new long[]{remainingCredit, creditor[1]});
            if (remainingDebt < 0) debtors.offer(new long[]{remainingDebt, debtor[1]});
        }
        return settlements;
    }

    private BalanceResponse.UserDto toUserDto(TripMember member) {
        return new BalanceResponse.UserDto(member.getId(), member.getName(), member.getLinkedUserId());
    }
}
