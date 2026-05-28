package com.navigator.backend.controller;

import com.navigator.backend.dto.NavigationErrorDto;
import com.navigator.backend.dto.NavigationLocationDto;
import com.navigator.backend.dto.NavigationShareDto;
import com.navigator.backend.dto.PathResponseDto;
import com.navigator.backend.dto.RouteResponseDto;
import com.navigator.backend.service.AStarService;
import com.navigator.backend.service.NavigationRouteException;
import com.navigator.backend.service.NavigationRouteService;
import com.navigator.backend.service.NavigationShareService;
import jakarta.validation.Valid;
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
  private final NavigationShareService navigationShareService;

  // ── Postojeći endpointi ──────────────────────────────────────────────────

  @GetMapping("/locations")
  public ResponseEntity<List<NavigationLocationDto>> getLocations(
      @RequestParam(defaultValue = "") String query,
      @RequestParam(defaultValue = "20") int limit) {
    return ResponseEntity.ok(navigationRouteService.searchLocations(query, limit));
  }

  @GetMapping("/spaces")
  public ResponseEntity<List<NavigationLocationDto>> getSpaces(
      @RequestParam(defaultValue = "") String query,
      @RequestParam(defaultValue = "200") int limit) {
    return ResponseEntity.ok(navigationRouteService.searchSpaces(query, limit));
  }

  @GetMapping("/route")
  public ResponseEntity<?> getRoute(
      @RequestParam Long fromLocationId,
      @RequestParam(required = false) Long toLocationId,
      @RequestParam(required = false) String targetType,
      @RequestParam(defaultValue = "true") boolean allowElevator) {
    try {
      RouteResponseDto route =
          navigationRouteService.route(fromLocationId, toLocationId, targetType, allowElevator);
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
    if (result.getPath() == null || result.getPath().isEmpty()) {
      return ResponseEntity.status(404).body(result);
    }
    return ResponseEntity.ok(result);
  }

  // ── Share endpointi ──────────────────────────────────────────────────────

  /**
   * Kreira share link za rutu.
   *
   * <p>POST /api/navigation/share
   * Body: { "fromLocationId": 1, "toLocationId": 2, "allowElevator": true }
   * ili:  { "fromLocationId": 1, "targetType": "wc", "allowElevator": true }
   *
   * <p>Response: { "shareCode": "a3Kx9mPq", "shareUrl": "http://localhost:5173/share/a3Kx9mPq" }
   */
  @PostMapping("/share")
  public ResponseEntity<?> createShare(
      @Valid @RequestBody NavigationShareDto.CreateRequest request) {
    try {
      NavigationShareDto.CreateResponse response = navigationShareService.createShare(request);
      return ResponseEntity.ok(response);
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
   * Vraća sacuvane route inpute za dati share kod.
   *
   * <p>GET /api/navigation/share/{shareCode}
   *
   * <p>Response: { "fromLocationId": 1, "toLocationId": 2, "allowElevator": true }
   * 404 ako share kod ne postoji.
   */
  @GetMapping("/share/{shareCode}")
  public ResponseEntity<?> resolveShare(@PathVariable String shareCode) {
    try {
      NavigationShareDto.ResolveResponse response =
          navigationShareService.resolveShare(shareCode);
      return ResponseEntity.ok(response);
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
   * Vraća jednu lokaciju po ID-u.
   * Koristiti za prepopunjavanje prikaza iz shared linka.
   *
   * <p>GET /api/navigation/locations/{id}
   *
   * <p>Response: NavigationLocationDto
   * 404 ako lokacija ne postoji ili nije enabled.
   */
  @GetMapping("/locations/{id}")
  public ResponseEntity<?> getLocation(@PathVariable Long id) {
    try {
      NavigationLocationDto location = navigationShareService.getLocation(id);
      return ResponseEntity.ok(location);
    } catch (NavigationRouteException exception) {
      return ResponseEntity.status(exception.getStatus())
          .body(
              NavigationErrorDto.builder()
                  .code(exception.getCode())
                  .message(exception.getMessage())
                  .build());
    }
  }
}