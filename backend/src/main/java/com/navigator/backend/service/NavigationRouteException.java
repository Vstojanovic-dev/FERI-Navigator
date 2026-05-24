package com.navigator.backend.service;

import org.springframework.http.HttpStatus;

public class NavigationRouteException extends RuntimeException {
  private final HttpStatus status;
  private final String code;

  public NavigationRouteException(HttpStatus status, String code, String message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public String getCode() {
    return code;
  }
}
