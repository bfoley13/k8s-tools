package routes

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"k8s-tooling-adapter/server/types"

	"github.com/google/go-github/v38/github"
	v1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes/scheme"
)

func (api *K8sService) ListManifestOption(w http.ResponseWriter, r *http.Request) {
	log.Println("[ListManifestOption] starting service call")
	ctx := context.Background()
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	params := r.URL.Query()
	if _, ok := params["repoOwner"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid repoOwner parameter"))
		return
	}

	if _, ok := params["repoName"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid repoName parameter"))
		return
	}

	if _, ok := params["repoBranch"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid repoBranch parameter"))
		return
	}

	repoOwner := params["repoOwner"][0]
	repoName := params["repoName"][0]
	repoBranch := params["repoBranch"][0]
	log.Printf("[ListManifestOption] Req Repo: %s/%s/%s\n", repoOwner, repoName, repoBranch)

	tree, err := api.GHClient.GetBranchTree(ctx, repoOwner, repoName, repoBranch)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	manifestOptions := make([]*types.ManifestOption, 0)
	for _, entry := range tree.Entries {
		if entry == nil || entry.Path == nil {
			continue
		}

		if strings.Contains(*entry.Path, "Chart.yaml") {
			manifestOptions = append(manifestOptions, &types.ManifestOption{
				SHA:  *entry.SHA,
				Path: *entry.Path,
			})
		}

		if strings.Contains(*entry.Path, "manifests") && *entry.Type == "tree" {
			manifestOptions = append(manifestOptions, &types.ManifestOption{
				SHA:  *entry.SHA,
				Path: *entry.Path,
			})
		}
	}

	log.Println("[ListManifestOption] Found Manifest Options: ", len(manifestOptions))

	resp := types.ManifestOptionResponse{
		Data: manifestOptions,
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	log.Println("[ListManifestOption] completed")
	w.WriteHeader(http.StatusOK)
}

func (api *K8sService) ListServices(w http.ResponseWriter, r *http.Request) {
	log.Println("[ListServices] starting service call")
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	params := r.URL.Query()
	if _, ok := params["repoOwner"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid repoOwner parameter"))
		return
	}

	if _, ok := params["repoName"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid repoName parameter"))
		return
	}

	if _, ok := params["repoBranch"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid repoBranch parameter"))
		return
	}

	if _, ok := params["manifestOptionPath"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid manifestOptionPath parameter"))
		return
	}

	repoOwner := params["repoOwner"][0]
	repoName := params["repoName"][0]
	repoBranch := params["repoBranch"][0]
	manifestOptionPath := params["manifestOptionPath"][0]

	manifestYamls := []string{}
	var err error
	if strings.Contains(manifestOptionPath, "Chart.yaml") {
		manifestYamls, err = api.getHelmManifestYamls(repoName, repoOwner, repoBranch, manifestOptionPath)
		if err != nil {
			api.WriteHTTPErrorResponse(w, 500, err)
			return
		}
	} else if strings.Contains(manifestOptionPath, "manifests") {
		manifestYamls, err = api.getDefinedManifestYamls(context.Background(), repoName, repoOwner, repoBranch)
		if err != nil {
			api.WriteHTTPErrorResponse(w, 500, err)
			return
		}
	}

	decode := scheme.Codecs.UniversalDeserializer().Decode
	services := make([]*types.Service, 0)

	for _, yamlBlob := range manifestYamls {
		if yamlBlob == "" {
			continue
		}

		obj, _, err := decode([]byte(yamlBlob), nil, nil)
		if err != nil {
			fmt.Println("Error using universal decoder:", err.Error())
			continue
		}

		if obj.GetObjectKind().GroupVersionKind().Kind == "Service" {
			currService := obj.(*v1.Service)
			services = append(services, &types.Service{
				Name: currService.Name,
			})
			log.Println("[ListServices] found service: ", currService.Name)
		}
	}

	log.Println("[ListServices] Num of services found: ", len(services))

	resp := types.ServiceResponse{
		Data: services,
	}

	log.Println("[ListServices] Writing response")

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	log.Println("[ListServices] completed")
	w.WriteHeader(http.StatusOK)
}

func (api *K8sService) GetChartDirectories(w http.ResponseWriter, r *http.Request) {
	log.Println("[GetChartDirectories] starting service call")
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	ctx := context.Background()

	params := r.URL.Query()
	if _, ok := params["repoOwner"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid repoOwner parameter"))
		return
	}

	if _, ok := params["repoName"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid repoName parameter"))
		return
	}

	if _, ok := params["branchSha"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid branchSha parameter"))
		return
	}

	if _, ok := params["chartPath"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid chartPath parameter"))
		return
	}

	repoOwner := params["repoOwner"][0]
	repoName := params["repoName"][0]
	branchSha := params["branchSha"][0]
	chartPath := params["chartPath"][0]

	chartPath = strings.Replace(chartPath, "/Chart.yaml", "/", -1)

	tree, err := api.GHClient.GetBranchTree(ctx, repoOwner, repoName, branchSha)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("failed to get branch tree: %s", err.Error()))
		return
	}

	directories := make([]*types.TreeEntry, 0)
	for _, entry := range tree.Entries {
		if *entry.Type != "tree" {
			continue
		}

		if strings.Contains(*entry.Path, chartPath) {
			directories = append(directories, &types.TreeEntry{
				SHA:  *entry.SHA,
				Path: *entry.Path,
			})
		}
	}

	log.Println("[GetChartDirectories] Completed")
	if err := json.NewEncoder(w).Encode(types.TreeResponse{Data: directories}); err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (api *K8sService) CreateIngressPullRequest(w http.ResponseWriter, r *http.Request) {
	log.Println("[CreateIngressPullRequest] starting service call")
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	ctx := context.Background()

	log.Printf("[CreateIngressPullRequest] request body: %v\n", r.Body)
	requestDecoder := json.NewDecoder(r.Body)
	defer func() {
		if err := r.Body.Close(); err != nil {
			api.WriteHTTPErrorResponse(w, 500, err)
		}
	}()

	createPRRequest := &types.CreateIngressPullRequest{}
	err := requestDecoder.Decode(createPRRequest)
	if err != nil {
		log.Println("[CreateIngressPullRequest] failed to decode request body")
		api.WriteHTTPErrorResponse(w, 400, err)
		return
	}
	log.Printf("[CreateIngressPullRequest] Request: %+v\n", createPRRequest)

	newBranchName := "bot-test-branch"

	fmt.Println("[CreateIngressPullRequest] Getting repo reference")
	ref, err := api.GHClient.GetReference(ctx, createPRRequest.RepoOwner, createPRRequest.RepoName, newBranchName, createPRRequest.RepoBranch)
	if err != nil || ref == nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to make new commit ref"))
		return
	}

	fmt.Println("[CreateIngressPullRequest] Saving ingress definition localy")
	newFileName, err := api.LocalRepoService.SaveFile(createPRRequest.RepoOwner, createPRRequest.RepoName, createPRRequest.RepoBranch, createPRRequest.IngressDefinition, createPRRequest.IngressFilename)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to save file: %s", err))
		return
	}

	fmt.Println("[CreateIngressPullRequest] Creating new commit tree")
	sourceFile := fmt.Sprintf("%s:%s", newFileName, createPRRequest.IngressDirectory+"/"+createPRRequest.IngressFilename)
	tree, err := api.GHClient.GenerateCommitTree(ctx, ref, createPRRequest.RepoOwner, createPRRequest.RepoName, sourceFile)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to generate new commit tree: %s", err.Error()))
		return
	}

	fmt.Println("[CreateIngressPullRequest] Creating new commit")
	_, err = api.GHClient.CreateCommit(ctx, ref, tree, createPRRequest.RepoOwner, createPRRequest.RepoName)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to create commit: %s", err.Error()))
		return
	}

	fmt.Println("[CreateIngressPullRequest] Generating pull request")
	pr, err := api.GHClient.CreatePullRequest(ctx, "Ingress Addition", createPRRequest.RepoOwner, createPRRequest.RepoName, createPRRequest.RepoBranch, "Adding ingress definition", createPRRequest.RepoOwner, createPRRequest.RepoName, newBranchName)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to create pull request: %s", err.Error()))
		return
	}

	resp := &types.CreatePullRequestResponse{
		PullRequestURL: pr.GetHTMLURL(),
	}

	log.Println("[CreateIngressPullRequest] Completed")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}
	w.WriteHeader(http.StatusOK)

}

func (api *K8sService) getHelmManifestYamls(repoName, repoOwner, repoBranch, chartPath string) ([]string, error) {
	err := api.LocalRepoService.CloneRepositoryLocaly(api.accessToken, repoOwner, repoName, repoBranch)
	if err != nil {
		return nil, fmt.Errorf("error cloning repo: %s", err.Error())
	}
	log.Println("[ListServices] Cloned repo successfully")

	helmManifest, err := api.LocalRepoService.GenerateManifestWithHelm(repoOwner, repoName, repoBranch, strings.Replace(chartPath, "/Chart.yaml", "/", -1))
	if err != nil {
		return nil, fmt.Errorf("error generating maifest: %s", err.Error())
	}
	log.Println("[ListServices] Manifest generated successfully")

	return strings.Split(helmManifest, "---"), nil
}

func (api *K8sService) getDefinedManifestYamls(ctx context.Context, repoName, repoOwner, repoBranch string) ([]string, error) {
	err := api.LocalRepoService.CloneRepositoryLocaly(api.accessToken, repoOwner, repoName, repoBranch)
	if err != nil {
		return nil, fmt.Errorf("error cloning repo: %s", err.Error())
	}
	log.Println("[ListServices] Cloned repo successfully")

	tree, err := api.GHClient.GetBranchTree(ctx, repoOwner, repoName, repoBranch)
	if err != nil {
		return nil, fmt.Errorf("error getting repo branch: %s", err.Error())
	}

	manifestYamlBlobs := make([]*github.TreeEntry, 0)
	for _, entry := range tree.Entries {
		if entry == nil || entry.Path == nil {
			continue
		}

		if strings.Contains(*entry.Path, "manifests/") && strings.Contains(*entry.Path, ".yaml") && *entry.Type == "blob" {
			manifestYamlBlobs = append(manifestYamlBlobs, entry)
		}
	}

	yamlBlobs := []string{}
	for _, treeEntry := range manifestYamlBlobs {
		blob, err := api.GHClient.GetBlob(ctx, repoOwner, repoName, *treeEntry.SHA)
		if err != nil {
			return nil, fmt.Errorf("error fetching blob %s: %s", *treeEntry.Path, err.Error())
		}

		yamlString, err := base64.StdEncoding.DecodeString(*blob.Content)
		if err != nil {
			log.Println("failed to decode yaml: ", *treeEntry.Path)
			continue
		}
		yamlBlobs = append(yamlBlobs, string(yamlString))
	}

	return yamlBlobs, nil
}
