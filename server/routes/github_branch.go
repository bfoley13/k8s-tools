package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"k8s-tooling-adapter/server/types"
)

func (api *K8sService) ListRepoBranches(w http.ResponseWriter, r *http.Request) {
	log.Println("[ListRepoBranches] starting service call")
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

	repoOwner := params["repoOwner"][0]
	repoName := params["repoName"][0]
	log.Printf("[ListRepoBranches] Req Repo: %s/%s\n", repoOwner, repoName)

	branches, err := api.GHClient.ListRepositoryBranches(ctx, repoOwner, repoName)
	if err != nil {
		log.Println("[ListRepoBranches] error fetching branches from github")
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	log.Println("[ListRepoBranches] Branches found: ", len(branches))
	log.Println("[ListRepoBranches] mutating branches for response")
	resp := types.BranchesResponse{}
	resp.Data = types.GitHubToResponseBranch(branches)

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	log.Println("[ListRepoBranches] completed")
	w.WriteHeader(http.StatusOK)
}
