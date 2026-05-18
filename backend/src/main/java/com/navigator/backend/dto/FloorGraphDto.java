package com.navigator.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import lombok.*;

public class FloorGraphDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportRequest {
        @NotNull private Integer floor;

        @NotEmpty @Valid private List<NodeDto> nodes;

        @NotEmpty @Valid private List<EdgeDto> edges;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeDto {
        @NotBlank private String id;

        private String label;

        @NotNull private Double x;

        @NotNull private Double y;

        private String nodeType;

        private Long roomId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EdgeDto {
        @NotBlank private String from;

        @NotBlank private String to;

        private String edgeType;

        private Boolean crossFloor;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportResult {
        private int nodesInserted;
        private int edgesInserted;
        private int floor;
        private String message;
    }
}