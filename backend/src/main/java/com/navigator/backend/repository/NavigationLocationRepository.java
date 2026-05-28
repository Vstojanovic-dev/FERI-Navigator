package com.navigator.backend.repository;

import com.navigator.backend.model.NavigationLocation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NavigationLocationRepository extends JpaRepository<NavigationLocation, Long> {

  @EntityGraph(attributePaths = {"building", "floor", "node", "space", "space.spaceType"})
  @Query(
      """
          SELECT l FROM NavigationLocation l
          WHERE l.isEnabled = true
          AND (
            :query = ''
            OR LOWER(l.searchableName) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(l.displayName) LIKE LOWER(CONCAT('%', :query, '%'))
          )
          """)
  List<NavigationLocation> searchEnabled(@Param("query") String query, Pageable pageable);

  @EntityGraph(attributePaths = {"building", "floor", "node", "space", "space.spaceType"})
  @Query(
      """
          SELECT l FROM NavigationLocation l
          WHERE l.isEnabled = true
          AND l.space IS NOT NULL
          AND l.locationType IN ('classroom', 'laboratory', 'office')
          AND (
            :query = ''
            OR LOWER(l.searchableName) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(l.displayName) LIKE LOWER(CONCAT('%', :query, '%'))
          )
          """)
  List<NavigationLocation> searchSpaces(@Param("query") String query, Pageable pageable);

  @EntityGraph(attributePaths = {"building", "floor", "node", "space", "space.spaceType"})
  @Query("SELECT l FROM NavigationLocation l WHERE l.id = :id AND l.isEnabled = true")
  Optional<NavigationLocation> findEnabledById(@Param("id") Long id);

  @EntityGraph(attributePaths = {"building", "floor", "space", "space.spaceType"})
  @Query(
      """
          SELECT l FROM NavigationLocation l
          WHERE l.isEnabled = true
            AND l.space IS NOT NULL
            AND l.building.id = :buildingId
            AND l.locationType IN ('classroom', 'laboratory', 'office')
          ORDER BY l.floor.z, l.displayName
          """)
  List<NavigationLocation> findEnabledCatalogSpacesByBuildingId(@Param("buildingId") Long buildingId);

  @EntityGraph(attributePaths = {"building", "floor", "node"})
  @Query(
      """
          SELECT l FROM NavigationLocation l
          WHERE l.isEnabled = true
            AND l.locationType = :locationType
            AND l.node IS NOT NULL
          """)
  List<NavigationLocation> findEnabledByLocationType(@Param("locationType") String locationType);
}
