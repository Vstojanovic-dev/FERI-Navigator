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
import java.util.Collections;
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

  @Test
  void routeKeepsSingleFloorPathInsideOneSegment() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    Building g2 = Building.builder().id(1L).code("G2").name("Objekt G2").description("G2").build();
    Floor g2Floor = buildFloor(101L, g2, "pritlicje", "Pritlicje", "/maps/g2.png");

    NavNode start = buildNode(11L, "G2_start", "G2 start", "corridor", g2Floor, 10, 10, true);
    NavNode waypoint = buildNode(12L, "G2_wp1", "G2 wp1", "corridor", g2Floor, 20, 20, true);
    NavNode destination = buildNode(13L, "G2_room", "G2 room", "room", g2Floor, 30, 30, false);

    NavigationLocation from = buildLocation(1L, "Start", "entrance", start, g2);
    NavigationLocation to = buildLocation(2L, "Destinacija", "room", destination, g2);

    RouteSearchResult route =
        RouteSearchResult.builder()
            .nodes(List.of(start, waypoint, destination))
            .edges(
                List.of(
                    routeEdge(501L, start, waypoint, "corridor"),
                    routeEdge(502L, waypoint, destination, "corridor")))
            .totalCost(5)
            .build();

    when(locationRepository.findEnabledById(1L)).thenReturn(Optional.of(from));
    when(locationRepository.findEnabledById(2L)).thenReturn(Optional.of(to));
    when(locationRepository.findEnabledByNodeIdIn(List.of(11L, 12L, 13L)))
        .thenReturn(List.of(to));
    when(aStarService.findPath(start, destination, true)).thenReturn(route);

    RouteResponseDto result = service.route(1L, 2L, null, true);

    assertEquals(1, result.getSegments().size());
    assertEquals(
        List.of(11L, 12L, 13L),
        result.getSegments().get(0).getPath().stream()
            .map(RouteResponseDto.RoutePointDto::getNodeId)
            .toList());
    assertEquals("G2", result.getSegments().get(0).getBuildingCode());
    assertEquals("Pritlicje", result.getSegments().get(0).getFloorLabel());
  }

  @Test
  void routeSplitsCrossFloorTransferWithoutLeakingNextFloorPointIntoPreviousSegment() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    Building g2 = Building.builder().id(1L).code("G2").name("Objekt G2").description("G2").build();
    Floor groundFloor = buildFloor(101L, g2, "pritlicje", "Pritlicje", "/maps/g2-p.png");
    Floor firstFloor =
        buildFloor(102L, g2, "1_nadstropje", "1. nadstropje", "/maps/g2-1.png");

    NavNode start = buildNode(11L, "G2_start", "G2 start", "corridor", groundFloor, 10, 10, true);
    NavNode stairsDown =
        buildNode(12L, "G2_stairs_p", "Stepenice P", "stairs", groundFloor, 20, 20, true);
    NavNode stairsUp =
        buildNode(21L, "G2_stairs_1", "Stepenice 1", "stairs", firstFloor, 40, 40, true);
    NavNode destination =
        buildNode(22L, "G2_room_1", "G2 room 1", "room", firstFloor, 50, 50, false);

    NavigationLocation from = buildLocation(1L, "Start", "entrance", start, g2);
    NavigationLocation to = buildLocation(2L, "Destinacija", "room", destination, g2);

    RouteSearchResult route =
        RouteSearchResult.builder()
            .nodes(List.of(start, stairsDown, stairsUp, destination))
            .edges(
                List.of(
                    routeEdge(601L, start, stairsDown, "corridor"),
                    routeEdge(602L, stairsDown, stairsUp, "stairs"),
                    routeEdge(603L, stairsUp, destination, "corridor")))
            .totalCost(7)
            .build();

    when(locationRepository.findEnabledById(1L)).thenReturn(Optional.of(from));
    when(locationRepository.findEnabledById(2L)).thenReturn(Optional.of(to));
    when(locationRepository.findEnabledByNodeIdIn(List.of(11L, 12L, 21L, 22L)))
        .thenReturn(List.of(to));
    when(aStarService.findPath(start, destination, true)).thenReturn(route);

    RouteResponseDto result = service.route(1L, 2L, null, true);

    assertEquals(2, result.getSegments().size());
    assertEquals(
        List.of(11L, 12L),
        result.getSegments().get(0).getPath().stream()
            .map(RouteResponseDto.RoutePointDto::getNodeId)
            .toList());
    assertEquals(
        List.of(21L, 22L),
        result.getSegments().get(1).getPath().stream()
            .map(RouteResponseDto.RoutePointDto::getNodeId)
            .toList());
    assertEquals("Pritlicje", result.getSegments().get(0).getFloorLabel());
    assertEquals("1. nadstropje", result.getSegments().get(1).getFloorLabel());
  }

  @Test
  void routeSplitsCrossBuildingTransferWithoutLeakingNextBuildingPointIntoPreviousSegment() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    Building g2 = Building.builder().id(1L).code("G2").name("Objekt G2").description("G2").build();
    Building g3 = Building.builder().id(2L).code("G3").name("Objekt G3").description("G3").build();

    Floor g2Floor = buildFloor(101L, g2, "pritlicje", "Pritlicje", "/maps/g2.png");
    Floor g3Floor = buildFloor(201L, g3, "pritlicje", "Pritlicje", "/maps/g3.png");

    NavNode start = buildNode(11L, "G2_start", "G2 start", "corridor", g2Floor, 10, 10, true);
    NavNode g2Exit =
        buildNode(
            12L,
            "G2_pritlicje_izlaz_za_g3_objekat",
            "Izlaz za G3",
            "building_transfer",
            g2Floor,
            20,
            20,
            true);
    NavNode g3Entry =
        buildNode(
            21L,
            "G3_pritlicje_vhod_iz_g2",
            "Vhod iz G2",
            "building_transfer",
            g3Floor,
            900,
            900,
            true);
    NavNode destination = buildNode(22L, "G3_room", "G3 room", "room", g3Floor, 930, 930, false);

    NavigationLocation from = buildLocation(1L, "Start", "entrance", start, g2);
    NavigationLocation to = buildLocation(2L, "Destinacija", "room", destination, g3);

    RouteSearchResult route =
        RouteSearchResult.builder()
            .nodes(List.of(start, g2Exit, g3Entry, destination))
            .edges(
                List.of(
                    routeEdge(501L, start, g2Exit, "corridor"),
                    routeEdge(502L, g2Exit, g3Entry, "building_transfer"),
                    routeEdge(503L, g3Entry, destination, "corridor")))
            .totalCost(8)
            .build();

    when(locationRepository.findEnabledById(1L)).thenReturn(Optional.of(from));
    when(locationRepository.findEnabledById(2L)).thenReturn(Optional.of(to));
    when(locationRepository.findEnabledByNodeIdIn(List.of(11L, 12L, 21L, 22L)))
        .thenReturn(List.of(to));
    when(aStarService.findPath(start, destination, true)).thenReturn(route);

    RouteResponseDto result = service.route(1L, 2L, null, true);

    assertEquals(2, result.getSegments().size());
    assertEquals(List.of(11L, 12L), result.getSegments().get(0).getPath().stream().map(RouteResponseDto.RoutePointDto::getNodeId).toList());
    assertEquals(List.of(21L, 22L), result.getSegments().get(1).getPath().stream().map(RouteResponseDto.RoutePointDto::getNodeId).toList());
    assertEquals("G2", result.getSegments().get(0).getBuildingCode());
    assertEquals("G3", result.getSegments().get(1).getBuildingCode());
  }

  @Test
  void routeDoesNotTreatIntermediateRoomNodeAsFinalDestination() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    Building g2 = Building.builder().id(1L).code("G2").name("Objekt G2").description("G2").build();
    Floor g2Floor = buildFloor(101L, g2, "2_nadstropje", "2. nadstropje", "/maps/g2-2.png");

    NavNode start = buildNode(11L, "G2_p1_alfa", "G2 P1 Alfa", "corridor", g2Floor, 10, 10, true);
    NavNode studyRoom =
        buildNode(12L, "prostor_za_ucenje2", null, "room", g2Floor, 30, 10, false);
    NavNode buildingExit =
        buildNode(13L, "izlaz_za_g3_objekat", null, "building_transfer", g2Floor, 50, 10, false);

    NavigationLocation from = buildLocation(1L, "G2 P1 Alfa", "entrance", start, g2);
    NavigationLocation to = buildLocation(2L, "Izlaz Za G3 Objekat", "exit", buildingExit, g2);
    NavigationLocation studyRoomLocation =
        buildLocation(3L, "Prostor Za Ucenje 2", "room", studyRoom, g2);

    RouteSearchResult route =
        RouteSearchResult.builder()
            .nodes(List.of(start, studyRoom, buildingExit))
            .edges(
                List.of(
                    routeEdge(501L, start, studyRoom, "corridor"),
                    routeEdge(502L, studyRoom, buildingExit, "corridor")))
            .totalCost(6)
            .build();

    when(locationRepository.findEnabledById(1L)).thenReturn(Optional.of(from));
    when(locationRepository.findEnabledById(2L)).thenReturn(Optional.of(to));
    when(locationRepository.findEnabledByNodeIdIn(List.of(11L, 12L, 13L)))
        .thenReturn(List.of(studyRoomLocation, to));
    when(aStarService.findPath(start, buildingExit, true)).thenReturn(route);

    RouteResponseDto result = service.route(1L, 2L, null, true);

    assertEquals(1, result.getSegments().size());
    assertEquals(
        "Nastavite prema Prostor Za Ucenje 2.",
        result.getSegments().get(0).getSteps().get(0).getText());
    assertEquals(
        "Stigli ste do lokacije Izlaz Za G3 Objekat.",
        result.getSegments().get(0).getSteps().get(1).getText());
  }

  @Test
  void routeHumanizesTransferLabelsAndAddsTransferArrivalStep() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    Building g2 = Building.builder().id(1L).code("G2").name("Objekt G2").description("G2").build();
    Building g3 = Building.builder().id(2L).code("G3").name("Objekt G3").description("G3").build();
    Floor g2Floor = buildFloor(101L, g2, "2_nadstropje", "2. nadstropje", "/maps/g2-2.png");
    Floor g3Floor = buildFloor(201L, g3, "2_nadstropje", "2. nadstropje", "/maps/g3-2.png");

    NavNode start = buildNode(11L, "G2_p1_alfa", "G2 P1 Alfa", "corridor", g2Floor, 10, 10, true);
    NavNode g2Exit =
        buildNode(12L, "izlaz_za_g3_objekat", null, "building_transfer", g2Floor, 30, 10, false);
    NavNode g3Entry =
        buildNode(21L, "vhod_iz_g2", null, "building_transfer", g3Floor, 900, 900, false);
    NavNode destination =
        buildNode(22L, "seminarska_soba", null, "room", g3Floor, 930, 930, false);

    NavigationLocation from = buildLocation(1L, "G2 P1 Alfa", "entrance", start, g2);
    NavigationLocation to = buildLocation(2L, "Seminarska Soba", "room", destination, g3);

    RouteSearchResult route =
        RouteSearchResult.builder()
            .nodes(List.of(start, g2Exit, g3Entry, destination))
            .edges(
                List.of(
                    routeEdge(501L, start, g2Exit, "corridor"),
                    routeEdge(502L, g2Exit, g3Entry, "building_transfer"),
                    routeEdge(503L, g3Entry, destination, "corridor")))
            .totalCost(8)
            .build();

    when(locationRepository.findEnabledById(1L)).thenReturn(Optional.of(from));
    when(locationRepository.findEnabledById(2L)).thenReturn(Optional.of(to));
    when(locationRepository.findEnabledByNodeIdIn(List.of(11L, 12L, 21L, 22L)))
        .thenReturn(Collections.singletonList(to));
    when(aStarService.findPath(start, destination, true)).thenReturn(route);

    RouteResponseDto result = service.route(1L, 2L, null, true);

    assertEquals("Nastavite prema Izlaz Za G3 Objekat.", result.getSegments().get(0).getSteps().get(0).getText());
    assertEquals("building_transfer", result.getSegments().get(1).getSteps().get(0).getManeuverType());
    assertEquals(
        "Usli ste u Objekt G3. Nastavite po prikazanoj putanji.",
        result.getSegments().get(1).getSteps().get(0).getText());
    assertEquals(
        "Stigli ste do lokacije Seminarska Soba.",
        result.getSegments().get(1).getSteps().get(1).getText());
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

  private NavigationLocation buildLocation(
      Long locationId, String displayName, String locationType, NavNode node, Building building) {
    return NavigationLocation.builder()
        .id(locationId)
        .displayName(displayName)
        .searchableName(displayName.toLowerCase())
        .locationType(locationType)
        .building(building)
        .floor(node.getFloor())
        .node(node)
        .spaceId(locationId)
        .isEnabled(true)
        .build();
  }

  private Floor buildFloor(Long floorId, Building building, String code, String label, String mapImageUrl) {
    return Floor.builder()
        .id(floorId)
        .building(building)
        .code(code)
        .label(label)
        .levelNumber(BigDecimal.ZERO)
        .z(BigDecimal.ZERO)
        .mapImageUrl(mapImageUrl)
        .coordinateWidth(BigDecimal.valueOf(1000))
        .coordinateHeight(BigDecimal.valueOf(1000))
        .build();
  }

  private NavNode buildNode(
      Long nodeId,
      String externalId,
      String label,
      String nodeTypeCode,
      Floor floor,
      int x,
      int y,
      boolean waypoint) {
    return NavNode.builder()
        .id(nodeId)
        .externalId(externalId)
        .label(label)
        .nodeType(NodeType.builder().id(1L).code(nodeTypeCode).name(nodeTypeCode).build())
        .floor(floor)
        .floorId(floor.getId())
        .x(BigDecimal.valueOf(x))
        .y(BigDecimal.valueOf(y))
        .z(BigDecimal.ZERO)
        .isWaypoint(waypoint)
        .build();
  }

  private NavEdge routeEdge(Long edgeId, NavNode fromNode, NavNode toNode) {
    return routeEdge(edgeId, fromNode, toNode, "corridor");
  }

  private NavEdge routeEdge(Long edgeId, NavNode fromNode, NavNode toNode, String edgeTypeCode) {
    return NavEdge.builder()
        .id(edgeId)
        .fromNode(fromNode)
        .toNode(toNode)
        .weight(BigDecimal.ONE)
        .edgeType(EdgeType.builder().id(1L).code(edgeTypeCode).name(edgeTypeCode).build())
        .build();
  }
}
