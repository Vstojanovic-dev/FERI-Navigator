package com.navigator.backend.service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class NavigationLocalization {
  private static final Pattern BUILDING_PATTERN = Pattern.compile("(?i)^objekt\\s+(.+)$");
  private static final Pattern CLASSROOM_PATTERN =
      Pattern.compile("(?i)^(?:učilnica|ucilnica|amfiteater)\\s+(.+)$");
  private static final Pattern LABORATORY_PATTERN = Pattern.compile("(?i)^laboratorij\\s+(.+)$");
  private static final Pattern MEETING_ROOM_PATTERN =
      Pattern.compile("(?i)^sejna\\s+soba\\s+(.+)$");
  private static final Pattern OFFICE_PATTERN = Pattern.compile("(?i)^kabinet\\s+(.+)$");
  private static final Pattern ELEVATOR_PATTERN =
      Pattern.compile("(?i)^(?:dvigalo|dvigala|lift|liftovi)\\s*(.*)$");
  private static final Pattern STAIRCASE_PATTERN =
      Pattern.compile("(?i)^(?:stopnišče|stopnisce)\\s*(.*)$");
  private static final Pattern CORRIDOR_PATTERN = Pattern.compile("(?i)^hodnik\\s*(.*)$");
  private static final Pattern FLOOR_NUMBER_PATTERN =
      Pattern.compile("^(\\d+)\\.\\s*nadstropje$", Pattern.CASE_INSENSITIVE);
  private static final Pattern LABEL_WITH_CODE_PATTERN =
      Pattern.compile("^(.*?)(\\s*\\([A-Z0-9\\-]+\\))$");
  private static final Pattern DISPLAY_WITH_CONTEXT_PATTERN =
      Pattern.compile("^(.*?)\\s*-\\s*([A-Z0-9]+),\\s*(.+)$");
  private static final Pattern MAIN_ENTRANCE_PATTERN = Pattern.compile("(?i)^glavni\\s+vhod$");
  private static final Pattern ENTRANCE_PATTERN = Pattern.compile("(?i)^vhod\\s+(.+)$");
  private static final Pattern EXIT_TO_BUILDING_PATTERN =
      Pattern.compile("(?i)^izhod\\s+za\\s+objekt\\s+(.+)$");
  private static final Pattern EXIT_PATTERN = Pattern.compile("(?i)^izhod\\s+(.+)$");
  private static final Pattern COFFEE_VENDING_PATTERN =
      Pattern.compile("(?i)^avtomat\\s+za\\s+kavo$");

  private static final Map<String, String> EN_INSTRUCTION_MAP = buildEnglishInstructionMap();

  private NavigationLocalization() {}

  static String localizeBuildingName(String value, NavigationLanguage language) {
    String normalized = normalizeSourceText(value);
    if (language == NavigationLanguage.EN) {
      Matcher matcher = BUILDING_PATTERN.matcher(normalized);
      if (matcher.matches()) {
        return "Building " + matcher.group(1).trim();
      }
    }
    return normalized;
  }

  static String localizeFloorLabel(String value, NavigationLanguage language) {
    String normalized = normalizeSourceText(value);
    if (language != NavigationLanguage.EN) {
      return normalized;
    }

    String lowered = normalized.toLowerCase(Locale.ROOT);
    if ("pritličje".equals(lowered) || "pritlicje".equals(lowered)) {
      return "Ground Floor";
    }
    if ("klet".equals(lowered)) {
      return "Basement";
    }
    if ("mansarda".equals(lowered)) {
      return "Attic";
    }
    if ("medetaža".equals(lowered) || "medetaza".equals(lowered)) {
      return "Mezzanine";
    }

    Matcher floorNumber = FLOOR_NUMBER_PATTERN.matcher(lowered);
    if (floorNumber.matches()) {
      int floor = Integer.parseInt(floorNumber.group(1));
      return ordinal(floor) + " Floor";
    }

    return normalized;
  }

  static String localizeSpaceTypeName(String value, NavigationLanguage language) {
    String normalized = normalizeSourceText(value);
    if (language != NavigationLanguage.EN) {
      return normalized;
    }

    String lowered = normalized.toLowerCase(Locale.ROOT);
    return switch (lowered) {
      case "amfiteater", "učilnica", "ucilnica", "predavalnica", "classroom" -> "Classroom";
      case "laboratorij", "laboratory" -> "Laboratory";
      case "sejna soba" -> "Meeting Room";
      case "kabinet", "office" -> "Office";
      case "hodnik", "corridor" -> "Corridor";
      case "stopnišče", "stopnisce", "stairs" -> "Staircase";
      case "dvigalo", "lift", "elevator" -> "Elevator";
      default -> normalized;
    };
  }

  static String localizeDisplayName(String value, NavigationLanguage language) {
    String normalized = normalizeSourceText(value);
    if (language != NavigationLanguage.EN) {
      return normalized;
    }

    Matcher contextual = DISPLAY_WITH_CONTEXT_PATTERN.matcher(normalized);
    if (contextual.matches()) {
      String base = localizeDisplayName(contextual.group(1).trim(), language);
      String buildingCode = contextual.group(2).trim();
      String floor = localizeFloorLabel(contextual.group(3).trim(), language);
      return base + " - " + buildingCode + ", " + floor;
    }

    Matcher labeled = LABEL_WITH_CODE_PATTERN.matcher(normalized);
    if (labeled.matches()) {
      return localizeDisplayName(labeled.group(1), language) + labeled.group(2);
    }

    Matcher building = BUILDING_PATTERN.matcher(normalized);
    if (building.matches()) {
      return "Building " + building.group(1).trim();
    }

    Matcher classroom = CLASSROOM_PATTERN.matcher(normalized);
    if (classroom.matches()) {
      return classroom.group(1).trim() + " Classroom";
    }

    Matcher laboratory = LABORATORY_PATTERN.matcher(normalized);
    if (laboratory.matches()) {
      return laboratory.group(1).trim() + " Laboratory";
    }

    Matcher meetingRoom = MEETING_ROOM_PATTERN.matcher(normalized);
    if (meetingRoom.matches()) {
      return meetingRoom.group(1).trim() + " Meeting Room";
    }

    Matcher office = OFFICE_PATTERN.matcher(normalized);
    if (office.matches()) {
      return office.group(1).trim() + " Office";
    }

    Matcher elevator = ELEVATOR_PATTERN.matcher(normalized);
    if (elevator.matches()) {
      String suffix = elevator.group(1).trim();
      return suffix.isEmpty() ? "Elevators" : "Elevators " + suffix;
    }

    Matcher staircase = STAIRCASE_PATTERN.matcher(normalized);
    if (staircase.matches()) {
      String suffix = staircase.group(1).trim();
      return suffix.isEmpty() ? "Staircase" : "Staircase " + suffix;
    }

    Matcher corridor = CORRIDOR_PATTERN.matcher(normalized);
    if (corridor.matches()) {
      String suffix = corridor.group(1).trim();
      return suffix.isEmpty() ? "Corridor" : "Corridor " + suffix;
    }

    if (MAIN_ENTRANCE_PATTERN.matcher(normalized).matches()) {
      return "Main Entrance";
    }

    Matcher entrance = ENTRANCE_PATTERN.matcher(normalized);
    if (entrance.matches()) {
      return "Entrance " + entrance.group(1).trim();
    }

    Matcher exitToBuilding = EXIT_TO_BUILDING_PATTERN.matcher(normalized);
    if (exitToBuilding.matches()) {
      return "Exit to Building " + exitToBuilding.group(1).trim();
    }

    Matcher exit = EXIT_PATTERN.matcher(normalized);
    if (exit.matches()) {
      return "Exit " + exit.group(1).trim();
    }

    if (COFFEE_VENDING_PATTERN.matcher(normalized).matches()) {
      return "Coffee vending machine";
    }

    if ("vhod".equalsIgnoreCase(normalized)) {
      return "Entrance";
    }
    if ("izhod".equalsIgnoreCase(normalized)) {
      return "Exit";
    }

    return normalized;
  }

  static String localizeInstruction(String value, NavigationLanguage language) {
    String normalized = normalizeSourceText(value);
    if (language != NavigationLanguage.EN || normalized == null || normalized.isBlank()) {
      return normalized;
    }

    String mapped = EN_INSTRUCTION_MAP.get(normalized);
    return mapped != null ? mapped : normalized;
  }

  static String normalizeSourceText(String value) {
    if (value == null) {
      return null;
    }

    String normalized = value.trim().replaceAll("\\s+", " ");
    normalized = normalized.replace("PritliÄje", "Pritličje");
    normalized = normalized.replace("PoÅ¡", "Poš");
    normalized = normalized.replace("ZaÄ", "Zač");
    normalized = normalized.replace("NajbliÅ¾", "Najbliž");
    normalized = normalized.replace("Å¡", "š");
    normalized = normalized.replace("Ä", "č");
    normalized = normalized.replace("Å¾", "ž");
    normalized = normalized.replace("uÄ", "uč");
    normalized = normalized.replace("toÄ", "toč");
    normalized = normalized.replace("mogoÄ", "mogoč");
    normalized = normalized.replace("enoliÄ", "enolič");
    normalized = normalized.replaceAll("(?i)\\bulaz\\b", "vhod");
    normalized = normalized.replaceAll("(?i)\\bizlaz\\b", "izhod");
    normalized = normalized.replaceAll("(?i)\\bobjekat\\b", "objekt");
    normalized = normalized.replaceAll("(?i)\\bstepenice\\b", "stopnišče");
    normalized = normalized.replaceAll("(?i)\\bstepeniste\\b", "stopnišče");
    normalized = normalized.replaceAll("(?i)\\bstopnisce\\b", "stopnišče");
    normalized = normalized.replaceAll("(?i)\\bstopnisca\\b", "stopnišča");
    normalized = normalized.replaceAll("(?i)\\bstopniscu\\b", "stopnišču");
    normalized = normalized.replaceAll("(?i)\\btajnistvo\\b", "tajništvo");
    normalized = normalized.replaceAll("(?i)\\bucionica\\b", "učilnica");
    normalized = normalized.replaceAll("(?i)\\bucilnica\\b", "učilnica");
    normalized = normalized.replaceAll("(?i)\\bliftovi\\b", "dvigala");
    normalized = normalized.replaceAll("(?i)\\blift\\b", "dvigalo");
    normalized = normalized.replaceAll("(?i)\\bstudentski\\b", "študentski");
    normalized = normalized.replaceAll("(?i)\\bosoblje\\b", "osebje");
    return normalized;
  }

  private static String ordinal(int floor) {
    int mod100 = floor % 100;
    if (mod100 >= 11 && mod100 <= 13) {
      return floor + "th";
    }

    return switch (floor % 10) {
      case 1 -> floor + "st";
      case 2 -> floor + "nd";
      case 3 -> floor + "rd";
      default -> floor + "th";
    };
  }

  private static Map<String, String> buildEnglishInstructionMap() {
    Map<String, String> map = new LinkedHashMap<>();
    map.put("Pojdi od lifta proti hodniku.", "Go from the elevator toward the corridor.");
    map.put("Pojdi iz hodnika proti liftu.", "Go from the corridor toward the elevator.");
    map.put(
        "Nadaljuj po hodniku proti predavalnicama Alfa in Beta.",
        "Continue along the corridor toward classrooms Alfa and Beta.");
    map.put("Učilnica Alfa je ob hodniku.", "Alfa Classroom is next to the corridor.");
    map.put("Učilnica Beta je ob hodniku.", "Beta Classroom is next to the corridor.");
    map.put("Vrni se iz učilnice Alfa na hodnik.", "Return from Alfa Classroom to the corridor.");
    map.put("Vrni se iz učilnice Beta na hodnik.", "Return from Beta Classroom to the corridor.");
    map.put("Pojdi od lifta do hodnika.", "Go from the elevator to the corridor.");
    map.put(
        "Nadaljuj po hodniku proti stopnišču.",
        "Continue along the corridor toward the staircase.");
    map.put(
        "Nadaljuj do razcepa pri stopnišču.",
        "Continue to the junction near the staircase.");
    map.put("Stopnišče je pred tabo.", "The staircase is in front of you.");
    map.put("Vrni se od stopnišča na hodnik.", "Return from the staircase to the corridor.");
    map.put("Nadaljuj po spodnjem hodniku.", "Continue along the lower corridor.");
    map.put(
        "Nadaljuj do hodnika pri laboratorijih.",
        "Continue to the corridor near the laboratories.");
    map.put("Laboratorij Farad je ob hodniku.", "Farad Laboratory is next to the corridor.");
    map.put(
        "Vrni se iz laboratorija Farad na hodnik.",
        "Return from Farad Laboratory to the corridor.");
    map.put("Laboratorij Weber je ob hodniku.", "Weber Laboratory is next to the corridor.");
    map.put(
        "Vrni se iz laboratorija Weber na hodnik.",
        "Return from Weber Laboratory to the corridor.");
    map.put(
        "Nadaljuj po hodniku proti laboratoriju Tesla.",
        "Continue along the corridor toward the Tesla Laboratory.");
    map.put(
        "Nadaljuj nazaj proti laboratorijema Farad in Weber.",
        "Continue back toward the Farad and Weber laboratories.");
    map.put("Laboratorij Tesla je ob hodniku.", "Tesla Laboratory is next to the corridor.");
    map.put(
        "Vrni se iz laboratorija Tesla na hodnik.",
        "Return from Tesla Laboratory to the corridor.");
    map.put("Nadaljuj nazaj proti stopnišču.", "Continue back toward the staircase.");
    map.put("Nadaljuj nazaj po hodniku.", "Continue back along the corridor.");
    map.put(
        "Nadaljuj po hodniku proti liftu.",
        "Continue along the corridor toward the elevator.");
    return map;
  }
}
