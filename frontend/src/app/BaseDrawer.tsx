import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MuiDrawer from '@mui/material/Drawer';
import { Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { DeviceHub, Extension, GitHub } from '@mui/icons-material';
import { AppState, BaseDisplayState, HomeDisplay } from '../models/types';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open'
})(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

export default function BaseDrawer(props: { open: boolean, toggleDrawer(): void, setAppState(state: AppState): void, appState: AppState }) {
  const { open, toggleDrawer, setAppState, appState } = props;

  const handleNavClick = (displayState: HomeDisplay, baseDisplay: BaseDisplayState) => {
    setAppState({
      ...appState, homeDisplay: displayState, baseDisplayState: baseDisplay
    });
  };

  return (
    <Drawer variant="permanent" open={open}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
        }}
      >
        <IconButton onClick={toggleDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => handleNavClick(HomeDisplay.REPO_SELECT, BaseDisplayState.REPO_SELECT)}>
          <ListItemIcon>
            <GitHub />
          </ListItemIcon>
          <ListItemText primary="Repository Select" />
        </ListItem>
        <ListItem button onClick={() => handleNavClick(HomeDisplay.APP_EXTENSIONS, BaseDisplayState.EXTENSION_DISPLAY)}>
          <ListItemIcon>
            <Extension />
          </ListItemIcon>
          <ListItemText primary="App Extensions" />
        </ListItem>
        <ListItem button onClick={() => handleNavClick(HomeDisplay.APP_PIPELINES, BaseDisplayState.HOME)}>
          <ListItemIcon>
            <DeviceHub />
          </ListItemIcon>
          <ListItemText primary="Repo Pipelines" />
        </ListItem>
      </List>
    </Drawer>
  );
}