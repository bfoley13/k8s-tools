package router

import (
	"net/http"

	"github.com/gorilla/mux"

	"k8s-tooling-adapter/server/routes"
)

func NewRouter(apiServer *routes.K8sService, getFS func() http.FileSystem) *mux.Router {
	router := mux.NewRouter()

	router.HandleFunc("/api/github/repositories", corsHandler(apiServer.ListRepositories, "GET")).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/github/repository/branches", corsHandler(apiServer.ListRepoBranches, "GET")).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/github/repository/charts", corsHandler(apiServer.ListRepoCharts, "GET")).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/github/repository/workflows", corsHandler(apiServer.ListRepoWorkflows, "GET")).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/github/repository/services", corsHandler(apiServer.ListServices, "GET")).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/github/repository/chartdirectory", corsHandler(apiServer.GetChartDirectories, "GET")).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/github/repository/pr", corsHandler(apiServer.CreateIngressPullRequest, "POST")).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/github/repository/test", corsHandler(apiServer.TestPut, "POST")).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/github/repository/action", corsHandler(apiServer.GetRepoAction, "GET")).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/github/repository/workflow", corsHandler(apiServer.GetWorkflowFile, "GET")).Methods("GET", "OPTIONS")

	//This handles serving the react bundle
	router.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(getFS())))
	return router
}

func corsHandler(h func(http.ResponseWriter, *http.Request), validMethods string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", validMethods)
		} else {
			h(w, r)
		}
	}
}
