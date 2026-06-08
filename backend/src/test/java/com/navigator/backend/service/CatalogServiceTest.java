package com.navigator.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.navigator.backend.dto.BuildingCatalogDto;
import com.navigator.backend.dto.CatalogSpaceDto;
import com.navigator.backend.model.Building;
import com.navigator.backend.model.Floor;
import com.navigator.backend.model.NavigationLocation;
import com.navigator.backend.model.Space;
import com.navigator.backend.model.SpaceType;
import com.navigator.backend.repository.BuildingRepository;
import com.navigator.backend.repository.NavigationLocationRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

  @Mock private BuildingRepository buildingRepository;
  @Mock private NavigationLocationRepository locationRepository;

  @Test
  void listBuildingsReturnsCatalogSummariesIncludingSpaceCount() {
    CatalogService service = new CatalogService(buildingRepository, locationRepository);

    when(buildingRepository.findCatalogSummaries())
        .thenReturn(List.of(new BuildingCatalogDto(7L, "Objekt G2", "Opis", "/img/g2.png", 12L)));

    List<BuildingCatalogDto> result = service.listBuildings();

    assertEquals(1, result.size());
    assertEquals("Objekt G2", result.getFirst().name());
    assertEquals(12L, result.getFirst().spaceCount());
    verify(buildingRepository).findCatalogSummaries();
  }

  @Test
  void listBuildingSpacesMapsLocationAndSpaceFieldsForFrontendCards() {
    CatalogService service = new CatalogService(buildingRepository, locationRepository);
    NavigationLocation location = buildLocation();

    when(locationRepository.findEnabledCatalogSpacesByBuildingId(2L)).thenReturn(List.of(location));

    List<CatalogSpaceDto> result = service.listBuildingSpaces(2L);

    assertEquals(1, result.size());
    CatalogSpaceDto space = result.getFirst();
    assertEquals(44L, space.id());
    assertEquals("Alfa", space.name());
    assertEquals("Učilnica", space.type());
    assertEquals("Objekt G2", space.buildingName());
    assertEquals("1. nadstropje", space.floor());
    assertEquals("Opis prostora", space.description());
    assertNull(space.imageUrl());
    verify(locationRepository).findEnabledCatalogSpacesByBuildingId(2L);
  }

  private NavigationLocation buildLocation() {
    Building building =
        Building.builder().id(2L).code("G2").name("Objekt G2").description("Opis").build();
    Floor floor =
        Floor.builder()
            .id(3L)
            .building(building)
            .code("1_nadstropje")
            .label("1. nadstropje")
            .levelNumber(BigDecimal.ONE)
            .z(BigDecimal.ONE)
            .mapImageUrl("/maps/g2.png")
            .coordinateWidth(BigDecimal.valueOf(100))
            .coordinateHeight(BigDecimal.valueOf(100))
            .build();
    SpaceType spaceType = SpaceType.builder().id(5L).code("classroom").name("Učilnica").build();
    Space space =
        Space.builder()
            .id(44L)
            .building(building)
            .floor(floor)
            .spaceType(spaceType)
            .code("G2_1_alfa")
            .name("Alfa")
            .description("Opis prostora")
            .imageUrl(null)
            .build();

    return NavigationLocation.builder()
        .id(9L)
        .displayName("Alfa - G2, 1. nadstropje")
        .searchableName("alfa")
        .locationType("classroom")
        .building(building)
        .floor(floor)
        .spaceId(44L)
        .space(space)
        .isEnabled(true)
        .build();
  }
}
