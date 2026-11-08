// Renewal Radar - Frontend API Module
// This module handles communication with the backend API and manages authentication

class RenewalRadarAPI {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.token = this.loadToken();
  }

  // Token management
  loadToken() {
    return localStorage.getItem('rr_token');
  }

  saveToken(token) {
    this.token = token;
    localStorage.setItem('rr_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('rr_token');
    localStorage.removeItem('rr_user');
    localStorage.removeItem('rr_selectedGym');
  }

  getAuthHeader() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  async makeRequest(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login.html';
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Authentication
  async signup(email, password, firstName, lastName = '') {
    const data = await this.makeRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName })
    });

    if (data.needsVerification) {
      // Store verification info for later
      localStorage.setItem('rr_verificationToken', data.verificationToken);
      localStorage.setItem('rr_verificationEmail', data.email);
    }

    if (data.token) {
      this.saveToken(data.token);
      localStorage.setItem('rr_user', JSON.stringify(data.user));
    }

    return data;
  }

  async verifyEmail(token) {
    const data = await this.makeRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });

    if (data.token) {
      this.saveToken(data.token);
      localStorage.setItem('rr_user', JSON.stringify(data.user));
      localStorage.removeItem('rr_verificationToken');
      localStorage.removeItem('rr_verificationEmail');
    }

    return data;
  }

  async login(email, password) {
    const data = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      this.saveToken(data.token);
      localStorage.setItem('rr_user', JSON.stringify(data.user));
    }

    return data;
  }

  async forgotPassword(email) {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, newPassword) {
    return this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me', { method: 'GET' });
  }

  async deleteAccount() {
    return this.makeRequest('/auth/me', { method: 'DELETE' });
  }

  // Gyms
  async createGym(name, location = '') {
    return this.makeRequest('/gyms', {
      method: 'POST',
      body: JSON.stringify({ name, location })
    });
  }

  async getGyms() {
    return this.makeRequest('/gyms', { method: 'GET' });
  }

  async getGym(gymId) {
    return this.makeRequest(`/gyms/${gymId}`, { method: 'GET' });
  }

  async updateGym(gymId, name, location = '') {
    return this.makeRequest(`/gyms/${gymId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, location })
    });
  }

  // Members
  async addMember(gymId, memberData) {
    return this.makeRequest(`/gyms/${gymId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData)
    });
  }

  async getMembers(gymId) {
    return this.makeRequest(`/gyms/${gymId}/members`, { method: 'GET' });
  }

  async getMember(gymId, memberId) {
    return this.makeRequest(`/gyms/${gymId}/members/${memberId}`, { method: 'GET' });
  }

  async updateMember(gymId, memberId, updates) {
    return this.makeRequest(`/gyms/${gymId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteMember(gymId, memberId) {
    return this.makeRequest(`/gyms/${gymId}/members/${memberId}`, {
      method: 'DELETE'
    });
  }

  async exportGymData(gymId) {
    return this.makeRequest(`/gyms/${gymId}/export`, { method: 'GET' });
  }
}

// Global API instance
const api = new RenewalRadarAPI();

// UI State management
class RenewalRadarUI {
  constructor() {
    this.isLoggedIn = !!api.token;
    this.user = JSON.parse(localStorage.getItem('rr_user') || 'null');
    this.selectedGymId = localStorage.getItem('rr_selectedGym');
    this.gyms = [];
    this.members = [];
  }

  async init() {
    if (this.isLoggedIn && this.selectedGymId) {
      await this.loadMembers();
    }
  }

  async logout() {
    api.clearToken();
    this.isLoggedIn = false;
    this.user = null;
    this.selectedGymId = null;
    window.location.href = '/login.html';
  }

  async loadGyms() {
    try {
      this.gyms = await api.getGyms();
      return this.gyms;
    } catch (err) {
      console.error('Error loading gyms:', err);
      throw err;
    }
  }

  async selectGym(gymId) {
    this.selectedGymId = gymId;
    localStorage.setItem('rr_selectedGym', gymId);
    await this.loadMembers();
  }

  async loadMembers() {
    if (!this.selectedGymId) return [];

    try {
      this.members = await api.getMembers(this.selectedGymId);
      return this.members;
    } catch (err) {
      console.error('Error loading members:', err);
      throw err;
    }
  }

  async createGym(name, location) {
    try {
      const gym = await api.createGym(name, location);
      this.gyms.push(gym);
      return gym;
    } catch (err) {
      console.error('Error creating gym:', err);
      throw err;
    }
  }

  async addMember(memberData) {
    if (!this.selectedGymId) throw new Error('No gym selected');

    try {
      const member = await api.addMember(this.selectedGymId, memberData);
      this.members.push(member);
      return member;
    } catch (err) {
      console.error('Error adding member:', err);
      throw err;
    }
  }

  async updateMember(memberId, updates) {
    if (!this.selectedGymId) throw new Error('No gym selected');

    try {
      const updated = await api.updateMember(this.selectedGymId, memberId, updates);
      const idx = this.members.findIndex(m => m.id === memberId);
      if (idx >= 0) this.members[idx] = updated;
      return updated;
    } catch (err) {
      console.error('Error updating member:', err);
      throw err;
    }
  }

  async deleteMember(memberId) {
    if (!this.selectedGymId) throw new Error('No gym selected');

    try {
      await api.deleteMember(this.selectedGymId, memberId);
      this.members = this.members.filter(m => m.id !== memberId);
    } catch (err) {
      console.error('Error deleting member:', err);
      throw err;
    }
  }
}

// Global UI instance
const ui = new RenewalRadarUI();
