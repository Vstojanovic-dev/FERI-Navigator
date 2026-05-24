package com.navigator.backend.admin.repository;

import com.navigator.backend.admin.model.AdminNodeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminNodeTypeRepository extends JpaRepository<AdminNodeType, Long> {
  Optional<AdminNodeType> findByCode(String code);
}
