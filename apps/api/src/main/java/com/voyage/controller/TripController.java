package com.voyage.controller;

import com.voyage.dto.BalanceResponse;
import com.voyage.dto.TripRequest;
import com.voyage.dto.TripResponse;
import com.voyage.service.BalanceService;
import com.voyage.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;
    private final BalanceService balanceService;

    public TripController(TripService tripService, BalanceService balanceService) {
        this.tripService = tripService;
        this.balanceService = balanceService;
    }

    @GetMapping
    public ResponseEntity<List<TripResponse>> getAll(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(tripService.getAllForUser(principal.getUsername()));
    }

    @GetMapping("/archived")
    public ResponseEntity<List<TripResponse>> getArchived(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(tripService.getArchivedForUser(principal.getUsername()));
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<TripResponse> getById(@PathVariable String tripId,
                                                 @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(tripService.getById(tripId, principal.getUsername()));
    }

    @PostMapping
    public ResponseEntity<TripResponse> create(@Valid @RequestBody TripRequest.Create req,
                                                @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(tripService.create(req, principal.getUsername()));
    }

    @PatchMapping("/{tripId}")
    public ResponseEntity<TripResponse> updateTrip(@PathVariable String tripId,
                                                    @Valid @RequestBody TripRequest.Update req,
                                                    @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(tripService.updateTrip(tripId, req, principal.getUsername()));
    }

    @PatchMapping("/{tripId}/archive")
    public ResponseEntity<TripResponse> archiveTrip(@PathVariable String tripId,
                                                      @RequestBody TripRequest.Archive req,
                                                      @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(tripService.archiveTrip(tripId, req.isArchived(), principal.getUsername()));
    }

    @DeleteMapping("/{tripId}")
    public ResponseEntity<Void> deleteTrip(@PathVariable String tripId,
                                            @AuthenticationPrincipal UserDetails principal) {
        tripService.deleteTrip(tripId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{tripId}/members")
    public ResponseEntity<TripResponse> addMember(@PathVariable String tripId,
                                                   @Valid @RequestBody TripRequest.AddMember req,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(tripService.addMember(tripId, req, principal.getUsername()));
    }

    @DeleteMapping("/{tripId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable String tripId,
                                              @PathVariable String memberId,
                                              @AuthenticationPrincipal UserDetails principal) {
        tripService.removeMember(tripId, memberId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{tripId}/balances")
    public ResponseEntity<BalanceResponse> getBalances(@PathVariable String tripId,
                                                        @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(balanceService.calculateBalances(tripId, principal.getUsername()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> handleNotFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }
}
