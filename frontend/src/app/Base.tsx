import * as React from "react";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import {
  AppState,
  BaseDisplayState,
  emptyAppState,
  HomeDisplay,
} from "../models/types";
import {
  Badge,
  Box,
  Button,
  Container,
  CssBaseline,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import MenuIcon from "@mui/icons-material/Menu";
import ExtensionsCard from "./extensions/ExtensionsCard";
import IngressWorkflow from "./extensions/workflow/ingress/IngressWorkflow";
import BaseDrawer from "./BaseDrawer";
import { AccountCircle, OpenInBrowser } from "@mui/icons-material";
import AppSelect from "./repo_select/AppSelect";
import GithubActionWorkflow from "./extensions/workflow/githubAction/GithubActionWorkflow";

const theme = createTheme();
const drawerWidth: number = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export default function Base(props: {}) {
  const {} = props;
  const [appState, setAppState] = React.useState<AppState>({
    ...emptyAppState(),
    ghUserName: "OliverMKing",
  });
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const [open, setOpen] = React.useState<boolean>(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleAccountClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleAccountClose = (displayState: BaseDisplayState) => {
    setAppState({
      ...appState,
      baseDisplayState: displayState,
      homeDisplay: HomeDisplay.REPO_SELECT,
    });
    setMenuAnchor(null);
  };

  const selectRepos = () => {
    console.log("repo being selected");
    setAppState({
      ...appState,
      baseDisplayState: BaseDisplayState.REPO_SELECT,
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: "24px", // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              k8s-tooling
            </Typography>
            <IconButton color="inherit">
              <Badge
                color="secondary"
                id="account-circle"
                aria-controls="account-menu"
                aria-haspopup="true"
                aria-expanded={menuOpen ? "true" : undefined}
                onClick={handleAccountClick}
              >
                <AccountCircle />
              </Badge>
              <Menu
                id="account-menu"
                anchorEl={menuAnchor}
                open={menuOpen}
                onClose={handleAccountClose}
                MenuListProps={{
                  "aria-labelledby": "account-circle",
                }}
              >
                {appState.repo.name != "" && (
                  <MenuItem
                    onClick={() =>
                      handleAccountClose(BaseDisplayState.REPO_SELECT)
                    }
                  >
                    Repository: {appState.repo.name}
                  </MenuItem>
                )}
                {appState.branch.name != "" && (
                  <MenuItem
                    onClick={() =>
                      handleAccountClose(BaseDisplayState.BRANCH_SELECT)
                    }
                  >
                    Branch: {appState.branch.name}
                  </MenuItem>
                )}
              </Menu>
            </IconButton>
          </Toolbar>
        </AppBar>
        <BaseDrawer
          setAppState={setAppState}
          appState={appState}
          open={open}
          toggleDrawer={toggleDrawer}
        />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
            {appState.baseDisplayState == BaseDisplayState.HOME && (
              <div>
                <Typography
                  component="h1"
                  variant="h2"
                  align="center"
                  color="text.primary"
                  gutterBottom
                >
                  App Extension Helper
                </Typography>
                <Typography
                  variant="h5"
                  align="center"
                  color="text.secondary"
                  paragraph
                >
                  Connect to your GitHub accont to explore how you can extend
                  your k8s application!
                </Typography>
                <Stack
                  sx={{ pt: 4 }}
                  direction="row"
                  spacing={2}
                  justifyContent="center"
                >
                  <Button variant="contained" onClick={selectRepos}>
                    Connect to GitHub
                  </Button>
                </Stack>
              </div>
            )}
            {appState.baseDisplayState == BaseDisplayState.REPO_SELECT && (
              <AppSelect appState={appState} setAppState={setAppState} />
            )}
            {appState.baseDisplayState ==
              BaseDisplayState.EXTENSION_DISPLAY && (
              <ExtensionsCard appState={appState} setAppState={setAppState} />
            )}
            {appState.baseDisplayState == BaseDisplayState.INGRESS_DISPLAY && (
              <IngressWorkflow appState={appState} setAppState={setAppState} />
            )}
            {appState.baseDisplayState ==
              BaseDisplayState.GITHUB_ACTION_DISPLAY && (
              <GithubActionWorkflow
                appState={appState}
                setAppState={setAppState}
              />
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
