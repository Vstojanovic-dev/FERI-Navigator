package com.navigator.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NavigationLocationDto {
  private Long id;
  private String displayName;
  private String locationType;
  private Long buildingId;
  private String buildingCode;
  private String buildingName;
  private Long floorId;
  private String floorCode;
  private String floorLabel;
  private Long nodeId;
  private boolean hasNode;
}
