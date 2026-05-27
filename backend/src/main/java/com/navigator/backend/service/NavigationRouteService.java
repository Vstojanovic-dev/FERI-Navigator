package com.navigator.backend.service;

import com.navigator.backend.dto.NavigationLocationDto;
import com.navigator.backend.dto.RouteResponseDto;
import com.navigator.backend.dto.RouteResponseDto.RoutePointDto;
import com.navigator.backend.dto.RouteResponseDto.RouteSegmentDto;
import com.navigator.backend.dto.RouteResponseDto.RouteStepDto;
import com.navigator.backend.dto.RouteSearchResult;
import com.navigator.backend.model.Floor;
import com.navigator.backend.model.NavEdge;
import com.navigator.backend.model.NavNode;
import com.navigator.backend.model.NavigationLocation;
import com.navigator.backend.model.Space;
import com.navigator.backend.repository.NavigationLocationRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NavigationRouteService {

  private final NavigationLocationRepository locationRepository;
  private final AStarService aStarService;

  @Transactional(readOnly = true)
  public List<NavigationLocationDto> searchLocations(String query, int limit) {
    int normalizedLimit = Math.max(1, Math.min(limit, 200));
    String normalizedQuery = query == null ? "" : query.trim();
    return locationRepository
        .searchEnabled(normalizedQuery, PageRequest.of(0, normalizedLimit))
        .stream()
        .map(this::toLocationDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public RouteResponseDto route(
      Long fromLocationId, Long toLocationId, String targetType, boolean allowElevator) {
    String normalizedTargetType = normalizeTargetType(targetType);
    boolean hasLocationTarget = toLocationId != null;
    boolean hasNearestTarget = normalizedTargetType != null;

    if (hasLocationTarget == hasNearestTarget) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST,
          "INVALID_TARGET",
          "Posaljite tacno jedan cilj: toLocationId ili targetType.");
    }

    if (hasNearestTarget) {
      return routeToNearestTarget(fromLocationId, normalizedTargetType, allowElevator);
    }

    NavigationLocation from = findLocation(fromLocationId, "fromLocationId");
    NavigationLocation to = findLocation(toLocationId, "toLocationId");

    if (!from.hasNode()) {
      throw new NavigationRouteException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "LOCATION_WITHOUT_NODE",
          "Pocetna lokacija jos nije povezana sa navigacionim grafom.");
    }

    if (!to.hasNode()) {
      throw new NavigationRouteException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "LOCATION_WITHOUT_NODE",
          "Ciljna lokacija jos nije povezana sa navigacionim grafom.");
    }

    RouteSearchResult searchResult =
        aStarService.findPath(from.getNode(), to.getNode(), allowElevator);

    if (searchResult.getNodes().isEmpty()) {
      throw new NavigationRouteException(
          HttpStatus.NOT_FOUND, "NO_ROUTE", "Za izabrane lokacije jos ne postoji unesena ruta.");
    }

    return RouteResponseDto.builder()
        .routeId("route-" + from.getId() + "-" + to.getId())
        .from(toLocationDto(from))
        .to(toLocationDto(to))
        .totalCost(searchResult.getTotalCost())
        .segments(buildSegments(searchResult))
        .build();
  }

  private RouteResponseDto routeToNearestTarget(
      Long fromLocationId, String targetType, boolean allowElevator) {
    if (!"wc".equals(targetType)) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST,
          "UNSUPPORTED_TARGET_TYPE",
          "Podrzan je samo targetType=wc.");
    }

    NavigationLocation from = findLocation(fromLocationId, "fromLocationId");
    if (!from.hasNode()) {
      throw new NavigationRouteException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "LOCATION_WITHOUT_NODE",
          "Pocetna lokacija jos nije povezana sa navigacionim grafom.");
    }

    List<NavigationLocation> candidates =
        locationRepository.findEnabledByLocationType(targetType).stream()
            .filter(NavigationLocation::hasNode)
            .filter(candidate -> !candidate.getId().equals(from.getId()))
            .toList();

    if (candidates.isEmpty()) {
      throw new NavigationRouteException(
          HttpStatus.NOT_FOUND,
          "TARGET_TYPE_NOT_AVAILABLE",
          "Najblizi WC trenutno nije dostupan u navigacionim podacima.");
    }

    NavigationLocation bestLocation = null;
    RouteSearchResult bestRoute = null;
    for (NavigationLocation candidate : candidates) {
      RouteSearchResult candidateRoute =
          aStarService.findPath(from.getNode(), candidate.getNode(), allowElevator);
      if (candidateRoute.getNodes().isEmpty()) {
        continue;
      }
      if (bestRoute == null || candidateRoute.getTotalCost() < bestRoute.getTotalCost()) {
        bestRoute = candidateRoute;
        bestLocation = candidate;
      }
    }

    if (bestRoute == null || bestLocation == null) {
      throw new NavigationRouteException(
          HttpStatus.NOT_FOUND,
          "NO_ROUTE_TO_TARGET_TYPE",
          "Do najblizeg WC-a trenutno ne postoji unesena ruta.");
    }

    return RouteResponseDto.builder()
        .routeId("route-" + from.getId() + "-nearest-" + targetType + "-" + bestLocation.getId())
        .from(toLocationDto(from))
        .to(toLocationDto(bestLocation))
        .totalCost(bestRoute.getTotalCost())
        .segments(buildSegments(bestRoute))
        .build();
  }

  private String normalizeTargetType(String targetType) {
    if (targetType == null || targetType.isBlank()) {
      return null;
    }
    return targetType.trim().toLowerCase(Locale.ROOT);
  }

  private NavigationLocation findLocation(Long locationId, String fieldName) {
    if (locationId == null) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST, "MISSING_LOCATION", "Parametar '" + fieldName + "' je obavezan.");
    }

    return locationRepository
        .findEnabledById(locationId)
        .orElseThrow(
            () ->
                new NavigationRouteException(
                    HttpStatus.NOT_FOUND,
                    "LOCATION_NOT_FOUND",
                    "Lokacija nije pronadjena: " + locationId));
  }

  private List<RouteSegmentDto> buildSegments(RouteSearchResult searchResult) {
    List<NavNode> nodes = searchResult.getNodes();
    List<NavEdge> edges = searchResult.getEdges();

    if (nodes.size() == 1) {
      NavNode node = nodes.get(0);
      return List.of(
          buildSegment(
              0,
              node.getFloor(),
              List.of(node),
              List.of(
                  RouteStepDto.builder()
                      .index(0)
                      .text("Start i cilj su ista lokacija.")
                      .fromNodeId(node.getId())
                      .toNodeId(node.getId())
                      .type("same_location")
                      .build())));
    }

    List<SegmentDraft> drafts = new ArrayList<>();
    SegmentDraft current = new SegmentDraft(nodes.get(0).getFloor());
    current.nodes.add(nodes.get(0));

    for (int edgeIndex = 0; edgeIndex < edges.size(); edgeIndex++) {
      NavEdge edge = edges.get(edgeIndex);
      NavNode fromNode = nodes.get(edgeIndex);
      NavNode toNode = nodes.get(edgeIndex + 1);
      boolean floorChanged = !fromNode.getFloorId().equals(toNode.getFloorId());

      current.nodes.add(toNode);
      current.steps.add(buildStep(current.steps.size(), edge, fromNode, toNode, false));

      if (floorChanged) {
        drafts.add(current);

        current = new SegmentDraft(toNode.getFloor());
        current.nodes.add(toNode);
        RouteStepDto arrivalStep = buildStep(0, edge, fromNode, toNode, true);
        current.steps.add(arrivalStep);
      }
    }

    if (!drafts.contains(current)) {
      drafts.add(current);
    }

    List<RouteSegmentDto> segments = new ArrayList<>();
    for (int i = 0; i < drafts.size(); i++) {
      SegmentDraft draft = drafts.get(i);
      segments.add(buildSegment(i, draft.floor, draft.nodes, reindexSteps(draft.steps)));
    }
    return segments;
  }

  private RouteSegmentDto buildSegment(
      int index, Floor floor, List<NavNode> nodes, List<RouteStepDto> steps) {
    boolean usesElevator = steps.stream().anyMatch(step -> "elevator".equals(step.getType()));
    boolean usesStairs = steps.stream().anyMatch(step -> "stairs".equals(step.getType()));

    return RouteSegmentDto.builder()
        .index(index)
        .buildingId(floor.getBuilding().getId())
        .buildingCode(floor.getBuilding().getCode())
        .buildingName(floor.getBuilding().getName())
        .floorId(floor.getId())
        .floorCode(floor.getCode())
        .floorLabel(floor.getLabel())
        .mapImageUrl(floor.getMapImageUrl())
        .coordinateWidth(floor.getCoordinateWidth().doubleValue())
        .coordinateHeight(floor.getCoordinateHeight().doubleValue())
        .z(floor.getZ().doubleValue())
        .usesElevator(usesElevator)
        .usesStairs(usesStairs)
        .path(nodes.stream().map(this::toPointDto).toList())
        .steps(steps)
        .build();
  }

  private List<RouteStepDto> reindexSteps(List<RouteStepDto> steps) {
    List<RouteStepDto> reindexed = new ArrayList<>();
    for (int i = 0; i < steps.size(); i++) {
      RouteStepDto step = steps.get(i);
      reindexed.add(
          RouteStepDto.builder()
              .index(i)
              .text(step.getText())
              .fromNodeId(step.getFromNodeId())
              .toNodeId(step.getToNodeId())
              .type(step.getType())
              .build());
    }
    return reindexed;
  }

  private RouteStepDto buildStep(
      int index, NavEdge edge, NavNode fromNode, NavNode toNode, boolean arrivalContext) {
    String type = edge.getEdgeTypeCode();
    return RouteStepDto.builder()
        .index(index)
        .text(instruction(edge, fromNode, toNode, arrivalContext))
        .fromNodeId(fromNode.getId())
        .toNodeId(toNode.getId())
        .type(type)
        .build();
  }

  private String instruction(
      NavEdge edge, NavNode fromNode, NavNode toNode, boolean arrivalContext) {
    if (!arrivalContext && hasText(edge.getInstructionForward())) {
      return edge.getInstructionForward();
    }

    String edgeType = edge.getEdgeTypeCode();
    String toLabel = readableLabel(toNode);

    if ("elevator".equals(edgeType)) {
      return arrivalContext
          ? "Izadjite iz lifta i nastavite po prikazanoj putanji."
          : "Udjite u lift i idite na sprat " + toNode.getFloor().getLabel() + ".";
    }

    if ("stairs".equals(edgeType)) {
      return arrivalContext
          ? "Izadjite sa stepenica i nastavite po prikazanoj putanji."
          : "Idite stepenicama do sprata " + toNode.getFloor().getLabel() + ".";
    }

    if ("room".equals(toNode.getNodeTypeCode())) {
      return "Stigli ste do lokacije " + toLabel + ".";
    }

    if ("corridor".equals(edgeType) || "virtual".equals(edgeType)) {
      return "Nastavite prema " + toLabel + ".";
    }

    return "Pratite putanju do " + toLabel + ".";
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private String readableLabel(NavNode node) {
    if (hasText(node.getLabel())) {
      return node.getLabel();
    }

    return node.getExternalId().replace('_', ' ').toLowerCase(Locale.ROOT);
  }

  private RoutePointDto toPointDto(NavNode node) {
    return RoutePointDto.builder()
        .nodeId(node.getId())
        .externalId(node.getExternalId())
        .label(readableLabel(node))
        .nodeType(node.getNodeTypeCode())
        .x(node.getX().doubleValue())
        .y(node.getY().doubleValue())
        .z(node.getZ().doubleValue())
        .build();
  }

  private NavigationLocationDto toLocationDto(NavigationLocation location) {
    Space space = location.getSpace();

    return NavigationLocationDto.builder()
        .id(location.getId())
        .displayName(location.getDisplayName())
        .locationType(location.getLocationType())
        .buildingId(location.getBuilding().getId())
        .buildingCode(location.getBuilding().getCode())
        .buildingName(location.getBuilding().getName())
        .floorId(location.getFloor().getId())
        .floorCode(location.getFloor().getCode())
        .floorLabel(location.getFloor().getLabel())
        .nodeId(location.getNode() != null ? location.getNode().getId() : null)
        .spaceId(space != null ? space.getId() : location.getSpaceId())
        .spaceName(space != null ? space.getName() : null)
        .spaceTypeName(space != null && space.getSpaceType() != null ? space.getSpaceType().getName() : null)
        .description(space != null ? space.getDescription() : null)
        .imageUrl(space != null ? space.getImageUrl() : null)
        .hasNode(location.hasNode())
        .build();
  }

  private static class SegmentDraft {
    private final Floor floor;
    private final List<NavNode> nodes = new ArrayList<>();
    private final List<RouteStepDto> steps = new ArrayList<>();

    private SegmentDraft(Floor floor) {
      this.floor = floor;
    }
  }
}
