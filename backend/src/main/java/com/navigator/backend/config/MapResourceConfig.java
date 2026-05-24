package com.navigator.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MapResourceConfig implements WebMvcConfigurer {

  @Value("${feri.maps.location:file:./database/maps/}")
  private String mapsLocation;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("/maps/**").addResourceLocations(mapsLocation);
  }
}
