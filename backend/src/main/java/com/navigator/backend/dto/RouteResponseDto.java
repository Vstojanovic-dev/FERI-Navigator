package com.navigator.backend.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RouteResponseDto {
  private String routeId;
  private NavigationLocationDto from;
  private NavigationLocationDto to;
  private double totalCost;
  private List<RouteSegmentDto> segments;

  @Data
  @Builder
  public static class RouteSegmentDto {
    private int index;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long floorId;
    private String floorCode;
    private String floorLabel;
    private String mapImageUrl;
    private double coordinateWidth;
    private double coordinateHeight;
    private double z;
    private boolean usesElevator;
    private boolean usesStairs;
    private List<RoutePointDto> path;
    private List<RouteStepDto> steps;
  }

  @Data
  @Builder
  public static class RoutePointDto {
    private Long nodeId;
    private String externalId;
    private String label;
    private String nodeType;
    private double x;
    private double y;
    private double z;
  }

  @Data
  @Builder
  public static class RouteStepDto {
    private int index;
    private String text;
    private Long fromNodeId;
    private Long toNodeId;
    private String type;
    private String icon;
    private String maneuverType;
    private Long zoneId;
  }
}
