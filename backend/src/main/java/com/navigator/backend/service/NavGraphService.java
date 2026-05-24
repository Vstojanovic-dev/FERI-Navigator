package com.navigator.backend.service;

import com.navigator.backend.dto.FloorGraphDto;
import com.navigator.backend.model.EdgeType;
import com.navigator.backend.model.NavEdge;
import com.navigator.backend.model.NavNode;
import com.navigator.backend.model.NodeType;
import com.navigator.backend.repository.EdgeTypeRepository;
import com.navigator.backend.repository.NavEdgeRepository;
import com.navigator.backend.repository.NavNodeRepository;
import com.navigator.backend.repository.NodeTypeRepository;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NavGraphService {

  private final NavNodeRepository nodeRepo;
  private final NavEdgeRepository edgeRepo;
  private final NodeTypeRepository nodeTypeRepo;
  private final EdgeTypeRepository edgeTypeRepo;

  private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 0);

  @Transactional
  public FloorGraphDto.ImportResult importFloorGraph(FloorGraphDto.ImportRequest request) {
    Long floor = request.getFloor().longValue();
    log.info(
        "Uvoz grafa za {}. sprat - {} cvorova, {} veza",
        floor,
        request.getNodes().size(),
        request.getEdges().size());

    edgeRepo.deleteAllByFromNodeFloorId(floor);
    nodeRepo.deleteAllByFloorId(floor);

    Map<String, NavNode> nodeMap = new HashMap<>();

    for (FloorGraphDto.NodeDto dto : request.getNodes()) {
      Point point = makePoint(dto.getX(), dto.getY());
      String nodeTypeCode = dto.getNodeType() != null ? dto.getNodeType() : inferNodeType(dto);

      NavNode node =
          NavNode.builder()
              .floorId(floor)
              .label(dto.getLabel())
              .isWaypoint(dto.getLabel() == null)
              .nodeType(resolveNodeType(nodeTypeCode))
              .spaceId(dto.getRoomId())
              .x(BigDecimal.valueOf(dto.getX()))
              .y(BigDecimal.valueOf(dto.getY()))
              .z(BigDecimal.ZERO)
              .externalId(floor + "_" + dto.getId())
              .geom(point)
              .build();

      NavNode saved = nodeRepo.save(node);
      nodeMap.put(dto.getId(), saved);
      log.debug("Cvor upisan: {} ({})", dto.getId(), dto.getLabel());
    }

    int edgesInserted = 0;
    for (FloorGraphDto.EdgeDto dto : request.getEdges()) {
      NavNode fromNode = nodeMap.get(dto.getFrom());
      NavNode toNode = nodeMap.get(dto.getTo());

      if (fromNode == null || toNode == null) {
        log.warn("Veza preskocena - cvor nije pronadjen: {} -> {}", dto.getFrom(), dto.getTo());
        continue;
      }

      double weight = calculateDistance(fromNode.getGeom(), toNode.getGeom());
      LineString line = makeLineString(fromNode.getGeom(), toNode.getGeom());
      String edgeType = dto.getEdgeType() != null ? dto.getEdgeType() : "corridor";
      boolean crossFloor = dto.getCrossFloor() != null && dto.getCrossFloor();

      saveEdge(fromNode, toNode, weight, edgeType, crossFloor, line);
      saveEdge(
          toNode,
          fromNode,
          weight,
          edgeType,
          crossFloor,
          makeLineString(toNode.getGeom(), fromNode.getGeom()));

      edgesInserted++;
    }

    log.info("Import zavrsen: {} cvorova, {} veza", nodeMap.size(), edgesInserted);

    return new FloorGraphDto.ImportResult(
        nodeMap.size(),
        edgesInserted,
        request.getFloor(),
        "Uspjesno uvezeno "
            + nodeMap.size()
            + " cvorova i "
            + edgesInserted
            + " veza za "
            + request.getFloor()
            + ". sprat");
  }

  @Transactional
  public int importCrossFloorEdges(List<FloorGraphDto.EdgeDto> edges) {
    int count = 0;
    for (FloorGraphDto.EdgeDto dto : edges) {
      NavNode fromNode = nodeRepo.findByExternalId(dto.getFrom()).orElse(null);
      NavNode toNode = nodeRepo.findByExternalId(dto.getTo()).orElse(null);

      if (fromNode == null || toNode == null) {
        log.warn("Cross-floor veza preskocena: {} -> {}", dto.getFrom(), dto.getTo());
        continue;
      }

      EdgeType edgeType = resolveEdgeType(dto.getEdgeType() != null ? dto.getEdgeType() : "stairs");
      double weight = calculateDistance(fromNode.getGeom(), toNode.getGeom()) + 100;

      saveEdge(
          fromNode,
          toNode,
          weight,
          edgeType,
          true,
          makeLineString(fromNode.getGeom(), toNode.getGeom()));
      saveEdge(
          toNode,
          fromNode,
          weight,
          edgeType,
          true,
          makeLineString(toNode.getGeom(), fromNode.getGeom()));
      count++;
    }
    log.info("Uvezeno {} cross-floor veza", count);
    return count;
  }

  private void saveEdge(
      NavNode from, NavNode to, double weight, String type, boolean crossFloor, LineString geom) {
    saveEdge(from, to, weight, resolveEdgeType(type), crossFloor, geom);
  }

  private void saveEdge(
      NavNode from, NavNode to, double weight, EdgeType type, boolean crossFloor, LineString geom) {
    edgeRepo.save(
        NavEdge.builder()
            .fromNode(from)
            .toNode(to)
            .weight(BigDecimal.valueOf(weight))
            .edgeType(type)
            .isCrossFloor(crossFloor)
            .geom(geom)
            .build());
  }

  private NodeType resolveNodeType(String code) {
    return nodeTypeRepo
        .findByCode(code)
        .orElseThrow(() -> new IllegalArgumentException("Nepoznat tip cvora: " + code));
  }

  private EdgeType resolveEdgeType(String code) {
    return edgeTypeRepo
        .findByCode(code)
        .orElseThrow(() -> new IllegalArgumentException("Nepoznat tip ivice: " + code));
  }

  private Point makePoint(double x, double y) {
    return geometryFactory.createPoint(new Coordinate(x, y));
  }

  private LineString makeLineString(Point from, Point to) {
    return geometryFactory.createLineString(
        new Coordinate[] {from.getCoordinate(), to.getCoordinate()});
  }

  private double calculateDistance(Point a, Point b) {
    return a.distance(b);
  }

  private String inferNodeType(FloorGraphDto.NodeDto dto) {
    if (dto.getLabel() == null) return "waypoint";
    String label = dto.getLabel().toLowerCase();
    if (label.contains("lift") || label.contains("dvigalo")) return "elevator";
    if (label.contains("stepen")) return "stairs";
    if (label.contains("wc") || label.contains("stranisce")) return "wc";
    if (label.contains("hodnik")) return "corridor";
    return "room";
  }
}
