import { AccountTree, Description, GitHub } from '@mui/icons-material';
import { Button, Container, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { ListBranches, ListCharts, ListRepositories } from '../../api/github';
import { Branch, ChartEntry, Repository } from '../../models/github';
import { AppState, BaseDisplayState } from '../../models/types';

export default function AppSelect(props: {appState: AppState, setAppState: (appState: AppState) => void}) {
  const {appState, setAppState} = props;
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<Repository | undefined>();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>();
  const [chartPaths, setChartPaths] = useState<ChartEntry[]>([]);
  const [selectedChart, setSelectedChart] = useState<ChartEntry | undefined>();

  React.useEffect(() => {
    ListRepositories({
      repoOwner: "bfoley13"
    }, setRepositories)
  }, []);

  React.useEffect(() => {
    if (selectedRepository != undefined) {
      ListBranches({
        repoOwner: "bfoley13",
        repoName: selectedRepository.name
      }, setBranches)
    }
  }, [selectedRepository]);

  React.useEffect(() => {
    if (selectedRepository != undefined && selectedBranch != undefined) {
      ListCharts({
        repoOwner: "bfoley13",
        repoName: selectedRepository.name,
        repoBranch: selectedBranch.sha
      }, setChartPaths)
    }
  }, [selectedBranch]);

  const setSelectedRepo = (repo: Repository) => {
    setAppState({...appState, repo: repo});
    setSelectedRepository(repo);
    setSelectedBranch(undefined);
    setSelectedChart(undefined);
    setChartPaths([]);
  }

  const setSelectedRepoBranch = (branch: Branch) => {
    setAppState({...appState, branch: branch});
    setSelectedBranch(branch);
    setSelectedChart(undefined);
  }

  const setSelectedRepoChart = (chart: ChartEntry) => {
    setAppState({...appState, chart: chart});
    setSelectedChart(chart);
  }

  const selectApp = () => {
    setAppState({...appState, baseDisplayState: BaseDisplayState.EXTENSION_DISPLAY});
  }

  return (
    <Container maxWidth="lg" sx={{display: 'flex', flexDirection:'column', height: '100%'}}>
      <Paper sx={{display: 'flex', flexDirection:'column'}}>
        <div style={{display: 'flex', flexDirection:'row', flex: 1, alignContent: 'center'}}>
          <Typography variant="h5" align="center" color="text.secondary" paragraph sx={{flex: 1}}>
            Select Your App:
          </Typography>
        </div>
        <Divider />
        <div style={{display: 'flex', flexDirection:'row', flex: 1, padding: '4px'}}>
          <div style={{display: 'flex', flexDirection:'column', flex: 1, padding: '4px'}}>
            <Typography variant="h6" align="center" color="text.secondary" paragraph>
              Repository:
            </Typography>
            <List
              sx={{
                overflow: 'auto',
                maxHeight: 500,
              }}
            >
              {
                repositories.map((repo, idx) => {
                  return (
                    <div>
                    <ListItem onClick={() => setSelectedRepo(repo)} key={"repo-" + idx}>
                      <ListItemButton selected={selectedRepository?.name == repo.name}>
                        <ListItemIcon>
                          <GitHub />
                        </ListItemIcon>
                        <ListItemText
                          primary={repo.name}
                        />
                      </ListItemButton>
                    </ListItem>
                    {idx != repositories.length - 1 &&
                      <Divider variant="inset" component="li" />
                    }
                    </div>
                  )
                })
              }
            </List>
          </div>
          <div style={{display: 'flex', flexDirection:'column', flex: 1, padding: '4px'}}>
            <Typography variant="h6" align="center" color="text.secondary" paragraph>
              Branch:
            </Typography>
            <List>
              {
                branches.map((branch, idx) => {
                  return (
                    <div>
                      <ListItem onClick={() => setSelectedRepoBranch(branch)} key={"branch-" + idx}>
                        <ListItemButton selected={selectedBranch?.name == branch.name}>
                        <ListItemIcon>
                          <AccountTree />
                        </ListItemIcon>
                          <ListItemText
                            primary={branch.name}
                          />
                        </ListItemButton>
                      </ListItem>
                      {idx != branches.length - 1 &&
                        <Divider variant="fullWidth" component="li" />
                      }
                    </div>
                  )
                })
              }
            </List>
          </div>
          <div style={{display: 'flex', flexDirection:'column', flex: 1, padding: '4px'}}>
            <Typography variant="h6" align="center" color="text.secondary" paragraph>
              Chart:
            </Typography>
            <List>
              {
                chartPaths.map((chart, idx) => {
                  return (
                    <div>
                      <ListItem key={"chart-" + idx} onClick={() => setSelectedRepoChart(chart)}>
                        <ListItemButton selected={selectedChart?.path == chart.path}>
                          <ListItemIcon>
                            <Description />
                          </ListItemIcon>
                          <ListItemText
                            primary={chart.path}
                          />
                        </ListItemButton>
                      </ListItem>
                      {idx != chartPaths.length - 1 &&
                        <Divider variant="fullWidth" component="li" />
                      }
                    </div>
                  )
                })
              }
            </List>
          </div>
        </div>
      </Paper>
      <Button variant="contained" sx={{float: 'right', marginTop: '10px'}} disabled={selectedChart == undefined} onClick={() => selectApp()}>
          Select App
      </Button>
    </Container>
  );

}