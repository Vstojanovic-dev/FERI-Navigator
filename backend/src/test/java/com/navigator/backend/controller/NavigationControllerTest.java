package com.navigator.backend.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.navigator.backend.dto.NavigationLocationDto;
import com.navigator.backend.dto.PathResponseDto;
import com.navigator.backend.dto.RouteResponseDto;
import com.navigator.backend.service.AStarService;
import com.navigator.backend.service.NavigationRouteException;
import com.navigator.backend.service.NavigationRouteService;
import com.navigator.backend.service.NavigationShareService;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(NavigationController.class)
@AutoConfigureMockMvc(addFilters = false)
class NavigationControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private AStarService aStarService;
  @MockBean private NavigationRouteService navigationRouteService;
  @MockBean private NavigationShareService navigationShareService;

  @Test
  void getLocationsReturnsSearchResultsUsingProvidedQueryAndLimit() throws Exception {
    when(navigationRouteService.searchLocations("glavni", 5))
        .thenReturn(
            List.of(
                NavigationLocationDto.builder()
                    .id(11L)
                    .displayName("Glavni vhod - G2, Pritlicje")
                    .locationType("entrance")
                    .buildingId(1L)
                    .buildingCode("G2")
                    .buildingName("Objekt G2")
                    .floorId(1L)
                    .floorCode("pritlicje")
                    .floorLabel("Pritlicje")
                    .hasNode(true)
                    .build()));

    mockMvc
        .perform(get("/api/navigation/locations").param("query", "glavni").param("limit", "5"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].displayName").value("Glavni vhod - G2, Pritlicje"))
        .andExpect(jsonPath("$[0].buildingCode").value("G2"));

    verify(navigationRouteService).searchLocations("glavni", 5);
  }

  @Test
  void getRouteReturnsStructuredErrorWhenServiceThrowsNavigationRouteException() throws Exception {
    when(navigationRouteService.route(11L, 12L, null, true))
        .thenThrow(
            new NavigationRouteException(
                HttpStatus.NOT_FOUND, "NO_ROUTE", "Za izabrane lokacije jos ne postoji unesena ruta."));

    mockMvc
        .perform(get("/api/navigation/route").param("fromLocationId", "11").param("toLocationId", "12"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NO_ROUTE"))
        .andExpect(jsonPath("$.message").value("Za izabrane lokacije jos ne postoji unesena ruta."));

    verify(navigationRouteService).route(11L, 12L, null, true);
  }

  @Test
  void getPathRejectsBlankFromParameter() throws Exception {
    mockMvc
        .perform(get("/api/navigation/path").param("from", "   ").param("to", "alfa"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Parametar 'from' je obavezan."));
  }

  @Test
  void getPathReturnsNotFoundWhenAStarDoesNotFindAnyNodes() throws Exception {
    when(aStarService.findPath("referat", "alfa"))
        .thenReturn(
            PathResponseDto.builder()
                .message("Put nije pronadjen.")
                .path(Collections.emptyList())
                .build());

    mockMvc
        .perform(get("/api/navigation/path").param("from", "referat").param("to", "alfa"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").value("Put nije pronadjen."));

    verify(aStarService).findPath("referat", "alfa");
  }

  @Test
  void getRouteReturnsRoutePayloadOnSuccess() throws Exception {
    when(navigationRouteService.route(11L, null, "wc", false))
        .thenReturn(
            RouteResponseDto.builder()
                .routeId("route-11-nearest-wc-30")
                .totalCost(9)
                .segments(
                    List.of(
                        RouteResponseDto.RouteSegmentDto.builder()
                            .index(0)
                            .buildingCode("G2")
                            .floorLabel("Pritlicje")
                            .path(List.of())
                            .steps(List.of())
                            .build()))
                .build());

    mockMvc
        .perform(
            get("/api/navigation/route")
                .param("fromLocationId", "11")
                .param("targetType", "wc")
                .param("allowElevator", "false"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.routeId").value("route-11-nearest-wc-30"))
        .andExpect(jsonPath("$.segments[0].buildingCode").value("G2"));

    verify(navigationRouteService).route(11L, null, "wc", false);
  }
}
