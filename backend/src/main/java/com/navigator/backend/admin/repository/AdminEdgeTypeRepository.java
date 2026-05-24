package com.navigator.backend.admin.repository;

import com.navigator.backend.admin.model.AdminEdgeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminEdgeTypeRepository extends JpaRepository<AdminEdgeType, Long> {
  Optional<AdminEdgeType> findByCode(String code);
}
