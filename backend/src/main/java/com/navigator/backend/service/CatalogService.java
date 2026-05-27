package com.navigator.backend.service;

import com.navigator.backend.dto.BuildingCatalogDto;
import com.navigator.backend.dto.CatalogSpaceDto;
import com.navigator.backend.model.NavigationLocation;
import com.navigator.backend.model.Space;
import com.navigator.backend.repository.BuildingRepository;
import com.navigator.backend.repository.NavigationLocationRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CatalogService {

  private final BuildingRepository buildingRepository;
  private final NavigationLocationRepository locationRepository;

  @Transactional(readOnly = true)
  public List<BuildingCatalogDto> listBuildings() {
    return buildingRepository.findCatalogSummaries();
  }

  @Transactional(readOnly = true)
  public List<CatalogSpaceDto> listBuildingSpaces(Long buildingId) {
    return locationRepository.findEnabledCatalogSpacesByBuildingId(buildingId).stream()
        .map(this::toCatalogSpaceDto)
        .toList();
  }

  private CatalogSpaceDto toCatalogSpaceDto(NavigationLocation location) {
    Space space = location.getSpace();

    return new CatalogSpaceDto(
        space != null ? space.getId() : location.getSpaceId(),
        space != null ? space.getName() : location.getDisplayName(),
        space != null && space.getSpaceType() != null
            ? space.getSpaceType().getName()
            : location.getLocationType(),
        location.getBuilding().getId(),
        location.getBuilding().getName(),
        location.getFloor().getLabel(),
        space != null ? space.getDescription() : null,
        space != null ? space.getImageUrl() : null);
  }
}
