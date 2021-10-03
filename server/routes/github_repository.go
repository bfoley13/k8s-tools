package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"k8s-tooling-adapter/server/types"
)

func (api *K8sService) ListRepositories(w http.ResponseWriter, r *http.Request) {
	log.Println("[ListRepositories] starting service call")
	ctx := context.Background()
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	params := r.URL.Query()
	if _, ok := params["repoOwner"]; !ok {
		api.WriteHTTPErrorResponse(w, 400, fmt.Errorf("invalid repoOwner parameter"))
		return
	}

	repoOwner := params["repoOwner"][0]
	log.Printf("[ListRepositories] Req.Owner: %s\n", repoOwner)

	repos, err := api.GHClient.ListRepositories(ctx, repoOwner)
	if err != nil {
		log.Println("[ListRepositories] error fetching repositories from github")
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	log.Println("[ListRepositories] Repositories found: ", len(repos))
	log.Println("[ListRepositories] mutating repos for response")
	resp := types.RepositoriesResponse{}
	resp.Data = types.GitHubToResponseRepository(repoOwner, repos)

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		api.WriteHTTPErrorResponse(w, 500, err)
		return
	}

	log.Println("[ListRepositories] completed")
	w.WriteHeader(http.StatusOK)
}
