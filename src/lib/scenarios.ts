import type { SavedScenario, SelectedIncentiveAssumption, SimulationControls, SimulationResults } from "./types";

export interface ScenarioStore {
  list(): SavedScenario[];
  save(scenario: SavedScenario): SavedScenario[];
  reset(): void;
}

export function createScenarioSnapshot(args: {
  name: string;
  controls: SimulationControls;
  assumptions: SelectedIncentiveAssumption[];
  results: SimulationResults;
}): SavedScenario {
  return {
    id: `scenario-${Date.now()}`,
    name: args.name,
    controls: args.controls,
    selectedIncentiveAssumptions: args.assumptions,
    selectedRuleSnapshots: args.assumptions.map((assumption) => assumption.ruleSnapshot),
    resultSnapshot: args.results,
    createdAt: new Date().toISOString()
  };
}

export function createInMemoryScenarioStore(initialScenarios: SavedScenario[] = []): ScenarioStore {
  let scenarios = [...initialScenarios];

  return {
    list() {
      return scenarios;
    },
    save(scenario) {
      scenarios = [scenario, ...scenarios.filter((saved) => saved.id !== scenario.id)];
      return scenarios;
    },
    reset() {
      scenarios = [];
    }
  };
}

export const scenarioStorageNote =
  "Prompt 1 uses a local in-memory scenario abstraction. The interface is ready to move to a server database later without making browser localStorage the source of truth.";
