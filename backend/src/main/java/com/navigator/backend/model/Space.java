package com.navigator.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "spaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Space {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "building_id", nullable = false)
  private Building building;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "floor_id", nullable = false)
  private Floor floor;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "space_type_id", nullable = false)
  private SpaceType spaceType;

  @Column(name = "code", nullable = false)
  private String code;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "description")
  private String description;

  @Column(name = "image_url")
  private String imageUrl;

  @Column(name = "primary_node_id")
  private Long primaryNodeId;

  @Column(name = "is_public", nullable = false)
  private Boolean isPublic = true;
}
