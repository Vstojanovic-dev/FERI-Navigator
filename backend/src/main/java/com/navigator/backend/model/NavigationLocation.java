package com.navigator.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "navigation_locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavigationLocation {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "display_name", nullable = false)
  private String displayName;

  @Column(name = "searchable_name", nullable = false)
  private String searchableName;

  @Column(name = "location_type", nullable = false)
  private String locationType;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "building_id", nullable = false)
  private Building building;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "floor_id", nullable = false)
  private Floor floor;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "node_id", nullable = false)
  private NavNode node;

  @Column(name = "space_id")
  private Long spaceId;

  @Column(name = "is_enabled", nullable = false)
  private Boolean isEnabled = true;

  public boolean hasNode() {
    return node != null;
  }
}
