import { useReducer, useCallback } from 'react';

function apiReducer(state, action) {
  switch (action.type) {
    case 'SET_APIS':
      return { ...state, apis: action.payload };
    case 'SET_SELECTED':
      return { ...state, selectedApi: action.payload };
    case 'CLEAR_SELECTED':
      return { ...state, selectedApi: {} };
    case 'SET_APIS_WITH_SELECTION':
      const { apis, selectedId } = action.payload;
      const selected = selectedId ? apis.find(api => api.ID === selectedId) : null;
      return {
        apis,
        selectedApi: selected || state.selectedApi
      };
    default:
      return state;
  }
}

function useApis() {
  const [state, dispatch] = useReducer(apiReducer, {
    apis: [],
    selectedApi: {}
  });

  const setApis = useCallback((apis) => {
    dispatch({ type: 'SET_APIS', payload: apis });
  }, []);

  const setSelectedApi = useCallback((api) => {
    dispatch({ type: 'SET_SELECTED', payload: api });
  }, []);

  const clearSelectedApi = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED' });
  }, []);

  // Atomic update of both APIs and selection
  const setApisWithSelection = useCallback((apis, selectedId) => {
    dispatch({ type: 'SET_APIS_WITH_SELECTION', payload: { apis, selectedId } });
  }, []);

  return {
    apis: state.apis,
    selectedApi: state.selectedApi,
    setApis,
    setSelectedApi,
    clearSelectedApi,
    setApisWithSelection
  };
}
export default useApis;
