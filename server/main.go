package main

import (
	"context"
	"embed"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"k8s-tooling-adapter/server/router"
	"k8s-tooling-adapter/server/routes"
)

type AppConfig struct {
	GitHubAccessToken string `json:"ghAccessToken"`
}

//go:embed build/*
var embeddedFiles embed.FS

//go:embed config.json
var configBytes []byte

func main() {
	appConfig := loadConfigFile()
	k8sService := routes.NewK8sService(appConfig.GitHubAccessToken)

	r := router.NewRouter(k8sService, getFileSystem)

	srv := &http.Server{
		Addr:    "0.0.0.0:8080",
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil {
			log.Println(err)
		}
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)

	<-c

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*15)
	defer cancel()

	srv.Shutdown(ctx)

	log.Println("shutting down")
	os.Exit(0)
}

func getFileSystem() http.FileSystem {
	log.Println("requesting frontend...")
	fsys, err := fs.Sub(embeddedFiles, "build")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}

func loadConfigFile() AppConfig {
	appConfig := AppConfig{}
	json.Unmarshal(configBytes, &appConfig)
	return appConfig
}
