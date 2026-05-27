package com.navigator.backend.dto;

public record BuildingCatalogDto(
    Long id, String name, String description, String imageUrl, Long spaceCount) {}
