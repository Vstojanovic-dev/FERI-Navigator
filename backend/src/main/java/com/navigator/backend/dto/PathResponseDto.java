package com.navigator.backend.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PathResponseDto {

  /** Ukupna cijena puta (suma weighta svih veza) */
  private double totalCost;

  /** Uredan niz čvorova od starta do cilja */
  private List<PathNode> path;

  /** Poruka ako put nije pronađen */
  private String message;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class PathNode {
    private Long id;
    private String externalId;
    private String label;
    private String nodeType;
    private Long floorId;
    private double x;
    private double y;
  }
}
