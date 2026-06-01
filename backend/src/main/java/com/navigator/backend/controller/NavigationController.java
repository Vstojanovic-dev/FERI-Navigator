package com.navigator.backend.controller;

import com.navigator.backend.dto.NavigationLocationDto;
import com.navigator.backend.dto.NavigationShareDto;
import com.navigator.backend.dto.PathResponseDto;
import com.navigator.backend.dto.RouteResponseDto;
import com.navigator.backend.service.AStarService;
import com.navigator.backend.service.NavigationRouteService;
import com.navigator.backend.service.NavigationShareService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/navigation")
@RequiredArgsConstructor
public class NavigationController {

  private final AStarService aStarService;
  private final NavigationRouteService navigationRouteService;
  private final NavigationShareService navigationShareService;

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
  public ResponseEntity<RouteResponseDto> getRoute(
      @RequestParam Long fromLocationId,
      @RequestParam(required = false) Long toLocationId,
      @RequestParam(required = false) String targetType,
      @RequestParam(defaultValue = "true") boolean allowElevator) {
    RouteResponseDto route =
        navigationRouteService.route(fromLocationId, toLocationId, targetType, allowElevator);
    return ResponseEntity.ok(route);
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

  @PostMapping("/share")
  public ResponseEntity<NavigationShareDto.CreateResponse> createShare(
      @Valid @RequestBody NavigationShareDto.CreateRequest request) {
    NavigationShareDto.CreateResponse response = navigationShareService.createShare(request);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/share/{shareCode}")
  public ResponseEntity<NavigationShareDto.ResolveResponse> resolveShare(
      @PathVariable String shareCode) {
    NavigationShareDto.ResolveResponse response = navigationShareService.resolveShare(shareCode);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/locations/{id}")
  public ResponseEntity<NavigationLocationDto> getLocation(@PathVariable Long id) {
    NavigationLocationDto location = navigationShareService.getLocation(id);
    return ResponseEntity.ok(location);
  }
}
