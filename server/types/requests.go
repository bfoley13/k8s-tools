package types

type RepositoryRequest struct {
	RepoOwner string `json:"repoOwner"`
}

type BranchesRequest struct {
	RepoOwner string `json:"repoOwner"`
	RepoName  string `json:"repoName"`
}

type ChartRequest struct {
	RepoOwner  string `json:"repoOwner"`
	RepoName   string `json:"repoName"`
	RepoBranch string `json:"repoBranch"`
}

type ServiceRequest struct {
	RepoOwner  string `json:"repoOwner"`
	RepoName   string `json:"repoName"`
	RepoBranch string `json:"repoBranch"`
	ChartPath  string `json:"chartPath"`
}

type CreateIngressPullRequest struct {
	RepoOwner         string `json:"repoOwner"`
	RepoName          string `json:"repoName"`
	RepoBranch        string `json:"repoBranch"`
	IngressDefinition string `json:"ingressDefinition"`
	IngressDirectory  string `json:"ingressDirectory"`
	IngressFilename   string `json:"ingressFilename"`
}

type ActionRequest struct {
	Url string  `json:"url"`
}
