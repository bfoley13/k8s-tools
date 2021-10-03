import * as React from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import Base from './app/Base';

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Base />
  </ThemeProvider>,
  document.querySelector('#root'),
);
