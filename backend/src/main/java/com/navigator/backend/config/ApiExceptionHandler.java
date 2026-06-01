package com.navigator.backend.config;

import com.navigator.backend.admin.controller.MapEditorController;
import com.navigator.backend.admin.service.MapEditorException;
import com.navigator.backend.dto.NavigationErrorDto;
import com.navigator.backend.service.NavigationRouteException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(NavigationRouteException.class)
  ResponseEntity<NavigationErrorDto> handleNavigation(NavigationRouteException exception) {
    return ResponseEntity.status(exception.getStatus())
        .body(
            NavigationErrorDto.builder()
                .code(exception.getCode())
                .message(exception.getMessage())
                .build());
  }

  @ExceptionHandler(MapEditorException.class)
  ResponseEntity<MapEditorController.EditorErrorDto> handleAdmin(MapEditorException exception) {
    return ResponseEntity.status(exception.getStatus())
        .body(new MapEditorController.EditorErrorDto(exception.getCode(), exception.getMessage()));
  }
}
