package com.navigator.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
@EnableConfigurationProperties({CorsProperties.class, AdminModeProperties.class})
public class SecurityConfig {
  @Bean
  @Order(1)
  SecurityFilterChain adminFilterChain(HttpSecurity http, AdminModeProperties adminModeProperties)
      throws Exception {
    return http.securityMatcher("/api/admin/**")
        .csrf(csrf -> csrf.disable())
        .addFilterBefore(adminDisabledFilter(adminModeProperties), AuthorizationFilter.class)
        .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
        .build();
  }

  @Bean
  @Order(2)
  SecurityFilterChain publicFilterChain(HttpSecurity http, CorsConfigurationSource cors)
      throws Exception {
    return http.csrf(csrf -> csrf.disable())
        .cors(corsSpec -> corsSpec.configurationSource(cors))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers("/actuator/health", "/actuator/health/**")
                    .permitAll()
                    .anyRequest()
                    .permitAll())
        .build();
  }

  @Bean
  OncePerRequestFilter adminDisabledFilter(AdminModeProperties adminModeProperties) {
    return new OncePerRequestFilter() {
      @Override
      protected void doFilterInternal(
          HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
          throws ServletException, IOException {
        if (!adminModeProperties.enabled()) {
          response.sendError(HttpServletResponse.SC_NOT_FOUND);
          return;
        }
        filterChain.doFilter(request, response);
      }

      @Override
      protected boolean shouldNotFilter(HttpServletRequest request) {
        return !new AntPathRequestMatcher("/api/admin/**").matches(request);
      }
    };
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(properties.allowedOrigins());
    config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(false);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/navigation/**", config);
    source.registerCorsConfiguration("/api/catalog/**", config);
    return source;
  }
}
