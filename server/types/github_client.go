package types

import (
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/go-github/v38/github"
	"golang.org/x/oauth2"
)

var (
	commitName    = "bfoley13"
	commitEmail   = "brandonfoley13@gmail.com"
	commitMessage = "k8s-ingress-extension"
)

type GitHubClient struct {
	*github.Client
}

func NewGithubClient(ctx context.Context, accessToken string) GitHubClient {
	if accessToken == "" {
		return GitHubClient{
			github.NewClient(nil),
		}
	}

	log.Println("Setting up auth...")
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: accessToken},
	)
	tc := oauth2.NewClient(ctx, ts)

	log.Println("Creating Github client...")
	return GitHubClient{
		github.NewClient(tc),
	}
}

func (ghc *GitHubClient) ListRepositories(ctx context.Context, repoOwner string) ([]*github.Repository, error) {
	log.Printf("[ListRepositories] Fetching repositories: %s\n", repoOwner)
	repos, resp, err := ghc.Repositories.List(ctx, repoOwner, nil)
	if err != nil {
		return nil, fmt.Errorf("[ListRepositories] error fetching repositories: %s", err.Error())
	}
	if resp != nil && resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("[ListRepositories] Resp status not OK: %s", resp.Status)
	}

	return repos, nil
}

func (ghc *GitHubClient) GetRepository(ctx context.Context, repoOwner, repoName string) (*github.Repository, error) {
	log.Printf("[GetRepository] Fetching repository: %s/%s\n", repoOwner, repoName)
	repo, resp, err := ghc.Repositories.Get(ctx, repoOwner, repoName)
	if err != nil {
		return nil, fmt.Errorf("[GetRepository] error getting repository: %v", err)
	}
	if resp != nil && resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("[GetRepository] Resp status not OK: %s", resp.Status)
	}

	return repo, nil
}

func (ghc *GitHubClient) ListRepositoryBranches(ctx context.Context, repoOwner, repoName string) ([]*github.Branch, error) {
	log.Println("[ListRepositoryBranches] Fetching Repo Branches: ", repoName)
	branches, r, err := ghc.Repositories.ListBranches(ctx, repoOwner, repoName, nil)
	if err != nil {
		return nil, fmt.Errorf("[ListRepositoryBranches] error fetching branches %s: %s", repoName, err.Error())
	}
	if r != nil && r.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("[ListRepositoryBranches] Resp status not OK %s: %s", repoName, r.Status)
	}

	return branches, nil
}

func (ghc *GitHubClient) GetRepositoryBranch(ctx context.Context, repoOwner, repoName, branchName string) (*github.Branch, error) {
	log.Println("[GetRepositoryBranch] Fetching Branch: ", branchName)
	branch, r, err := ghc.Repositories.GetBranch(ctx, repoOwner, repoName, branchName, false)
	if err != nil {
		return nil, fmt.Errorf("[GetRepositoryBranch] error fetching branch %s: %s", branchName, err.Error())
	}
	if r != nil && r.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("[GetRepositoryBranch] Resp status not OK %s: %s", branchName, r.Status)
	}

	return branch, nil
}

func (ghc *GitHubClient) GetBranchTree(ctx context.Context, repoOwner, repoName, branchSHA string) (*github.Tree, error) {
	log.Println("[GetBranchTree] Fetching Branch Tree: ", branchSHA)
	tree, r, err := ghc.Git.GetTree(ctx, repoOwner, repoName, branchSHA, true)
	if err != nil {
		return nil, fmt.Errorf("[GetBranchTree] error fetching tree: %s", err.Error())
	}
	if r != nil && r.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("[GetBranchTree] Resp status not OK: %s", r.Status)
	}

	return tree, nil
}

func (ghc *GitHubClient) GetBlob(ctx context.Context, repoOwner, repoName, blobSHA string) (*github.Blob, error) {
	blob, r, err := ghc.Git.GetBlob(ctx, repoOwner, repoName, blobSHA)
	if err != nil {
		return nil, fmt.Errorf("[GetBranchTree] error fetching tree: %s", err.Error())
	}
	if r != nil && r.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("[GetBranchTree] Resp status not OK: %s", r.Status)
	}

	return blob, nil
}

func (ghc *GitHubClient) GetBlobsFromSHASlice(ctx context.Context, repoOwner, repoName string, blobSHAs []string) ([]*github.Blob, error) {
	var blobs []*github.Blob
	for _, sha := range blobSHAs {
		blob, err := ghc.GetBlob(ctx, repoOwner, repoName, sha)
		if err != nil {
			return nil, fmt.Errorf("[GetBlobsFromSHASlice] error getting blob slice: %s", err.Error())
		}

		blobs = append(blobs, blob)
	}

	return blobs, nil
}

func (ghc *GitHubClient) GetReference(ctx context.Context, sourceOwner, sourceRepo, commitBranch, baseBranch string) (*github.Reference, error) {
	if ref, _, err := ghc.Git.GetRef(ctx, sourceOwner, sourceRepo, "refs/heads/"+commitBranch); err == nil {
		return ref, nil
	}

	// We consider that an error means the branch has not been found and needs to
	// be created.
	if commitBranch == baseBranch {
		return nil, fmt.Errorf("The commit branch does not exist but `-base-branch` is the same as `-commit-branch`")
	}

	if baseBranch == "" {
		return nil, fmt.Errorf("The `-base-branch` should not be set to an empty string when the branch specified by `-commit-branch` does not exists")
	}

	var baseRef *github.Reference
	var err error
	if baseRef, _, err = ghc.Git.GetRef(ctx, sourceOwner, sourceRepo, "refs/heads/"+baseBranch); err != nil {
		return nil, err
	}
	newRef := &github.Reference{Ref: github.String("refs/heads/" + commitBranch), Object: &github.GitObject{SHA: baseRef.Object.SHA}}
	ref, _, err := ghc.Git.CreateRef(ctx, sourceOwner, sourceRepo, newRef)
	return ref, err
}

// getTree generates the tree to commit based on the given files and the commit
// of the ref you got in getRef.
func (ghc *GitHubClient) GenerateCommitTree(ctx context.Context, ref *github.Reference, sourceOwner, sourceRepo, sourceFiles string) (*github.Tree, error) {
	// Create a tree with what to commit.
	entries := []*github.TreeEntry{}

	// Load each file into the tree.
	for _, fileArg := range strings.Split(sourceFiles, ",") {
		file, content, err := getFileContent(fileArg)
		if err != nil {
			return nil, err
		}
		entries = append(entries, &github.TreeEntry{Path: github.String(file), Type: github.String("blob"), Content: github.String(string(content)), Mode: github.String("100644")})
	}

	tree, _, err := ghc.Git.CreateTree(ctx, sourceOwner, sourceRepo, *ref.Object.SHA, entries)
	return tree, err
}

// getFileContent loads the local content of a file and return the target name
// of the file in the target repository and its contents.
func getFileContent(fileArg string) (targetName string, b []byte, err error) {
	var localFile string
	files := strings.Split(fileArg, ":")
	switch {
	case len(files) < 1:
		return "", nil, errors.New("empty `-files` parameter")
	case len(files) == 1:
		localFile = files[0]
		targetName = files[0]
	default:
		localFile = files[0]
		targetName = files[1]
	}

	b, err = ioutil.ReadFile(localFile)
	return targetName, b, err
}

// pushCommit creates the commit in the given reference using the given tree.
func (ghc *GitHubClient) CreateCommit(ctx context.Context, ref *github.Reference, tree *github.Tree, sourceOwner, sourceRepo string) (*github.Commit, error) {
	// Get the parent commit to attach the commit to.
	parent, _, err := ghc.Repositories.GetCommit(ctx, sourceOwner, sourceRepo, *ref.Object.SHA, nil)
	if err != nil {
		return nil, err
	}
	// This is not always populated, but is needed.
	parent.Commit.SHA = parent.SHA

	// Create the commit using the tree.
	date := time.Now()
	author := &github.CommitAuthor{Date: &date, Name: &commitName, Email: &commitEmail}
	commit := &github.Commit{Author: author, Message: &commitMessage, Tree: tree, Parents: []*github.Commit{parent.Commit}}
	newCommit, _, err := ghc.Git.CreateCommit(ctx, sourceOwner, sourceRepo, commit)
	if err != nil {
		return nil, err
	}

	// Attach the commit to the master branch.
	ref.Object.SHA = newCommit.SHA
	_, _, err = ghc.Git.UpdateRef(ctx, sourceOwner, sourceRepo, ref, false)
	return newCommit, err
}

// createPR creates a pull request. Based on: https://godoc.org/github.com/google/go-github/github#example-PullRequestsService-Create
func (ghc *GitHubClient) CreatePullRequest(ctx context.Context, prSubject, prRepoOwner, prRepo, prBranch, prDescription, sourceOwner, sourceRepo, commitBranch string) (*github.PullRequest, error) {
	if prSubject == "" {
		return nil, errors.New("missing `-pr-title` flag; skipping PR creation")
	}

	if prRepoOwner != "" && prRepoOwner != sourceOwner {
		commitBranch = fmt.Sprintf("%s:%s", sourceOwner, commitBranch)
	} else {
		prRepoOwner = sourceOwner
	}

	if prRepo == "" {
		prRepo = sourceRepo
	}

	log.Printf("Title: %s | Head: %s | Base: %s | Body: %s", prSubject, commitBranch, prBranch, prDescription)

	newPR := &github.NewPullRequest{
		Title:               &prSubject,
		Head:                &commitBranch,
		Base:                &prBranch,
		Body:                &prDescription,
		MaintainerCanModify: github.Bool(true),
	}

	pr, _, err := ghc.PullRequests.Create(ctx, prRepoOwner, prRepo, newPR)
	if err != nil {
		return nil, err
	}

	fmt.Printf("PR created: %s\n", pr.GetHTMLURL())
	return pr, nil
}
