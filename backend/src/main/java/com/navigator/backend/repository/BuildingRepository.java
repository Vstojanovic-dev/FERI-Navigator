package com.navigator.backend.repository;

import com.navigator.backend.dto.BuildingCatalogDto;
import com.navigator.backend.model.Building;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {

  @Query(
      """
          SELECT new com.navigator.backend.dto.BuildingCatalogDto(
            b.id,
            b.name,
            b.description,
            b.imageUrl,
            COUNT(l.id)
          )
          FROM Building b
          LEFT JOIN NavigationLocation l
            ON l.building.id = b.id
            AND l.isEnabled = true
            AND l.space IS NOT NULL
            AND l.locationType IN ('classroom', 'laboratory', 'office', 'public_area', 'service')
          GROUP BY b.id, b.name, b.description, b.imageUrl
          ORDER BY b.name
          """)
  List<BuildingCatalogDto> findCatalogSummaries();
}
