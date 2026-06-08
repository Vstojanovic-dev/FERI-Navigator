package com.navigator.backend.admin.service;

import com.navigator.backend.admin.dto.MapEditorDto.EdgeDto;
import com.navigator.backend.admin.dto.MapEditorDto.EdgeUpsertRequest;
import com.navigator.backend.admin.dto.MapEditorDto.FloorOptionDto;
import com.navigator.backend.admin.dto.MapEditorDto.FloorViewDto;
import com.navigator.backend.admin.dto.MapEditorDto.GraphDto;
import com.navigator.backend.admin.dto.MapEditorDto.LookupOptionDto;
import com.navigator.backend.admin.dto.MapEditorDto.NodeDto;
import com.navigator.backend.admin.dto.MapEditorDto.NodeUpsertRequest;
import com.navigator.backend.admin.model.*;
import com.navigator.backend.admin.repository.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Pattern;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MapEditorService {

  private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9]+");
  private static final BigDecimal CROSS_FLOOR_PENALTY = BigDecimal.valueOf(100);

  private final AdminFloorRepository floorRepository;
  private final AdminNodeTypeRepository nodeTypeRepository;
  private final AdminEdgeTypeRepository edgeTypeRepository;
  private final AdminNavNodeRepository nodeRepository;
  private final AdminNavEdgeRepository edgeRepository;
  private final JdbcTemplate jdbcTemplate;

  private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 0);

  public MapEditorService(
      AdminFloorRepository floorRepository,
      AdminNodeTypeRepository nodeTypeRepository,
      AdminEdgeTypeRepository edgeTypeRepository,
      AdminNavNodeRepository nodeRepository,
      AdminNavEdgeRepository edgeRepository,
      JdbcTemplate jdbcTemplate) {
    this.floorRepository = floorRepository;
    this.nodeTypeRepository = nodeTypeRepository;
    this.edgeTypeRepository = edgeTypeRepository;
    this.nodeRepository = nodeRepository;
    this.edgeRepository = edgeRepository;
    this.jdbcTemplate = jdbcTemplate;
  }

  @Transactional(readOnly = true)
  public List<FloorOptionDto> listFloors() {
    return floorRepository.findAllForEditor().stream().map(this::toFloorOptionDto).toList();
  }

  @Transactional(readOnly = true)
  public List<LookupOptionDto> listNodeTypes() {
    return nodeTypeRepository.findAll(Sort.by("code")).stream().map(this::toLookupDto).toList();
  }

  @Transactional(readOnly = true)
  public List<LookupOptionDto> listEdgeTypes() {
    return edgeTypeRepository.findAll(Sort.by("code")).stream().map(this::toLookupDto).toList();
  }

  @Transactional(readOnly = true)
  public GraphDto getGraph(Long floorId) {
    AdminFloor floor = findFloor(floorId);
    List<AdminNavNode> nodes = nodeRepository.findAllForFloor(floorId);
    List<AdminNavEdge> edges = edgeRepository.findAllForFloor(floorId);

    Set<Long> nodesWithCrossFloorEdges = new HashSet<>();
    for (AdminNavEdge edge : edges) {
      if (Boolean.TRUE.equals(edge.getIsCrossFloor())) {
        nodesWithCrossFloorEdges.add(edge.getFromNode().getId());
        nodesWithCrossFloorEdges.add(edge.getToNode().getId());
      }
    }

    return new GraphDto(
        toFloorViewDto(floor),
        nodes.stream()
            .map(node -> toNodeDto(node, nodesWithCrossFloorEdges.contains(node.getId())))
            .toList(),
        collapseEdgesForEditor(edges, floorId));
  }

  @Transactional
  public NodeDto createNode(NodeUpsertRequest request) {
    AdminFloor floor = findFloor(request.floorId());
    AdminNodeType nodeType = findNodeType(request.nodeTypeCode());

    AdminNavNode node = new AdminNavNode();
    node.setFloorId(floor.getId());
    node.setNodeType(nodeType);
    node.setSpaceId(request.spaceId());
    node.setLabel(cleanText(request.label()));
    node.setIsWaypoint(request.isWaypoint());
    node.setIsPublic(request.isPublic());
    node.setX(decimal(request.x()));
    node.setY(decimal(request.y()));
    node.setZ(floor.getZ());
    node.setGeom(makePoint(request.x(), request.y()));
    node.setExternalId(
        resolveExternalId(request.externalId(), request.label(), nodeType.getCode(), floor));

    return toNodeDto(nodeRepository.save(node), false);
  }

  @Transactional
  public NodeDto updateNode(Long nodeId, NodeUpsertRequest request) {
    AdminNavNode node = findNode(nodeId);
    AdminFloor floor = findFloor(request.floorId());
    AdminNodeType nodeType = findNodeType(request.nodeTypeCode());
    String externalId =
        resolveExternalIdForUpdate(
            request.externalId(), request.label(), nodeType.getCode(), floor, nodeId);

    node.setFloorId(floor.getId());
    node.setNodeType(nodeType);
    node.setSpaceId(request.spaceId());
    node.setLabel(cleanText(request.label()));
    node.setIsWaypoint(request.isWaypoint());
    node.setIsPublic(request.isPublic());
    node.setX(decimal(request.x()));
    node.setY(decimal(request.y()));
    node.setZ(floor.getZ());
    node.setGeom(makePoint(request.x(), request.y()));
    node.setExternalId(externalId);

    return toNodeDto(nodeRepository.save(node), hasCrossFloorConnections(nodeId));
  }

  @Transactional
  public void deleteNode(Long nodeId) {
    AdminNavNode node = findNode(nodeId);

    Integer locationCount =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM navigation_locations WHERE node_id = ?", Integer.class, nodeId);
    Integer spacePrimaryCount =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM spaces WHERE primary_node_id = ?", Integer.class, nodeId);

    if ((locationCount != null && locationCount > 0)
        || (spacePrimaryCount != null && spacePrimaryCount > 0)) {
      throw new MapEditorException(
          HttpStatus.CONFLICT,
          "NODE_HAS_DEPENDENCIES",
          "Node je povezan sa lokacijama ili prostorima i ne moze biti obrisan iz editora.");
    }

    nodeRepository.delete(node);
  }

  @Transactional
  public EdgeDto createEdge(EdgeUpsertRequest request) {
    AdminNavNode fromNode = findNode(request.fromNodeId());
    AdminNavNode toNode = findNode(request.toNodeId());
    AdminEdgeType edgeType = findEdgeType(request.edgeTypeCode());

    validateEdgeRequest(fromNode, toNode, request.isCrossFloor(), request.isCrossBuilding());

    AdminNavEdge primary =
        upsertDirectionalEdge(
            null,
            fromNode,
            toNode,
            edgeType,
            request.isBidirectional(),
            request.isCrossFloor(),
            request.isCrossBuilding(),
            request.instructionForward(),
            request.instructionBackward(),
            request.landmark());

    if (request.isBidirectional()) {
      upsertDirectionalEdge(
          edgeRepository.findByFromNodeIdAndToNodeId(toNode.getId(), fromNode.getId()).orElse(null),
          toNode,
          fromNode,
          edgeType,
          true,
          request.isCrossFloor(),
          request.isCrossBuilding(),
          request.instructionBackward(),
          request.instructionForward(),
          request.landmark());
    }

    return toEdgeDto(primary);
  }

  @Transactional
  public EdgeDto updateEdge(Long edgeId, EdgeUpsertRequest request) {
    AdminNavEdge current = findEdge(edgeId);
    AdminNavEdge oldReverse =
        edgeRepository
            .findByFromNodeIdAndToNodeId(current.getToNode().getId(), current.getFromNode().getId())
            .orElse(null);

    AdminNavNode fromNode = findNode(request.fromNodeId());
    AdminNavNode toNode = findNode(request.toNodeId());
    AdminEdgeType edgeType = findEdgeType(request.edgeTypeCode());

    validateEdgeRequest(fromNode, toNode, request.isCrossFloor(), request.isCrossBuilding());

    AdminNavEdge primary =
        upsertDirectionalEdge(
            current,
            fromNode,
            toNode,
            edgeType,
            request.isBidirectional(),
            request.isCrossFloor(),
            request.isCrossBuilding(),
            request.instructionForward(),
            request.instructionBackward(),
            request.landmark());

    if (request.isBidirectional()) {
      AdminNavEdge reverseExisting =
          edgeRepository.findByFromNodeIdAndToNodeId(toNode.getId(), fromNode.getId()).orElse(null);
      if (reverseExisting != null && reverseExisting.getId().equals(primary.getId())) {
        reverseExisting = null;
      }
      AdminNavEdge reverseSaved =
          upsertDirectionalEdge(
              reverseExisting,
              toNode,
              fromNode,
              edgeType,
              true,
              request.isCrossFloor(),
              request.isCrossBuilding(),
              request.instructionBackward(),
              request.instructionForward(),
              request.landmark());
      if (oldReverse != null
          && Boolean.TRUE.equals(oldReverse.getIsBidirectional())
          && !oldReverse.getId().equals(primary.getId())
          && !oldReverse.getId().equals(reverseSaved.getId())) {
        edgeRepository.delete(oldReverse);
      }
    } else if (oldReverse != null
        && Boolean.TRUE.equals(oldReverse.getIsBidirectional())
        && !oldReverse.getId().equals(primary.getId())) {
      edgeRepository.delete(oldReverse);
    }

    return toEdgeDto(primary);
  }

  @Transactional
  public void deleteEdge(Long edgeId) {
    AdminNavEdge edge = findEdge(edgeId);
    AdminNavEdge reverse =
        edgeRepository
            .findByFromNodeIdAndToNodeId(edge.getToNode().getId(), edge.getFromNode().getId())
            .orElse(null);

    if (reverse != null
        && !reverse.getId().equals(edge.getId())
        && (Boolean.TRUE.equals(edge.getIsBidirectional())
            || Boolean.TRUE.equals(reverse.getIsBidirectional()))) {
      edgeRepository.delete(reverse);
    }

    edgeRepository.delete(edge);
  }

  private List<EdgeDto> collapseEdgesForEditor(List<AdminNavEdge> edges, Long activeFloorId) {
    Map<String, AdminNavEdge> byDirection = new HashMap<>();
    for (AdminNavEdge edge : edges) {
      byDirection.put(directionKey(edge.getFromNode().getId(), edge.getToNode().getId()), edge);
    }

    List<EdgeDto> result = new ArrayList<>();
    Set<Long> consumed = new HashSet<>();

    for (AdminNavEdge edge : edges) {
      if (consumed.contains(edge.getId())) {
        continue;
      }

      AdminNavEdge reverse =
          byDirection.get(directionKey(edge.getToNode().getId(), edge.getFromNode().getId()));

      if (Boolean.TRUE.equals(edge.getIsBidirectional())
          && reverse != null
          && !reverse.getId().equals(edge.getId())
          && Boolean.TRUE.equals(reverse.getIsBidirectional())) {
        AdminNavEdge representative = chooseRepresentative(activeFloorId, edge, reverse);
        consumed.add(edge.getId());
        consumed.add(reverse.getId());
        result.add(toEdgeDto(representative));
        continue;
      }

      consumed.add(edge.getId());
      result.add(toEdgeDto(edge));
    }

    return result;
  }

  private AdminNavEdge chooseRepresentative(
      Long activeFloorId, AdminNavEdge first, AdminNavEdge second) {
    boolean firstStartsOnActiveFloor = first.getFromNode().getFloorId().equals(activeFloorId);
    boolean secondStartsOnActiveFloor = second.getFromNode().getFloorId().equals(activeFloorId);

    if (firstStartsOnActiveFloor && !secondStartsOnActiveFloor) {
      return first;
    }
    if (secondStartsOnActiveFloor && !firstStartsOnActiveFloor) {
      return second;
    }
    return first.getId() <= second.getId() ? first : second;
  }

  private AdminNavEdge upsertDirectionalEdge(
      AdminNavEdge existing,
      AdminNavNode fromNode,
      AdminNavNode toNode,
      AdminEdgeType edgeType,
      boolean isBidirectional,
      boolean isCrossFloor,
      boolean isCrossBuilding,
      String instructionForward,
      String instructionBackward,
      String landmark) {
    AdminNavEdge duplicate =
        edgeRepository.findByFromNodeIdAndToNodeId(fromNode.getId(), toNode.getId()).orElse(null);
    if (duplicate != null && (existing == null || !duplicate.getId().equals(existing.getId()))) {
      throw new MapEditorException(
          HttpStatus.CONFLICT,
          "EDGE_ALREADY_EXISTS",
          "Vec postoji veza izmedju izabranih node-ova u ovom smeru.");
    }

    AdminNavEdge edge = existing != null ? existing : new AdminNavEdge();
    edge.setFromNode(fromNode);
    edge.setToNode(toNode);
    edge.setEdgeType(edgeType);
    edge.setIsBidirectional(isBidirectional);
    edge.setIsCrossFloor(isCrossFloor);
    edge.setIsCrossBuilding(isCrossBuilding);
    edge.setInstructionForward(cleanText(instructionForward));
    edge.setInstructionBackward(cleanText(instructionBackward));
    edge.setLandmark(cleanText(landmark));
    edge.setWeight(calculateWeight(fromNode, toNode, isCrossFloor));
    edge.setGeom(makeLineString(fromNode.getGeom(), toNode.getGeom()));
    return edgeRepository.save(edge);
  }

  private void validateEdgeRequest(
      AdminNavNode fromNode, AdminNavNode toNode, boolean isCrossFloor, boolean isCrossBuilding) {
    if (fromNode.getId().equals(toNode.getId())) {
      throw new MapEditorException(
          HttpStatus.BAD_REQUEST, "INVALID_EDGE", "Node ne moze biti povezan sam sa sobom.");
    }

    boolean sameFloor = fromNode.getFloorId().equals(toNode.getFloorId());
    boolean sameBuilding =
        fromNode.getFloor().getBuilding().getId().equals(toNode.getFloor().getBuilding().getId());

    if (!isCrossFloor && !sameFloor) {
      throw new MapEditorException(
          HttpStatus.BAD_REQUEST,
          "FLOOR_MISMATCH",
          "Če povezava ni cross-floor, morata biti obe vozlišči v istem nadstropju.");
    }

    if (!isCrossBuilding && !sameBuilding) {
      throw new MapEditorException(
          HttpStatus.BAD_REQUEST,
          "BUILDING_MISMATCH",
          "Če povezava ni cross-building, morata biti obe vozlišči v istem objektu.");
    }
  }

  private BigDecimal calculateWeight(
      AdminNavNode fromNode, AdminNavNode toNode, boolean isCrossFloor) {
    BigDecimal distance = BigDecimal.valueOf(fromNode.getGeom().distance(toNode.getGeom()));
    if (isCrossFloor) {
      distance = distance.add(CROSS_FLOOR_PENALTY);
    }
    return distance.setScale(3, RoundingMode.HALF_UP);
  }

  private boolean hasCrossFloorConnections(Long nodeId) {
    return edgeRepository.countCrossFloorConnectionsForNode(nodeId) > 0;
  }

  private String resolveExternalId(
      String externalId, String label, String nodeTypeCode, AdminFloor floor) {
    String candidate = cleanText(externalId);
    if (candidate != null && !candidate.isBlank()) {
      if (nodeRepository.existsByExternalId(candidate)) {
        throw new MapEditorException(
            HttpStatus.CONFLICT, "EXTERNAL_ID_EXISTS", "Vec postoji node sa istim externalId.");
      }
      return candidate;
    }

    String base =
        floor.getBuilding().getCode()
            + "_"
            + floor.getCode()
            + "_"
            + slugify(label != null && !label.isBlank() ? label : nodeTypeCode);

    String resolved = base;
    int suffix = 2;
    while (nodeRepository.existsByExternalId(resolved)) {
      resolved = base + "_" + suffix++;
    }
    return resolved;
  }

  private String resolveExternalIdForUpdate(
      String externalId, String label, String nodeTypeCode, AdminFloor floor, Long nodeId) {
    String candidate = cleanText(externalId);
    if (candidate != null && !candidate.isBlank()) {
      Optional<AdminNavNode> sameExternal = nodeRepository.findByExternalId(candidate);
      if (sameExternal.isPresent() && !sameExternal.get().getId().equals(nodeId)) {
        throw new MapEditorException(
            HttpStatus.CONFLICT, "EXTERNAL_ID_EXISTS", "Vec postoji node sa istim externalId.");
      }
      return candidate;
    }

    String base =
        floor.getBuilding().getCode()
            + "_"
            + floor.getCode()
            + "_"
            + slugify(label != null && !label.isBlank() ? label : nodeTypeCode);
    String resolved = base;
    int suffix = 2;
    while (true) {
      Optional<AdminNavNode> existing = nodeRepository.findByExternalId(resolved);
      if (existing.isEmpty() || existing.get().getId().equals(nodeId)) {
        break;
      }
      resolved = base + "_" + suffix++;
    }
    return resolved;
  }

  private AdminFloor findFloor(Long floorId) {
    return floorRepository
        .findDetailedById(floorId)
        .orElseThrow(
            () ->
                new MapEditorException(
                    HttpStatus.NOT_FOUND, "FLOOR_NOT_FOUND", "Sprat nije pronadjen: " + floorId));
  }

  private AdminNodeType findNodeType(String code) {
    return nodeTypeRepository
        .findByCode(code)
        .orElseThrow(
            () ->
                new MapEditorException(
                    HttpStatus.BAD_REQUEST, "NODE_TYPE_NOT_FOUND", "Nepoznat node type: " + code));
  }

  private AdminEdgeType findEdgeType(String code) {
    return edgeTypeRepository
        .findByCode(code)
        .orElseThrow(
            () ->
                new MapEditorException(
                    HttpStatus.BAD_REQUEST, "EDGE_TYPE_NOT_FOUND", "Nepoznat edge type: " + code));
  }

  private AdminNavNode findNode(Long nodeId) {
    return nodeRepository
        .findDetailedById(nodeId)
        .orElseThrow(
            () ->
                new MapEditorException(
                    HttpStatus.NOT_FOUND, "NODE_NOT_FOUND", "Node nije pronadjen: " + nodeId));
  }

  private AdminNavEdge findEdge(Long edgeId) {
    return edgeRepository
        .findDetailedById(edgeId)
        .orElseThrow(
            () ->
                new MapEditorException(
                    HttpStatus.NOT_FOUND, "EDGE_NOT_FOUND", "Edge nije pronadjen: " + edgeId));
  }

  private FloorOptionDto toFloorOptionDto(AdminFloor floor) {
    return new FloorOptionDto(
        floor.getId(),
        floor.getBuilding().getId(),
        floor.getBuilding().getCode(),
        floor.getBuilding().getName(),
        floor.getCode(),
        floor.getLabel(),
        floor.getLevelNumber(),
        floor.getMapImageUrl(),
        floor.getCoordinateWidth().doubleValue(),
        floor.getCoordinateHeight().doubleValue(),
        floor.getZ().doubleValue());
  }

  private FloorViewDto toFloorViewDto(AdminFloor floor) {
    return new FloorViewDto(
        floor.getId(),
        floor.getBuilding().getId(),
        floor.getBuilding().getCode(),
        floor.getBuilding().getName(),
        floor.getCode(),
        floor.getLabel(),
        floor.getMapImageUrl(),
        floor.getCoordinateWidth().doubleValue(),
        floor.getCoordinateHeight().doubleValue(),
        floor.getZ().doubleValue());
  }

  private LookupOptionDto toLookupDto(AdminNodeType nodeType) {
    return new LookupOptionDto(
        nodeType.getId(), nodeType.getCode(), nodeType.getName(), nodeType.getDescription());
  }

  private LookupOptionDto toLookupDto(AdminEdgeType edgeType) {
    return new LookupOptionDto(
        edgeType.getId(), edgeType.getCode(), edgeType.getName(), edgeType.getDescription());
  }

  private NodeDto toNodeDto(AdminNavNode node, boolean hasCrossFloorConnections) {
    return new NodeDto(
        node.getId(),
        node.getFloorId(),
        node.getExternalId(),
        node.getLabel(),
        node.getNodeTypeCode(),
        node.getNodeType().getId(),
        node.getSpaceId(),
        Boolean.TRUE.equals(node.getIsWaypoint()),
        Boolean.TRUE.equals(node.getIsPublic()),
        node.getX().doubleValue(),
        node.getY().doubleValue(),
        node.getZ().doubleValue(),
        hasCrossFloorConnections);
  }

  private EdgeDto toEdgeDto(AdminNavEdge edge) {
    return new EdgeDto(
        edge.getId(),
        edge.getFromNode().getId(),
        edge.getToNode().getId(),
        edge.getEdgeTypeCode(),
        edge.getEdgeType().getId(),
        edge.getWeight().doubleValue(),
        Boolean.TRUE.equals(edge.getIsBidirectional()),
        Boolean.TRUE.equals(edge.getIsCrossFloor()),
        Boolean.TRUE.equals(edge.getIsCrossBuilding()),
        edge.getInstructionForward(),
        edge.getInstructionBackward(),
        edge.getLandmark(),
        edge.getFromNode().getFloorId(),
        edge.getToNode().getFloorId(),
        displayLabel(edge.getFromNode()),
        displayLabel(edge.getToNode()),
        edge.getFromNode().getExternalId(),
        edge.getToNode().getExternalId());
  }

  private String displayLabel(AdminNavNode node) {
    if (node.getLabel() != null && !node.getLabel().isBlank()) {
      return node.getLabel();
    }
    return node.getExternalId();
  }

  private String directionKey(Long fromNodeId, Long toNodeId) {
    return fromNodeId + "->" + toNodeId;
  }

  private BigDecimal decimal(Double value) {
    return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
  }

  private Point makePoint(double x, double y) {
    return geometryFactory.createPoint(new Coordinate(x, y));
  }

  private LineString makeLineString(Point from, Point to) {
    return geometryFactory.createLineString(
        new Coordinate[] {from.getCoordinate(), to.getCoordinate()});
  }

  private String cleanText(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private String slugify(String value) {
    String normalized = value == null ? "node" : value.trim().toLowerCase(Locale.ROOT);
    normalized = NON_ALNUM.matcher(normalized).replaceAll("_");
    normalized = normalized.replaceAll("^_+|_+$", "");
    return normalized.isBlank() ? "node" : normalized;
  }
}
