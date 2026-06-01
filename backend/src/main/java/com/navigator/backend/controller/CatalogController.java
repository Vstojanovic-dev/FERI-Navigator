package com.navigator.backend.controller;

import com.navigator.backend.dto.BuildingCatalogDto;
import com.navigator.backend.dto.CatalogSpaceDto;
import com.navigator.backend.service.CatalogService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

  private final CatalogService catalogService;

  @GetMapping("/buildings")
  public ResponseEntity<List<BuildingCatalogDto>> getBuildings() {
    return ResponseEntity.ok(catalogService.listBuildings());
  }

  @GetMapping("/buildings/{buildingId}/spaces")
  public ResponseEntity<List<CatalogSpaceDto>> getBuildingSpaces(@PathVariable Long buildingId) {
    return ResponseEntity.ok(catalogService.listBuildingSpaces(buildingId));
  }
}
