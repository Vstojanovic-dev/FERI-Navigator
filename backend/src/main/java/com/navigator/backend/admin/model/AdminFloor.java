package com.navigator.backend.admin.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "floors")
public class AdminFloor {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "building_id", nullable = false)
  private AdminBuilding building;

  @Column(name = "code", nullable = false)
  private String code;

  @Column(name = "label", nullable = false)
  private String label;

  @Column(name = "level_number", nullable = false)
  private BigDecimal levelNumber;

  @Column(name = "z", nullable = false)
  private BigDecimal z;

  @Column(name = "map_image_url", nullable = false)
  private String mapImageUrl;

  @Column(name = "coordinate_width", nullable = false)
  private BigDecimal coordinateWidth;

  @Column(name = "coordinate_height", nullable = false)
  private BigDecimal coordinateHeight;

  public AdminFloor() {}

  public Long getId() {
    return id;
  }

  public AdminBuilding getBuilding() {
    return building;
  }

  public String getCode() {
    return code;
  }

  public String getLabel() {
    return label;
  }

  public BigDecimal getLevelNumber() {
    return levelNumber;
  }

  public BigDecimal getZ() {
    return z;
  }

  public String getMapImageUrl() {
    return mapImageUrl;
  }

  public BigDecimal getCoordinateWidth() {
    return coordinateWidth;
  }

  public BigDecimal getCoordinateHeight() {
    return coordinateHeight;
  }
}
