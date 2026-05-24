package com.navigator.backend.dto;

import com.navigator.backend.model.NavEdge;
import com.navigator.backend.model.NavNode;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RouteSearchResult {
  private List<NavNode> nodes;
  private List<NavEdge> edges;
  private double totalCost;
}
