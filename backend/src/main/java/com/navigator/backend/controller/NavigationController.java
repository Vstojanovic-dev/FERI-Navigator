package com.navigator.backend.controller;

import com.navigator.backend.dto.PathResponseDto;
import com.navigator.backend.dto.NavigationErrorDto;
import com.navigator.backend.dto.NavigationLocationDto;
import com.navigator.backend.dto.RouteResponseDto;
import com.navigator.backend.service.AStarService;
import com.navigator.backend.service.NavigationRouteException;
import com.navigator.backend.service.NavigationRouteService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/navigation")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Za razvoj — ograniči u produkciji
public class NavigationController {

  private final AStarService aStarService;
  private final NavigationRouteService navigationRouteService;

  @GetMapping("/locations")
  public ResponseEntity<List<NavigationLocationDto>> getLocations(
      @RequestParam(defaultValue = "") String query, @RequestParam(defaultValue = "20") int limit) {
    return ResponseEntity.ok(navigationRouteService.searchLocations(query, limit));
  }

  @GetMapping("/route")
  public ResponseEntity<?> getRoute(
      @RequestParam Long fromLocationId,
      @RequestParam Long toLocationId,
      @RequestParam(defaultValue = "true") boolean allowElevator) {
    try {
      RouteResponseDto route =
          navigationRouteService.route(fromLocationId, toLocationId, allowElevator);
      return ResponseEntity.ok(route);
    } catch (NavigationRouteException exception) {
      return ResponseEntity.status(exception.getStatus())
          .body(
              NavigationErrorDto.builder()
                  .code(exception.getCode())
                  .message(exception.getMessage())
                  .build());
    }
  }

  /**
   * Traži najkraći put između dva čvora.
   *
   * <p>GET /api/navigation/path?from=referat&to=amper_lab
   *
   * <p>Parametri: from — label ili externalId početnog čvora (npr. "referat", "0_referat") to —
   * label ili externalId ciljnog čvora
   *
   * <p>Odgovor: 200 OK — PathResponseDto sa putem i ukupnom cijenom 400 Bad Request — ako from ili
   * to nisu navedeni
   */
  @GetMapping("/path")
  public ResponseEntity<PathResponseDto> getPath(
      @RequestParam String from, @RequestParam String to) {

    if (from == null || from.isBlank()) {
      return ResponseEntity.badRequest()
          .body(PathResponseDto.builder().message("Parametar 'from' je obavezan.").build());
    }
    if (to == null || to.isBlank()) {
      return ResponseEntity.badRequest()
          .body(PathResponseDto.builder().message("Parametar 'to' je obavezan.").build());
    }

    PathResponseDto result = aStarService.findPath(from.trim(), to.trim());

    // Ako put nije pronađen, vrati 404 umjesto 200
    if (result.getPath() == null || result.getPath().isEmpty()) {
      return ResponseEntity.status(404).body(result);
    }

    return ResponseEntity.ok(result);
  }
}
