package com.navigator.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.navigator.backend.dto.PathResponseDto;
import com.navigator.backend.dto.RouteSearchResult;
import com.navigator.backend.model.Building;
import com.navigator.backend.model.EdgeType;
import com.navigator.backend.model.Floor;
import com.navigator.backend.model.NavEdge;
import com.navigator.backend.model.NavNode;
import com.navigator.backend.model.NodeType;
import com.navigator.backend.repository.NavEdgeRepository;
import com.navigator.backend.repository.NavNodeRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AStarServiceTest {

  @Mock private NavNodeRepository nodeRepository;
  @Mock private NavEdgeRepository edgeRepository;

  @Test
  void findsLowerCostPathWhenNodePriorityNeedsRefresh() {
    AStarService service = new AStarService(nodeRepository, edgeRepository);

    NavNode start = buildNode(1L, "start", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode viaA = buildNode(2L, "via-a", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode viaX = buildNode(3L, "via-x", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode viaB = buildNode(4L, "via-b", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode goal = buildNode(5L, "goal", BigDecimal.ZERO, BigDecimal.ZERO);

    when(edgeRepository.findByFromNodeId(1L))
        .thenReturn(List.of(edge(start, viaA, "corridor", "1"), edge(start, viaB, "corridor", "12")));
    when(edgeRepository.findByFromNodeId(2L))
        .thenReturn(List.of(edge(viaA, goal, "corridor", "9"), edge(viaA, viaX, "corridor", "0.5")));
    when(edgeRepository.findByFromNodeId(3L))
        .thenReturn(List.of(edge(viaX, viaB, "corridor", "0.5")));
    when(edgeRepository.findByFromNodeId(4L))
        .thenReturn(List.of(edge(viaB, goal, "corridor", "1")));

    RouteSearchResult result = service.findPath(start, goal, true);

    assertEquals(List.of(start, viaA, viaX, viaB, goal), result.getNodes());
    assertEquals(3.0, result.getTotalCost(), 1e-9);
  }

  @Test
  void rejectsPathSearchWhenGoalCoordinatesAreMissing() {
    AStarService service = new AStarService(nodeRepository, edgeRepository);

    NavNode start = buildNode(1L, "start", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode goal = buildNode(2L, "goal", null, BigDecimal.ZERO);

    IllegalStateException exception =
        assertThrows(IllegalStateException.class, () -> service.findPath(start, goal, true));

    assertEquals("Missing coordinate: x for node 2", exception.getMessage());
  }

  @Test
  void rejectsMalformedEdgeWithoutDestinationNode() {
    AStarService service = new AStarService(nodeRepository, edgeRepository);

    NavNode start = buildNode(1L, "start", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode goal = buildNode(2L, "goal", BigDecimal.ONE, BigDecimal.ONE);

    when(edgeRepository.findByFromNodeId(1L))
        .thenReturn(
            List.of(
                NavEdge.builder()
                    .id(99L)
                    .fromNode(start)
                    .weight(BigDecimal.ONE)
                    .edgeType(EdgeType.builder().id(1L).code("corridor").name("corridor").build())
                    .build()));

    IllegalStateException exception =
        assertThrows(IllegalStateException.class, () -> service.findPath(start, goal, true));

    assertEquals("Missing destination node for edge.", exception.getMessage());
  }

  @Test
  void stairsOnlyModeSkipsElevatorEdgesEvenWhenElevatorPathIsCheaper() {
    AStarService service = new AStarService(nodeRepository, edgeRepository);

    NavNode start = buildNode(1L, "start", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode stairsNode = buildNode(2L, "stairs-node", BigDecimal.ONE, BigDecimal.ONE);
    NavNode elevatorNode = buildNode(3L, "elevator-node", BigDecimal.TEN, BigDecimal.TEN);
    NavNode goal = buildNode(4L, "goal", BigDecimal.valueOf(20), BigDecimal.valueOf(20));

    when(edgeRepository.findByFromNodeId(1L))
        .thenReturn(
            List.of(
                edge(start, stairsNode, "stairs", "5"),
                edge(start, elevatorNode, "elevator", "1")));
    when(edgeRepository.findByFromNodeId(2L))
        .thenReturn(List.of(edge(stairsNode, goal, "corridor", "5")));

    RouteSearchResult result =
        service.findPath(start, goal, false, VerticalTraversalMode.STAIRS_ONLY);

    assertEquals(List.of(start, stairsNode, goal), result.getNodes());
  }

  @Test
  void elevatorOnlyModeSkipsStairsEdgesEvenWhenStairsPathIsCheaper() {
    AStarService service = new AStarService(nodeRepository, edgeRepository);

    NavNode start = buildNode(1L, "start", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode stairsNode = buildNode(2L, "stairs-node", BigDecimal.ONE, BigDecimal.ONE);
    NavNode elevatorNode = buildNode(3L, "elevator-node", BigDecimal.TEN, BigDecimal.TEN);
    NavNode goal = buildNode(4L, "goal", BigDecimal.valueOf(20), BigDecimal.valueOf(20));

    when(edgeRepository.findByFromNodeId(1L))
        .thenReturn(
            List.of(
                edge(start, stairsNode, "stairs", "1"),
                edge(start, elevatorNode, "elevator", "5")));
    when(edgeRepository.findByFromNodeId(3L))
        .thenReturn(List.of(edge(elevatorNode, goal, "corridor", "5")));

    RouteSearchResult result =
        service.findPath(start, goal, true, VerticalTraversalMode.ELEVATOR_ONLY);

    assertEquals(List.of(start, elevatorNode, goal), result.getNodes());
  }

  @Test
  void anyModeStillChoosesCheapestPath() {
    AStarService service = new AStarService(nodeRepository, edgeRepository);

    NavNode start = buildNode(1L, "start", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode corridorA = buildNode(2L, "corridor-a", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode corridorB = buildNode(3L, "corridor-b", BigDecimal.ZERO, BigDecimal.ZERO);
    NavNode goal = buildNode(4L, "goal", BigDecimal.ZERO, BigDecimal.ZERO);

    when(edgeRepository.findByFromNodeId(1L))
        .thenReturn(
            List.of(
                edge(start, corridorA, "corridor", "1"),
                edge(start, corridorB, "corridor", "5")));
    when(edgeRepository.findByFromNodeId(2L))
        .thenReturn(List.of(edge(corridorA, goal, "corridor", "1")));

    RouteSearchResult result =
        service.findPath(start, goal, false, VerticalTraversalMode.ANY);

    assertEquals(List.of(start, corridorA, goal), result.getNodes());
  }

  @Test
  void legacyPathMessagesAreLocalizedForEnglish() {
    AStarService service = new AStarService(nodeRepository, edgeRepository);

    PathResponseDto result = service.findPath("referat", "alfa", "en-US");

    assertEquals("Start node was not found: referat", result.getMessage());
    assertEquals(List.of(), result.getPath());
  }

  private NavNode buildNode(Long id, String externalId, BigDecimal x, BigDecimal y) {
    Building building = Building.builder().id(1L).code("G2").name("Objekt G2").build();
    Floor floor =
        Floor.builder()
            .id(10L)
            .building(building)
            .code("pritlicje")
            .label("Pritličje")
            .levelNumber(BigDecimal.ZERO)
            .z(BigDecimal.ZERO)
            .mapImageUrl("/maps/test.png")
            .coordinateWidth(BigDecimal.valueOf(1000))
            .coordinateHeight(BigDecimal.valueOf(1000))
            .build();

    return NavNode.builder()
        .id(id)
        .externalId(externalId)
        .label(externalId)
        .floorId(floor.getId())
        .floor(floor)
        .nodeType(NodeType.builder().id(1L).code("corridor").name("Corridor").build())
        .isWaypoint(true)
        .x(x)
        .y(y)
        .z(BigDecimal.ZERO)
        .build();
  }

  private NavEdge edge(NavNode from, NavNode to, String edgeTypeCode, String weight) {
    return NavEdge.builder()
        .id(from.getId() * 10 + to.getId())
        .fromNode(from)
        .toNode(to)
        .weight(new BigDecimal(weight))
        .edgeType(EdgeType.builder().id(1L).code(edgeTypeCode).name(edgeTypeCode).build())
        .build();
  }
}
