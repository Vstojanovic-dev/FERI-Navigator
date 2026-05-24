package com.navigator.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NavigationErrorDto {
  private String code;
  private String message;
}
