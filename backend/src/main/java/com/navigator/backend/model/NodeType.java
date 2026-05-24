package com.navigator.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "node_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NodeType {

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
