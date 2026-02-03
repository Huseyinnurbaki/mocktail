/* eslint-disable no-undef */
const BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '';

export const API_CORE_URL = `${BASE_URL}/core/v1`;

export const ALL_APIS = `${API_CORE_URL}/apis`;
export const SAVE_API = `${API_CORE_URL}/api`;
export const UPDATE_API = `${API_CORE_URL}/api`;
export const DELETE_API = `${API_CORE_URL}/api`;
export const IMPORT_API = `${API_CORE_URL}/import`;

// For internal API calls (dashboard → backend)
export const API_MOCKTAIL_URL = `${BASE_URL}/mocktail`;

// For display/copy purposes (what users see in dashboard)
// Can be overridden with MOCKTAIL_BASE_URL env var (or legacy REACT_APP_MOCKTAIL_URL)
const DISPLAY_BASE_URL = (process.env.MOCKTAIL_BASE_URL || process.env.REACT_APP_MOCKTAIL_URL) ?
                         (process.env.MOCKTAIL_BASE_URL || process.env.REACT_APP_MOCKTAIL_URL).replace(/\/mocktail\/?$/, '') :
                         (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : window.location.origin);

export const PUBLIC_MOCKTAIL_URL = `${DISPLAY_BASE_URL}/mocktail`;

export const GITHUB_RELEASES = 'https://api.github.com/repos/Huseyinnurbaki/mocktail/releases';
