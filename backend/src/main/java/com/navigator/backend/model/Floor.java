package com.navigator.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "floors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Floor {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "building_id", nullable = false)
  private Building building;

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
}
