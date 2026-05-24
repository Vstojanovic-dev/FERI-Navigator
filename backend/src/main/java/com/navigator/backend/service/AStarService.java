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

  private final NavNodeRepository nodeRepo;
  private final NavEdgeRepository edgeRepo;

  public PathResponseDto findPath(String fromLabel, String toLabel) {
    Optional<NavNode> startOpt = findNode(fromLabel);
    Optional<NavNode> goalOpt = findNode(toLabel);

    if (startOpt.isEmpty()) {
      return PathResponseDto.builder()
          .message("Startni cvor nije pronadjen: " + fromLabel)
          .path(Collections.emptyList())
          .build();
    }

    if (goalOpt.isEmpty()) {
      return PathResponseDto.builder()
          .message("Ciljni cvor nije pronadjen: " + toLabel)
          .path(Collections.emptyList())
          .build();
    }

    RouteSearchResult route = findPath(startOpt.get(), goalOpt.get(), true);
    if (route.getNodes().isEmpty()) {
      return PathResponseDto.builder()
          .message("Put nije pronadjen izmedju '" + fromLabel + "' i '" + toLabel + "'.")
          .path(Collections.emptyList())
          .build();
    }

    return buildResponse(route.getNodes(), route.getTotalCost());
  }

  public RouteSearchResult findPath(NavNode start, NavNode goal, boolean allowElevator) {
    if (start.getId().equals(goal.getId())) {
      return RouteSearchResult.builder().nodes(List.of(start)).edges(List.of()).totalCost(0).build();
    }

    log.info("A* search: {} -> {}", start.getExternalId(), goal.getExternalId());

    Map<Long, Double> gScore = new HashMap<>();
    Map<Long, Double> fScore = new HashMap<>();
    Map<Long, Long> cameFrom = new HashMap<>();
    Map<Long, NavEdge> cameFromEdge = new HashMap<>();
    Set<Long> closedSet = new HashSet<>();

    gScore.put(start.getId(), 0.0);
    fScore.put(start.getId(), heuristic(start, goal));

    PriorityQueue<Long> openSet =
        new PriorityQueue<>(
            Comparator.comparingDouble(id -> fScore.getOrDefault(id, Double.MAX_VALUE)));
    openSet.add(start.getId());

    Map<Long, NavNode> nodeCache = new HashMap<>();
    nodeCache.put(start.getId(), start);
    nodeCache.put(goal.getId(), goal);

    while (!openSet.isEmpty()) {
      Long currentId = openSet.poll();

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
        if (!allowElevator && "elevator".equals(edge.getEdgeTypeCode())) {
          continue;
        }

        NavNode neighbor = edge.getToNode();
        Long neighborId = neighbor.getId();

        if (closedSet.contains(neighborId)) {
          continue;
        }

        nodeCache.putIfAbsent(neighborId, neighbor);

        double tentativeG =
            gScore.getOrDefault(currentId, Double.MAX_VALUE) + edge.getWeight().doubleValue();

        if (tentativeG < gScore.getOrDefault(neighborId, Double.MAX_VALUE)) {
          cameFrom.put(neighborId, currentId);
          cameFromEdge.put(neighborId, edge);
          gScore.put(neighborId, tentativeG);
          fScore.put(neighborId, tentativeG + heuristic(neighbor, goal));

          if (!openSet.contains(neighborId)) {
            openSet.add(neighborId);
          }
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

  private double heuristic(NavNode a, NavNode b) {
    double dx = a.getX().doubleValue() - b.getX().doubleValue();
    double dy = a.getY().doubleValue() - b.getY().doubleValue();
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
        .id(node.getId())
        .externalId(node.getExternalId())
        .label(node.getLabel())
        .nodeType(node.getNodeTypeCode())
        .floorId(node.getFloorId())
        .x(node.getX().doubleValue())
        .y(node.getY().doubleValue())
        .build();
  }
}
