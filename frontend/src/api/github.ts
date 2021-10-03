import axios from "axios";
import { Branch, ChartEntry, CreateIngressPRRequest, ListBranchesRequest, ListChartEntryRequest, ListDirectoriesRequest, ListRepositoriesRequest, ListServicesRequest, Repository, ServiceEntry, TreeEntry } from "../models/github";

const baseURL = "http://localhost:8080";
axios.defaults.baseURL = baseURL


export function ListRepositories(req : ListRepositoriesRequest, handleResponse : (response: Repository[]) => void) {
  console.log("ListRepositories");
  axios.defaults.baseURL = baseURL
  axios.get(baseURL + "/api/github/repositories", {
    params: {
      repoOwner: req.repoOwner
    }
  })
  .then((resp) => {
    console.log("Got Response: ")
    console.log(resp)
    handleResponse(resp.data.data);
  })
}

export function ListBranches(req: ListBranchesRequest, handleResponse : (response: Branch[]) => void) {
  console.log("ListBranches");
  axios.defaults.baseURL = baseURL
  axios.get(baseURL + "/api/github/repository/branches", {
    params: {
      repoOwner: req.repoOwner,
      repoName: req.repoName
    }
  })
  .then((resp) => {
    console.log("Got Response: ")
    console.log(resp)
    handleResponse(resp.data.data);
  })
}

export function ListCharts(req: ListChartEntryRequest, handleResponse : (response: ChartEntry[]) => void) {
  console.log("ListCharts");
  console.log(req);
  axios.defaults.baseURL = baseURL
  axios.get(baseURL + "/api/github/repository/charts", {
    params: {
      repoOwner: req.repoOwner,
      repoName: req.repoName,
      repoBranch: req.repoBranch
    }
  })
  .then((resp) => {
    console.log("Got Response: ")
    console.log(resp)
    handleResponse(resp.data.data);
  })
}

export function ListServices(req: ListServicesRequest, handleResponse : (response: ServiceEntry[]) => void) {
  console.log("ListServices");
  console.log(req);
  axios.defaults.baseURL = baseURL
  axios.get(baseURL + "/api/github/repository/services", {
    params: {
      repoOwner: req.repoOwner,
      repoName: req.repoName,
      repoBranch: req.repoBranch,
      chartPath: req.chartPath
    }
  })
  .then((resp) => {
    console.log("Got Response: ")
    console.log(resp)
    handleResponse(resp.data.data);
  })
}

export function ListDirectories(req: ListDirectoriesRequest, handleResponse : (response: TreeEntry[]) => void) {
  console.log("ListServices");
  console.log(req);
  axios.defaults.baseURL = baseURL
  axios.get(baseURL + "/api/github/repository/chartdirectory", {
    params: {
      repoOwner: req.repoOwner,
      repoName: req.repoName,
      branchSha: req.branchSha,
      chartPath: req.chartPath
    }
  })
  .then((resp) => {
    console.log("Got Response: ")
    console.log(resp)
    handleResponse(resp.data.data);
  })
}

export function CreateIngressPR(req: CreateIngressPRRequest, handleResponse: (prURL: string) => void) {
  console.log("CreateIngressPR");
  console.log(req);
  axios.defaults.baseURL = baseURL
  axios.post( baseURL + '/api/github/repository/pr', req)
  .then((resp) => {
    console.log("Got Response: ")
    console.log(resp)
    handleResponse(resp.data.pullRequestURL);
  })
}
