import { useEffect } from 'react';
import Dashboad from './containers/Dashboard';
import Header from './components/Header';
import { ToastContainer, toast } from 'react-toastify';
import useToastify from "./hooks/useToastify"

import './styles/global.css';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const frenchToast = useToastify()

  useEffect(() => {
    frenchToast.toastProps && toast(frenchToast.toastProps);
    frenchToast.reset()
  }, [frenchToast, frenchToast.toastProps])
  return (
    <div>
      <ToastContainer />
      <Header />
      <Dashboad frenchToast={frenchToast} />
    </div>
  );
}

export default App;
