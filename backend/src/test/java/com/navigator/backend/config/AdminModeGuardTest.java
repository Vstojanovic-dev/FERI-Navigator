package com.navigator.backend.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = AdminModeGuardTest.AdminProbeController.class,
    properties = {
      "app.admin.enabled=false",
      "app.cors.allowed-origins=http://localhost:5173",
    })
@AutoConfigureMockMvc
@Import(SecurityConfig.class)
@ImportAutoConfiguration(SecurityAutoConfiguration.class)
@ActiveProfiles("test")
class AdminModeGuardTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void adminEndpointsReturnNotFoundWhenDisabled() throws Exception {
    mockMvc.perform(get("/api/admin/map-editor/floors")).andExpect(status().isNotFound());
  }

  @RestController
  static class AdminProbeController {
    @GetMapping("/api/admin/map-editor/floors")
    ResponseEntity<Void> floors() {
      return ResponseEntity.ok().build();
    }
  }
}
