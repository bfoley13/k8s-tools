package types

import (
	"github.com/google/go-github/v38/github"
)

type APIError struct {
	Error string `json:"error"`
}

type RepositoriesResponse struct {
	Data []*Repository `json:"data"`
}

type BranchesResponse struct {
	Data []*Branch `json:"data"`
}

type ManifestOptionResponse struct {
	Data []*ManifestOption `json:"data"`
}

type WorkflowResponse struct {
	Data []*Workflow `json:"data"`
}

type ServiceResponse struct {
	Data []*Service `json:"data"`
}

type TreeResponse struct {
	Data []*TreeEntry `json:"data"`
}

type ActionResponse struct {
	Data *Action `json:"data"`
}

type ListWorkflowResponse struct {
	Data []*WorkflowDefinition `json:"data"`
}

type Repository struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Owner       string `json:"owner"`
	Description string `json:"description"`
}

type Branch struct {
	SHA  string `json:"sha"`
	Name string `json:"name"`
}

type ManifestOption struct {
	SHA  string `json:"sha"`
	Path string `json:"path"`
}

type Workflow struct {
	SHA  string `json:"sha"`
	Path string `json:"path"`
}

type Service struct {
	Name string `json:"name"`
}

type TreeEntry struct {
	SHA  string `json:"sha"`
	Path string `json:"path"`
}

type WorkflowDefinition struct {
	SHA  string `json:"sha"`
	Path string `json:"path"`
	WorkflowYaml string `json:"workflowYaml"`
}

type CreatePullRequestResponse struct {
	PullRequestURL string `json:"pullRequestURL"`
}

type ActionInput struct {
	Name string `json:"name"`
	Description string `json:"description"`
	Required bool `json:"required"`
}

type Action struct {
	Name string `json:"name"`
	Description string `json:"description"`
	Inputs []ActionInput `json:"inputs"`
}

type ActionYml struct {
	Name string
	Description string
	Inputs map[string]map[string]string
}

type WorkflowFile struct {
	Contents string `json:"contents"`
}

type WorkflowFileResponse struct {
	Data *WorkflowFile  `json:"data"`
}

func GitHubToResponseRepository(repoOwner string, repos []*github.Repository) []*Repository {
	respRepos := make([]*Repository, 0)
	for _, repo := range repos {
		if repo == nil {
			continue
		}

		respRepo := &Repository{
			Owner: repoOwner,
		}

		if repo.ID != nil {
			respRepo.ID = *repo.ID
		}

		if repo.Name != nil {
			respRepo.Name = *repo.Name
		}

		if repo.Description != nil {
			respRepo.Description = *repo.Description
		}

		respRepos = append(respRepos, respRepo)
	}
	return respRepos
}

func GitHubToResponseBranch(branches []*github.Branch) []*Branch {
	respBranches := make([]*Branch, 0)
	for _, branch := range branches {
		if branch == nil {
			continue
		}

		respBranches = append(respBranches, &Branch{
			Name: *branch.Name,
			SHA:  *branch.Commit.SHA,
		})
	}
	return respBranches
}
