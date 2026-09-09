const ACCESS_TOKEN_KEY = 'stoker:access_token';
const REFRESH_TOKEN_KEY = 'stoker:refresh_token';
const ACTIVE_STOCK_KEY = 'stoker:active_stock_id';

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken, refreshToken) {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getStoredActiveStockId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_STOCK_KEY);
}

export function setStoredActiveStockId(stockId) {
  if (typeof window === 'undefined') return;
  if (stockId) {
    localStorage.setItem(ACTIVE_STOCK_KEY, stockId);
  } else {
    localStorage.removeItem(ACTIVE_STOCK_KEY);
  }
}

