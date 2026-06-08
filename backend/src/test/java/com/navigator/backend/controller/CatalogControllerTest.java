package com.navigator.backend.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.navigator.backend.dto.BuildingCatalogDto;
import com.navigator.backend.dto.CatalogSpaceDto;
import com.navigator.backend.service.CatalogService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CatalogController.class)
@AutoConfigureMockMvc(addFilters = false)
class CatalogControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private CatalogService catalogService;

  @Test
  void getBuildingsReturnsCatalogPayload() throws Exception {
    when(catalogService.listBuildings())
        .thenReturn(List.of(new BuildingCatalogDto(7L, "Objekt G2", "Opis", "/img/g2.png", 12L)));

    mockMvc
        .perform(get("/api/catalog/buildings"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(7))
        .andExpect(jsonPath("$[0].name").value("Objekt G2"))
        .andExpect(jsonPath("$[0].spaceCount").value(12));

    verify(catalogService).listBuildings();
  }

  @Test
  void getBuildingSpacesReturnsSpaceCardsForRequestedBuilding() throws Exception {
    when(catalogService.listBuildingSpaces(3L))
        .thenReturn(
            List.of(new CatalogSpaceDto(9L, "Alfa", "Učilnica", 3L, "Objekt G2", "1. nadstropje", "Opis", null)));

    mockMvc
        .perform(get("/api/catalog/buildings/3/spaces"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(9))
        .andExpect(jsonPath("$[0].name").value("Alfa"))
        .andExpect(jsonPath("$[0].floor").value("1. nadstropje"));

    verify(catalogService).listBuildingSpaces(3L);
  }
}
