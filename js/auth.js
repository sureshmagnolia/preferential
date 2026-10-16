/**
 * Electoral Returning Officer Authentication Service
 * ===================================================
 * Guards the administrative, ballot box entry, and simulation control areas.
 */

const STORAGE_PWD_KEY = 'preferential_admin_pwd';
const SESSION_AUTH_KEY = 'preferential_admin_session';
const DEFAULT_PASSCODE = 'admin2026';

export class AuthService {
  constructor() {
    this.initPasscode();
  }

  initPasscode() {
    if (!localStorage.getItem(STORAGE_PWD_KEY)) {
      localStorage.setItem(STORAGE_PWD_KEY, DEFAULT_PASSCODE);
    }
  }

  getPasscode() {
    return localStorage.getItem(STORAGE_PWD_KEY) || DEFAULT_PASSCODE;
  }

  isAuthenticated() {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  }

  login(inputPasscode) {
    const valid = this.getPasscode();
    if (inputPasscode.trim() === valid.trim()) {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      return true;
    }
    return false;
  }

  logout() {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }

  changePasscode(currentPasscode, newPasscode) {
    if (currentPasscode.trim() !== this.getPasscode().trim()) {
      throw new Error("Current passcode does not match.");
    }
    if (!newPasscode || newPasscode.trim().length < 4) {
      throw new Error("New passcode must be at least 4 characters.");
    }
    localStorage.setItem(STORAGE_PWD_KEY, newPasscode.trim());
    return true;
  }

  resetPasscode() {
    localStorage.setItem(STORAGE_PWD_KEY, DEFAULT_PASSCODE);
  }
}
