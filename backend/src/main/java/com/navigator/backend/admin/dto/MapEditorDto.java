package com.navigator.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class MapEditorDto {

  public record FloorOptionDto(
      Long floorId,
      Long buildingId,
      String buildingCode,
      String buildingName,
      String floorCode,
      String floorLabel,
      BigDecimal levelNumber,
      String mapImageUrl,
      double coordinateWidth,
      double coordinateHeight,
      double z) {}

  public record LookupOptionDto(Long id, String code, String name, String description) {}

  public record FloorViewDto(
      Long floorId,
      Long buildingId,
      String buildingCode,
      String buildingName,
      String floorCode,
      String floorLabel,
      String mapImageUrl,
      double coordinateWidth,
      double coordinateHeight,
      double z) {}

  public record NodeDto(
      Long id,
      Long floorId,
      String externalId,
      String label,
      String nodeTypeCode,
      Long nodeTypeId,
      Long spaceId,
      boolean isWaypoint,
      boolean isPublic,
      double x,
      double y,
      double z,
      boolean hasCrossFloorConnections) {}

  public record EdgeDto(
      Long id,
      Long fromNodeId,
      Long toNodeId,
      String edgeTypeCode,
      Long edgeTypeId,
      double weight,
      boolean isBidirectional,
      boolean isCrossFloor,
      boolean isCrossBuilding,
      String instructionForward,
      String instructionBackward,
      String landmark,
      Long fromFloorId,
      Long toFloorId,
      String fromNodeLabel,
      String toNodeLabel,
      String fromNodeExternalId,
      String toNodeExternalId) {}

  public record GraphDto(FloorViewDto floor, List<NodeDto> nodes, List<EdgeDto> edges) {}

  public record NodeUpsertRequest(
      @NotNull Long floorId,
      String label,
      String externalId,
      @NotBlank String nodeTypeCode,
      @NotNull Double x,
      @NotNull Double y,
      @NotNull Boolean isWaypoint,
      @NotNull Boolean isPublic,
      Long spaceId) {}

  public record EdgeUpsertRequest(
      @NotNull Long fromNodeId,
      @NotNull Long toNodeId,
      @NotBlank String edgeTypeCode,
      @NotNull Boolean isBidirectional,
      @NotNull Boolean isCrossFloor,
      @NotNull Boolean isCrossBuilding,
      String instructionForward,
      String instructionBackward,
      String landmark) {}
}
