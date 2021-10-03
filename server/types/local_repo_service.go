package types

import (
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"
)

type LocalRepoService struct {
	repoCache map[string]*LocalRepo
}

type LocalRepo struct {
	Name                string
	Owner               string
	Branch              string
	BaseDirectory       string
	Manifest            string
	CloneTimestamp      time.Time
	LastActionTimestamp time.Time
}

func NewLocalRepoService() LocalRepoService {
	newService := LocalRepoService{
		repoCache: make(map[string]*LocalRepo),
	}

	go func() {
		for range time.Tick(time.Minute * 5) {
			newService.cleanupCache()
		}
	}()

	return newService
}

func (lrs *LocalRepoService) CloneRepositoryLocaly(accessToken, repoOwner, repoName, repoBranch string) error {
	repoHash := lrs.generateRepoHash(repoOwner, repoName, repoBranch)

	if _, ok := lrs.repoCache[repoHash]; ok {
		log.Println("[CloneRepository] Repo alreade present locally")
		return nil
	}

	err := exec.Command("git", "clone", "-b", repoBranch, fmt.Sprintf("https://%s@github.com/%s/%s.git", accessToken, repoOwner, repoName), fmt.Sprintf("./%s", repoHash)).Run()
	if err != nil {
		log.Println("[CloneRepository] Failed to clone repository: ", err.Error())
		return err
	}

	newLocalRepo := &LocalRepo{
		Name:                repoName,
		Owner:               repoOwner,
		Branch:              repoBranch,
		BaseDirectory:       repoHash,
		CloneTimestamp:      time.Now(),
		LastActionTimestamp: time.Now(),
		Manifest:            "",
	}

	log.Println("[CloneRepository] Successfully cloned repo")
	lrs.repoCache[repoHash] = newLocalRepo
	return nil
}

func (lrs *LocalRepoService) GenerateManifestWithHelm(repoOwner, repoName, repoBranch, chartPath string) (string, error) {
	repoHash := lrs.generateRepoHash(repoOwner, repoName, repoBranch)

	if _, ok := lrs.repoCache[repoHash]; !ok {
		log.Println("[GenerateManifestWithHelm] repo doesnt exist locally")
		return "", fmt.Errorf("[GenerateManifestWithHelm] repo doesnt exist locally")
	}

	localRepo := lrs.repoCache[repoHash]
	helmManifest, err := exec.Command("helm3", "template", repoName, fmt.Sprintf("./%s/%s", localRepo.BaseDirectory, chartPath)).Output()
	if err != nil {
		return "", fmt.Errorf("[GenerateManifestWithHelm] error generating manifest: %s", err.Error())
	}

	localRepo.LastActionTimestamp = time.Now()
	localRepo.Manifest = string(helmManifest)
	log.Println("[GenerateManifestWithHelm] Manifest generated successfully")
	return string(helmManifest), nil
}

func (lrs *LocalRepoService) CreateNewBranch(repoOwner, repoName, repoBranch string) error {
	repoHash := lrs.generateRepoHash(repoOwner, repoName, repoBranch)

	if _, ok := lrs.repoCache[repoHash]; !ok {
		log.Println("[CreateNewBranch] repo doesnt exist locally")
		return fmt.Errorf("[CreateNewBranch] repo doesnt exist locally")
	}

	localRepo := lrs.repoCache[repoHash]
	err := exec.Command("cd", fmt.Sprintf("./%s/", localRepo.BaseDirectory), "&&", "git", "checkout", "-b", localRepo.BaseDirectory).Run()
	if err != nil {
		return fmt.Errorf("[CreateNewBranch] error creating new branch: %s", err.Error())
	}

	log.Println("[CreateNewBranch] branch created successfully")
	return nil
}

func (lrs *LocalRepoService) SaveFile(repoOwner, repoName, repoBranch, fileContents, fileName string) (string, error) {
	repoHash := lrs.generateRepoHash(repoOwner, repoName, repoBranch)

	if _, ok := lrs.repoCache[repoHash]; !ok {
		log.Println("[SaveFile] repo doesnt exist locally")
		return "", fmt.Errorf("[SaveFile] repo doesnt exist locally")
	}

	localRepo := lrs.repoCache[repoHash]
	err := os.WriteFile(fmt.Sprintf("./%s/%s", localRepo.BaseDirectory, fileName), []byte(fileContents), 0755)
	if err != nil {
		log.Println("[SaveFile] failed to save file")
		return "", fmt.Errorf("[SaveFile] failed to save file: %s", err.Error())
	}

	return fmt.Sprintf("./%s/%s", localRepo.BaseDirectory, fileName), nil
}

func (lrs *LocalRepoService) generateRepoHash(repoOwner, repoName, repoBranch string) string {
	repoInfo := []byte(repoOwner + repoName + repoBranch)
	hash := sha1.New()
	hash.Write(repoInfo)
	return base64.URLEncoding.EncodeToString(hash.Sum(nil))
}

func (lrs *LocalRepoService) cleanupCache() {
	log.Println("[cleanupCache] cleaning up unused repos")
	hashesToRemove := make([]string, 0)
	for hash, repo := range lrs.repoCache {
		if time.Now().Before(repo.LastActionTimestamp.Add(10 * time.Minute)) {
			continue
		}

		hashesToRemove = append(hashesToRemove, hash)
	}

	log.Println("[cleanupCache] Repos to cleanup: ", len(hashesToRemove))
	var err error
	for _, hash := range hashesToRemove {
		repo := lrs.repoCache[hash]
		err = exec.Command("rm", "-rf", fmt.Sprintf("./%s/", repo.BaseDirectory)).Run()
		if err != nil {
			log.Println("[cleanupCache] Failed to cleanup repo with hash: ", hash)
			continue
		}

		delete(lrs.repoCache, hash)
		log.Println("[cleanupCache] Succeesful repo cleanup: ", hash)
	}
}
