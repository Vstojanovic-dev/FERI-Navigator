package com.navigator.backend.service;

import com.navigator.backend.dto.NavigationShareDto;
import com.navigator.backend.model.NavigationRouteShare;
import com.navigator.backend.repository.NavigationRouteShareRepository;
import com.navigator.backend.repository.NavigationLocationRepository;
import java.security.SecureRandom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NavigationShareService {

  private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  private static final int CODE_LENGTH = 8;
  private static final int MAX_RETRIES = 10;

  private final NavigationRouteShareRepository shareRepository;
  private final NavigationLocationRepository locationRepository;

  @Value("${app.share.base-url:http://localhost:5173}")
  private String baseUrl;

  @Transactional
  public NavigationShareDto.CreateResponse createShare(NavigationShareDto.CreateRequest request) {
    validateRequest(request);

    String shareCode = generateUniqueCode();

    NavigationRouteShare share = NavigationRouteShare.builder()
        .shareCode(shareCode)
        .fromLocationId(request.getFromLocationId())
        .toLocationId(request.getToLocationId())
        .targetType(normalizeTargetType(request.getTargetType()))
        .allowElevator(request.isAllowElevator())
        .build();

    shareRepository.save(share);
    log.info("Share kreiran: {} (from={}, to={}, targetType={})",
        shareCode, request.getFromLocationId(), request.getToLocationId(), request.getTargetType());

    String shareUrl = baseUrl + "/share/" + shareCode;
    return NavigationShareDto.CreateResponse.builder()
        .shareCode(shareCode)
        .shareUrl(shareUrl)
        .build();
  }

  @Transactional(readOnly = true)
  public NavigationShareDto.ResolveResponse resolveShare(String shareCode) {
    NavigationRouteShare share = shareRepository.findByShareCode(shareCode)
        .orElseThrow(() -> new NavigationRouteException(
            HttpStatus.NOT_FOUND,
            "SHARE_NOT_FOUND",
            "Share link nije pronađen ili je istekao."));

    return NavigationShareDto.ResolveResponse.builder()
        .fromLocationId(share.getFromLocationId())
        .toLocationId(share.getToLocationId())
        .targetType(share.getTargetType())
        .allowElevator(share.isAllowElevator())
        .build();
  }

  @Transactional(readOnly = true)
  public com.navigator.backend.dto.NavigationLocationDto getLocation(Long locationId) {
    // Reuse postojeći NavigationRouteService#findLocation logiku
    // kroz repository direktno da ne kreiramo cirkularnu zavisnost
    return locationRepository.findEnabledById(locationId)
        .map(location -> {
          com.navigator.backend.model.Space space = location.getSpace();
          return com.navigator.backend.dto.NavigationLocationDto.builder()
              .id(location.getId())
              .displayName(location.getDisplayName())
              .locationType(location.getLocationType())
              .buildingId(location.getBuilding().getId())
              .buildingCode(location.getBuilding().getCode())
              .buildingName(location.getBuilding().getName())
              .floorId(location.getFloor().getId())
              .floorCode(location.getFloor().getCode())
              .floorLabel(location.getFloor().getLabel())
              .nodeId(location.getNode() != null ? location.getNode().getId() : null)
              .spaceId(space != null ? space.getId() : location.getSpaceId())
              .spaceName(space != null ? space.getName() : null)
              .spaceTypeName(space != null && space.getSpaceType() != null
                  ? space.getSpaceType().getName() : null)
              .description(space != null ? space.getDescription() : null)
              .imageUrl(space != null ? space.getImageUrl() : null)
              .hasNode(location.hasNode())
              .build();
        })
        .orElseThrow(() -> new NavigationRouteException(
            HttpStatus.NOT_FOUND,
            "LOCATION_NOT_FOUND",
            "Lokacija nije pronađena: " + locationId));
  }

  // ── Helpers ──

  private void validateRequest(NavigationShareDto.CreateRequest request) {
    boolean hasLocation = request.getToLocationId() != null;
    boolean hasTargetType = request.getTargetType() != null
        && !request.getTargetType().isBlank();

    if (hasLocation == hasTargetType) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST,
          "INVALID_TARGET",
          "Pošaljite tačno jedan cilj: toLocationId ili targetType.");
    }

    // Proveri da from lokacija postoji
    if (!locationRepository.existsEnabledById(request.getFromLocationId())) {
      throw new NavigationRouteException(
          HttpStatus.NOT_FOUND,
          "LOCATION_NOT_FOUND",
          "Početna lokacija nije pronađena: " + request.getFromLocationId());
    }

    // Proveri da to lokacija postoji (samo ako je prosleđena)
    if (hasLocation && !locationRepository.existsEnabledById(request.getToLocationId())) {
      throw new NavigationRouteException(
          HttpStatus.NOT_FOUND,
          "LOCATION_NOT_FOUND",
          "Ciljna lokacija nije pronađena: " + request.getToLocationId());
    }
  }

  private String generateUniqueCode() {
    SecureRandom random = new SecureRandom();
    for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
      StringBuilder sb = new StringBuilder(CODE_LENGTH);
      for (int i = 0; i < CODE_LENGTH; i++) {
        sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
      }
      String code = sb.toString();
      if (!shareRepository.existsByShareCode(code)) {
        return code;
      }
    }
    throw new NavigationRouteException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "SHARE_CODE_GENERATION_FAILED",
        "Nije moguće generisati jedinstveni share kod. Pokušajte ponovo.");
  }

  private String normalizeTargetType(String targetType) {
    if (targetType == null || targetType.isBlank()) return null;
    return targetType.trim().toLowerCase(java.util.Locale.ROOT);
  }
}