package com.navigator.backend.service;

final class NavigationTexts {
  private NavigationTexts() {}

  static String exactlyOneTarget(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Provide exactly one target: toLocationId or targetType."
        : "Pošljite natanko en cilj: toLocationId ali targetType.";
  }

  static String supportedTargetTypeOnlyWc(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Only targetType=wc is supported."
        : "Podprt je samo targetType=wc.";
  }

  static String startLocationNotLinked(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "The start location is not linked to the navigation graph yet."
        : "Začetna lokacija še ni povezana z navigacijskim grafom.";
  }

  static String targetLocationNotLinked(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "The target location is not linked to the navigation graph yet."
        : "Ciljna lokacija še ni povezana z navigacijskim grafom.";
  }

  static String noRouteForSelectedLocations(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "There is no route defined for the selected locations yet."
        : "Za izbrani lokaciji še ni vnesene poti.";
  }

  static String nearestWcUnavailable(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "The nearest WC is currently unavailable in the navigation data."
        : "Najbližji WC trenutno ni na voljo v navigacijskih podatkih.";
  }

  static String noRouteToNearestWc(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "There is no route defined to the nearest WC yet."
        : "Do najbližjega WC-ja trenutno ni vnesene poti.";
  }

  static String missingLocation(String fieldName, NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Parameter '" + fieldName + "' is required."
        : "Parameter '" + fieldName + "' je obvezen.";
  }

  static String locationNotFound(Long locationId, NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Location not found: " + locationId
        : "Lokacija ni najdena: " + locationId;
  }

  static String sameLocation(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "The start and target are the same location."
        : "Začetek in cilj sta ista lokacija.";
  }

  static String elevatorExit(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Exit the elevator and continue along the displayed route."
        : "Izstopite iz dvigala in nadaljujte po prikazani poti.";
  }

  static String elevatorEnter(String floorLabel, NavigationLanguage language) {
    String localizedFloor = NavigationLocalization.localizeFloorLabel(floorLabel, language);
    return language == NavigationLanguage.EN
        ? "Take the elevator to " + localizedFloor + "."
        : "Vstopite v dvigalo in pojdite v nadstropje " + localizedFloor + ".";
  }

  static String stairsExit(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Exit the stairs and continue along the displayed route."
        : "Izstopite s stopnic in nadaljujte po prikazani poti.";
  }

  static String stairsEnter(String floorLabel, NavigationLanguage language) {
    String localizedFloor = NavigationLocalization.localizeFloorLabel(floorLabel, language);
    return language == NavigationLanguage.EN
        ? "Use the stairs to reach " + localizedFloor + "."
        : "Pojdite po stopnicah do nadstropja " + localizedFloor + ".";
  }

  static String buildingEntered(String buildingName, NavigationLanguage language) {
    String localizedBuilding = NavigationLocalization.localizeBuildingName(buildingName, language);
    return language == NavigationLanguage.EN
        ? "You entered " + localizedBuilding + ". Continue along the displayed route."
        : "Vstopili ste v " + localizedBuilding + ". Nadaljujte po prikazani poti.";
  }

  static String continueTo(String label, NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Continue toward " + label + "."
        : "Nadaljujte proti " + label + ".";
  }

  static String arrivedAt(String label, NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "You have arrived at " + label + "."
        : "Prispeli ste do lokacije " + label + ".";
  }

  static String continueAlongCorridor(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Continue along the corridor."
        : "Nadaljujte po hodniku.";
  }

  static String turnLeft(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Turn left at the junction."
        : "Na razcepu zavijte levo.";
  }

  static String turnRight(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Turn right at the junction."
        : "Na razcepu zavijte desno.";
  }

  static String slightLeft(NavigationLanguage language) {
    return language == NavigationLanguage.EN ? "Bear slightly left." : "Rahlo zavijte levo.";
  }

  static String slightRight(NavigationLanguage language) {
    return language == NavigationLanguage.EN ? "Bear slightly right." : "Rahlo zavijte desno.";
  }

  static String turnBack(NavigationLanguage language) {
    return language == NavigationLanguage.EN ? "Turn back." : "Obrnite se nazaj.";
  }

  static String followPathTo(String label, NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Follow the route to " + label + "."
        : "Sledite poti do " + label + ".";
  }

  static String nextWaypoint(NavigationLanguage language) {
    return language == NavigationLanguage.EN ? "the next waypoint" : "naslednji točki";
  }

  static String invalidRouteData(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Navigation data is incomplete or inconsistent."
        : "Navigacijski podatki so nepopolni ali nekonsistentni.";
  }

  static String shareNotFound(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "The share link was not found or has expired."
        : "Povezava za deljenje ni bila najdena ali je potekla.";
  }

  static String requestBodyRequired(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "The request body is required."
        : "Telo zahteve je obvezno.";
  }

  static String startLocationNotFound(Long locationId, NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Start location not found: " + locationId
        : "Začetna lokacija ni najdena: " + locationId;
  }

  static String targetLocationNotFound(Long locationId, NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Target location not found: " + locationId
        : "Ciljna lokacija ni najdena: " + locationId;
  }

  static String shareCodeGenerationFailed(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "Failed to generate a unique share code. Please try again."
        : "Ni mogoče ustvariti enolične kode za deljenje. Poskusite znova.";
  }

  static String shareCodeRequired(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "The share code is required."
        : "Koda za deljenje je obvezna.";
  }

  static String invalidShareConfiguration(NavigationLanguage language) {
    return language == NavigationLanguage.EN
        ? "The share URL configuration is missing."
        : "Konfiguracija URL-ja za deljenje ni nastavljena.";
  }
}
