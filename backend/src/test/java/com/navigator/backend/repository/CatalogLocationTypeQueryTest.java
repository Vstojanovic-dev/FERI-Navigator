package com.navigator.backend.repository;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

class CatalogLocationTypeQueryTest {

  @Test
  void publicCatalogQueriesIncludeServiceAndPublicAreaLocations() throws NoSuchMethodException {
    Method searchSpaces =
        NavigationLocationRepository.class.getMethod("searchSpaces", String.class, Pageable.class);
    Method buildingSpaces =
        NavigationLocationRepository.class.getMethod(
            "findEnabledCatalogSpacesByBuildingId", Long.class);
    Method buildingSummaries = BuildingRepository.class.getMethod("findCatalogSummaries");

    assertAll(
        () -> assertIncludesPublicCatalogTypes(searchSpaces),
        () -> assertIncludesPublicCatalogTypes(buildingSpaces),
        () -> assertIncludesPublicCatalogTypes(buildingSummaries));
  }

  private void assertIncludesPublicCatalogTypes(Method repositoryMethod) {
    String query = repositoryMethod.getAnnotation(Query.class).value();

    assertTrue(
        query.contains("'service'"),
        () -> repositoryMethod.getName() + " must include service locations in the public catalog");
    assertTrue(
        query.contains("'public_area'"),
        () ->
            repositoryMethod.getName()
                + " must include public-area locations in the public catalog");
  }
}
