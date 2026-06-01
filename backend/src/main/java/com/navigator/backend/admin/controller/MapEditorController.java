package com.navigator.backend.admin.controller;

import com.navigator.backend.admin.dto.MapEditorDto.EdgeDto;
import com.navigator.backend.admin.dto.MapEditorDto.EdgeUpsertRequest;
import com.navigator.backend.admin.dto.MapEditorDto.FloorOptionDto;
import com.navigator.backend.admin.dto.MapEditorDto.GraphDto;
import com.navigator.backend.admin.dto.MapEditorDto.LookupOptionDto;
import com.navigator.backend.admin.dto.MapEditorDto.NodeDto;
import com.navigator.backend.admin.dto.MapEditorDto.NodeUpsertRequest;
import com.navigator.backend.admin.service.AdminSqlExportService;
import com.navigator.backend.admin.service.MapEditorService;
import com.navigator.backend.config.AdminModeGuard;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/map-editor")
public class MapEditorController {

  private final AdminModeGuard adminModeGuard;
  private final MapEditorService mapEditorService;
  private final AdminSqlExportService sqlExportService;

  public MapEditorController(
      AdminModeGuard adminModeGuard,
      MapEditorService mapEditorService,
      AdminSqlExportService sqlExportService) {
    this.adminModeGuard = adminModeGuard;
    this.mapEditorService = mapEditorService;
    this.sqlExportService = sqlExportService;
  }

  @GetMapping("/floors")
  public List<FloorOptionDto> getFloors() {
    adminModeGuard.requireEnabled();
    return mapEditorService.listFloors();
  }

  @GetMapping("/floors/{floorId}/graph")
  public GraphDto getGraph(@PathVariable Long floorId) {
    adminModeGuard.requireEnabled();
    return mapEditorService.getGraph(floorId);
  }

  @GetMapping("/lookup/node-types")
  public List<LookupOptionDto> getNodeTypes() {
    adminModeGuard.requireEnabled();
    return mapEditorService.listNodeTypes();
  }

  @GetMapping("/lookup/edge-types")
  public List<LookupOptionDto> getEdgeTypes() {
    adminModeGuard.requireEnabled();
    return mapEditorService.listEdgeTypes();
  }

  @GetMapping(value = "/export/sql", produces = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity<String> exportSql() {
    adminModeGuard.requireEnabled();
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=006_admin_navigation_graph.sql")
        .body(sqlExportService.exportSql());
  }

  @PostMapping("/nodes")
  public NodeDto createNode(@Valid @RequestBody NodeUpsertRequest request) {
    adminModeGuard.requireEnabled();
    return mapEditorService.createNode(request);
  }

  @PatchMapping("/nodes/{nodeId}")
  public NodeDto updateNode(
      @PathVariable Long nodeId, @Valid @RequestBody NodeUpsertRequest request) {
    adminModeGuard.requireEnabled();
    return mapEditorService.updateNode(nodeId, request);
  }

  @DeleteMapping("/nodes/{nodeId}")
  public ResponseEntity<Void> deleteNode(@PathVariable Long nodeId) {
    adminModeGuard.requireEnabled();
    mapEditorService.deleteNode(nodeId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/edges")
  public EdgeDto createEdge(@Valid @RequestBody EdgeUpsertRequest request) {
    adminModeGuard.requireEnabled();
    return mapEditorService.createEdge(request);
  }

  @PatchMapping("/edges/{edgeId}")
  public EdgeDto updateEdge(
      @PathVariable Long edgeId, @Valid @RequestBody EdgeUpsertRequest request) {
    adminModeGuard.requireEnabled();
    return mapEditorService.updateEdge(edgeId, request);
  }

  @DeleteMapping("/edges/{edgeId}")
  public ResponseEntity<Void> deleteEdge(@PathVariable Long edgeId) {
    adminModeGuard.requireEnabled();
    mapEditorService.deleteEdge(edgeId);
    return ResponseEntity.noContent().build();
  }

  public record EditorErrorDto(String code, String message) {}
}
