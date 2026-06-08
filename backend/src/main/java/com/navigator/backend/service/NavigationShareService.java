package com.navigator.backend.service;

import com.navigator.backend.dto.NavigationLocationDto;
import com.navigator.backend.dto.NavigationShareDto;
import com.navigator.backend.model.NavigationRouteShare;
import com.navigator.backend.model.Space;
import com.navigator.backend.repository.NavigationLocationRepository;
import com.navigator.backend.repository.NavigationRouteShareRepository;
import java.security.SecureRandom;
import java.util.Locale;
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

  private static final String ALPHABET =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  private static final int CODE_LENGTH = 8;
  private static final int MAX_RETRIES = 10;

  private final NavigationRouteShareRepository shareRepository;
  private final NavigationLocationRepository locationRepository;

  @Value("${app.share.base-url:http://localhost:5173}")
  private String baseUrl;

  @Transactional
  public NavigationShareDto.CreateResponse createShare(NavigationShareDto.CreateRequest request) {
    return createShare(request, null);
  }

  @Transactional
  public NavigationShareDto.CreateResponse createShare(
      NavigationShareDto.CreateRequest request, String acceptLanguage) {
    NavigationLanguage language = NavigationLanguage.fromHeader(acceptLanguage);
    validateRequest(request, language);

    String shareCode = generateUniqueCode(language);

    NavigationRouteShare share =
        NavigationRouteShare.builder()
            .shareCode(shareCode)
            .fromLocationId(request.getFromLocationId())
            .toLocationId(request.getToLocationId())
            .targetType(normalizeTargetType(request.getTargetType()))
            .allowElevator(request.isAllowElevator())
            .build();

    shareRepository.save(share);
    log.info(
        "Povezava za deljenje je ustvarjena: {} (from={}, to={}, targetType={})",
        shareCode,
        request.getFromLocationId(),
        request.getToLocationId(),
        request.getTargetType());

    String shareUrl = normalizedBaseUrl(language) + "/share/" + shareCode;
    return NavigationShareDto.CreateResponse.builder()
        .shareCode(shareCode)
        .shareUrl(shareUrl)
        .build();
  }

  @Transactional(readOnly = true)
  public NavigationShareDto.ResolveResponse resolveShare(String shareCode) {
    return resolveShare(shareCode, null);
  }

  @Transactional(readOnly = true)
  public NavigationShareDto.ResolveResponse resolveShare(String shareCode, String acceptLanguage) {
    NavigationLanguage language = NavigationLanguage.fromHeader(acceptLanguage);
    NavigationRouteShare share =
        shareRepository
            .findByShareCode(normalizeShareCode(shareCode, language))
            .orElseThrow(
                () ->
                    new NavigationRouteException(
                        HttpStatus.NOT_FOUND,
                        "SHARE_NOT_FOUND",
                        NavigationTexts.shareNotFound(language)));

    return NavigationShareDto.ResolveResponse.builder()
        .fromLocationId(share.getFromLocationId())
        .toLocationId(share.getToLocationId())
        .targetType(share.getTargetType())
        .allowElevator(share.isAllowElevator())
        .build();
  }

  @Transactional(readOnly = true)
  public NavigationLocationDto getLocation(Long locationId) {
    return getLocation(locationId, null);
  }

  @Transactional(readOnly = true)
  public NavigationLocationDto getLocation(Long locationId, String acceptLanguage) {
    NavigationLanguage language = NavigationLanguage.fromHeader(acceptLanguage);
    if (locationId == null) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST, "MISSING_LOCATION", NavigationTexts.missingLocation("id", language));
    }

    return locationRepository
        .findEnabledById(locationId)
        .map(
            location -> {
              Space space = location.getSpace();
              return NavigationLocationDto.builder()
                  .id(location.getId())
                  .displayName(
                      NavigationLocalization.localizeDisplayName(
                          location.getDisplayName(), language))
                  .locationType(location.getLocationType())
                  .buildingId(location.getBuilding().getId())
                  .buildingCode(location.getBuilding().getCode())
                  .buildingName(
                      NavigationLocalization.localizeBuildingName(
                          location.getBuilding().getName(), language))
                  .floorId(location.getFloor().getId())
                  .floorCode(location.getFloor().getCode())
                  .floorLabel(
                      NavigationLocalization.localizeFloorLabel(
                          location.getFloor().getLabel(), language))
                  .nodeId(location.getNode() != null ? location.getNode().getId() : null)
                  .spaceId(space != null ? space.getId() : location.getSpaceId())
                  .spaceName(
                      space != null
                          ? NavigationLocalization.localizeDisplayName(space.getName(), language)
                          : null)
                  .spaceTypeName(
                      space != null && space.getSpaceType() != null
                          ? NavigationLocalization.localizeSpaceTypeName(
                              space.getSpaceType().getName(), language)
                          : null)
                  .description(space != null ? space.getDescription() : null)
                  .imageUrl(space != null ? space.getImageUrl() : null)
                  .hasNode(location.hasNode())
                  .build();
            })
        .orElseThrow(
            () ->
                new NavigationRouteException(
                    HttpStatus.NOT_FOUND,
                    "LOCATION_NOT_FOUND",
                    NavigationTexts.locationNotFound(locationId, language)));
  }

  private void validateRequest(
      NavigationShareDto.CreateRequest request, NavigationLanguage language) {
    if (request == null) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST, "INVALID_REQUEST", NavigationTexts.requestBodyRequired(language));
    }
    if (request.getFromLocationId() == null) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST,
          "MISSING_LOCATION",
          NavigationTexts.missingLocation("fromLocationId", language));
    }

    boolean hasLocation = request.getToLocationId() != null;
    String normalizedTargetType = normalizeTargetType(request.getTargetType());
    boolean hasTargetType = normalizedTargetType != null;

    if (hasLocation == hasTargetType) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST, "INVALID_TARGET", NavigationTexts.exactlyOneTarget(language));
    }

    if (!locationRepository.existsEnabledById(request.getFromLocationId())) {
      throw new NavigationRouteException(
          HttpStatus.NOT_FOUND,
          "LOCATION_NOT_FOUND",
          NavigationTexts.startLocationNotFound(request.getFromLocationId(), language));
    }

    if (hasLocation && !locationRepository.existsEnabledById(request.getToLocationId())) {
      throw new NavigationRouteException(
          HttpStatus.NOT_FOUND,
          "LOCATION_NOT_FOUND",
          NavigationTexts.targetLocationNotFound(request.getToLocationId(), language));
    }

    if (hasTargetType && !"wc".equals(normalizedTargetType)) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST,
          "UNSUPPORTED_TARGET_TYPE",
          NavigationTexts.supportedTargetTypeOnlyWc(language));
    }
  }

  private String generateUniqueCode(NavigationLanguage language) {
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
        NavigationTexts.shareCodeGenerationFailed(language));
  }

  private String normalizeTargetType(String targetType) {
    if (targetType == null || targetType.isBlank()) {
      return null;
    }
    return targetType.trim().toLowerCase(Locale.ROOT);
  }

  private String normalizeShareCode(String shareCode, NavigationLanguage language) {
    if (shareCode == null || shareCode.isBlank()) {
      throw new NavigationRouteException(
          HttpStatus.BAD_REQUEST, "INVALID_SHARE_CODE", NavigationTexts.shareCodeRequired(language));
    }
    return shareCode.trim();
  }

  private String normalizedBaseUrl(NavigationLanguage language) {
    String normalized = baseUrl == null ? "" : baseUrl.trim();
    if (normalized.isEmpty()) {
      throw new NavigationRouteException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "INVALID_SHARE_CONFIGURATION",
          NavigationTexts.invalidShareConfiguration(language));
    }
    return normalized.endsWith("/")
        ? normalized.substring(0, normalized.length() - 1)
        : normalized;
  }
}
