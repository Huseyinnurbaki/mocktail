import { Box } from '@chakra-ui/react';
import Dashboad from './containers/Dashboard';
import Header from './components/Header';
import GithubCorner from 'react-github-corner';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <Box minH="100vh" bg="gray.50" fontFamily="Montserrat, sans-serif">
      <Toaster />
      <Header />
      <Dashboad />
      <GithubCorner direction="left" size={50} href="https://github.com/Huseyinnurbaki/mocktail" />
    </Box>
  );
}

export default App;
