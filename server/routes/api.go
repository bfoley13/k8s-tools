package routes

import (
	"context"
	"encoding/json"
	"k8s-tooling-adapter/server/types"
	"log"
	"net/http"
)

type K8sService struct {
	GHClient         types.GitHubClient
	LocalRepoService types.LocalRepoService
	accessToken      string
}

func NewK8sService(accessToken string) *K8sService {
	client := types.NewGithubClient(context.Background(), accessToken)
	lrs := types.NewLocalRepoService()
	return &K8sService{
		GHClient:         client,
		LocalRepoService: lrs,
		accessToken:      accessToken,
	}
}

func (api *K8sService) WriteHTTPErrorResponse(w http.ResponseWriter, code int, errResp error) {
	log.Println("[WriteHTTPErrorResponse] Error: ", errResp.Error())
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(&types.APIError{Error: errResp.Error()}); err != nil {
		log.Println("[WriteHTTPErrorResponse] failed to write http response: ", err.Error())
	}
}
