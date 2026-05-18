package com.voyage.repository;

import com.voyage.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, String> {
    List<Expense> findByTripIdOrderByCreatedAtDesc(String tripId);
}
