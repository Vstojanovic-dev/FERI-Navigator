package com.navigator.backend.admin.controller;

import com.navigator.backend.admin.dto.MapEditorDto.*;
import com.navigator.backend.admin.service.AdminSqlExportService;
import com.navigator.backend.admin.service.MapEditorException;
import com.navigator.backend.admin.service.MapEditorService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/map-editor")
@CrossOrigin(origins = "*")
public class MapEditorController {

  private final MapEditorService mapEditorService;
  private final AdminSqlExportService sqlExportService;

  public MapEditorController(
      MapEditorService mapEditorService, AdminSqlExportService sqlExportService) {
    this.mapEditorService = mapEditorService;
    this.sqlExportService = sqlExportService;
  }

  @GetMapping("/floors")
  public List<FloorOptionDto> getFloors() {
    return mapEditorService.listFloors();
  }

  @GetMapping("/floors/{floorId}/graph")
  public GraphDto getGraph(@PathVariable Long floorId) {
    return mapEditorService.getGraph(floorId);
  }

  @GetMapping("/lookup/node-types")
  public List<LookupOptionDto> getNodeTypes() {
    return mapEditorService.listNodeTypes();
  }

  @GetMapping("/lookup/edge-types")
  public List<LookupOptionDto> getEdgeTypes() {
    return mapEditorService.listEdgeTypes();
  }

  @GetMapping(value = "/export/sql", produces = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity<String> exportSql() {
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=006_admin_navigation_graph.sql")
        .body(sqlExportService.exportSql());
  }

  @PostMapping("/nodes")
  public NodeDto createNode(@Valid @RequestBody NodeUpsertRequest request) {
    return mapEditorService.createNode(request);
  }

  @PatchMapping("/nodes/{nodeId}")
  public NodeDto updateNode(@PathVariable Long nodeId, @Valid @RequestBody NodeUpsertRequest request) {
    return mapEditorService.updateNode(nodeId, request);
  }

  @DeleteMapping("/nodes/{nodeId}")
  public ResponseEntity<Void> deleteNode(@PathVariable Long nodeId) {
    mapEditorService.deleteNode(nodeId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/edges")
  public EdgeDto createEdge(@Valid @RequestBody EdgeUpsertRequest request) {
    return mapEditorService.createEdge(request);
  }

  @PatchMapping("/edges/{edgeId}")
  public EdgeDto updateEdge(@PathVariable Long edgeId, @Valid @RequestBody EdgeUpsertRequest request) {
    return mapEditorService.updateEdge(edgeId, request);
  }

  @DeleteMapping("/edges/{edgeId}")
  public ResponseEntity<Void> deleteEdge(@PathVariable Long edgeId) {
    mapEditorService.deleteEdge(edgeId);
    return ResponseEntity.noContent().build();
  }

  @ExceptionHandler(MapEditorException.class)
  public ResponseEntity<EditorErrorDto> handleMapEditorException(MapEditorException exception) {
    return ResponseEntity.status(exception.getStatus())
        .body(new EditorErrorDto(exception.getCode(), exception.getMessage()));
  }

  public record EditorErrorDto(String code, String message) {}
}
