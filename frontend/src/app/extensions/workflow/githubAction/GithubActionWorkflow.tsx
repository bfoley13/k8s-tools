import React from "react";
import { ListWorkflows } from "../../../../api/github";
import { WorkflowEntry } from "../../../../models/github";
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

const githubActionSteps = ["Select Workflow", "Add Actions", "Confirm"];

export default function GithubActionWorkflow(props: {
  appState: AppState;
  setAppState: (appState: AppState) => void;
}) {
  const [workflows, setWorkflows] = React.useState<WorkflowEntry[]>([]);
  const { appState, setAppState } = props;
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
            Workflows
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
      {workflowStep == 1 && <h1>{selectedWorkflow?.path}</h1>}
    </Container>
  );
}
