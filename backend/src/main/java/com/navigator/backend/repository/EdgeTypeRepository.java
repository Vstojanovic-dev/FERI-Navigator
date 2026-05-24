package com.navigator.backend.repository;

import com.navigator.backend.model.EdgeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EdgeTypeRepository extends JpaRepository<EdgeType, Long> {
  Optional<EdgeType> findByCode(String code);
}
