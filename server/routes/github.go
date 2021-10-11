package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"k8s-tooling-adapter/server/types"

	v1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes/scheme"
)

func (api *K8sService) ListRepoCharts(w http.ResponseWriter, r *http.Request) {
	log.Println("[ListRepoCharts] starting service call")
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
	log.Printf("[ListRepoCharts] Req Repo: %s/%s/%s\n", repoOwner, repoName, repoBranch)

	tree, err := api.GHClient.GetBranchTree(ctx, repoOwner, repoName, repoBranch)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	chartEntries := make([]*types.Chart, 0)
	for _, entry := range tree.Entries {
		if entry == nil || entry.Path == nil {
			continue
		}

		if strings.Contains(*entry.Path, "Chart.yaml") {
			chartEntries = append(chartEntries, &types.Chart{
				SHA:  *entry.SHA,
				Path: *entry.Path,
			})
		}
	}

	log.Println("[ListRepoCharts] Found Charts: ", len(chartEntries))

	resp := types.ChartResponse{
		Data: chartEntries,
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	log.Println("[ListRepoCharts] completed")
	w.WriteHeader(http.StatusOK)
}

func (api *K8sService) ListRepoWorkflows(w http.ResponseWriter, r *http.Request) {
	log.Println("[ListRepoWorkflows] starting service call")
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
	log.Printf("[ListRepoCharts] Req Repo: %s/%s/%s\n", repoOwner, repoName, repoBranch)

	tree, err := api.GHClient.GetBranchTree(ctx, repoOwner, repoName, repoBranch)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	reg, err := regexp.Compile(".github/workflows/.+.ya?ml")
	if err != nil {
		log.Printf("ERROR: %s", err.Error())
	}

	workflows := make([]*types.Workflow, 0)
	for _, entry := range tree.Entries {
		if entry == nil || entry.Path == nil {
			continue
		}

		if reg.MatchString(*entry.Path) {
			workflows = append(workflows, &types.Workflow{
				SHA: *entry.SHA,
				Path: *entry.Path,
			})
		}
	}

	log.Println("[ListRepoCharts] Found Workflows: ", len(workflows))

	resp := types.WorkflowResponse{
		Data: workflows,
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	log.Println("[ListRepoWorkflows] completed")
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

	if _, ok := params["chartPath"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid chartPath parameter"))
		return
	}

	repoOwner := params["repoOwner"][0]
	repoName := params["repoName"][0]
	repoBranch := params["repoBranch"][0]
	chartPath := params["chartPath"][0]

	log.Println("[ListServices] Chart Path: ", chartPath)
	err := api.LocalRepoService.CloneRepositoryLocaly(api.accessToken, repoOwner, repoName, repoBranch)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("error cloning repo: %s", err.Error()))
		return
	}
	log.Println("[ListServices] Cloned repo successfully")

	helmManifest, err := api.LocalRepoService.GenerateManifestWithHelm(repoOwner, repoName, repoBranch, strings.Replace(chartPath, "/Chart.yaml", "/", -1))
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("error generating maifest: %s", err.Error()))
		return
	}
	log.Println("[ListServices] Manifest generated successfully")

	manifestYamls := strings.Split(helmManifest, "---")
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

func (api *K8sService) TestPut(w http.ResponseWriter, r *http.Request) {
	log.Println("[TestPut] starting service call")
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	ctx := context.Background()

	repoOwner := "bfoley13"
	repoName := "hello-kubernetes"
	repoBranch := "main"
	newBranchName := "bot-test-branch"
	// ingressSourceFileString := "ingress.yaml:hello-kubernetes/deploy/helm/hello-kubernetes/templates/ingress.yaml"
	ingressYaml := `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
	name: <INGRESS_NAME>
spec:
	rules:
	- host: <HOST_URL>
		http:
			paths:
			- path: <URL_PATH>
				pathType: <PATH_TYPE>
				backend:
					service:
						name: <SERVICE_NAME>
						port:
							number: <SERVICE_PORT>
`

	log.Printf("%s/%s/%s/%s/%s\n", repoOwner, repoName, repoBranch, newBranchName, ingressYaml)
	ref, err := api.GHClient.GetReference(ctx, repoOwner, repoName, newBranchName, repoBranch)
	if err != nil || ref == nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to make new commit ref"))
		return
	}

	newFileName, err := api.LocalRepoService.SaveFile(repoOwner, repoName, repoBranch, ingressYaml, "hello-service-ingress.yaml")
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to save file: %s", err))
		return
	}

	sourceFile := fmt.Sprintf("%s:%s", newFileName, "deploy/helm/hello-kubernetes/templates/ingress.yaml")

	tree, err := api.GHClient.GenerateCommitTree(ctx, ref, repoOwner, repoName, sourceFile)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to generate new commit tree: %s", err.Error()))
		return
	}

	_, err = api.GHClient.CreateCommit(ctx, ref, tree, repoOwner, repoName)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to create commit: %s", err.Error()))
		return
	}

	pr, err := api.GHClient.CreatePullRequest(ctx, "Ingress Addition", repoOwner, repoName, repoBranch, "Adding ingress definition", "bfoley13", repoName, newBranchName)
	if err != nil {
		api.WriteHTTPErrorResponse(w, 500, fmt.Errorf("failed to create pull request: %s", err.Error()))
		return
	}

	log.Println("[TestPut] Completed")
	if err := json.NewEncoder(w).Encode(pr.GetHTMLURL()); err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}
	w.WriteHeader(http.StatusOK)
}
