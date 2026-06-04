package com.navigator.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.navigator.backend.model.Building;
import com.navigator.backend.model.Floor;
import com.navigator.backend.model.NavNode;
import com.navigator.backend.model.NodeType;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class VerticalPreferenceResolverTest {

  private final VerticalPreferenceResolver resolver = new VerticalPreferenceResolver();

  /*
  Behavior matrix:
  - same floor -> ANY
  - different floors + allowElevator=true -> ELEVATOR_ONLY then STAIRS_ONLY
  - one floor + allowElevator=false -> STAIRS_ONLY then ELEVATOR_ONLY
  - two or more floors + allowElevator=false -> ELEVATOR_ONLY then STAIRS_ONLY
  */

  @Test
  void sameFloorUsesAnyMode() {
    assertEquals(
        List.of(VerticalTraversalMode.ANY),
        resolver.resolveAttemptOrder(buildNode(1L, 0), buildNode(2L, 0), false));
  }

  @Test
  void sameFloorWithElevatorToggleStillUsesAnyMode() {
    assertEquals(
        List.of(VerticalTraversalMode.ANY),
        resolver.resolveAttemptOrder(buildNode(1L, 0), buildNode(2L, 0), true));
  }

  @Test
  void elevatorToggleMakesElevatorPrimaryForSingleFloorTravel() {
    assertEquals(
        List.of(VerticalTraversalMode.ELEVATOR_ONLY, VerticalTraversalMode.STAIRS_ONLY),
        resolver.resolveAttemptOrder(buildNode(1L, 0), buildNode(2L, 1), true));
  }

  @Test
  void oneFloorDifferenceWithoutElevatorPrefersStairs() {
    assertEquals(
        List.of(VerticalTraversalMode.STAIRS_ONLY, VerticalTraversalMode.ELEVATOR_ONLY),
        resolver.resolveAttemptOrder(buildNode(1L, 0), buildNode(2L, 1), false));
  }

  @Test
  void multiFloorDifferenceWithoutElevatorPrefersElevator() {
    assertEquals(
        List.of(VerticalTraversalMode.ELEVATOR_ONLY, VerticalTraversalMode.STAIRS_ONLY),
        resolver.resolveAttemptOrder(buildNode(1L, 0), buildNode(2L, 3), false));
  }

  private NavNode buildNode(Long nodeId, int levelNumber) {
    Building building = Building.builder().id(1L).code("G2").name("Objekt G2").build();
    Floor floor =
        Floor.builder()
            .id(nodeId + 100)
            .building(building)
            .code("floor-" + levelNumber)
            .label("Floor " + levelNumber)
            .levelNumber(BigDecimal.valueOf(levelNumber))
            .z(BigDecimal.valueOf(levelNumber))
            .mapImageUrl("/maps/test.png")
            .coordinateWidth(BigDecimal.valueOf(1000))
            .coordinateHeight(BigDecimal.valueOf(1000))
            .build();

    return NavNode.builder()
        .id(nodeId)
        .externalId("node-" + nodeId)
        .label("Node " + nodeId)
        .nodeType(NodeType.builder().id(1L).code("corridor").name("Corridor").build())
        .floor(floor)
        .floorId(floor.getId())
        .x(BigDecimal.ZERO)
        .y(BigDecimal.ZERO)
        .z(BigDecimal.valueOf(levelNumber))
        .build();
  }
}
