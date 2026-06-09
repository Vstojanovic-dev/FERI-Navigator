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
    return listBuildings(null);
  }

  @Transactional(readOnly = true)
  public List<BuildingCatalogDto> listBuildings(String acceptLanguage) {
    NavigationLanguage language = NavigationLanguage.fromHeader(acceptLanguage);
    return buildingRepository.findCatalogSummaries().stream()
        .map(
            building ->
                new BuildingCatalogDto(
                    building.id(),
                    NavigationLocalization.localizeBuildingName(building.name(), language),
                    building.description(),
                    building.imageUrl(),
                    building.spaceCount()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<CatalogSpaceDto> listBuildingSpaces(Long buildingId) {
    return listBuildingSpaces(buildingId, null);
  }

  @Transactional(readOnly = true)
  public List<CatalogSpaceDto> listBuildingSpaces(Long buildingId, String acceptLanguage) {
    NavigationLanguage language = NavigationLanguage.fromHeader(acceptLanguage);
    return locationRepository.findEnabledCatalogSpacesByBuildingId(buildingId).stream()
        .map(location -> toCatalogSpaceDto(location, language))
        .toList();
  }

  private CatalogSpaceDto toCatalogSpaceDto(
      NavigationLocation location, NavigationLanguage language) {
    Space space = location.getSpace();
    String localizedDisplayName =
        NavigationLocalization.localizeDisplayName(
            space != null ? space.getName() : location.getDisplayName(), language);
    String localizedType =
        NavigationLocalization.localizeSpaceTypeName(
            space != null && space.getSpaceType() != null
                ? space.getSpaceType().getName()
                : location.getLocationType(),
            language);

    return new CatalogSpaceDto(
        space != null ? space.getId() : location.getSpaceId(),
        localizedDisplayName,
        localizedType,
        location.getBuilding().getId(),
        NavigationLocalization.localizeBuildingName(location.getBuilding().getName(), language),
        NavigationLocalization.localizeFloorLabel(location.getFloor().getLabel(), language),
        space != null ? space.getDescription() : null,
        space != null ? space.getImageUrl() : null);
  }
}
