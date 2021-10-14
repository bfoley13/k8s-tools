import { Branch, ChartEntry, Repository } from "./github";

export enum BaseDisplayState {
  HOME,
  REPO_SELECT,
  BRANCH_SELECT,
  CHART_SELECT,
  EXTENSION_DISPLAY,
  INGRESS_DISPLAY,
  SERVICEMESH_DISPLAY
}

export enum HomeDisplay {
  HOME,
  REPO_SELECT,
  APP_PIPELINES,
  APP_EXTENSIONS
}


export interface AppState {
  homeDisplay: HomeDisplay;
  baseDisplayState: BaseDisplayState;
  repo: Repository;
  branch: Branch;
  chart: ChartEntry;
  ghUserName: string;
}

export function emptyAppState() : AppState {
  return {
    homeDisplay: HomeDisplay.HOME,
    baseDisplayState: BaseDisplayState.HOME,
    repo: {
      id: 0,
      name: "",
      owner: "",
      description: ""
    },
    branch: {
      name: "",
      sha: ""
    },
    chart: {
      sha: "",
      path: "",
    },
    ghUserName: ""
  }
}