package com.navigator.backend.repository;

import com.navigator.backend.model.NodeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NodeTypeRepository extends JpaRepository<NodeType, Long> {
  Optional<NodeType> findByCode(String code);
}
