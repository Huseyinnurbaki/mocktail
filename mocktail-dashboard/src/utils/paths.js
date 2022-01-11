/* eslint-disable no-undef */
const BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '';

const API_CORE_URL = `${BASE_URL}/core/v1`;

export const ALL_APIS = `${API_CORE_URL}/apis`;
export const SAVE_API = `${API_CORE_URL}/api`;
export const DELETE_API = `${API_CORE_URL}/api`;
export const IMPORT_API = `${API_CORE_URL}/import`;

export const API_MOCKTAIL_URL = `${BASE_URL}/mocktail`;

export const GITHUB_RELEASES = 'https://api.github.com/repos/Huseyinnurbaki/mocktail/releases';
