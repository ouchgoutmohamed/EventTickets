import { userClient as axiosInstance } from '../../../api/axiosClients';

const userService = {
  // Get all users (admin only) with pagination and filters
  getAllUsers: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(filters.etat && { etat: filters.etat }),
      ...(filters.roleId && { roleId: filters.roleId }),
      ...(filters.search && { search: filters.search }),
    });

    const response = await axiosInstance.get(`/users?${params}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await axiosInstance.put('/users/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    const response = await axiosInstance.put('/users/password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Admin: Activate/Enable user
  activateUser: async (userId) => {
    const response = await axiosInstance.put(`/users/${userId}/enable`);
    return response.data;
  },

  // Admin: Disable/Deactivate user
  deactivateUser: async (userId) => {
    const response = await axiosInstance.put(`/users/${userId}/disable`);
    return response.data;
  },

  // Admin: Suspend user (alias for disable)
  suspendUser: async (userId) => {
    const response = await axiosInstance.put(`/users/${userId}/disable`);
    return response.data;
  },

  // Admin: Delete user
  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/users/${userId}`);
    return response.data;
  },

  // Admin: Assign role to user
  assignRole: async (userId, roleId) => {
    const response = await axiosInstance.put(`/users/${userId}/role`, {
      roleId,
    });
    return response.data;
  },

  // Admin: Get user login history
  getLoginHistory: async (userId) => {
    const response = await axiosInstance.get(`/users/${userId}/history`);
    return response.data;
  },
};

export default userService;
