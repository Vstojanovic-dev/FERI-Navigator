package com.navigator.backend.service;

import com.navigator.backend.model.NavNode;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class VerticalPreferenceResolver {

  // Product rule:
  // - same floor -> ANY
  // - different floors + allowElevator=true -> ELEVATOR_ONLY then STAIRS_ONLY
  // - one floor + allowElevator=false -> STAIRS_ONLY then ELEVATOR_ONLY
  // - two or more floors + allowElevator=false -> ELEVATOR_ONLY then STAIRS_ONLY
  public List<VerticalTraversalMode> resolveAttemptOrder(
      NavNode start, NavNode goal, boolean allowElevator) {
    int floorDelta = floorDelta(start, goal);

    if (floorDelta == 0) {
      return List.of(VerticalTraversalMode.ANY);
    }

    if (allowElevator) {
      return List.of(
          VerticalTraversalMode.ELEVATOR_ONLY,
          VerticalTraversalMode.STAIRS_ONLY);
    }

    if (floorDelta == 1) {
      return List.of(
          VerticalTraversalMode.STAIRS_ONLY,
          VerticalTraversalMode.ELEVATOR_ONLY);
    }

    return List.of(
        VerticalTraversalMode.ELEVATOR_ONLY,
        VerticalTraversalMode.STAIRS_ONLY);
  }

  int floorDelta(NavNode start, NavNode goal) {
    BigDecimal startLevel = requireLevelNumber(start);
    BigDecimal goalLevel = requireLevelNumber(goal);
    return startLevel.subtract(goalLevel).abs().intValueExact();
  }

  private BigDecimal requireLevelNumber(NavNode node) {
    if (node == null || node.getFloor() == null || node.getFloor().getLevelNumber() == null) {
      throw new IllegalStateException("Missing floor level for node " + requireNodeId(node));
    }
    return node.getFloor().getLevelNumber();
  }

  private Long requireNodeId(NavNode node) {
    if (node == null || node.getId() == null) {
      throw new IllegalStateException("Missing node id.");
    }
    return node.getId();
  }
}
