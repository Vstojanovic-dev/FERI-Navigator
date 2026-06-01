package com.navigator.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class AdminModeGuard {
  private final AdminModeProperties properties;

  public void requireEnabled() {
    if (!properties.enabled()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin mode is disabled.");
    }
  }
}
