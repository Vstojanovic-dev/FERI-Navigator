package com.navigator.backend.service;

enum NavigationLanguage {
  SL,
  EN;

  static NavigationLanguage fromHeader(String headerValue) {
    if (headerValue == null || headerValue.isBlank()) {
      return SL;
    }

    String normalized = headerValue.trim().toLowerCase();
    if (normalized.startsWith("en")) {
      return EN;
    }

    return SL;
  }
}
