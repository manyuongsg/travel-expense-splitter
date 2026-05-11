package com.splitandshare.service;

import com.splitandshare.dto.TripRequest;
import com.splitandshare.dto.TripResponse;
import com.splitandshare.entity.Expense;
import com.splitandshare.entity.Trip;
import com.splitandshare.entity.TripMember;
import com.splitandshare.entity.User;
import com.splitandshare.repository.ExpenseRepository;
import com.splitandshare.repository.TripRepository;
import com.splitandshare.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;

    public TripService(TripRepository tripRepository, UserRepository userRepository,
                       ExpenseRepository expenseRepository) {
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
    }

    public List<TripResponse> getAllForUser(String userId) {
        return tripRepository.findAllByCreatedByIdAndArchivedFalseOrderByCreatedAtDesc(userId).stream()
            .map(this::toResponse)
            .toList();
    }

    public List<TripResponse> getArchivedForUser(String userId) {
        return tripRepository.findAllByCreatedByIdAndArchivedTrueOrderByCreatedAtDesc(userId).stream()
            .map(this::toResponse)
            .toList();
    }

    public TripResponse getById(String tripId, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);
        return toResponse(trip);
    }

    @Transactional
    public TripResponse create(TripRequest.Create req, String creatorId) {
        User creator = findUser(creatorId);
        Trip trip = Trip.builder()
            .name(req.getName())
            .baseCurrency(req.getBaseCurrency().toUpperCase())
            .createdBy(creator)
            .build();

        TripMember creatorMember = new TripMember();
        creatorMember.setTrip(trip);
        creatorMember.setName(creator.getDisplayName());
        creatorMember.setLinkedUserId(creator.getId());
        trip.getMembers().add(creatorMember);

        return toResponse(tripRepository.save(trip));
    }

    @Transactional
    public TripResponse updateTrip(String tripId, TripRequest.Update req, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);
        trip.setName(req.getName().trim());
        trip.setBaseCurrency(req.getBaseCurrency().toUpperCase());
        return toResponse(tripRepository.save(trip));
    }

    @Transactional
    public TripResponse archiveTrip(String tripId, boolean archived, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);
        trip.setArchived(archived);
        return toResponse(tripRepository.save(trip));
    }

    @Transactional
    public void deleteTrip(String tripId, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);
        List<Expense> expenses = expenseRepository.findByTripIdOrderByCreatedAtDesc(tripId);
        expenseRepository.deleteAll(expenses);
        tripRepository.delete(trip);
    }

    @Transactional
    public TripResponse addMember(String tripId, TripRequest.AddMember req, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);

        TripMember member = new TripMember();
        member.setTrip(trip);
        member.setName(req.getName().trim());
        trip.getMembers().add(member);

        return toResponse(tripRepository.save(trip));
    }

    @Transactional
    public void removeMember(String tripId, String memberId, String requestingUserId) {
        Trip trip = findTrip(tripId);
        assertCreator(trip, requestingUserId);
        trip.getMembers().removeIf(m -> m.getId().equals(memberId));
        tripRepository.save(trip);
    }

    private Trip findTrip(String tripId) {
        return tripRepository.findById(tripId)
            .orElseThrow(() -> new NoSuchElementException("Trip not found: " + tripId));
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    }

    private void assertCreator(Trip trip, String userId) {
        if (!trip.getCreatedBy().getId().equals(userId)) {
            throw new AccessDeniedException("Only the trip creator can access this trip");
        }
    }

    private TripResponse toResponse(Trip trip) {
        long totalCents = trip.getExpenses().stream()
            .mapToLong(e -> e.getAmountCents().longValue())
            .sum();
        List<TripResponse.MemberDto> memberDtos = trip.getMembers().stream()
            .map(m -> new TripResponse.MemberDto(m.getId(), m.getName(), m.getLinkedUserId()))
            .toList();
        return new TripResponse(
            trip.getId(),
            trip.getName(),
            trip.getBaseCurrency(),
            trip.getCreatedAt(),
            trip.getMembers().size(),
            totalCents,
            memberDtos,
            trip.isArchived()
        );
    }
}
