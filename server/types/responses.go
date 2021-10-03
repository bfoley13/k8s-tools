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

type ChartResponse struct {
	Data []*Chart `json:"data"`
}

type ServiceResponse struct {
	Data []*Service `json:"data"`
}

type TreeResponse struct {
	Data []*TreeEntry `json:"data"`
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

type Chart struct {
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

type CreatePullRequestResponse struct {
	PullRequestURL string `json:"pullRequestURL"`
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
