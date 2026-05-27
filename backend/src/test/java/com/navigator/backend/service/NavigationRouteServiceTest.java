package com.navigator.backend.service;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.navigator.backend.model.NavigationLocation;
import com.navigator.backend.repository.NavigationLocationRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class NavigationRouteServiceTest {

  @Mock private NavigationLocationRepository locationRepository;

  @Mock private AStarService aStarService;

  @Test
  void searchSpacesUsesSpaceRepositoryQueryAndCapsLimit() {
    NavigationRouteService service = new NavigationRouteService(locationRepository, aStarService);

    when(locationRepository.searchSpaces(eq("lab"), eq(PageRequest.of(0, 200))))
        .thenReturn(List.<NavigationLocation>of());

    List<?> result = service.searchSpaces("lab", 999);

    assertTrue(result.isEmpty());
    verify(locationRepository).searchSpaces("lab", PageRequest.of(0, 200));
  }
}
