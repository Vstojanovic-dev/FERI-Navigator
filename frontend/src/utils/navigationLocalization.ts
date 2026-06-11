import type { AppLanguage } from '../i18n/language';
import type { BilingualText, NavigationLocation, NavigationRoute, RouteStep } from '../types/navigation';
import { localizeFloorLabel } from './displayNames';

const SL_TO_EN_EXACT: Record<string, string> = {
  'Pojdi od lifta proti hodniku.': 'Go from the elevator toward the corridor.',
  'Pojdi iz hodnika proti liftu.': 'Go from the corridor toward the elevator.',
  'Nadaljuj po hodniku proti predavalnicama Alfa in Beta.':
    'Continue along the corridor toward classrooms Alfa and Beta.',
  'Učilnica Alfa je ob hodniku.': 'Alfa Classroom is next to the corridor.',
  'Učilnica Beta je ob hodniku.': 'Beta Classroom is next to the corridor.',
  'Vrni se iz učilnice Alfa na hodnik.': 'Return from Alfa Classroom to the corridor.',
  'Vrni se iz učilnice Beta na hodnik.': 'Return from Beta Classroom to the corridor.',
  'Pojdi od lifta do hodnika.': 'Go from the elevator to the corridor.',
  'Nadaljuj po hodniku proti stopnišču.': 'Continue along the corridor toward the staircase.',
  'Nadaljuj do razcepa pri stopnišču.': 'Continue to the junction near the staircase.',
  'Stopnišče je pred tabo.': 'The staircase is in front of you.',
  'Vrni se od stopnišča na hodnik.': 'Return from the staircase to the corridor.',
  'Nadaljuj po spodnjem hodniku.': 'Continue along the lower corridor.',
  'Nadaljuj do hodnika pri laboratorijih.': 'Continue to the corridor near the laboratories.',
  'Laboratorij Farad je ob hodniku.': 'Farad Laboratory is next to the corridor.',
  'Vrni se iz laboratorija Farad na hodnik.': 'Return from Farad Laboratory to the corridor.',
  'Laboratorij Weber je ob hodniku.': 'Weber Laboratory is next to the corridor.',
  'Vrni se iz laboratorija Weber na hodnik.': 'Return from Weber Laboratory to the corridor.',
  'Nadaljuj po hodniku proti laboratoriju Tesla.':
    'Continue along the corridor toward the Tesla Laboratory.',
  'Nadaljuj nazaj proti laboratorijema Farad in Weber.':
    'Continue back toward the Farad and Weber laboratories.',
  'Laboratorij Tesla je ob hodniku.': 'Tesla Laboratory is next to the corridor.',
  'Vrni se iz laboratorija Tesla na hodnik.': 'Return from Tesla Laboratory to the corridor.',
  'Nadaljuj nazaj proti stopnišču.': 'Continue back toward the staircase.',
  'Nadaljuj nazaj po hodniku.': 'Continue back along the corridor.',
  'Nadaljuj po hodniku proti liftu.': 'Continue along the corridor toward the elevator.',
  'Nadaljujte po hodniku.': 'Continue along the corridor.',
  'Na razcepu zavijte levo.': 'Turn left at the junction.',
  'Na razcepu zavijte desno.': 'Turn right at the junction.',
  'Rahlo zavijte levo.': 'Bear slightly left.',
  'Rahlo zavijte desno.': 'Bear slightly right.',
  'Obrnite se nazaj.': 'Turn back.',
  'Izstopite iz dvigala in nadaljujte po prikazani poti.':
    'Exit the elevator and continue along the displayed route.',
  'Izstopite s stopnic in nadaljujte po prikazani poti.':
    'Exit the stairs and continue along the displayed route.',
};

const EN_TO_SL_EXACT = Object.fromEntries(
  Object.entries(SL_TO_EN_EXACT).map(([sl, en]) => [en, sl])
);

function normalizeInstructionText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
}

function localizeEmbeddedLabel(label: string, language: AppLanguage): string {
  return localizeNavigationDisplayName(label, language);
}

function translateInstructionTemplates(text: string, targetLanguage: AppLanguage): string | null {
  if (targetLanguage === 'en') {
    const continueTo = text.match(/^Nadaljujte proti (.+)\.$/);
    if (continueTo) {
      return `Continue toward ${localizeEmbeddedLabel(continueTo[1], 'en')}.`;
    }

    const arrived = text.match(/^Prispeli ste do lokacije (.+)\.$/);
    if (arrived) {
      return `You have arrived at ${localizeEmbeddedLabel(arrived[1], 'en')}.`;
    }

    const follow = text.match(/^Sledite poti do (.+)\.$/);
    if (follow) {
      return `Follow the route to ${localizeEmbeddedLabel(follow[1], 'en')}.`;
    }

    const elevator = text.match(/^Vstopite v dvigalo in pojdite v nadstropje (.+)\.$/);
    if (elevator) {
      return `Take the elevator to ${localizeFloorLabel(elevator[1], 'en')}.`;
    }

    const stairs = text.match(/^Pojdite po stopnicah do nadstropja (.+)\.$/);
    if (stairs) {
      return `Use the stairs to reach ${localizeFloorLabel(stairs[1], 'en')}.`;
    }

    const building = text.match(/^Vstopili ste v (.+)\. Nadaljujte po prikazani poti\.$/);
    if (building) {
      return `You entered ${localizeNavigationBuildingName(building[1], 'en')}. Continue along the displayed route.`;
    }

    return null;
  }

  const continueTo = text.match(/^Continue toward (.+)\.$/);
  if (continueTo) {
    return `Nadaljujte proti ${localizeEmbeddedLabel(continueTo[1], 'sl')}.`;
  }

  const arrived = text.match(/^You have arrived at (.+)\.$/);
  if (arrived) {
    return `Prispeli ste do lokacije ${localizeEmbeddedLabel(arrived[1], 'sl')}.`;
  }

  const follow = text.match(/^Follow the route to (.+)\.$/);
  if (follow) {
    return `Sledite poti do ${localizeEmbeddedLabel(follow[1], 'sl')}.`;
  }

  const elevator = text.match(/^Take the elevator to (.+)\.$/);
  if (elevator) {
    return `Vstopite v dvigalo in pojdite v nadstropje ${localizeFloorLabel(elevator[1], 'sl')}.`;
  }

  const stairs = text.match(/^Use the stairs to reach (.+)\.$/);
  if (stairs) {
    return `Pojdite po stopnicah do nadstropja ${localizeFloorLabel(stairs[1], 'sl')}.`;
  }

  const building = text.match(/^You entered (.+)\. Continue along the displayed route\.$/);
  if (building) {
    return `Vstopili ste v ${localizeNavigationBuildingName(building[1], 'sl')}. Nadaljujte po prikazani poti.`;
  }

  return null;
}

export function localizeRouteInstruction(text: string, targetLanguage: AppLanguage): string {
  const normalized = normalizeInstructionText(text);
  if (!normalized) {
    return text;
  }

  if (targetLanguage === 'en') {
    return (
      SL_TO_EN_EXACT[normalized] ??
      translateInstructionTemplates(normalized, 'en') ??
      normalized
    );
  }

  return (
    EN_TO_SL_EXACT[normalized] ??
    translateInstructionTemplates(normalized, 'sl') ??
    normalized
  );
}

export function buildRouteStepTexts(step: RouteStep, sourceLanguage: AppLanguage): BilingualText {
  if (step.texts) {
    return step.texts;
  }

  const sourceText = step.text;
  if (sourceLanguage === 'en') {
    return {
      en: sourceText,
      sl: localizeRouteInstruction(sourceText, 'sl'),
    };
  }

  return {
    sl: sourceText,
    en: localizeRouteInstruction(sourceText, 'en'),
  };
}

export function getRouteStepLabel(step: RouteStep, language: AppLanguage): string {
  const texts = step.texts ?? {
    sl: step.textSl ?? step.text,
    en: step.textEn ?? localizeRouteInstruction(step.text, 'en'),
  };

  return texts[language] ?? texts.sl;
}

/** @deprecated Use getRouteStepLabel */
export function getLocalizedRouteStepText(step: RouteStep, language: AppLanguage): string {
  return getRouteStepLabel(step, language);
}

export function attachBilingualRouteSteps(
  route: NavigationRoute,
  sourceLanguage: AppLanguage
): NavigationRoute {
  return {
    ...route,
    segments: route.segments.map((segment) => ({
      ...segment,
      steps: segment.steps.map((step) => {
        const texts = buildRouteStepTexts(step, sourceLanguage);
        return {
          ...step,
          texts,
          textSl: texts.sl,
          textEn: texts.en,
        };
      }),
    })),
  };
}

/** @deprecated Use attachBilingualRouteSteps */
export function enrichNavigationRoute(
  route: NavigationRoute,
  sourceLanguage: AppLanguage
): NavigationRoute {
  return attachBilingualRouteSteps(route, sourceLanguage);
}

export function localizeNavigationBuildingName(
  value: string | null | undefined,
  language: AppLanguage
): string {
  const normalized = value?.trim() ?? '';
  if (!normalized || language === 'sl') {
    return normalized;
  }

  const match = normalized.match(/^objekt\s+(.+)$/i);
  if (match) {
    return `Building ${match[1].trim()}`;
  }

  const buildingMatch = normalized.match(/^Building\s+(.+)$/i);
  if (buildingMatch) {
    return `Building ${buildingMatch[1].trim()}`;
  }

  return normalized;
}

export function localizeNavigationDisplayName(
  value: string | null | undefined,
  language: AppLanguage
): string {
  const normalized = value?.trim() ?? '';
  if (!normalized || language === 'sl') {
    return normalized;
  }

  const contextual = normalized.match(/^(.*?)\s*-\s*([A-Z0-9]+),\s*(.+)$/);
  if (contextual) {
    const base = localizeNavigationDisplayName(contextual[1].trim(), language);
    const buildingCode = contextual[2].trim();
    const floor = localizeFloorLabel(contextual[3].trim(), language);
    return `${base} - ${buildingCode}, ${floor}`;
  }

  const labeled = normalized.match(/^(.*?)(\s*\([A-Z0-9-]+\))$/);
  if (labeled) {
    return `${localizeNavigationDisplayName(labeled[1], language)}${labeled[2]}`;
  }

  const building = normalized.match(/^objekt\s+(.+)$/i);
  if (building) {
    return `Building ${building[1].trim()}`;
  }

  const classroom = normalized.match(/^(?:učilnica|ucilnica|amfiteater)\s+(.+)$/i);
  if (classroom) {
    return `${classroom[1].trim()} Classroom`;
  }

  const laboratory = normalized.match(/^laboratorij\s+(.+)$/i);
  if (laboratory) {
    return `${laboratory[1].trim()} Laboratory`;
  }

  const meetingRoom = normalized.match(/^sejna\s+soba\s+(.+)$/i);
  if (meetingRoom) {
    return `${meetingRoom[1].trim()} Meeting Room`;
  }

  const office = normalized.match(/^kabinet\s+(.+)$/i);
  if (office) {
    return `${office[1].trim()} Office`;
  }

  const elevator = normalized.match(/^(?:dvigalo|dvigala|lift|liftovi)\s*(.*)$/i);
  if (elevator) {
    return elevator[1].trim() ? `Elevators ${elevator[1].trim()}` : 'Elevators';
  }

  const staircase = normalized.match(/^(?:stopnišče|stopnisce)\s*(.*)$/i);
  if (staircase) {
    return staircase[1].trim() ? `Staircase ${staircase[1].trim()}` : 'Staircase';
  }

  const corridor = normalized.match(/^hodnik\s*(.*)$/i);
  if (corridor) {
    return corridor[1].trim() ? `Corridor ${corridor[1].trim()}` : 'Corridor';
  }

  if (/^glavni\s+vhod$/i.test(normalized)) {
    return 'Main Entrance';
  }

  const entrance = normalized.match(/^vhod\s+(.+)$/i);
  if (entrance) {
    return `Entrance ${entrance[1].trim()}`;
  }

  const exitToBuilding = normalized.match(/^izhod\s+za\s+objekt\s+(.+)$/i);
  if (exitToBuilding) {
    return `Exit to Building ${exitToBuilding[1].trim()}`;
  }

  const exit = normalized.match(/^izhod\s+(.+)$/i);
  if (exit) {
    return `Exit ${exit[1].trim()}`;
  }

  if (/^vhod$/i.test(normalized)) {
    return 'Entrance';
  }
  if (/^izhod$/i.test(normalized)) {
    return 'Exit';
  }

  const englishClassroom = normalized.match(/^(.+)\s+Classroom$/i);
  if (englishClassroom) {
    return `${englishClassroom[1].trim()} Classroom`;
  }

  const englishLaboratory = normalized.match(/^(.+)\s+Laboratory$/i);
  if (englishLaboratory) {
    return `${englishLaboratory[1].trim()} Laboratory`;
  }

  return normalized;
}

export function getLocalizedNavigationLocationLabel(
  location: NavigationLocation,
  language: AppLanguage
): string {
  if (location.spaceName?.trim()) {
    return localizeNavigationDisplayName(location.spaceName, language);
  }

  return localizeNavigationDisplayName(location.displayName, language);
}
