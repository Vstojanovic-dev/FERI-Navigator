package com.navigator.backend.service;

import com.navigator.backend.dto.PathResponseDto;
import com.navigator.backend.dto.RouteSearchResult;
import com.navigator.backend.model.NavEdge;
import com.navigator.backend.model.NavNode;
import com.navigator.backend.repository.NavEdgeRepository;
import com.navigator.backend.repository.NavNodeRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.PriorityQueue;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AStarService {

  private static final double DEFAULT_SCORE = Double.MAX_VALUE;

  private final NavNodeRepository nodeRepo;
  private final NavEdgeRepository edgeRepo;

  private record QueueEntry(Long nodeId, double score) {}

  public PathResponseDto findPath(String fromLabel, String toLabel) {
    return findPath(fromLabel, toLabel, null);
  }

  public PathResponseDto findPath(String fromLabel, String toLabel, String acceptLanguage) {
    NavigationLanguage language = NavigationLanguage.fromHeader(acceptLanguage);
    Optional<NavNode> startOpt = findNode(fromLabel);
    Optional<NavNode> goalOpt = findNode(toLabel);

    if (startOpt.isEmpty()) {
      return PathResponseDto.builder()
          .message(NavigationTexts.startNodeNotFound(fromLabel, language))
          .path(Collections.emptyList())
          .build();
    }

    if (goalOpt.isEmpty()) {
      return PathResponseDto.builder()
          .message(NavigationTexts.targetNodeNotFound(toLabel, language))
          .path(Collections.emptyList())
          .build();
    }

    RouteSearchResult route = findPath(startOpt.get(), goalOpt.get(), true);
    if (route.getNodes().isEmpty()) {
      return PathResponseDto.builder()
          .message(NavigationTexts.noLegacyPath(fromLabel, toLabel, language))
          .path(Collections.emptyList())
          .build();
    }

    return buildResponse(route.getNodes(), route.getTotalCost());
  }

  public RouteSearchResult findPath(NavNode start, NavNode goal, boolean allowElevator) {
    return findPath(start, goal, allowElevator, VerticalTraversalMode.ANY);
  }

  public RouteSearchResult findPath(
      NavNode start,
      NavNode goal,
      boolean allowElevator,
      VerticalTraversalMode traversalMode) {
    if (requireNodeId(start).equals(requireNodeId(goal))) {
      return RouteSearchResult.builder()
          .nodes(List.of(start))
          .edges(List.of())
          .totalCost(0)
          .build();
    }

    log.info("A* search: {} -> {}", start.getExternalId(), goal.getExternalId());

    Map<Long, Double> gScore = new HashMap<>();
    Map<Long, Double> fScore = new HashMap<>();
    Map<Long, Long> cameFrom = new HashMap<>();
    Map<Long, NavEdge> cameFromEdge = new HashMap<>();
    Set<Long> closedSet = new HashSet<>();

    gScore.put(start.getId(), 0.0);
    fScore.put(start.getId(), heuristic(start, goal));

    PriorityQueue<QueueEntry> openSet =
        new PriorityQueue<>(Comparator.comparingDouble(QueueEntry::score));
    openSet.add(new QueueEntry(start.getId(), fScore.get(start.getId())));

    Map<Long, NavNode> nodeCache = new HashMap<>();
    nodeCache.put(start.getId(), start);
    nodeCache.put(goal.getId(), goal);

    while (!openSet.isEmpty()) {
      QueueEntry current = openSet.poll();
      if (current.score() > fScore.getOrDefault(current.nodeId(), DEFAULT_SCORE)) {
        continue;
      }

      Long currentId = current.nodeId();

      if (currentId.equals(goal.getId())) {
        List<NavNode> pathNodes = reconstructPath(cameFrom, currentId, nodeCache);
        List<NavEdge> pathEdges = reconstructEdges(cameFromEdge, pathNodes);
        double totalCost = gScore.getOrDefault(currentId, 0.0);
        log.info("Path found: {} nodes, cost={}", pathNodes.size(), totalCost);
        return RouteSearchResult.builder()
            .nodes(pathNodes)
            .edges(pathEdges)
            .totalCost(totalCost)
            .build();
      }

      closedSet.add(currentId);

      for (NavEdge edge : edgeRepo.findByFromNodeId(currentId)) {
        if (!isEdgeAllowed(edge, traversalMode)) {
          continue;
        }

        NavNode neighbor = requireNeighbor(edge);
        Long neighborId = requireNodeId(neighbor);

        if (closedSet.contains(neighborId)) {
          continue;
        }

        nodeCache.putIfAbsent(neighborId, neighbor);

        double tentativeG =
            gScore.getOrDefault(currentId, DEFAULT_SCORE) + safeWeight(edge);

        if (tentativeG < gScore.getOrDefault(neighborId, DEFAULT_SCORE)) {
          cameFrom.put(neighborId, currentId);
          cameFromEdge.put(neighborId, edge);
          gScore.put(neighborId, tentativeG);
          double neighborScore = tentativeG + heuristic(neighbor, goal);
          fScore.put(neighborId, neighborScore);
          openSet.add(new QueueEntry(neighborId, neighborScore));
        }
      }
    }

    log.warn("Path not found: {} -> {}", start.getExternalId(), goal.getExternalId());
    return RouteSearchResult.builder().nodes(List.of()).edges(List.of()).totalCost(0).build();
  }

  private Optional<NavNode> findNode(String identifier) {
    Optional<NavNode> byExternal = nodeRepo.findByExternalId(identifier);
    if (byExternal.isPresent()) {
      return byExternal;
    }

    return nodeRepo.findFirstByLabelIgnoreCase(identifier);
  }

  private boolean isEdgeAllowed(NavEdge edge, VerticalTraversalMode traversalMode) {
    String edgeType = edge.getEdgeTypeCode();
    if (traversalMode == VerticalTraversalMode.STAIRS_ONLY && "elevator".equals(edgeType)) {
      return false;
    }
    if (traversalMode == VerticalTraversalMode.ELEVATOR_ONLY && "stairs".equals(edgeType)) {
      return false;
    }
    return true;
  }

  private double heuristic(NavNode a, NavNode b) {
    double dx = safeCoordinate(a.getX(), "x", a) - safeCoordinate(b.getX(), "x", b);
    double dy = safeCoordinate(a.getY(), "y", a) - safeCoordinate(b.getY(), "y", b);
    return Math.sqrt(dx * dx + dy * dy);
  }

  private List<NavNode> reconstructPath(
      Map<Long, Long> cameFrom, Long currentId, Map<Long, NavNode> cache) {
    List<NavNode> path = new ArrayList<>();
    while (cameFrom.containsKey(currentId)) {
      path.add(resolveNode(currentId, cache));
      currentId = cameFrom.get(currentId);
    }
    path.add(resolveNode(currentId, cache));
    Collections.reverse(path);
    return path;
  }

  private List<NavEdge> reconstructEdges(Map<Long, NavEdge> cameFromEdge, List<NavNode> nodes) {
    List<NavEdge> edges = new ArrayList<>();
    for (int i = 1; i < nodes.size(); i++) {
      NavEdge edge = cameFromEdge.get(nodes.get(i).getId());
      if (edge != null) {
        edges.add(edge);
      }
    }
    return edges;
  }

  private NavNode resolveNode(Long id, Map<Long, NavNode> cache) {
    return cache.computeIfAbsent(
        id,
        nodeId ->
            nodeRepo
                .findById(nodeId)
                .orElseThrow(() -> new IllegalStateException("Node not found: " + nodeId)));
  }

  private PathResponseDto buildResponse(List<NavNode> nodes, double totalCost) {
    List<PathResponseDto.PathNode> pathNodes = nodes.stream().map(this::toPathNode).toList();
    return PathResponseDto.builder().totalCost(totalCost).path(pathNodes).build();
  }

  private PathResponseDto.PathNode toPathNode(NavNode node) {
    return PathResponseDto.PathNode.builder()
        .id(requireNodeId(node))
        .externalId(node.getExternalId())
        .label(node.getLabel())
        .nodeType(node.getNodeTypeCode())
        .floorId(node.getFloorId())
        .x(safeCoordinate(node.getX(), "x", node))
        .y(safeCoordinate(node.getY(), "y", node))
        .build();
  }

  private Long requireNodeId(NavNode node) {
    if (node == null || node.getId() == null) {
      throw new IllegalStateException("Missing node id.");
    }
    return node.getId();
  }

  private double safeCoordinate(java.math.BigDecimal value, String field, NavNode node) {
    if (value == null) {
      throw new IllegalStateException(
          "Missing coordinate: " + field + " for node " + requireNodeId(node));
    }
    return value.doubleValue();
  }

  private double safeWeight(NavEdge edge) {
    if (edge.getWeight() == null) {
      throw new IllegalStateException("Missing edge weight for edge " + edge.getId() + ".");
    }
    return edge.getWeight().doubleValue();
  }

  private NavNode requireNeighbor(NavEdge edge) {
    if (edge == null || edge.getToNode() == null) {
      throw new IllegalStateException("Missing destination node for edge.");
    }
    return edge.getToNode();
  }
}
