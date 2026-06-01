package com.navigator.backend.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "app.admin.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminModeGuardTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void adminEndpointsReturnNotFoundWhenDisabled() throws Exception {
    mockMvc.perform(get("/api/admin/map-editor/floors")).andExpect(status().isNotFound());
  }
}
