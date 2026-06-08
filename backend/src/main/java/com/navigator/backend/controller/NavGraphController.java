package com.navigator.backend.controller;

import com.navigator.backend.dto.FloorGraphDto;
import com.navigator.backend.service.NavGraphService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/graph")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NavGraphController {

  private final NavGraphService navGraphService;

  @PostMapping("/import")
  public ResponseEntity<FloorGraphDto.ImportResult> importFloor(
      @Valid @RequestBody FloorGraphDto.ImportRequest request) {
    FloorGraphDto.ImportResult result = navGraphService.importFloorGraph(request);
    return ResponseEntity.ok(result);
  }

  @PostMapping("/cross-floor")
  public ResponseEntity<String> importCrossFloor(@RequestBody List<FloorGraphDto.EdgeDto> edges) {
    int count = navGraphService.importCrossFloorEdges(edges);
    return ResponseEntity.ok("Uvoženih je " + count + " povezav med nadstropji.");
  }
}
