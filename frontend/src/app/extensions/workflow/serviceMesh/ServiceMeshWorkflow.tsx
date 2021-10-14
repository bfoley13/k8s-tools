/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
} from "@mui/material";
import { AppState, BaseDisplayState } from "../../../../models/types";
import { useState } from "react";
import { styled } from "@mui/material/styles";
import MonacoEditor, { MonacoEditorProps } from "@uiw/react-monacoeditor";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import {
  Repository,
  RepoWorkflow,
  ServiceEntry,
  TreeEntry,
} from "../../../../models/github";
import {
  CreateWorkflowPR,
  ListDirectories,
  ListRepositories,
  ListRepoWorkflows,
  ListServices,
} from "../../../../api/github";
import { Code, GitHub } from "@mui/icons-material";
import { serviceMeshAction } from "./yaml";
import YAML from "yaml";

const ingressSteps = ["Select Workflow", "Add Ingress Deployment"];

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&:before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={
      <ArrowForwardIosSharpIcon
        sx={{
          fontSize: "0.9rem",
        }}
      />
    }
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, .05)"
      : "rgba(0, 0, 0, .03)",
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

export default function ServiceMeshWorkflow(props: {
  appState: AppState;
  setAppState: (appState: AppState) => void;
}) {
  const { appState, setAppState } = props;
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceEntry[]>([]);
  const [chartDirectories, setChartDirectories] = useState<TreeEntry[]>([]);
  const [workflowStep, setWorkflowStep] = useState<number>(0);
  const [accordionIndex, setAccordionIndex] = useState<number>(0);
  const [repoWorkflows, setRepoWorkflows] = useState<RepoWorkflow[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<string>("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<RepoWorkflow>();
  const [prURL, setPRURL] = useState<string>("");
  const [showWorkflowSelect, setShowWorkflowSelect] = useState<boolean>(false);

  // eslint-disable-next-line prefer-const
  let [workflowDefinition, setWorkflowDefinition] = useState<string>("");

  function createPR() {
    let workflowDir = "";
    if (selectedWorkflow != undefined) {
      workflowDir = selectedWorkflow.path;
    }
    CreateWorkflowPR(
      {
        repoOwner: appState.ghUserName,
        repoName: appState.repo.name,
        repoBranch: appState.branch.name,
        workflowDefinition: workflowDefinition,
        workflowFile: workflowDir,
      },
      setPRURL
    );
    setWorkflowStep(workflowStep + 1);
  }

  React.useEffect(() => {
    ListServices(
      {
        repoOwner: appState.ghUserName,
        repoName: appState.repo.name,
        repoBranch: appState.branch.name,
        manifestOptionPath: appState.chart.path,
      },
      setServices
    );
  }, []);

  React.useEffect(() => {
    ListDirectories(
      {
        repoOwner: appState.ghUserName,
        repoName: appState.repo.name,
        branchSha: appState.branch.sha,
        chartPath: appState.chart.path,
      },
      setChartDirectories
    );
  }, []);

  React.useEffect(() => {
    ListRepoWorkflows(
      {
        repoOwner: appState.ghUserName,
        repoName: appState.repo.name,
        branchSha: appState.branch.sha,
      },
      setRepoWorkflows
    );
  }, [selectedDirectory]);

  function selectServices(services: ServiceEntry[]) {
    setSelectedServices(services);
    setWorkflowStep(1);
  }

  function saveWorkflowYaml() {
    setWorkflowDefinition(workflowDefinition + "");
    setWorkflowStep(workflowStep + 1);
    console.log(workflowDefinition);
    createPR();
  }

  function selectWorkflow(workflow: RepoWorkflow) {
    let yamlObj = YAML.parse(workflow.workflowYaml);
    console.log(yamlObj);
    console.log(yamlObj.jobs.aks.steps);
    yamlObj.jobs.aks.steps.push(serviceMeshAction);
    let finalYaml = YAML.stringify(yamlObj);
    setSelectedWorkflow(workflow);
    setWorkflowDefinition(finalYaml);
    setWorkflowStep(workflowStep + 1);
  }

  const addToWorkflow = () => {
    setShowWorkflowSelect(true);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginBottom: "20px",
        }}
      >
        <Stepper activeStep={workflowStep} alternativeLabel>
          {ingressSteps.map((label, index) => {
            const stepProps = {};
            const labelProps = {};
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>
      <Divider variant="inset" />
      {workflowStep == 0 && (
        <Container
          maxWidth="md"
          sx={{
            marginTop: "25px",
          }}
        >
          <Paper
            sx={{
              padding: "20px",
            }}
          >
            {
              <div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    flexDirection: "row",
                    marginTop: "10px",
                  }}
                >
                  <Typography
                    variant="h5"
                    align="center"
                    color="text.secondary"
                    paragraph
                  >
                    Select Workflow
                  </Typography>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    flexDirection: "row",
                    marginTop: "10px",
                  }}
                >
                  <List
                    sx={{
                      overflow: "auto",
                      maxHeight: 500,
                    }}
                  >
                    {repoWorkflows.map((repoWorkflow, idx) => {
                      return (
                        <div key={idx}>
                          <ListItem
                            key={"service-" + idx}
                            onClick={() => selectWorkflow(repoWorkflow)}
                          >
                            <ListItemButton>
                              <ListItemIcon>
                                <Code />
                              </ListItemIcon>
                              <ListItemText
                                primary={repoWorkflow.path}
                                secondary={
                                  <React.Fragment>
                                    <Typography
                                      sx={{
                                        display: "inline",
                                      }}
                                      component="span"
                                      variant="body2"
                                      color="text.primary"
                                    ></Typography>
                                  </React.Fragment>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                          {idx != services.length - 1 && (
                            <Divider variant="inset" component="li" />
                          )}
                        </div>
                      );
                    })}
                  </List>
                </div>
              </div>
            }
          </Paper>
          <Button
            variant="contained"
            sx={{
              float: "left",
              marginTop: "10px",
            }}
            onClick={() => setWorkflowStep(workflowStep - 1)}
          >
            Back
          </Button>
        </Container>
      )}
      {selectedWorkflow && workflowStep == 1 && (
        <Container
          maxWidth="md"
          sx={{
            marginTop: "25px",
          }}
        >
          <Paper
            sx={{
              padding: "20px",
            }}
          >
            <Typography
              variant="h5"
              align="center"
              color="text.secondary"
              paragraph
            >
              Workflow Configuration Confirmation
            </Typography>
            <MonacoEditor
              language="yaml"
              value={workflowDefinition}
              options={{
                theme: "vs-dark",
              }}
              style={{
                width: "100%",
                minHeight: "500px",
              }}
              onChange={(s, e) => {
                console.log(e);
                workflowDefinition = s;
              }}
            />
          </Paper>
          <Button
            variant="contained"
            sx={{
              float: "left",
              marginTop: "10px",
            }}
            onClick={() => setWorkflowStep(workflowStep - 1)}
          >
            Back
          </Button>
          <Button
            variant="contained"
            sx={{
              float: "right",
              marginTop: "10px",
            }}
            onClick={() => saveWorkflowYaml()}
          >
            Confirm
          </Button>
        </Container>
      )}
      {workflowStep == 2 && (
        <Container
          maxWidth="md"
          sx={{
            marginTop: "25px",
          }}
        >
          <Paper
            sx={{
              padding: "20px",
            }}
          >
            {prURL == "" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    flexDirection: "row",
                  }}
                >
                  <CircularProgress
                    sx={{
                      flex: 1,
                    }}
                  />
                </div>
                <Typography
                  variant="h5"
                  align="center"
                  color="text.secondary"
                  paragraph
                >
                  Generating Pull Request
                </Typography>
              </div>
            )}
            {prURL != "" && (
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "row",
                  alignContent: "center",
                }}
              >
                <a
                  href={prURL}
                  style={{
                    flex: 1,
                    alignContent: "center",
                  }}
                >
                  PR Link
                </a>
              </div>
            )}
          </Paper>
        </Container>
      )}
    </Container>
  );
}
