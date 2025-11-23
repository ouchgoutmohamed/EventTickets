import { userClient as axiosInstance } from '../../../api/axiosClients';

const roleService = {
  // Get all roles
  getAllRoles: async () => {
    const response = await axiosInstance.get('/roles');
    return response.data;
  },

  // Get role by ID
  getRoleById: async (roleId) => {
    const response = await axiosInstance.get(`/roles/${roleId}`);
    return response.data;
  },

  // Create new role (admin only)
  createRole: async (roleData) => {
    const response = await axiosInstance.post('/roles', roleData);
    return response.data;
  },

  // Update role (admin only)
  updateRole: async (roleId, roleData) => {
    const response = await axiosInstance.put(`/roles/${roleId}`, roleData);
    return response.data;
  },

  // Delete role (admin only)
  deleteRole: async (roleId) => {
    const response = await axiosInstance.delete(`/roles/${roleId}`);
    return response.data;
  },
};

export default roleService;
