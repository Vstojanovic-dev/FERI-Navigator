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
import java.util.Comparator;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
  private final VerticalPreferenceResolver verticalPreferenceResolver;

  @Transactional(readOnly = true)
  public List<NavigationLocationDto> searchLocations(String query, int limit) {
    return searchLocations(query, limit, null);
  }

  @Transactional(readOnly = true)
  public List<NavigationLocationDto> searchLocations(String query, int limit, String acceptLanguage) {
    NavigationLanguage language = NavigationLanguage.fromHeader(acceptLanguage);
    int normalizedLimit = Math.max(1, Math.min(limit, 200));
    String normalizedQuery = query == null ? "" : query.trim();
    return locationRepository
        .searchEnabled(normalizedQuery, PageRequest.of(0, normalizedLimit))
        .stream()
        .map(location -> toLocationDto(location, language))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<NavigationLocationDto> searchSpaces(String query, int limit) {
    return searchSpaces(query, limit, null);
  }

  @Transactional(readOnly = true)
  public List<NavigationLocationDto> searchSpaces(String query, int limit, String acceptLanguage) {
    NavigationLanguage language = NavigationLanguage.fromHeader(acceptLanguage);
    int normalizedLimit = Math.max(1, Math.min(limit, 200));
    String normalizedQuery = query == null ? "" : query.trim();
    return locationRepository
        .searchSpaces(normalizedQuery, PageRequest.of(0, normalizedLimit))
        .stream()
        .map(location -> toLocationDto(location, language))
        .toList();
  }

  @Transactional(readOnly = true)
  public RouteResponseDto route(
      Long fromLocationId, Long toLocationId, String targetType, boolean allowElevator) {
    return route(fromLocationId, toLocationId, targetType, allowElevator, null);
  }

  @Transactional(readOnly = true)
  public RouteResponseDto route(
      Long fromLocationId,
      Long toLocationId,
      String targetType,
      boolean allowElevator,
      String acceptLanguage) {
    NavigationLanguage language = NavigationLanguage.fromHeader(acceptLanguage);
    String normalizedTargetType = normalizeTargetType(targetType);
    boolean hasLocationTarget = toLocationId != null;
    boolean hasNearestTarget = normalizedTargetType != null;

    if (hasLocationTarget == hasNearestTarget) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST,
          "INVALID_TARGET",
          NavigationTexts.exactlyOneTarget(language));
    }

    if (hasNearestTarget) {
      return routeToNearestTarget(fromLocationId, normalizedTargetType, allowElevator, language);
    }

    NavigationLocation from = findLocation(fromLocationId, "fromLocationId", language);
    NavigationLocation to = findLocation(toLocationId, "toLocationId", language);

    if (!from.hasNode()) {
      throw new NavigationRouteException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "LOCATION_WITHOUT_NODE",
          NavigationTexts.startLocationNotLinked(language));
    }

    if (!to.hasNode()) {
      throw new NavigationRouteException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "LOCATION_WITHOUT_NODE",
          NavigationTexts.targetLocationNotLinked(language));
    }

    try {
      RouteSearchResult searchResult =
          findPreferredRoute(from.getNode(), to.getNode(), allowElevator);

      if (searchResult.getNodes().isEmpty()) {
        throw new NavigationRouteException(
            HttpStatus.NOT_FOUND,
            "NO_ROUTE",
            NavigationTexts.noRouteForSelectedLocations(language));
      }

      return RouteResponseDto.builder()
          .routeId("route-" + from.getId() + "-" + to.getId())
          .from(toLocationDto(from, language))
          .to(toLocationDto(to, language))
          .totalCost(searchResult.getTotalCost())
          .segments(buildSegments(searchResult, to, language))
          .build();
    } catch (IllegalStateException ex) {
      throw invalidRouteData(language);
    }
  }

  private RouteResponseDto routeToNearestTarget(
      Long fromLocationId,
      String targetType,
      boolean allowElevator,
      NavigationLanguage language) {
    if (!"wc".equals(targetType)) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST,
          "UNSUPPORTED_TARGET_TYPE",
          NavigationTexts.supportedTargetTypeOnlyWc(language));
    }

    NavigationLocation from = findLocation(fromLocationId, "fromLocationId", language);
    if (!from.hasNode()) {
      throw new NavigationRouteException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "LOCATION_WITHOUT_NODE",
          NavigationTexts.startLocationNotLinked(language));
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
          NavigationTexts.nearestWcUnavailable(language));
    }

    try {
      NavigationLocation bestLocation = null;
      RouteSearchResult bestRoute = null;
      for (NavigationLocation candidate : candidates) {
        RouteSearchResult candidateRoute =
            findPreferredRoute(from.getNode(), candidate.getNode(), allowElevator);
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
            NavigationTexts.noRouteToNearestWc(language));
      }

      return RouteResponseDto.builder()
          .routeId(
              "route-" + from.getId() + "-nearest-" + targetType + "-" + bestLocation.getId())
          .from(toLocationDto(from, language))
          .to(toLocationDto(bestLocation, language))
          .totalCost(bestRoute.getTotalCost())
          .segments(buildSegments(bestRoute, bestLocation, language))
          .build();
    } catch (IllegalStateException ex) {
      throw invalidRouteData(language);
    }
  }

  private String normalizeTargetType(String targetType) {
    if (targetType == null || targetType.isBlank()) {
      return null;
    }
    return targetType.trim().toLowerCase(Locale.ROOT);
  }

  private RouteSearchResult findPreferredRoute(
      NavNode start, NavNode goal, boolean allowElevator) {
    for (VerticalTraversalMode attempt :
        verticalPreferenceResolver.resolveAttemptOrder(start, goal, allowElevator)) {
      RouteSearchResult result = aStarService.findPath(start, goal, allowElevator, attempt);
      if (result.getNodes() != null && !result.getNodes().isEmpty()) {
        return result;
      }
    }

    return RouteSearchResult.builder().nodes(List.of()).edges(List.of()).totalCost(0).build();
  }

  private NavigationLocation findLocation(
      Long locationId, String fieldName, NavigationLanguage language) {
    if (locationId == null) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST,
          "MISSING_LOCATION",
          NavigationTexts.missingLocation(fieldName, language));
    }

    return locationRepository
        .findEnabledById(locationId)
        .orElseThrow(
            () ->
                new NavigationRouteException(
                    HttpStatus.NOT_FOUND,
                    "LOCATION_NOT_FOUND",
                    NavigationTexts.locationNotFound(locationId, language)));
  }

  private List<RouteSegmentDto> buildSegments(
      RouteSearchResult searchResult,
      NavigationLocation destinationLocation,
      NavigationLanguage language) {
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
                      .text(NavigationTexts.sameLocation(language))
                      .fromNodeId(safeNodeId(node))
                      .toNodeId(safeNodeId(node))
                      .type("same_location")
                      .icon("destination")
                      .maneuverType("destination")
                      .zoneId(null)
                      .build()),
              Collections.emptyMap(),
              language));
    }

    validateRouteShape(nodes, edges);
    Long finalDestinationNodeId =
        destinationLocation != null && destinationLocation.hasNode()
            ? safeNodeId(destinationLocation.getNode())
            : safeNodeId(nodes.get(nodes.size() - 1));
    Map<Long, String> nodeDisplayNames =
        resolveNodeDisplayNames(nodes, destinationLocation, language);

    List<SegmentDraft> drafts = new ArrayList<>();
    SegmentDraft current = new SegmentDraft(requireFloor(nodes.get(0)));
    current.nodes.add(nodes.get(0));

    for (int edgeIndex = 0; edgeIndex < edges.size(); edgeIndex++) {
      NavEdge edge = edges.get(edgeIndex);
      NavNode fromNode = nodes.get(edgeIndex);
      NavNode toNode = nodes.get(edgeIndex + 1);
      boolean segmentBoundary = isSegmentBoundary(fromNode, toNode);

      if (segmentBoundary) {
        drafts.add(current);

        current = new SegmentDraft(requireFloor(toNode));
        current.nodes.add(toNode);
        current.incomingEdge = edge;
        current.incomingFromNode = fromNode;
        continue;
      }

      current.nodes.add(toNode);
      current.edges.add(edge);
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
        generatedSteps.add(
            buildStep(
                0,
                draft.incomingEdge,
                draft.incomingFromNode,
                draft.nodes.get(0),
                true,
                false,
                nodeDisplayNames,
                language));
      }
      generatedSteps.addAll(
          generateSegmentSteps(
              draft,
              i == drafts.size() - 1,
              finalDestinationNodeId,
              nodeDisplayNames,
              language));
      segments.add(
          buildSegment(
              i,
              draft.floor,
              draft.nodes,
              reindexSteps(generatedSteps),
              nodeDisplayNames,
              language));
    }
    return segments;
  }

  private List<RouteStepDto> generateSegmentSteps(
      SegmentDraft draft,
      boolean finalSegment,
      Long finalDestinationNodeId,
      Map<Long, String> nodeDisplayNames,
      NavigationLanguage language) {
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
      boolean isDestination =
          finalSegment
              && chunkEnd == draft.edges.size() - 1
              && Objects.equals(safeNodeId(toNode), finalDestinationNodeId);

      String maneuverType =
          resolveManeuverTypeForChunk(draft, chunkStart, chunkEnd, toNode, isDestination);
      String icon = resolveIcon(lastEdgeInChunk, maneuverType);
      String text =
          instructionForChunk(
              lastEdgeInChunk,
              fromNode,
              toNode,
              false,
              maneuverType,
              (chunkEnd - chunkStart) + 1,
              isDestination,
              nodeDisplayNames,
              language);

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
      int index,
      Floor floor,
      List<NavNode> nodes,
      List<RouteStepDto> steps,
      Map<Long, String> nodeDisplayNames,
      NavigationLanguage language) {
    boolean usesElevator = steps.stream().anyMatch(step -> "elevator".equals(step.getType()));
    boolean usesStairs = steps.stream().anyMatch(step -> "stairs".equals(step.getType()));

    return RouteSegmentDto.builder()
        .index(index)
        .buildingId(floor.getBuilding().getId())
        .buildingCode(floor.getBuilding().getCode())
        .buildingName(
            NavigationLocalization.localizeBuildingName(floor.getBuilding().getName(), language))
        .floorId(floor.getId())
        .floorCode(floor.getCode())
        .floorLabel(NavigationLocalization.localizeFloorLabel(floor.getLabel(), language))
        .mapImageUrl(floor.getMapImageUrl())
        .coordinateWidth(safeDecimal(floor.getCoordinateWidth(), "coordinateWidth", "floor " + floor.getId()))
        .coordinateHeight(safeDecimal(floor.getCoordinateHeight(), "coordinateHeight", "floor " + floor.getId()))
        .z(safeDecimal(floor.getZ(), "z", "floor " + floor.getId()))
        .usesElevator(usesElevator)
        .usesStairs(usesStairs)
        .path(nodes.stream().map(node -> toPointDto(node, nodeDisplayNames, language)).toList())
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
      int index,
      NavEdge edge,
      NavNode fromNode,
      NavNode toNode,
      boolean arrivalContext,
      boolean isDestination,
      Map<Long, String> nodeDisplayNames,
      NavigationLanguage language) {
    String type = edge.getEdgeTypeCode();
    String maneuverType = resolveManeuverType(edge, toNode, arrivalContext, isDestination);
    String icon = resolveIcon(edge, maneuverType);
    return RouteStepDto.builder()
        .index(index)
        .text(
            instruction(
                edge, fromNode, toNode, arrivalContext, isDestination, nodeDisplayNames, language))
        .fromNodeId(safeNodeId(fromNode))
        .toNodeId(safeNodeId(toNode))
        .type(type)
        .icon(icon)
        .maneuverType(maneuverType)
        .zoneId(null)
        .build();
  }

  private String resolveManeuverType(
      NavEdge edge, NavNode toNode, boolean arrivalContext, boolean isDestination) {
    if (isDestination) {
      return "destination";
    }

    String edgeType = edge.getEdgeTypeCode();
    if ("building_transfer".equals(edgeType)) {
      return "building_transfer";
    }
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
      SegmentDraft draft, int chunkStart, int chunkEnd, NavNode toNode, boolean isDestination) {
    NavEdge edge = draft.edges.get(chunkEnd);
    String base = resolveManeuverType(edge, toNode, false, isDestination);
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
    if ("building_transfer".equals(edgeType)) {
      return maneuverType;
    }
    if ("stairs".equals(edgeType)) {
      return maneuverType;
    }
    return maneuverType;
  }

  private String instruction(
      NavEdge edge,
      NavNode fromNode,
      NavNode toNode,
      boolean arrivalContext,
      boolean isDestination,
      Map<Long, String> nodeDisplayNames,
      NavigationLanguage language) {
    return instructionForChunk(
        edge,
        fromNode,
        toNode,
        arrivalContext,
        resolveManeuverType(edge, toNode, arrivalContext, isDestination),
        1,
        isDestination,
        nodeDisplayNames,
        language);
  }

  private String instructionForChunk(
      NavEdge edge,
      NavNode fromNode,
      NavNode toNode,
      boolean arrivalContext,
      String maneuverType,
      int mergedEdgeCount,
      boolean isDestination,
      Map<Long, String> nodeDisplayNames,
    NavigationLanguage language) {
    if (!arrivalContext && hasText(edge.getInstructionForward())) {
      return NavigationLocalization.localizeInstruction(edge.getInstructionForward(), language);
    }

    String edgeType = edge.getEdgeTypeCode();
    String toLabel = readableLabel(toNode, nodeDisplayNames, language);

    if ("elevator".equals(edgeType)) {
      return arrivalContext
          ? NavigationTexts.elevatorExit(language)
          : NavigationTexts.elevatorEnter(toNode.getFloor().getLabel(), language);
    }

    if ("stairs".equals(edgeType)) {
      return arrivalContext
          ? NavigationTexts.stairsExit(language)
          : NavigationTexts.stairsEnter(toNode.getFloor().getLabel(), language);
    }

    if ("building_transfer".equals(edgeType)) {
      return arrivalContext
          ? NavigationTexts.buildingEntered(toNode.getFloor().getBuilding().getName(), language)
          : NavigationTexts.continueTo(toLabel, language);
    }

    if (isDestination) {
      return NavigationTexts.arrivedAt(toLabel, language);
    }

    if ("corridor".equals(edgeType) || "virtual".equals(edgeType)) {
      if (isTechnicalWaypoint(toNode)) {
        return NavigationTexts.continueAlongCorridor(language);
      }
      if ("left".equals(maneuverType)) {
        return NavigationTexts.turnLeft(language);
      }
      if ("right".equals(maneuverType)) {
        return NavigationTexts.turnRight(language);
      }
      if ("slight_left".equals(maneuverType)) {
        return NavigationTexts.slightLeft(language);
      }
      if ("slight_right".equals(maneuverType)) {
        return NavigationTexts.slightRight(language);
      }
      if ("turn_back".equals(maneuverType)) {
        return NavigationTexts.turnBack(language);
      }
      if (mergedEdgeCount > 1) {
        return NavigationTexts.continueAlongCorridor(language);
      }
      return NavigationTexts.continueTo(toLabel, language);
    }

    return NavigationTexts.followPathTo(toLabel, language);
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

  private String readableLabel(NavNode node, Map<Long, String> nodeDisplayNames) {
    return readableLabel(node, nodeDisplayNames, NavigationLanguage.SL);
  }

  private String readableLabel(
      NavNode node, Map<Long, String> nodeDisplayNames, NavigationLanguage language) {
    String mappedDisplayName = nodeDisplayNames.get(safeNodeId(node));
    if (hasText(mappedDisplayName)) {
      return mappedDisplayName.trim();
    }

    if (hasText(node.getLabel())) {
      return humanizeLabel(node.getLabel(), language);
    }

    if (isTechnicalWaypoint(node)) {
      return NavigationTexts.nextWaypoint(language);
    }

    if (hasText(node.getExternalId())) {
      return humanizeLabel(node.getExternalId(), language);
    }

    return NavigationTexts.nextWaypoint(language);
  }

  private Map<Long, String> resolveNodeDisplayNames(
      List<NavNode> nodes,
      NavigationLocation destinationLocation,
      NavigationLanguage language) {
    List<Long> nodeIds =
        nodes.stream().map(NavNode::getId).filter(Objects::nonNull).distinct().toList();
    if (nodeIds.isEmpty()) {
      return Collections.emptyMap();
    }

    List<NavigationLocation> locations = locationRepository.findEnabledByNodeIdIn(nodeIds);
    Map<Long, String> nodeDisplayNames = new LinkedHashMap<>();
    if (locations != null) {
      locations.stream()
          .filter(NavigationLocation::hasNode)
          .filter(location -> hasText(location.getDisplayName()))
          .sorted(Comparator.comparing(NavigationLocation::getId))
          .forEach(
                location ->
                    nodeDisplayNames.putIfAbsent(
                        safeNodeId(location.getNode()),
                        NavigationLocalization.localizeDisplayName(
                            location.getDisplayName(), language)));
    }

    if (destinationLocation != null
        && destinationLocation.hasNode()
        && hasText(destinationLocation.getDisplayName())) {
      nodeDisplayNames.put(
          safeNodeId(destinationLocation.getNode()),
          NavigationLocalization.localizeDisplayName(
              destinationLocation.getDisplayName(), language));
    }

    return nodeDisplayNames;
  }

  private String humanizeLabel(String value, NavigationLanguage language) {
    String normalized = value == null ? "" : NavigationLocalization.normalizeSourceText(value);
    if (normalized.isEmpty()) {
      return normalized;
    }

    String withSpaces =
        normalized.replace('_', ' ').replace('-', ' ').replaceAll("\\s+", " ").trim();
    if (withSpaces.isEmpty()) {
      return normalized;
    }

    withSpaces = NavigationLocalization.normalizeSourceText(withSpaces);

    if (!withSpaces.equals(withSpaces.toLowerCase(Locale.ROOT))) {
      return NavigationLocalization.localizeDisplayName(withSpaces, language);
    }

    String[] parts = withSpaces.split(" ");
    StringBuilder builder = new StringBuilder();
    for (String part : parts) {
      if (part.isEmpty()) {
        continue;
      }
      if (builder.length() > 0) {
        builder.append(' ');
      }
      builder.append(Character.toUpperCase(part.charAt(0)));
      if (part.length() > 1) {
        builder.append(part.substring(1));
      }
    }
    String humanized =
        builder
        .toString()
        .replace(" Za ", " za ")
        .replace(" Objekt ", " objekt ")
        .replace(" In ", " in ")
        .replace(" Od ", " od ")
        .replace(" Do ", " do ");
    String slHumanized =
        humanized
            .replaceAll("\\b([A-Z0-9]+) objekt\\b", "objekt $1")
            .replaceAll("\\b([A-Z0-9]+) Objekt\\b", "objekt $1");
    return NavigationLocalization.localizeDisplayName(slHumanized, language);
  }

  private String slovenizeFallbackLabel(String value) {
    String result = value;
    result = result.replaceAll("(?i)\\bulaz\\b", "vhod");
    result = result.replaceAll("(?i)\\bizlaz\\b", "izhod");
    result = result.replaceAll("(?i)\\bobjekat\\b", "objekt");
    result = result.replaceAll("(?i)\\bstepenice\\b", "stopnišče");
    result = result.replaceAll("(?i)\\bstepeniste\\b", "stopnišče");
    result = result.replaceAll("(?i)\\bglevne\\b", "glavne");
    result = result.replaceAll("(?i)\\btajnistvo\\b", "tajništvo");
    result = result.replaceAll("(?i)\\bucionica\\b", "učilnica");
    result = result.replaceAll("(?i)\\bucilnica\\b", "učilnica");
    result = result.replaceAll("(?i)\\bliftovi\\b", "dvigala");
    result = result.replaceAll("(?i)\\blift\\b", "dvigalo");
    result = result.replaceAll("(?i)\\bstudentski\\b", "študentski");
    result = result.replaceAll("(?i)\\bosoblje\\b", "osebje");
    return result;
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
    return toPointDto(node, Collections.emptyMap(), NavigationLanguage.SL);
  }

  private RoutePointDto toPointDto(
      NavNode node, Map<Long, String> nodeDisplayNames, NavigationLanguage language) {
    return RoutePointDto.builder()
        .nodeId(safeNodeId(node))
        .externalId(node.getExternalId())
        .label(readableLabel(node, nodeDisplayNames, language))
        .nodeType(node.getNodeTypeCode())
        .x(safeNodeCoordinate(node, "x"))
        .y(safeNodeCoordinate(node, "y"))
        .z(safeNodeCoordinate(node, "z"))
        .build();
  }

  private boolean isSegmentBoundary(NavNode fromNode, NavNode toNode) {
    Floor fromFloor = requireFloor(fromNode);
    Floor toFloor = requireFloor(toNode);
    return !Objects.equals(fromNode.getFloorId(), toNode.getFloorId())
        || !Objects.equals(fromFloor.getBuilding().getId(), toFloor.getBuilding().getId());
  }

  NavigationLocationDto toLocationDto(NavigationLocation location, NavigationLanguage language) {
    Space space = location.getSpace();

    return NavigationLocationDto.builder()
        .id(location.getId())
        .displayName(NavigationLocalization.localizeDisplayName(location.getDisplayName(), language))
        .locationType(location.getLocationType())
        .buildingId(location.getBuilding().getId())
        .buildingCode(location.getBuilding().getCode())
        .buildingName(
            NavigationLocalization.localizeBuildingName(location.getBuilding().getName(), language))
        .floorId(location.getFloor().getId())
        .floorCode(location.getFloor().getCode())
        .floorLabel(
            NavigationLocalization.localizeFloorLabel(location.getFloor().getLabel(), language))
        .nodeId(location.getNode() != null ? location.getNode().getId() : null)
        .spaceId(space != null ? space.getId() : location.getSpaceId())
        .spaceName(
            space != null ? NavigationLocalization.localizeDisplayName(space.getName(), language) : null)
        .spaceTypeName(
            space != null && space.getSpaceType() != null
                ? NavigationLocalization.localizeSpaceTypeName(
                    space.getSpaceType().getName(), language)
                : null)
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

  private NavigationRouteException invalidRouteData(NavigationLanguage language) {
    return new NavigationRouteException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "INVALID_ROUTE_DATA",
        NavigationTexts.invalidRouteData(language));
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
