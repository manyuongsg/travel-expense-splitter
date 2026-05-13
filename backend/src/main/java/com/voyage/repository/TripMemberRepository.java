package com.voyage.repository;

import com.voyage.entity.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripMemberRepository extends JpaRepository<TripMember, String> {
}
