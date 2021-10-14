import { Card, CardActionArea, CardContent, Divider, Grid, Paper, Typography } from '@mui/material';
import * as React from 'react';
import appGWLogo from '../../logos/appGW_ingress.png';
import apisixLogo from '../../logos/apisix_Logo.svg';
import kongLogo from '../../logos/kong_icon.png';
import nginxLogo from '../../logos/nginx_Ingress.png';
import osmLogo from '../../logos/smi.png';
import kumaLogo from '../../logos/Kuma.jpg';
import istioLogo from '../../logos/istio.png';
import linkerd from '../../logos/linkerd.png';
import { AppState, BaseDisplayState } from '../../models/types';


const ingressProviders = [
  {
    logo: nginxLogo,
    text: "NGINX"
  },
  {
    logo: appGWLogo,
    text: "Application Gateway"
  },
  {
    logo: apisixLogo,
    text: "APISIX"
  },
  {
    logo: kongLogo,
    text: "KONG"
  }
];

const serviceMeshProviders = [
  {
    logo: osmLogo,
    text: "Open Service Mesh"
  },
  {
    logo: istioLogo,
    text: "Istio"
  },
  {
    logo: linkerd,
    text: "Linkerd"
  },
  {
    logo: kumaLogo,
    text: "Kuma"
  }
];


export default function ExtensionsCard(
  props: {
    appState: AppState,
    setAppState: (appState: AppState) => void
  }) {
  const { appState, setAppState } = props;

  const selectIngress = () => {
    setAppState({
      ...appState, baseDisplayState: BaseDisplayState.INGRESS_DISPLAY
    })
  }

  const selectServiceMeshIngress = () => {
    setAppState({
      ...appState, baseDisplayState: BaseDisplayState.SERVICEMESH_DISPLAY
    })
  }

  return (
    <Grid sx={{
      flexGrow: 1
    }} container spacing={2}>
      <Typography
        variant="h5"
        align="center"
        color="text.secondary"
        sx={{
          width: '100%',
          margin: 'auto'
        }}
        paragraph
      >
        Choose an Ingress Controller/LoadBalancer Provider
      </Typography>
      <Grid item xs={12}>
        <Grid container justifyContent="center" spacing={2}>
          {
            ingressProviders.map((info, idx) => {
              return (
                <Grid item key={idx}>
                  <Card sx={{
                    height: 200, width: 150
                  }} onClick={selectIngress}>
                    <CardActionArea sx={{
                      height: '100%'
                    }}>
                      <CardContent>
                        <img
                          src={info.logo}
                          style={{
                            width: '100%',
                            padding: '4px',
                            height: '118px',
                            display: 'block',
                          }}
                        />
                        <Typography
                          sx={{
                            width: '100%',
                            margin: 'auto',
                            display: 'block',
                            textAlign: 'center',
                          }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {info.text}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })
          }
        </Grid>
      </Grid>
      <Typography
        variant="h5"
        align="center"
        color="text.secondary"
        sx={{
          width: '100%',
          margin: 'auto',
          mt: '30px',
        }}
        paragraph
      >
        Choose a Service Mesh Provider
      </Typography>
      <Grid item xs={12}>
        <Grid container justifyContent="center" spacing={2}>
          {
            serviceMeshProviders.map((info, idx) => {
              return (
                <Grid item key={idx}>
                  <Card sx={{
                    height: 200, width: 150
                  }} onClick={selectServiceMeshIngress}>
                    <CardActionArea sx={{
                      height: '100%'
                    }}>
                      <CardContent>
                        <img
                          src={info.logo}
                          style={{
                            width: '100%',
                            padding: '4px',
                            height: '118px',
                            display: 'block',
                          }}
                        />
                        <Typography
                          sx={{
                            width: '100%',
                            margin: 'auto',
                            display: 'block',
                            textAlign: 'center',
                          }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {info.text}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })
          }
        </Grid>
      </Grid>

    </Grid>
  );
}