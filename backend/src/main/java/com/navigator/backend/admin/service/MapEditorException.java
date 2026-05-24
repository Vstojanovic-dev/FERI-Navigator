package com.navigator.backend.admin.service;

import org.springframework.http.HttpStatus;

public class MapEditorException extends RuntimeException {
  private final HttpStatus status;
  private final String code;

  public MapEditorException(HttpStatus status, String code, String message) {
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
