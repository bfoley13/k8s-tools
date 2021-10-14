import React from "react";
import { GetAction, GetWorkflow, ListWorkflows } from "../../../../api/github";
import {
  Action,
  Workflow,
  WorkflowEntry,
  WorkflowFileSplit,
} from "../../../../models/github";
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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy as prismTheme } from "react-syntax-highlighter/dist/esm/styles/prism";
/* eslint @typescript-eslint/no-var-requires: "off" */
const rrl = require("react-reorderable-list"); // workaround because no types
const { ReOrderableItem, ReOrderableList } = rrl;

const githubActionSteps = [
  "Select Workflow",
  "Select Action",
  "Enter Fields",
  "Add Action",
  "Confirm",
];

const defaultActionUrls = [
  "https://github.com/Azure/k8s-bake",
  "https://github.com/Azure/k8s-set-context",
  "https://github.com/Azure/k8s-deploy",
  "https://github.com/gambtho/aks_devcluster_action",
];

export default function GithubActionWorkflow(props: {
  appState: AppState;
  setAppState: (appState: AppState) => void;
}) {
  const [workflows, setWorkflows] = React.useState<WorkflowEntry[]>([]);
  const [actionUrl, setActionUrl] = React.useState<string>("");
  const { appState, setAppState } = props;
  const [action, setAction] = React.useState<Action>();
  const [workflowStep, setWorkflowStep] = React.useState<number>(0);
  const [actionFields, setActionFields] = React.useState<Map<string, string>>(
    new Map()
  );
  const [selectedWorkflow, setSelectedWorkflow] =
    React.useState<WorkflowEntry>();
  const [workflow, setWorkflow] = React.useState<Workflow>({ contents: "" });
  const [workflowFileSplit, setWorkflowFileSplit] =
    React.useState<WorkflowFileSplit>({ metadata: "", steps: [] });

  const setSteps = (newSteps: string[]) => {
    setWorkflowFileSplit({
      metadata: workflowFileSplit.metadata,
      steps: newSteps,
    });
  };

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

  const getAction = (url: string) => {
    getWorkflow();
    const parts = url.split("/");
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
      setActionUrl(url);
      setWorkflowStep(workflowStep + 1);
    }
  };

  const getWorkflow = () => {
    GetWorkflow(
      {
        repoOwner: appState.ghUserName,
        repoName: appState.repo.name,
        repoBranch: appState.branch.name,
        sha: selectedWorkflow?.sha ?? "",
      },
      setWorkflow
    );
  };

  const splitWorkflow = () => {
    // TODO: Add better error handling? What if no workflow? What if no steps?

    const split = workflow.contents.split(/(steps:\s?)/);
    const lines = split[2].split(/\r?\n/);
    let spaces = 0;
    for (const line of lines) {
      if (line.trimLeft().length == 0) {
        continue;
      }

      spaces = line.split("-")[0].length;
      break;
    }

    // generate steps
    let steps = split[2].split(/(?=- )/g);
    steps = steps.map((step) => step.trimRight());
    steps = steps.filter((step) => step.length > 0);
    steps = steps.map((step) =>
      step
        .split("\n")
        .map((line) => " ".repeat(spaces) + line)
        .join("\n")
    );

    // generate new step
    let secondSpaces = 2;
    for (const step of steps) {
      const splitStep = step.split("\n");
      if (splitStep.length > 1) {
        const firstCharIndex = splitStep[1].match("[a-zA-Z]")?.index || 2;
        secondSpaces = firstCharIndex;
        break;
      }
    }

    const parts = actionUrl?.split("/");
    const repoName = parts?.pop() || parts?.pop(); // handles trailing slash
    const repoOwner = parts?.pop();
    let newStep = `${" ".repeat(spaces)}- uses: ${repoOwner}/${repoName}`;
    if (actionFields.size > 0) {
      newStep += `\n${" ".repeat(spaces)}  with:`;
    }
    actionFields.forEach((val, key) => {
      newStep += `\n${" ".repeat(secondSpaces)}${key}: '${val}'`;
    });

    // append new step to steps
    steps.push(newStep);
    setWorkflowFileSplit({ metadata: split[0] + split[1], steps });
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
                  <div key={idx}>
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
            <List>
              {defaultActionUrls.map((url, i) => (
                <ListItem key={i} button onClick={() => getAction(url)}>
                  <ListItemText style={{ color: "blue" }} primary={url} />
                </ListItem>
              ))}
            </List>
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
              <Button variant="contained" onClick={() => getAction(actionUrl)}>
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
                  console.log(workflow);
                  console.log(splitWorkflow());
                  setWorkflowStep(workflowStep + 1);
                }
              }}
            >
              Add
            </Button>
          </Paper>
        </Container>
      )}

      {workflowStep == 3 && (
        <Container
          maxWidth="md"
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
            Add Action
          </Typography>
          <Paper>
            <SyntaxHighlighter wrapLongLines language="yaml" style={prismTheme}>
              {workflowFileSplit.metadata}
            </SyntaxHighlighter>
          </Paper>
          <ReOrderableList
            name="steps"
            list={workflowFileSplit.steps}
            component={List}
            style={{ padding: 0, margin: 0 }}
            onListUpdate={(newSteps: string[]) => setSteps(newSteps)}
          >
            {workflowFileSplit.steps.map((step, index) => (
              <ReOrderableItem
                component={ListItem}
                key={index}
                style={{
                  padding: 0,
                  margin: 0,
                  marginBottom: "5px",
                  width: "100%",
                }}
              >
                <Paper
                  style={{ margin: "0px", width: "100%", cursor: "pointer" }}
                >
                  <SyntaxHighlighter
                    wrapLongLines
                    language="yaml"
                    style={prismTheme}
                  >
                    {step}
                  </SyntaxHighlighter>
                </Paper>
              </ReOrderableItem>
            ))}
          </ReOrderableList>

          <Button
            style={{ marginTop: "20px", width: "100%" }}
            variant="contained"
            onClick={() => console.log(workflowFileSplit)}
          >
            Add
          </Button>
        </Container>
      )}
    </Container>
  );
}
