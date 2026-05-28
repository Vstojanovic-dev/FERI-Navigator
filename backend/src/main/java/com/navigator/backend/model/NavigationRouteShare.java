package com.navigator.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

@Entity
@Table(name = "navigation_route_shares")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavigationRouteShare {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "share_code", nullable = false, unique = true, length = 12)
  private String shareCode;

  @Column(name = "from_location_id", nullable = false)
  private Long fromLocationId;

  // Tacno jedan od ova dva mora biti postavljen — validacija je u servisu
  @Column(name = "to_location_id")
  private Long toLocationId;

  @Column(name = "target_type", length = 50)
  private String targetType;

  @Column(name = "allow_elevator", nullable = false)
  private boolean allowElevator;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}