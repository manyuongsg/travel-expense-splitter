package com.splitandshare.controller;

import com.splitandshare.dto.ExpenseRequest;
import com.splitandshare.dto.ExpenseResponse;
import com.splitandshare.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/trips/{tripId}/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getAll(@PathVariable String tripId,
                                                         @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(expenseService.getAllForTrip(tripId, principal.getUsername()));
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(@PathVariable String tripId,
                                                   @Valid @RequestBody ExpenseRequest req,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(expenseService.create(tripId, req, principal.getUsername()));
    }

    @PutMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponse> update(@PathVariable String tripId,
                                                   @PathVariable String expenseId,
                                                   @Valid @RequestBody ExpenseRequest req,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(expenseService.update(tripId, expenseId, req, principal.getUsername()));
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> delete(@PathVariable String tripId,
                                        @PathVariable String expenseId,
                                        @AuthenticationPrincipal UserDetails principal) {
        expenseService.delete(tripId, expenseId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> handleNotFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }

    @ExceptionHandler({AccessDeniedException.class, IllegalArgumentException.class})
    public ResponseEntity<String> handleBadRequest(RuntimeException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
