/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import { Box, Stepper, Step, StepLabel, Button, Card, CardContent, Container, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Paper, CircularProgress } from "@mui/material";
import { AppState, BaseDisplayState } from "../../../../models/types";
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import MonacoEditor, { MonacoEditorProps } from '@uiw/react-monacoeditor';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { Repository, RepoWorkflow, ServiceEntry, TreeEntry } from '../../../../models/github';
import { CreateIngressPR, ListDirectories, ListRepositories, ListRepoWorkflows, ListServices } from '../../../../api/github';
import { Code, GitHub } from '@mui/icons-material';
import { baseYaml, rule, path, ingressWorkflow } from './yaml';
import YAML from 'yaml';
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor';

const ingressSteps = ["Select Backing Service", "Define Rules", "Select Ingress Location", "Select Workflow", "Add Ingress Deployment", "Confirm"]

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{
      fontSize: '0.9rem'
    }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));



export default function IngressWorkflow(
  props: {
    appState: AppState,
    setAppState: (appState: AppState) => void
  }) {
  const { appState, setAppState } = props;
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceEntry[]>([]);
  const [chartDirectories, setChartDirectories] = useState<TreeEntry[]>([]);
  const [workflowStep, setWorkflowStep] = useState<number>(0);
  const [accordionIndex, setAccordionIndex] = useState<number>(0);
  const [ingressName, setIngressName] = useState<string>("");
  const [ruleCount, setRuleCount] = useState<number>(0);
  const [repoWorkflows, setRepoWorkflows] = useState<RepoWorkflow[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<string>("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<RepoWorkflow>();
  const [filename, setFilename] = useState<string>("");
  const [prURL, setPRURL] = useState<string>("");
  const [showWorkflowSelect, setShowWorkflowSelect] = useState<boolean>(false);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

  // eslint-disable-next-line prefer-const
  const [ingressDefinition, setIngressDefinition] = useState<string>(baseYaml);
  let [workflowDefinition, setWorkflowDefinition] = useState<string>("");

  function createPR() {
    let workflowDir = "";
    if (selectedWorkflow != undefined) {
      workflowDir = selectedWorkflow.path;
    }
    CreateIngressPR({
      repoOwner: appState.ghUserName,
      repoName: appState.repo.name,
      repoBranch: appState.branch.name,
      ingressDefinition: ingressDefinition,
      ingressDirectory: selectedDirectory,
      ingressFilename: filename,
      workflowDefinition: workflowDefinition,
      workflowFile: workflowDir
    }, setPRURL)
    setWorkflowStep(workflowStep + 1);
  }

  React.useEffect(() => {
    ListServices({
      repoOwner: appState.ghUserName,
      repoName: appState.repo.name,
      repoBranch: appState.branch.name,
      manifestOptionPath: appState.chart.path
    }, setServices);
  }, [])

  React.useEffect(() => {
    ListDirectories({
      repoOwner: appState.ghUserName,
      repoName: appState.repo.name,
      branchSha: appState.branch.sha,
      chartPath: appState.chart.path
    }, setChartDirectories);
  }, [])

  React.useEffect(() => {
    ListRepoWorkflows({
      repoOwner: appState.ghUserName,
      repoName: appState.repo.name,
      branchSha: appState.branch.sha
    }, setRepoWorkflows);
  }, [selectedDirectory])

  function selectServices(services: ServiceEntry[]) {
    setSelectedServices(services);
    setWorkflowStep(1);
  }

  function handleEditorDidMount(ed: editor.IStandaloneCodeEditor, m: any) {
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    editorRef.current = ed
    //editor.IEditOperationsBuilder()

    console.log("monacoRef:", editorRef)
  }

  const appendToEditor = (text: string) => {
    const numLines: number = editorRef.current?.getModel()?.getLineCount() || 0

    const edit1: monaco.editor.IIdentifiedSingleEditOperation = {
      range: {
        startLineNumber: numLines - 1,
        endLineNumber: numLines - 1,
        startColumn: 0,
        endColumn: 0
      },
      text: text
    }

    console.log("Executing edit")
    console.log(edit1)

    editorRef.current?.executeEdits('', [edit1])
  }

  const addRuleToDefinition = () => {
    appendToEditor(rule)
    // setIngressDefinition(ingressDefinition + rule);
  }

  const addPathToDefinition = () => {
    appendToEditor(path);
  }

  function saveIngressYaml() {
    let currentEditorModel: editor.ITextModel | null | undefined = editorRef.current?.getModel()
    let currentIngressDef: string = currentEditorModel?.getLinesContent().join('\n') || ""

    console.log(currentIngressDef);
    setIngressDefinition(currentIngressDef);
    setWorkflowStep(workflowStep + 1);
  }

  function saveWorkflowYaml() {
    setWorkflowDefinition(workflowDefinition + "");
    setWorkflowStep(workflowStep + 1);
    console.log(workflowDefinition);
  }

  function selectWorkflow(workflow: RepoWorkflow) {
    let yamlObj = YAML.parse(workflow.workflowYaml);
    console.log(yamlObj);
    console.log(yamlObj.jobs?.aks?.steps);
    yamlObj.jobs.aks.steps.push(ingressWorkflow);
    let finalYaml = YAML.stringify(yamlObj);
    setSelectedWorkflow(workflow)
    setWorkflowDefinition(finalYaml)
    setWorkflowStep(workflowStep + 1);
  }

  const noAddToWorkflow = () => {
    setWorkflowStep(5);
  }

  const addToWorkflow = () => {
    setShowWorkflowSelect(true);
  }

  return (
    <Container maxWidth="md">
      <Box sx={{
        marginBottom: "20px"
      }}>
        <Stepper activeStep={workflowStep} alternativeLabel>
          {ingressSteps.map((label, index) => {
            const stepProps = {
            };
            const labelProps = {
            };
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>
      <Divider variant="inset" />
      {workflowStep == 0 &&
        <Container
          maxWidth="sm"
          sx={{
            marginTop: "25px"
          }}
        >
          <Typography variant="h5" align="center" color="text.secondary" paragraph>
            Services:
          </Typography>
          <Paper>
            <List
              sx={{
                overflow: 'auto',
                maxHeight: 500,
              }}
            >
              {
                services.map((service, idx) => {
                  return (
                    <div key={idx}>
                      <ListItem key={"service-" + idx} onClick={() => selectServices([service])}>
                        <ListItemButton>
                          <ListItemIcon>
                            <Code />
                          </ListItemIcon>
                          <ListItemText
                            primary={service.name}
                            secondary={
                              <React.Fragment>
                                <Typography
                                  sx={{
                                    display: 'inline'
                                  }}
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                      {idx != services.length - 1 &&
                        <Divider variant="inset" component="li" />
                      }
                    </div>
                  )
                })
              }
            </List>
          </Paper>
        </Container>
      }
      {selectedServices.length > 0 && workflowStep == 1 &&
        <Container
          maxWidth="md"
          sx={{
            marginTop: "25px"
          }}
        >
          {
            selectedServices.map((selectedService, idx) => {
              return (
                <Accordion
                  key={idx}
                  expanded={accordionIndex === 0}
                  onChange={() => setAccordionIndex(idx)}>
                  <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
                    <Typography>{selectedService.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div>
                      <Box sx={{
                        display: 'flex', flexWrap: 'wrap', flexDirection: 'column'
                      }}>
                        <div style={{
                          display: 'flex', flexDirection: 'row'
                        }}>
                          <Editor
                            language="yaml"
                            value={ingressDefinition}
                            options={{
                              theme: 'hc-black',
                            }}
                            width="100%"
                            height="50vh"
                            onChange={(s, e) => {
                              console.log(e);
                            }}
                            onMount={handleEditorDidMount}
                          />
                        </div>
                        <div>
                          <div style={{
                            display: 'flex', flexWrap: 'wrap', flexDirection: 'row', marginTop: '10px'
                          }}>
                            <Button variant="contained" sx={{
                              margin: 'auto'
                            }} onClick={addRuleToDefinition}>
                              Add Rule
                            </Button>
                            <Button variant="contained" sx={{
                              margin: 'auto'
                            }} onClick={addPathToDefinition}>
                              Add Path
                            </Button>
                          </div>
                        </div>

                      </Box>
                    </div>
                  </AccordionDetails>
                </Accordion>
              );
            })
          }
          <Button variant="contained" sx={{
            float: 'left', marginTop: '10px'
          }} onClick={() => setWorkflowStep(workflowStep - 1)}>
            Back
          </Button>
          <Button variant="contained" sx={{
            float: 'right', marginTop: '10px'
          }} onClick={() => saveIngressYaml()}>
            Next
          </Button>
        </Container>
      }
      {workflowStep == 2 &&
        <Container
          maxWidth="md"
          sx={{
            marginTop: "25px"
          }}
        >
          <Paper sx={{
            padding: '20px', display: 'flex', flexDirection: 'column'
          }}>
            <Typography variant="h5" align="center" color="text.secondary" paragraph>
              Select Ingress Directory and Filename
            </Typography>
            <div style={{
              display: 'flex', flex: 'row', width: '100%'
            }}>
              <FormControl sx={{
                flex: 2, paddingRight: '10px'
              }}>
                <InputLabel id="directory-select-label">Directory</InputLabel>
                <Select
                  labelId="directory-select-label"
                  id="directory-select"
                  label="Directory"
                  value={selectedDirectory}
                  onChange={(e) => setSelectedDirectory(e.target.value)}
                >
                  {chartDirectories.map((directory, idx) => {
                    return (
                      <MenuItem
                        key={idx}
                        value={directory.path}>
                        {directory.path}
                      </MenuItem>
                    );
                  })

                  }
                </Select>
              </FormControl>
              <TextField sx={{
                flex: 1
              }} value={filename} onChange={(e) => setFilename(e.target.value)} id="outlined-basic" label="File Name" variant="outlined" />
            </div>
          </Paper>
          <Button variant="contained" sx={{
            float: 'left', marginTop: '10px'
          }} onClick={() => setWorkflowStep(workflowStep - 1)}>
            Back
          </Button>
          <Button variant="contained" sx={{
            float: 'right', marginTop: '10px'
          }} onClick={() => setWorkflowStep(workflowStep + 1)}>
            Next
          </Button>
        </Container>
      }
      {workflowStep == 3 &&
        <Container
          maxWidth="md"
          sx={{
            marginTop: "25px"
          }}
        >
          <Paper sx={{
            padding: '20px'
          }}>
            <Typography variant="h5" align="center" color="text.secondary" paragraph>
              Add to Workflow?
            </Typography>
            <div>
              <div style={{
                display: 'flex', flexWrap: 'wrap', flexDirection: 'row', marginTop: '10px'
              }}>
                <Button variant="contained" sx={{
                  margin: 'auto'
                }} onClick={addToWorkflow}>
                  Yes
                </Button>
                <Button variant="contained" sx={{
                  margin: 'auto'
                }} onClick={noAddToWorkflow}>
                  No
                </Button>
              </div>
            </div>
            {showWorkflowSelect &&
              <div>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', flexDirection: 'row', marginTop: '10px'
                }}>
                  <Typography variant="h5" align="center" color="text.secondary" paragraph>
                    Select Workflow
                  </Typography>
                </div>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', flexDirection: 'row', marginTop: '10px'
                }}>
                  <List
                    sx={{
                      overflow: 'auto',
                      maxHeight: 500,
                    }}
                  >
                    {
                      repoWorkflows.map((repoWorkflow, idx) => {
                        return (
                          <div key={idx}>
                            <ListItem key={"service-" + idx} onClick={() => selectWorkflow(repoWorkflow)}>
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
                                          display: 'inline'
                                        }}
                                        component="span"
                                        variant="body2"
                                        color="text.primary"
                                      >
                                      </Typography>
                                    </React.Fragment>
                                  }
                                />
                              </ListItemButton>
                            </ListItem>
                            {idx != services.length - 1 &&
                              <Divider variant="inset" component="li" />
                            }
                          </div>
                        )
                      })
                    }
                  </List>
                </div>
              </div>
            }
          </Paper>
          <Button variant="contained" sx={{
            float: 'left', marginTop: '10px'
          }} onClick={() => setWorkflowStep(workflowStep - 1)}>
            Back
          </Button>
          <Button variant="contained" sx={{
            float: 'right', marginTop: '10px'
          }} onClick={() => setWorkflowStep(workflowStep + 1)}>
            Next
          </Button>
        </Container>
      }
      {selectedWorkflow && workflowStep == 4 &&
        <Container
          maxWidth="md"
          sx={{
            marginTop: "25px"
          }}
        >
          <Paper sx={{
            padding: '20px'
          }}>
            <Typography variant="h5" align="center" color="text.secondary" paragraph>
              Ingress Configuration Confirmation
            </Typography>
            <MonacoEditor
              language="yaml"
              value={workflowDefinition}
              options={{
                theme: 'vs-dark',
              }}
              style={{
                width: '100%',
                minHeight: '500px'
              }}
              onChange={(s, e) => {
                console.log(e);
                workflowDefinition = s;
              }}
            />
          </Paper>
          <Button variant="contained" sx={{
            float: 'left', marginTop: '10px'
          }} onClick={() => setWorkflowStep(workflowStep - 1)}>
            Back
          </Button>
          <Button variant="contained" sx={{
            float: 'right', marginTop: '10px'
          }} onClick={() => saveWorkflowYaml()}>
            Next
          </Button>
        </Container>
      }
      {workflowStep == 5 &&
        <Container
          maxWidth="md"
          sx={{
            marginTop: "25px"
          }}
        >
          <Paper sx={{
            padding: '20px'
          }}>
            <Typography variant="h5" align="center" color="text.secondary" paragraph>
              Ingress Configuration Confirmation
            </Typography>
            <div style={{
              display: 'flex', flexDirection: 'row'
            }}>
              <ul>
                <li><span>Service: {selectedServices[0].name}</span></li>
                <li><span>Ingress Filename: {filename}</span></li>
                <li><span>Definition Location: {selectedDirectory}</span></li>
              </ul>
            </div>
          </Paper>
          <Button variant="contained" sx={{
            float: 'left', marginTop: '10px'
          }} onClick={() => setWorkflowStep(workflowStep - 1)}>
            Back
          </Button>
          <Button variant="contained" sx={{
            float: 'right', marginTop: '10px'
          }} onClick={() => createPR()}>
            Submit
          </Button>
        </Container>
      }
      {workflowStep == 6 &&
        <Container
          maxWidth="md"
          sx={{
            marginTop: "25px"
          }}
        >
          <Paper sx={{
            padding: '20px'
          }}>
            {prURL == "" &&
              <div style={{
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{
                  flex: 1, flexDirection: 'row'
                }}>
                  <CircularProgress sx={{
                    flex: 1
                  }} />
                </div>
                <Typography variant="h5" align="center" color="text.secondary" paragraph>
                  Generating Pull Request
                </Typography>
              </div>
            }
            {prURL != "" &&
              <div style={{
                display: 'flex', flex: 1, flexDirection: 'row', alignContent: 'center'
              }}>
                <a href={prURL} style={{
                  flex: 1, alignContent: 'center'
                }}>PR Link</a>
              </div>
            }
          </Paper>
        </Container>
      }
    </Container>
  );
}
