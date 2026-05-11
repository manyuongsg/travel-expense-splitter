package com.splitandshare.repository;

import com.splitandshare.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TripRepository extends JpaRepository<Trip, String> {

    List<Trip> findAllByCreatedByIdAndArchivedFalseOrderByCreatedAtDesc(String createdById);

    List<Trip> findAllByCreatedByIdAndArchivedTrueOrderByCreatedAtDesc(String createdById);

    List<Trip> findAllByCreatedByIdOrderByCreatedAtDesc(String createdById);
}
