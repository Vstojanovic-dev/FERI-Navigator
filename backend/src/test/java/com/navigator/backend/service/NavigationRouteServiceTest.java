package com.navigator.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.navigator.backend.dto.RouteResponseDto;
import com.navigator.backend.dto.RouteSearchResult;
import com.navigator.backend.model.Building;
import com.navigator.backend.model.EdgeType;
import com.navigator.backend.model.Floor;
import com.navigator.backend.model.NavEdge;
import com.navigator.backend.model.NavNode;
import com.navigator.backend.model.NavigationLocation;
import com.navigator.backend.model.NodeType;
import com.navigator.backend.repository.NavigationLocationRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class NavigationRouteServiceTest {

  @Mock private NavigationLocationRepository locationRepository;

  @Mock private AStarService aStarService;

  @Test
  void searchSpacesUsesSpaceRepositoryQueryAndCapsLimit() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    when(locationRepository.searchSpaces(eq("lab"), eq(PageRequest.of(0, 200))))
        .thenReturn(List.<NavigationLocation>of());

    List<?> result = service.searchSpaces("lab", 999);

    assertTrue(result.isEmpty());
    verify(locationRepository).searchSpaces("lab", PageRequest.of(0, 200));
  }

  @Test
  void searchLocationsTrimsQueryAndNormalizesMinimumLimit() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    when(locationRepository.searchEnabled(eq("Glavni ulaz"), eq(PageRequest.of(0, 1))))
        .thenReturn(List.of());

    List<?> result = service.searchLocations("  Glavni ulaz  ", -25);

    assertTrue(result.isEmpty());
    verify(locationRepository).searchEnabled("Glavni ulaz", PageRequest.of(0, 1));
  }

  @Test
  void routeRejectsRequestsThatSpecifyBothLocationAndTargetType() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    NavigationRouteException exception =
        assertThrows(
            NavigationRouteException.class, () -> service.route(1L, 2L, "wc", true));

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    assertEquals("INVALID_TARGET", exception.getCode());
  }

  @Test
  void routeToNearestTargetChoosesReachableCandidateWithLowestCost() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);
    NavigationLocation from = buildLocation(1L, "Glavni vhod", "entrance", true, 11L, "Pritlicje");
    NavigationLocation fartherWc = buildLocation(2L, "WC A", "wc", true, 21L, "1. nadstropje");
    NavigationLocation closerWc = buildLocation(3L, "WC B", "wc", true, 31L, "Pritlicje");
    RouteSearchResult longRoute =
        RouteSearchResult.builder()
            .nodes(List.of(from.getNode(), fartherWc.getNode()))
            .edges(List.of(routeEdge(501L, from.getNode(), fartherWc.getNode())))
            .totalCost(18)
            .build();
    RouteSearchResult shortRoute =
        RouteSearchResult.builder()
            .nodes(List.of(from.getNode(), closerWc.getNode()))
            .edges(List.of(routeEdge(502L, from.getNode(), closerWc.getNode())))
            .totalCost(6)
            .build();

    when(locationRepository.findEnabledById(1L)).thenReturn(Optional.of(from));
    when(locationRepository.findEnabledByLocationType("wc"))
        .thenReturn(List.of(from, fartherWc, closerWc));
    when(aStarService.findPath(from.getNode(), fartherWc.getNode(), true)).thenReturn(longRoute);
    when(aStarService.findPath(from.getNode(), closerWc.getNode(), true)).thenReturn(shortRoute);

    RouteResponseDto result = service.route(1L, null, " wc ", true);

    assertEquals("WC B", result.getTo().getDisplayName());
    assertEquals(6, result.getTotalCost());
    assertEquals("route-1-nearest-wc-3", result.getRouteId());
  }

  @Test
  void routeToNearestTargetRejectsUnsupportedTargetType() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    NavigationRouteException exception =
        assertThrows(
            NavigationRouteException.class, () -> service.route(1L, null, "office", true));

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    assertEquals("UNSUPPORTED_TARGET_TYPE", exception.getCode());
  }

  @Test
  void routeNormalizesInvalidGraphDataIntoNavigationError() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);
    NavigationLocation from = buildLocation(1L, "Ulaz", "entrance", true, 11L, "Pritlicje");
    NavigationLocation to = buildLocation(2L, "Kabinet", "room", true, 21L, "Pritlicje");
    from.getFloor().setCoordinateWidth(null);

    RouteSearchResult route =
        RouteSearchResult.builder()
            .nodes(List.of(from.getNode(), to.getNode()))
            .edges(List.of())
            .totalCost(4)
            .build();

    when(locationRepository.findEnabledById(1L)).thenReturn(Optional.of(from));
    when(locationRepository.findEnabledById(2L)).thenReturn(Optional.of(to));
    when(aStarService.findPath(from.getNode(), to.getNode(), true)).thenReturn(route);

    NavigationRouteException exception =
        assertThrows(NavigationRouteException.class, () -> service.route(1L, 2L, null, true));

    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.getStatus());
    assertEquals("INVALID_ROUTE_DATA", exception.getCode());
  }

  @Test
  void routeRejectsNullFromLocationBeforeRepositoryLookup() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    NavigationRouteException exception =
        assertThrows(NavigationRouteException.class, () -> service.route(null, 2L, null, true));

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    assertEquals("MISSING_LOCATION", exception.getCode());
    verify(locationRepository, never()).findEnabledById(2L);
  }

  @Test
  void routeNormalizesMismatchedRouteShapeIntoNavigationError() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);
    NavigationLocation from = buildLocation(1L, "Ulaz", "entrance", true, 11L, "Pritlicje");
    NavigationLocation to = buildLocation(2L, "Kabinet", "room", true, 21L, "Pritlicje");

    RouteSearchResult route =
        RouteSearchResult.builder()
            .nodes(List.of(from.getNode(), to.getNode()))
            .edges(List.of(NavEdge.builder().id(77L).build(), NavEdge.builder().id(78L).build()))
            .totalCost(4)
            .build();

    when(locationRepository.findEnabledById(1L)).thenReturn(Optional.of(from));
    when(locationRepository.findEnabledById(2L)).thenReturn(Optional.of(to));
    when(aStarService.findPath(from.getNode(), to.getNode(), true)).thenReturn(route);

    NavigationRouteException exception =
        assertThrows(NavigationRouteException.class, () -> service.route(1L, 2L, null, true));

    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.getStatus());
    assertEquals("INVALID_ROUTE_DATA", exception.getCode());
  }

  private NavigationLocation buildLocation(
      Long locationId,
      String displayName,
      String locationType,
      boolean hasNode,
      Long nodeId,
      String floorLabel) {
    Building building =
        Building.builder().id(1L).code("G2").name("Objekt G2").description("Opis").build();
    Floor floor =
        Floor.builder()
            .id(locationId + 100)
            .building(building)
            .code("floor-" + locationId)
            .label(floorLabel)
            .levelNumber(BigDecimal.ZERO)
            .z(BigDecimal.ZERO)
            .mapImageUrl("/maps/test.png")
            .coordinateWidth(BigDecimal.valueOf(100))
            .coordinateHeight(BigDecimal.valueOf(100))
            .build();
    NavNode node =
        hasNode
            ? NavNode.builder()
                .id(nodeId)
                .externalId("node-" + nodeId)
                .label(displayName)
                .nodeType(NodeType.builder().id(1L).code("room").name("Room").build())
                .floor(floor)
                .floorId(floor.getId())
                .x(BigDecimal.ONE)
                .y(BigDecimal.TEN)
                .z(BigDecimal.ZERO)
                .build()
            : null;

    return NavigationLocation.builder()
        .id(locationId)
        .displayName(displayName)
        .searchableName(displayName.toLowerCase())
        .locationType(locationType)
        .building(building)
        .floor(floor)
        .node(node)
        .spaceId(locationId)
        .isEnabled(true)
        .build();
  }

  private NavEdge routeEdge(Long edgeId, NavNode fromNode, NavNode toNode) {
    return NavEdge.builder()
        .id(edgeId)
        .fromNode(fromNode)
        .toNode(toNode)
        .weight(BigDecimal.ONE)
        .edgeType(EdgeType.builder().id(1L).code("corridor").name("Corridor").build())
        .build();
  }
}
