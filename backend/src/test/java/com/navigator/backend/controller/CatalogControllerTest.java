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
    when(catalogService.listBuildings(null))
        .thenReturn(List.of(new BuildingCatalogDto(7L, "Objekt G2", "Opis", "/img/g2.png", 12L)));

    mockMvc
        .perform(get("/api/catalog/buildings"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(7))
        .andExpect(jsonPath("$[0].name").value("Objekt G2"))
        .andExpect(jsonPath("$[0].spaceCount").value(12));

    verify(catalogService).listBuildings(null);
  }

  @Test
  void getBuildingsForwardsAcceptLanguageHeaderToService() throws Exception {
    when(catalogService.listBuildings("en-US"))
        .thenReturn(List.of(new BuildingCatalogDto(7L, "Building G2", "Opis", "/img/g2.png", 12L)));

    mockMvc
        .perform(get("/api/catalog/buildings").header("Accept-Language", "en-US"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("Building G2"));

    verify(catalogService).listBuildings("en-US");
  }

  @Test
  void getBuildingSpacesReturnsSpaceCardsForRequestedBuilding() throws Exception {
    when(catalogService.listBuildingSpaces(3L, null))
        .thenReturn(
            List.of(
                new CatalogSpaceDto(
                    9L, "Alfa", "Ucilnica", 3L, "Objekt G2", "1. nadstropje", "Opis", null)));

    mockMvc
        .perform(get("/api/catalog/buildings/3/spaces"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(9))
        .andExpect(jsonPath("$[0].name").value("Alfa"))
        .andExpect(jsonPath("$[0].floor").value("1. nadstropje"));

    verify(catalogService).listBuildingSpaces(3L, null);
  }

  @Test
  void getBuildingSpacesForwardsAcceptLanguageHeaderToService() throws Exception {
    when(catalogService.listBuildingSpaces(3L, "en-US"))
        .thenReturn(
            List.of(
                new CatalogSpaceDto(
                    9L, "Alfa", "Classroom", 3L, "Building G2", "1st Floor", "Opis", null)));

    mockMvc
        .perform(get("/api/catalog/buildings/3/spaces").header("Accept-Language", "en-US"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].type").value("Classroom"))
        .andExpect(jsonPath("$[0].buildingName").value("Building G2"));

    verify(catalogService).listBuildingSpaces(3L, "en-US");
  }
}
