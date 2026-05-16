import { useEffect, useState } from "react";
import {
  getBuildingName,
  getSpacesForBuilding,
  type Building,
  type Space,
} from "./data/demoData";
import MainPage from "./pages/MainPage.tsx";
import ObjektiPage from "./pages/ObjektiPage.tsx";
import PodrobnostiObjektaPage from "./pages/PodrobnostiObjektaPage.tsx";
import OFeriPage from "./pages/OFeriPage.tsx";
import UcilnicaPage from "./pages/UcilnicaPage.tsx";
import type { Screen } from "./types/navigation";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [ucilnicaReturnScreen, setUcilnicaReturnScreen] = useState<Screen>("home");
  const [introDone, setIntroDone] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);

  useEffect(() => {
    if (introDone) {
      return;
    }

    const showTimer = window.setTimeout(() => {
      setIntroVisible(true);
    }, 120);

    const moveTimer = window.setTimeout(() => {
      setIntroDone(true);
    }, 1700);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(moveTimer);
    };
  }, [introDone]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFindClassroom = (space: Space) => {
    alert(`Odprla bi se Navigacija. Cilj bi bil že nastavljen na: ${space.name}`);
  };

  const openUcilnica = (space: Space, returnTo: Screen) => {
    setSelectedSpace(space);
    setUcilnicaReturnScreen(returnTo);
    setScreen("ucilnica");
    scrollToTop();
  };

  const openPodrobnostiObjekta = (building: Building) => {
    setSelectedBuilding(building);
    setScreen("podrobnostiObjekta");
    scrollToTop();
  };

  if (screen === "ucilnica" && selectedSpace) {
    return (
      <UcilnicaPage
        space={selectedSpace}
        buildingName={getBuildingName(selectedSpace.buildingId)}
        onBack={() => setScreen(ucilnicaReturnScreen)}
        onFindClassroom={handleFindClassroom}
      />
    );
  }

  if (screen === "objekti") {
    return (
      <ObjektiPage
        onBack={() => setScreen("home")}
        onOpenBuilding={openPodrobnostiObjekta}
      />
    );
  }

  if (screen === "oFeri") {
    return <OFeriPage onBack={() => setScreen("home")} />;
  }

  if (screen === "podrobnostiObjekta" && selectedBuilding) {
    return (
      <PodrobnostiObjektaPage
        building={selectedBuilding}
        spaces={getSpacesForBuilding(selectedBuilding.id)}
        onBack={() => setScreen("objekti")}
        onOpenSpace={(space) => openUcilnica(space, "podrobnostiObjekta")}
        onFindClassroom={handleFindClassroom}
      />
    );
  }

  return (
    <MainPage
      introDone={introDone}
      introVisible={introVisible}
      onOpenSpace={(space) => openUcilnica(space, "home")}
      onOpenObjekti={() => {
        setScreen("objekti");
        scrollToTop();
      }}
      onMenuNavigacija={() => alert('Stran "Navigacija" bo dodana kasneje.')}
      onMenuOFeri={() => {
        setScreen("oFeri");
        scrollToTop();
      }}
      onFindClassroom={handleFindClassroom}
    />
  );
}

export default App;
