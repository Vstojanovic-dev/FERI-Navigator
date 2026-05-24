package com.navigator.backend.admin.repository;

import com.navigator.backend.admin.model.AdminFloor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminFloorRepository extends JpaRepository<AdminFloor, Long> {

  @Query(
      """
          SELECT f FROM AdminFloor f
          JOIN FETCH f.building b
          ORDER BY b.code, f.levelNumber
          """)
  List<AdminFloor> findAllForEditor();

  @Query(
      """
          SELECT f FROM AdminFloor f
          JOIN FETCH f.building
          WHERE f.id = :floorId
          """)
  Optional<AdminFloor> findDetailedById(@Param("floorId") Long floorId);
}
