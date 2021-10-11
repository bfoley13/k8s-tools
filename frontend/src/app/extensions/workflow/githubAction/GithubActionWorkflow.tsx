import React from "react";
import { ListWorkflows } from "../../../../api/github";
import { WorkflowEntry } from "../../../../models/github";
import { AppState } from "../../../../models/types";

const githubActionSteps = ["Select Workflow", "Confirm"];

export default function GithubActionWorkflow(props: {
  appState: AppState;
  setAppState: (appState: AppState) => void;
}) {
  const [workflows, setWorkflows] = React.useState<WorkflowEntry[]>([]);
  const { appState, setAppState } = props;

  React.useEffect(() => {
    ListWorkflows(
      {
        repoOwner: appState.ghUserName,
        repoName: appState.repo.name,
        repoBranch: appState.branch.name,
      },
      setWorkflows
    );
  }, []);

  return <h1>Hello</h1>;
}
