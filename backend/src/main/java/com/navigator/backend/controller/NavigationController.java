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
import org.springframework.web.bind.annotation.RequestHeader;
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
      @RequestParam(defaultValue = "20") int limit,
      @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
    return ResponseEntity.ok(navigationRouteService.searchLocations(query, limit, acceptLanguage));
  }

  @GetMapping("/spaces")
  public ResponseEntity<List<NavigationLocationDto>> getSpaces(
      @RequestParam(defaultValue = "") String query,
      @RequestParam(defaultValue = "200") int limit,
      @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
    return ResponseEntity.ok(navigationRouteService.searchSpaces(query, limit, acceptLanguage));
  }

  @GetMapping("/route")
  public ResponseEntity<RouteResponseDto> getRoute(
      @RequestParam Long fromLocationId,
      @RequestParam(required = false) Long toLocationId,
      @RequestParam(required = false) String targetType,
      @RequestParam(defaultValue = "true") boolean allowElevator,
      @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
    RouteResponseDto route =
        navigationRouteService.route(
            fromLocationId, toLocationId, targetType, allowElevator, acceptLanguage);
    return ResponseEntity.ok(route);
  }

  @GetMapping("/path")
  public ResponseEntity<PathResponseDto> getPath(
      @RequestParam String from,
      @RequestParam String to,
      @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
    boolean english = acceptLanguage != null && acceptLanguage.trim().toLowerCase().startsWith("en");
    if (from == null || from.isBlank()) {
      return ResponseEntity.badRequest()
          .body(PathResponseDto.builder().message(missingLocationMessage("from", english)).build());
    }
    if (to == null || to.isBlank()) {
      return ResponseEntity.badRequest()
          .body(PathResponseDto.builder().message(missingLocationMessage("to", english)).build());
    }
    PathResponseDto result = aStarService.findPath(from.trim(), to.trim(), acceptLanguage);
    if (result.getPath() == null || result.getPath().isEmpty()) {
      return ResponseEntity.status(404).body(result);
    }
    return ResponseEntity.ok(result);
  }

  @PostMapping("/share")
  public ResponseEntity<NavigationShareDto.CreateResponse> createShare(
      @Valid @RequestBody NavigationShareDto.CreateRequest request,
      @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
    NavigationShareDto.CreateResponse response =
        navigationShareService.createShare(request, acceptLanguage);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/share/{shareCode}")
  public ResponseEntity<NavigationShareDto.ResolveResponse> resolveShare(
      @PathVariable String shareCode,
      @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
    NavigationShareDto.ResolveResponse response =
        navigationShareService.resolveShare(shareCode, acceptLanguage);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/locations/{id}")
  public ResponseEntity<NavigationLocationDto> getLocation(
      @PathVariable Long id,
      @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
    NavigationLocationDto location = navigationShareService.getLocation(id, acceptLanguage);
    return ResponseEntity.ok(location);
  }

  private String missingLocationMessage(String fieldName, boolean english) {
    return english
        ? "Parameter '" + fieldName + "' is required."
        : "Parameter '" + fieldName + "' je obvezen.";
  }
}
