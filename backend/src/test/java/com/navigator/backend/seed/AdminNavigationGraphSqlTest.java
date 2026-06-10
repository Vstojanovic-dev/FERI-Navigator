package com.navigator.backend.seed;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class AdminNavigationGraphSqlTest {

  @Test
  void exportedNavigationLocationsIncludeObjectEEntries() throws IOException {
    String sql = Files.readString(Path.of("..", "database", "init", "006_admin_navigation_graph.sql"));

    assertTrue(
        sql.contains("('E-103 - E, Pritličje'")
            || sql.contains("('E-103 - E, Pritli"),
        "Expected object E rooms to be exported into navigation_locations seed data.");
    assertTrue(
        sql.contains("('E', 'pritlicje', 'office', 'E_pritlicje_e_103', 'E-103'")
            || sql.contains("('E', 'pritlicje', 'wc', 'E_pritlicje_enski_wc'"),
        "Expected object E spaces to be exported into spaces seed data.");
  }

  @Test
  void exportedNavigationLocationsIncludeLukaPavlicOffice() throws IOException {
    String sql = Files.readString(Path.of("..", "database", "init", "006_admin_navigation_graph.sql"));

    assertTrue(sql.contains("G2_1_nadstropje_g2_1n_13"));
    assertTrue(sql.contains("Kabinet Luka Pavlic (G2-1N.13)"));
    assertTrue(
        sql.contains(
            "Kabinet profesora Luke Pavlica. Govorile ure: Pon 10:00 - 12:00"));
    assertFalse(sql.contains("G3_1_nadstropje_kabinet_Pavlic"));
  }

  @Test
  void exportedNavigationLocationsUseCorrectE111RoomNumber() throws IOException {
    String sql = Files.readString(Path.of("..", "database", "init", "006_admin_navigation_graph.sql"));

    assertTrue(sql.contains("E_pritlicje_e_111"));
    assertTrue(sql.contains("E-111"));
    assertFalse(sql.contains("E_pritlicje_e_1111"));
    assertFalse(sql.contains("E-1111"));
  }
}
