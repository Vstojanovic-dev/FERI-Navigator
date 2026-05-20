package com.navigator.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "nav_nodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavNode {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "floor_id", nullable = false)
  private Integer floorId;

  @Column(name = "label")
  private String label;

  @Column(name = "is_waypoint", nullable = false)
  private Boolean isWaypoint = false;

  @Column(name = "node_type", length = 30)
  private String nodeType;

  @Column(name = "room_id")
  private Long roomId;

  @Column(name = "geom", columnDefinition = "geometry(Point,3857)", nullable = false)
  private Point geom;

  @Column(name = "external_id", unique = true)
  private String externalId;
}
