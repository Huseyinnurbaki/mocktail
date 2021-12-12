import { useState } from 'react';
function useApis() {
  const [apis, setApis] = useState([]);
  const [selectedApi, setSelectedApi] = useState({});

  function clearSelectedApi() {
    setSelectedApi({});
  }

  return { apis, setApis, selectedApi, setSelectedApi, clearSelectedApi };
}
export default useApis;
