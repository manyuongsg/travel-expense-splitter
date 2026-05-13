package com.voyage.repository;

import com.voyage.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    boolean existsByEmail(String email);

    @Query("SELECT u.id FROM User u ORDER BY LENGTH(u.id) DESC, u.id DESC")
    List<String> findTopUserIdBySequence(Pageable pageable);
}
