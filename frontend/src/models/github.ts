export interface ListRepositoriesRequest {
  repoOwner: string;
}

export interface ListBranchesRequest {
  repoOwner: string;
  repoName: string;
}

export interface ListChartEntryRequest {
  repoOwner: string;
  repoName: string;
  repoBranch: string;
}

export interface ListWorkflowsEntryRequest {
  repoOwner: string;
  repoName: string;
  repoBranch: string;
}

export interface GetWorkflowEntryRequest {
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  sha: string;
}

export interface Workflow {
  contents: string;
}

export interface WorkflowFileSplit {
  metadata: string;
  steps: string[];
}

export interface GetActionEntryRequest {
  repoOwner: string;
  repoName: string;
}

export interface ActionInput {
  name: string;
  description: string;
  required: boolean;
}

export interface Action {
  name: string;
  description: string;
  inputs: ActionInput[];
}

export interface ListServicesRequest {
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  manifestOptionPath: string;
}

export interface ListDirectoriesRequest {
  repoOwner: string;
  repoName: string;
  branchSha: string;
  chartPath: string;
}

export interface ListRepoWorkflowRequest {
  repoOwner: string;
  repoName: string;
  branchSha: string;
}

export interface CreateIngressPRRequest {
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  ingressDefinition: string;
  ingressDirectory: string;
  ingressFilename: string;
  workflowDefinition: string;
  workflowFile: string;
}

export interface CreateActionPrRequest {
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  workflowDefinition: string;
  workflowFile: string;
}

export interface CreateWorkflowPRRequest {
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  workflowDefinition: string;
  workflowFile: string;
}

export interface Repository {
  id: number;
  name: string;
  owner: string;
  description: string;
}

export interface Branch {
  name: string;
  sha: string;
}

export interface ChartEntry {
  sha: string;
  path: string;
}

export interface WorkflowEntry {
  sha: string;
  path: string;
}

export interface ServiceEntry {
  name: string;
}

export interface TreeEntry {
  sha: string;
  path: string;
}

export interface RepoWorkflow {
  workflowYaml: string;
  path: string;
  sha: string;
}
