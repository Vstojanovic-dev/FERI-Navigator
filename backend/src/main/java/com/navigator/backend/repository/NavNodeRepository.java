package com.navigator.backend.repository;

import com.navigator.backend.model.NavNode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NavNodeRepository extends JpaRepository<NavNode, Long> {

  Optional<NavNode> findByExternalId(String externalId);

  boolean existsByExternalId(String externalId);

  // A* — traži čvor po labelu (case-insensitive), uzmi prvi rezultat
  Optional<NavNode> findFirstByLabelIgnoreCase(String label);

  // Izbriše vsa vozlišča za izbrano nadstropje - uporabno za ponovni uvoz
  void deleteAllByFloorId(Long floorId);

  // PostGIS - poišči najbližje vozlišče na izbranem nadstropju
  @Query(
      value =
          """
            SELECT * FROM navigation_nodes
            WHERE floor_id = :floorId
            ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(:x, :y), 0))
            LIMIT 1
            """,
      nativeQuery = true)
  Optional<NavNode> findNearestOnFloor(
      @Param("floorId") Long floorId, @Param("x") double x, @Param("y") double y);
}
