package com.navigator.backend.repository;

import com.navigator.backend.model.NavigationRouteShare;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NavigationRouteShareRepository extends JpaRepository<NavigationRouteShare, Long> {

  Optional<NavigationRouteShare> findByShareCode(String shareCode);

  boolean existsByShareCode(String shareCode);
}