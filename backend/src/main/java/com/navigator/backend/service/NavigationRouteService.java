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
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
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
  public List<NavigationLocationDto> searchSpaces(String query, int limit) {
    int normalizedLimit = Math.max(1, Math.min(limit, 200));
    String normalizedQuery = query == null ? "" : query.trim();
    return locationRepository
        .searchSpaces(normalizedQuery, PageRequest.of(0, normalizedLimit))
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

    try {
      RouteSearchResult searchResult =
          aStarService.findPath(from.getNode(), to.getNode(), allowElevator);

      if (searchResult.getNodes().isEmpty()) {
        throw new NavigationRouteException(
            HttpStatus.NOT_FOUND,
            "NO_ROUTE",
            "Za izabrane lokacije jos ne postoji unesena ruta.");
      }

      return RouteResponseDto.builder()
          .routeId("route-" + from.getId() + "-" + to.getId())
          .from(toLocationDto(from))
          .to(toLocationDto(to))
          .totalCost(searchResult.getTotalCost())
          .segments(buildSegments(searchResult))
          .build();
    } catch (IllegalStateException ex) {
      throw invalidRouteData();
    }
  }

  private RouteResponseDto routeToNearestTarget(
      Long fromLocationId, String targetType, boolean allowElevator) {
    if (!"wc".equals(targetType)) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST, "UNSUPPORTED_TARGET_TYPE", "Podrzan je samo targetType=wc.");
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

    try {
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
          .routeId(
              "route-" + from.getId() + "-nearest-" + targetType + "-" + bestLocation.getId())
          .from(toLocationDto(from))
          .to(toLocationDto(bestLocation))
          .totalCost(bestRoute.getTotalCost())
          .segments(buildSegments(bestRoute))
          .build();
    } catch (IllegalStateException ex) {
      throw invalidRouteData();
    }
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
    List<NavNode> nodes =
        searchResult.getNodes() != null ? searchResult.getNodes() : Collections.emptyList();
    List<NavEdge> edges =
        searchResult.getEdges() != null ? searchResult.getEdges() : Collections.emptyList();

    if (nodes.isEmpty()) {
      return List.of();
    }

    if (nodes.size() == 1) {
      NavNode node = nodes.get(0);
      return List.of(
          buildSegment(
              0,
              requireFloor(node),
              List.of(node),
              List.of(
                  RouteStepDto.builder()
                      .index(0)
                      .text("Start i cilj su ista lokacija.")
                      .fromNodeId(safeNodeId(node))
                      .toNodeId(safeNodeId(node))
                      .type("same_location")
                      .icon("destination")
                      .maneuverType("destination")
                      .zoneId(null)
                      .build())));
    }

    validateRouteShape(nodes, edges);

    List<SegmentDraft> drafts = new ArrayList<>();
    SegmentDraft current = new SegmentDraft(requireFloor(nodes.get(0)));
    current.nodes.add(nodes.get(0));

    for (int edgeIndex = 0; edgeIndex < edges.size(); edgeIndex++) {
      NavEdge edge = edges.get(edgeIndex);
      NavNode fromNode = nodes.get(edgeIndex);
      NavNode toNode = nodes.get(edgeIndex + 1);
      boolean floorChanged = !Objects.equals(fromNode.getFloorId(), toNode.getFloorId());

      current.nodes.add(toNode);
      current.edges.add(edge);

      if (floorChanged) {
        drafts.add(current);

        current = new SegmentDraft(requireFloor(toNode));
        current.nodes.add(toNode);
        current.incomingEdge = edge;
        current.incomingFromNode = fromNode;
      }
    }

    if (!drafts.contains(current)) {
      drafts.add(current);
    }

    List<RouteSegmentDto> segments = new ArrayList<>();
    for (int i = 0; i < drafts.size(); i++) {
      SegmentDraft draft = drafts.get(i);
      validateDraftShape(draft);
      List<RouteStepDto> generatedSteps = new ArrayList<>();
      if (draft.incomingEdge != null && draft.incomingFromNode != null && !draft.nodes.isEmpty()) {
        generatedSteps.add(buildStep(0, draft.incomingEdge, draft.incomingFromNode, draft.nodes.get(0), true));
      }
      generatedSteps.addAll(generateSegmentSteps(draft));
      segments.add(buildSegment(i, draft.floor, draft.nodes, reindexSteps(generatedSteps)));
    }
    return segments;
  }

  private List<RouteStepDto> generateSegmentSteps(SegmentDraft draft) {
    List<RouteStepDto> steps = new ArrayList<>();
    if (draft.edges.isEmpty()) {
      return steps;
    }

    int edgeIndex = 0;
    while (edgeIndex < draft.edges.size()) {
      int chunkStart = edgeIndex;
      int chunkEnd = edgeIndex;

      while (chunkEnd < draft.edges.size() - 1 && canMergeChunkBoundary(draft, chunkEnd)) {
        chunkEnd++;
      }

      NavEdge lastEdgeInChunk = draft.edges.get(chunkEnd);
      NavNode fromNode = draft.nodes.get(chunkStart);
      NavNode toNode = draft.nodes.get(chunkEnd + 1);

      String maneuverType = resolveManeuverTypeForChunk(draft, chunkStart, chunkEnd, toNode);
      String icon = resolveIcon(lastEdgeInChunk, maneuverType);
      String text =
          instructionForChunk(
              lastEdgeInChunk, fromNode, toNode, false, maneuverType, (chunkEnd - chunkStart) + 1);

      steps.add(
          RouteStepDto.builder()
              .index(steps.size())
              .text(text)
              .fromNodeId(fromNode.getId())
              .toNodeId(toNode.getId())
              .type(lastEdgeInChunk.getEdgeTypeCode())
              .icon(icon)
              .maneuverType(maneuverType)
              .zoneId(null)
              .build());

      edgeIndex = chunkEnd + 1;
    }

    return steps;
  }

  private boolean canMergeChunkBoundary(SegmentDraft draft, int edgeIndex) {
    NavEdge currentEdge = draft.edges.get(edgeIndex);
    NavEdge nextEdge = draft.edges.get(edgeIndex + 1);
    NavNode boundaryNode = draft.nodes.get(edgeIndex + 1);

    if (!isMergeableCorridorEdge(currentEdge) || !isMergeableCorridorEdge(nextEdge)) {
      return false;
    }
    if (!isTechnicalWaypoint(boundaryNode)) {
      return false;
    }
    if (!Objects.equals(draft.nodes.get(edgeIndex).getFloorId(), draft.nodes.get(edgeIndex + 2).getFloorId())) {
      return false;
    }

    String turn = classifyTurn(draft.nodes.get(edgeIndex), boundaryNode, draft.nodes.get(edgeIndex + 2));
    return "straight".equals(turn) || "slight_left".equals(turn) || "slight_right".equals(turn);
  }

  private boolean isMergeableCorridorEdge(NavEdge edge) {
    String edgeType = edge.getEdgeTypeCode();
    boolean supportedType = "corridor".equals(edgeType) || "virtual".equals(edgeType);
    return supportedType && !hasText(edge.getInstructionForward()) && !hasText(edge.getLandmark());
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
        .coordinateWidth(safeDecimal(floor.getCoordinateWidth(), "coordinateWidth", "floor " + floor.getId()))
        .coordinateHeight(safeDecimal(floor.getCoordinateHeight(), "coordinateHeight", "floor " + floor.getId()))
        .z(safeDecimal(floor.getZ(), "z", "floor " + floor.getId()))
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
              .icon(step.getIcon())
              .maneuverType(step.getManeuverType())
              .zoneId(step.getZoneId())
              .build());
    }
    return reindexed;
  }

  private RouteStepDto buildStep(
      int index, NavEdge edge, NavNode fromNode, NavNode toNode, boolean arrivalContext) {
    String type = edge.getEdgeTypeCode();
    String maneuverType = resolveManeuverType(edge, toNode, arrivalContext);
    String icon = resolveIcon(edge, maneuverType);
    return RouteStepDto.builder()
        .index(index)
        .text(instruction(edge, fromNode, toNode, arrivalContext))
        .fromNodeId(safeNodeId(fromNode))
        .toNodeId(safeNodeId(toNode))
        .type(type)
        .icon(icon)
        .maneuverType(maneuverType)
        .zoneId(null)
        .build();
  }

  private String resolveManeuverType(NavEdge edge, NavNode toNode, boolean arrivalContext) {
    if ("room".equals(toNode.getNodeTypeCode())) {
      return "destination";
    }

    String edgeType = edge.getEdgeTypeCode();
    if ("elevator".equals(edgeType)) {
      return arrivalContext ? "elevator_exit" : "elevator";
    }
    if ("stairs".equals(edgeType)) {
      return arrivalContext ? "stairs_down" : "stairs_up";
    }
    if ("virtual".equals(edgeType)) {
      return "enter";
    }
    return "straight";
  }

  private String resolveManeuverTypeForChunk(
      SegmentDraft draft, int chunkStart, int chunkEnd, NavNode toNode) {
    NavEdge edge = draft.edges.get(chunkEnd);
    String base = resolveManeuverType(edge, toNode, false);
    if (!"straight".equals(base)) {
      return base;
    }
    if (chunkEnd < draft.edges.size() - 1) {
      NavNode previous = draft.nodes.get(chunkEnd);
      NavNode current = draft.nodes.get(chunkEnd + 1);
      NavNode next = draft.nodes.get(chunkEnd + 2);
      return classifyTurn(previous, current, next);
    }
    return "straight";
  }

  private String resolveIcon(NavEdge edge, String maneuverType) {
    String edgeType = edge.getEdgeTypeCode();
    if ("elevator".equals(edgeType)) {
      return "elevator";
    }
    if ("stairs".equals(edgeType)) {
      return maneuverType;
    }
    return maneuverType;
  }

  private String instruction(
      NavEdge edge, NavNode fromNode, NavNode toNode, boolean arrivalContext) {
    return instructionForChunk(edge, fromNode, toNode, arrivalContext, resolveManeuverType(edge, toNode, arrivalContext), 1);
  }

  private String instructionForChunk(
      NavEdge edge,
      NavNode fromNode,
      NavNode toNode,
      boolean arrivalContext,
      String maneuverType,
      int mergedEdgeCount) {
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
      if (isTechnicalWaypoint(toNode)) {
        return "Nadaljujte po hodniku.";
      }
      if ("left".equals(maneuverType)) {
        return "Na razcepu zavijte levo.";
      }
      if ("right".equals(maneuverType)) {
        return "Na razcepu zavijte desno.";
      }
      if ("slight_left".equals(maneuverType)) {
        return "Rahlo zavijte levo.";
      }
      if ("slight_right".equals(maneuverType)) {
        return "Rahlo zavijte desno.";
      }
      if ("turn_back".equals(maneuverType)) {
        return "Obrnite se nazaj.";
      }
      if (mergedEdgeCount > 1) {
        return "Nadaljujte po hodniku.";
      }
      return "Nastavite prema " + toLabel + ".";
    }

    return "Pratite putanju do " + toLabel + ".";
  }

  private String classifyTurn(NavNode previous, NavNode current, NavNode next) {
    double x1 = safeNodeCoordinate(current, "x") - safeNodeCoordinate(previous, "x");
    double y1 = safeNodeCoordinate(current, "y") - safeNodeCoordinate(previous, "y");
    double x2 = safeNodeCoordinate(next, "x") - safeNodeCoordinate(current, "x");
    double y2 = safeNodeCoordinate(next, "y") - safeNodeCoordinate(current, "y");

    double norm1 = Math.hypot(x1, y1);
    double norm2 = Math.hypot(x2, y2);
    if (norm1 < 1e-6 || norm2 < 1e-6) {
      return "straight";
    }

    double dot = (x1 * x2) + (y1 * y2);
    double cross = (x1 * y2) - (y1 * x2);
    double angle = Math.toDegrees(Math.atan2(cross, dot));

    if (angle >= -25 && angle <= 25) {
      return "straight";
    }
    if (angle > 25 && angle <= 60) {
      return "slight_right";
    }
    if (angle > 60 && angle <= 140) {
      return "right";
    }
    if (angle < -25 && angle >= -60) {
      return "slight_left";
    }
    if (angle < -60 && angle >= -140) {
      return "left";
    }
    return "turn_back";
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private String readableLabel(NavNode node) {
    if (hasText(node.getLabel())) {
      return node.getLabel();
    }

    if (isTechnicalWaypoint(node)) {
      return "sledecoj tacki";
    }

    if (hasText(node.getExternalId())) {
      return node.getExternalId().replace('_', ' ').toLowerCase(Locale.ROOT);
    }

    return "cilju";
  }

  private boolean isTechnicalWaypoint(NavNode node) {
    if (Boolean.TRUE.equals(node.getIsWaypoint())) {
      return true;
    }

    String externalId = node.getExternalId();
    if (!hasText(externalId)) {
      return false;
    }

    String lowered = externalId.toLowerCase(Locale.ROOT);
    return lowered.matches(".*\\bwp\\d+\\b.*") || lowered.contains("_wp");
  }

  private RoutePointDto toPointDto(NavNode node) {
    return RoutePointDto.builder()
        .nodeId(safeNodeId(node))
        .externalId(node.getExternalId())
        .label(readableLabel(node))
        .nodeType(node.getNodeTypeCode())
        .x(safeNodeCoordinate(node, "x"))
        .y(safeNodeCoordinate(node, "y"))
        .z(safeNodeCoordinate(node, "z"))
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
        .spaceTypeName(
            space != null && space.getSpaceType() != null ? space.getSpaceType().getName() : null)
        .description(space != null ? space.getDescription() : null)
        .imageUrl(space != null ? space.getImageUrl() : null)
        .hasNode(location.hasNode())
        .build();
  }

  private static class SegmentDraft {
    private final Floor floor;
    private final List<NavNode> nodes = new ArrayList<>();
    private final List<NavEdge> edges = new ArrayList<>();
    private NavEdge incomingEdge;
    private NavNode incomingFromNode;

    private SegmentDraft(Floor floor) {
      this.floor = floor;
    }
  }

  private NavigationRouteException invalidRouteData() {
    return new NavigationRouteException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "INVALID_ROUTE_DATA",
        "Navigacioni podaci su nepotpuni ili nekonzistentni.");
  }

  private void validateRouteShape(List<NavNode> nodes, List<NavEdge> edges) {
    if (edges.size() != nodes.size() - 1) {
      throw new IllegalStateException("Route nodes/edges shape is inconsistent.");
    }
  }

  private void validateDraftShape(SegmentDraft draft) {
    if (draft.nodes.isEmpty()) {
      throw new IllegalStateException("Route segment is missing nodes.");
    }
    if (!draft.edges.isEmpty() && draft.nodes.size() != draft.edges.size() + 1) {
      throw new IllegalStateException("Route segment nodes/edges shape is inconsistent.");
    }
  }

  private Floor requireFloor(NavNode node) {
    if (node == null || node.getFloor() == null) {
      throw new IllegalStateException("Missing floor for node " + safeNodeId(node));
    }
    return node.getFloor();
  }

  private Long safeNodeId(NavNode node) {
    if (node == null || node.getId() == null) {
      throw new IllegalStateException("Missing node id.");
    }
    return node.getId();
  }

  private double safeNodeCoordinate(NavNode node, String field) {
    if (node == null) {
      throw new IllegalStateException("Missing node for coordinate " + field);
    }

    return switch (field) {
      case "x" -> safeDecimal(node.getX(), field, "node " + safeNodeId(node));
      case "y" -> safeDecimal(node.getY(), field, "node " + safeNodeId(node));
      case "z" -> safeDecimal(node.getZ(), field, "node " + safeNodeId(node));
      default -> throw new IllegalArgumentException("Unsupported coordinate field: " + field);
    };
  }

  private double safeDecimal(java.math.BigDecimal value, String field, String owner) {
    if (value == null) {
      throw new IllegalStateException("Missing " + field + " for " + owner);
    }
    return value.doubleValue();
  }
}
