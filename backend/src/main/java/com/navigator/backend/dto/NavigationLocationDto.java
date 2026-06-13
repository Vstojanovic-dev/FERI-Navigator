package com.navigator.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NavigationLocationDto {
  private Long id;
  private String displayName;
  private String searchableName;
  private String locationType;
  private Long buildingId;
  private String buildingCode;
  private String buildingName;
  private Long floorId;
  private String floorCode;
  private String floorLabel;
  private Long nodeId;
  private Long spaceId;
  private String spaceName;
  private String spaceTypeName;
  private String description;
  private String imageUrl;
  private boolean hasNode;
}
