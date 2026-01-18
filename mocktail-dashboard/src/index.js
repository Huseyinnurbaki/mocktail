import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Global, css } from '@emotion/react';
import App from './app.js';

const GlobalStyles = () => (
  <Global
    styles={css`
      html, body, #app, #app>div {
        height: 100%;
      }

      #root {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      html {
        scroll-behavior: smooth;
      }
    `}
  />
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <GlobalStyles />
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
