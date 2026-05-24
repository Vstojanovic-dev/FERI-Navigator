package com.navigator.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "edge_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeType {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "code", nullable = false, unique = true)
  private String code;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "description")
  private String description;
}
