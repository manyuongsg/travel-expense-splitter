package com.voyage.repository;

import com.voyage.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TripRepository extends JpaRepository<Trip, String> {

    List<Trip> findAllByCreatedByIdAndArchivedFalseOrderByCreatedAtDesc(String createdById);

    List<Trip> findAllByCreatedByIdAndArchivedTrueOrderByCreatedAtDesc(String createdById);

    List<Trip> findAllByCreatedByIdOrderByCreatedAtDesc(String createdById);
}
