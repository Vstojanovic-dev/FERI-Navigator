package com.navigator.backend.dto;

public record CatalogSpaceDto(
    Long id,
    String name,
    String type,
    Long buildingId,
    String buildingName,
    String floor,
    String description,
    String imageUrl) {}
