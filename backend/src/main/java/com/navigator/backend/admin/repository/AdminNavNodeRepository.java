package com.navigator.backend.admin.repository;

import com.navigator.backend.admin.model.AdminNavNode;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminNavNodeRepository extends JpaRepository<AdminNavNode, Long> {

  boolean existsByExternalId(String externalId);

  Optional<AdminNavNode> findByExternalId(String externalId);

  @Query(
      """
          SELECT n FROM AdminNavNode n
          JOIN FETCH n.nodeType
          JOIN FETCH n.floor f
          JOIN FETCH f.building
          WHERE n.floorId = :floorId
          ORDER BY n.id
          """)
  List<AdminNavNode> findAllForFloor(@Param("floorId") Long floorId);

  @Query(
      """
          SELECT n FROM AdminNavNode n
          JOIN FETCH n.nodeType
          JOIN FETCH n.floor f
          JOIN FETCH f.building
          WHERE n.id = :nodeId
          """)
  Optional<AdminNavNode> findDetailedById(@Param("nodeId") Long nodeId);
}
