package com.navigator.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

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

  private NavNode buildNode(Long id, String externalId, BigDecimal x, BigDecimal y) {
    Building building = Building.builder().id(1L).code("G2").name("Objekt G2").build();
    Floor floor =
        Floor.builder()
            .id(10L)
            .building(building)
            .code("pritlicje")
            .label("Pritlicje")
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
