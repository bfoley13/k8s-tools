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

export interface ListServicesRequest {
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  chartPath: string;
}

export interface ListDirectoriesRequest {
  repoOwner: string;
  repoName: string;
  branchSha: string;
  chartPath: string;
}

export interface CreateIngressPRRequest {
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  ingressDefinition: string;
  ingressDirectory: string;
  ingressFilename: string;
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
