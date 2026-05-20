package com.navigator.backend.service;

import com.navigator.backend.dto.PathResponseDto;
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

    /**
     * Traži najkraći put između dva čvora koristeći A* algoritam.
     *
     * @param fromLabel label ili externalId početnog čvora (npr. "referat", "1_wp1")
     * @param toLabel   label ili externalId ciljnog čvora
     * @return PathResponseDto sa listom čvorova i ukupnom cijenom, ili porukom o grešci
     */
    public PathResponseDto findPath(String fromLabel, String toLabel) {
        // ── 1. Pronađi startni i ciljni čvor ──
        Optional<NavNode> startOpt = findNode(fromLabel);
        Optional<NavNode> goalOpt = findNode(toLabel);

        if (startOpt.isEmpty()) {
            log.warn("Startni čvor nije pronađen: {}", fromLabel);
            return PathResponseDto.builder()
                    .message("Startni čvor nije pronađen: " + fromLabel)
                    .path(Collections.emptyList())
                    .build();
        }
        if (goalOpt.isEmpty()) {
            log.warn("Ciljni čvor nije pronađen: {}", toLabel);
            return PathResponseDto.builder()
                    .message("Ciljni čvor nije pronađen: " + toLabel)
                    .path(Collections.emptyList())
                    .build();
        }

        NavNode start = startOpt.get();
        NavNode goal = goalOpt.get();

        if (start.getId().equals(goal.getId())) {
            return PathResponseDto.builder()
                    .totalCost(0)
                    .path(List.of(toPathNode(start)))
                    .message("Start i cilj su isti čvor.")
                    .build();
        }

        log.info("A* pretraga: {} -> {}", start.getExternalId(), goal.getExternalId());

        // ── 2. A* ──
        // gScore[id] = najmanji poznati cost od starta do čvora
        Map<Long, Double> gScore = new HashMap<>();
        // fScore[id] = gScore + heuristika (procjena do cilja)
        Map<Long, Double> fScore = new HashMap<>();
        // cameFrom[id] = prethodni čvor na optimalnom putu
        Map<Long, Long> cameFrom = new HashMap<>();

        Set<Long> closedSet = new HashSet<>();

        gScore.put(start.getId(), 0.0);
        fScore.put(start.getId(), heuristic(start, goal));

        // Open set sortiran po fScore
        PriorityQueue<Long> openSet = new PriorityQueue<>(
                Comparator.comparingDouble(id -> fScore.getOrDefault(id, Double.MAX_VALUE))
        );
        openSet.add(start.getId());

        // Cache čvorova da ne idemo u bazu za svaki čvor
        Map<Long, NavNode> nodeCache = new HashMap<>();
        nodeCache.put(start.getId(), start);
        nodeCache.put(goal.getId(), goal);

        while (!openSet.isEmpty()) {
            Long currentId = openSet.poll();

            if (currentId.equals(goal.getId())) {
                // Put pronađen — rekonstruiši
                List<NavNode> pathNodes = reconstructPath(cameFrom, currentId, nodeCache);
                double totalCost = gScore.getOrDefault(currentId, 0.0);
                log.info("Put pronađen: {} čvorova, cijena={}", pathNodes.size(), totalCost);
                return buildResponse(pathNodes, totalCost);
            }

            closedSet.add(currentId);

            // Dohvati sve veze iz ovog čvora
            NavNode current = resolveNode(currentId, nodeCache);
            List<NavEdge> edges = edgeRepo.findByFromNodeId(currentId);

            for (NavEdge edge : edges) {
                NavNode neighbor = edge.getToNode();
                Long neighborId = neighbor.getId();

                if (closedSet.contains(neighborId)) continue;

                nodeCache.putIfAbsent(neighborId, neighbor);

                double tentativeG = gScore.getOrDefault(currentId, Double.MAX_VALUE) + edge.getWeight();

                if (tentativeG < gScore.getOrDefault(neighborId, Double.MAX_VALUE)) {
                    cameFrom.put(neighborId, currentId);
                    gScore.put(neighborId, tentativeG);
                    fScore.put(neighborId, tentativeG + heuristic(neighbor, goal));

                    if (!openSet.contains(neighborId)) {
                        openSet.add(neighborId);
                    }
                }
            }
        }

        log.warn("Put nije pronađen: {} -> {}", fromLabel, toLabel);
        return PathResponseDto.builder()
                .message("Put nije pronađen između '" + fromLabel + "' i '" + toLabel + "'.")
                .path(Collections.emptyList())
                .build();
    }

    // ── Pomoćne metode ──

    /**
     * Traži čvor po labelu (case-insensitive) ili externalId-u.
     */
    private Optional<NavNode> findNode(String identifier) {
        // Probaj prvo po externalId (format "sprat_label", npr. "2_lift")
        Optional<NavNode> byExternal = nodeRepo.findByExternalId(identifier);
        if (byExternal.isPresent()) return byExternal;

        // Onda po labelu (case-insensitive) — uzmi prvi rezultat
        return nodeRepo.findFirstByLabelIgnoreCase(identifier);
    }

    /**
     * Euklidska heuristika između dva čvora (admissible — nikad ne precjenjuje).
     * Koristi SVG koordinate čvorova.
     */
    private double heuristic(NavNode a, NavNode b) {
        double dx = a.getGeom().getX() - b.getGeom().getX();
        double dy = a.getGeom().getY() - b.getGeom().getY();
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Rekonstruira put od cilja unazad prema startu, pa obrne listu.
     */
    private List<NavNode> reconstructPath(Map<Long, Long> cameFrom, Long currentId,
                                          Map<Long, NavNode> cache) {
        List<NavNode> path = new ArrayList<>();
        while (cameFrom.containsKey(currentId)) {
            path.add(resolveNode(currentId, cache));
            currentId = cameFrom.get(currentId);
        }
        path.add(resolveNode(currentId, cache)); // dodaj startni čvor
        Collections.reverse(path);
        return path;
    }

    private NavNode resolveNode(Long id, Map<Long, NavNode> cache) {
        return cache.computeIfAbsent(id, nodeId ->
                nodeRepo.findById(nodeId).orElseThrow(
                        () -> new IllegalStateException("Čvor nije pronađen u bazi: " + nodeId)));
    }

    private PathResponseDto buildResponse(List<NavNode> nodes, double totalCost) {
        List<PathResponseDto.PathNode> pathNodes = nodes.stream()
                .map(this::toPathNode)
                .toList();
        return PathResponseDto.builder()
                .totalCost(totalCost)
                .path(pathNodes)
                .build();
    }

    private PathResponseDto.PathNode toPathNode(NavNode node) {
        return PathResponseDto.PathNode.builder()
                .id(node.getId())
                .externalId(node.getExternalId())
                .label(node.getLabel())
                .nodeType(node.getNodeType())
                .floorId(node.getFloorId())
                .x(node.getGeom().getX())
                .y(node.getGeom().getY())
                .build();
    }
}
