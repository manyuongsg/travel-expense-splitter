package com.splitandshare.repository;

import com.splitandshare.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, String> {
    List<ExpenseSplit> findByExpenseId(String expenseId);
    List<ExpenseSplit> findByOwedByIdAndSettledFalse(String userId);
}
