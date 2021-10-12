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
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { Code, Help } from "@mui/icons-material";
import { isConstructorDeclaration } from "typescript";

const githubActionSteps = [
  "Select Workflow",
  "Select Action",
  "Enter Fields",
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
  const [actionFields, setActionFields] = React.useState<Map<string, string>>(
    new Map()
  );
  const [selectedWorkflow, setSelectedWorkflow] =
    React.useState<WorkflowEntry>();

  const addActionField = (name: string, val: string) => {
    setActionFields(new Map(actionFields.set(name, val)));
  };

  const hasRequiredFields = (): boolean => {
    const required = action?.inputs.filter((input) => input.required);
    const unfulfilled = required?.filter(
      (input) =>
        !actionFields.has(input.name) ||
        actionFields.get(input.name)?.length == 0
    );
    console.log(required);
    console.log(unfulfilled);

    return !!unfulfilled && unfulfilled?.length == 0;
  };

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
              example: https://github.com/actions/first-interaction
            </Typography>
            <Divider />
          </Paper>
        </Container>
      )}

      {workflowStep == 2 && (
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
            Enter Fields
          </Typography>
          <Paper sx={{ display: "flex", flexDirection: "column" }}>
            {action?.inputs.map(({ name, description, required }, index) => {
              return (
                <>
                  <Typography
                    style={{ marginLeft: "34px", paddingTop: "34px" }}
                    color="text.primary"
                    paragraph
                  >
                    {name + (required ? "*" : "")}{" "}
                    <Tooltip
                      style={{ cursor: "pointer" }}
                      title={<p style={{ fontSize: "16px" }}>{description}</p>}
                      arrow
                    >
                      <Help fontSize="inherit" />
                    </Tooltip>
                  </Typography>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      flex: 1,
                      alignContent: "center",
                      margin: "20px",
                      marginTop: "0px",
                      padding: "10px",
                      paddingTop: "0px",
                    }}
                  >
                    <TextField
                      sx={{ margin: "4px", flex: 1 }}
                      id="standard-basic"
                      label={required ? "required" : ""}
                      variant="standard"
                      value={actionFields.get(name)}
                      onChange={(e) => addActionField(name, e.target.value)}
                    />
                  </div>
                </>
              );
            })}
            <Button
              style={{ margin: "34px" }}
              variant="contained"
              onClick={() => {
                if (hasRequiredFields()) {
                  console.log(actionFields);
                  setWorkflowStep(workflowStep + 1);
                }
              }}
            >
              Add
            </Button>
          </Paper>
        </Container>
      )}
    </Container>
  );
}
