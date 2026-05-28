package com.navigator.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

public class NavigationShareDto {

  /** POST /api/navigation/share — request body */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class CreateRequest {

    @NotNull(message = "fromLocationId je obavezan.")
    private Long fromLocationId;

    // Tacno jedan od ova dva mora biti poslat — validacija u servisu
    private Long toLocationId;

    private String targetType;

    @Builder.Default private boolean allowElevator = true;
  }

  /** POST /api/navigation/share — response */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class CreateResponse {
    private String shareCode;
    private String shareUrl;
  }

  /** GET /api/navigation/share/{shareCode} — response sa sacuvanim route inputima */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class ResolveResponse {
    private Long fromLocationId;
    private Long toLocationId;
    private String targetType;
    private boolean allowElevator;
  }
}