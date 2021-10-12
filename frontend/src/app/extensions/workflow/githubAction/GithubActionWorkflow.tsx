import React from "react";
import { GetAction, ListWorkflows } from "../../../../api/github";
import { Action, WorkflowEntry } from "../../../../models/github";
import { AppState } from "../../../../models/types";
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
import { Code, GitHub } from "@mui/icons-material";

const githubActionSteps = [
  "Select Workflow",
  "Select Action",
  "Add Action",
  "Confirm",
];

export default function GithubActionWorkflow(props: {
  appState: AppState;
  setAppState: (appState: AppState) => void;
}) {
  const [workflows, setWorkflows] = React.useState<WorkflowEntry[]>([]);
  const [actionUrl, setActionUrl] = React.useState<String>("");
  const { appState, setAppState } = props;
  const [action, setAction] = React.useState<Action>();
  const [workflowStep, setWorkflowStep] = React.useState<number>(0);
  const [selectedWorkflow, setSelectedWorkflow] =
    React.useState<WorkflowEntry>();

  React.useEffect(() => {
    ListWorkflows(
      {
        repoOwner: appState.ghUserName,
        repoName: appState.repo.name,
        repoBranch: appState.branch.name,
      },
      setWorkflows
    );
  }, []);

  const getAction = () => {
    let parts = actionUrl?.split("/");
    const repoName = parts?.pop() || parts?.pop(); // handles trailing slash
    const repoOwner = parts?.pop();

    if (repoName && repoOwner) {
      GetAction(
        {
          repoOwner: repoOwner,
          repoName: repoName,
        },
        setAction
      );
      setWorkflowStep(workflowStep + 1);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginBottom: "20px",
        }}
      >
        <Stepper activeStep={workflowStep} alternativeLabel>
          {githubActionSteps.map((label, index) => {
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
          maxWidth="sm"
          sx={{
            marginTop: "25px",
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
          <Paper>
            <List
              sx={{
                overflow: "auto",
                maxHeight: 500,
              }}
            >
              {workflows.map((workflow, idx) => {
                return (
                  <div>
                    <ListItem
                      key={"workflow-" + idx}
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setWorkflowStep(workflowStep + 1);
                      }}
                    >
                      <ListItemButton>
                        <ListItemIcon>
                          <Code />
                        </ListItemIcon>
                        <ListItemText
                          primary={workflow.path}
                          secondary={
                            <React.Fragment>
                              <Typography
                                sx={{ display: "inline" }}
                                component="span"
                                variant="body2"
                                color="text.primary"
                              ></Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {idx != workflows.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </div>
                );
              })}
            </List>
          </Paper>
        </Container>
      )}
      {workflowStep == 1 && (
        <Container
          maxWidth="sm"
          sx={{
            marginTop: "25px",
          }}
        >
          <Typography
            variant="h5"
            align="center"
            color="text.secondary"
            paragraph
          >
            Select Action
          </Typography>
          <Paper sx={{ display: "flex", flexDirection: "column" }}>
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flex: 1,
                alignContent: "center",
                margin: "20px",
                marginBottom: "0px",
                padding: "10px",
              }}
            >
              <TextField
                sx={{ margin: "4px", flex: 1 }}
                id="standard-basic"
                label="Github Action Repository URL"
                variant="standard"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
              />
              <Button variant="contained" onClick={() => getAction()}>
                Use
              </Button>
            </div>
            <Typography
              style={{ marginLeft: "34px" }}
              color="text.secondary"
              paragraph
            >
              example: https://github.com/Azure/k8s-bake
            </Typography>
            <Divider />
          </Paper>
        </Container>
      )}
    </Container>
  );
}
