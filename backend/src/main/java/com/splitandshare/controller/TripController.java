package com.splitandshare.controller;

import com.splitandshare.dto.BalanceResponse;
import com.splitandshare.dto.TripRequest;
import com.splitandshare.dto.TripResponse;
import com.splitandshare.service.BalanceService;
import com.splitandshare.service.TripService;
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
