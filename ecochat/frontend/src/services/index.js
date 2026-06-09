import api from "./api.js";

// Auth
export const registerUser = (data) => api.post("/users/register", data);
export const loginUser = (data) => api.post("/users/login", data);
export const logoutUser = () => api.post("/users/logout");
export const getCurrentUser = () => api.get("/users/current-user");
export const updateProfile = (data) => api.patch("/users/update-profile", data);
export const changePassword = (data) => api.post("/users/change-password", data);
export const searchUsers = (q) => api.get(`/users/search?q=${q}`);

// Messages
export const getConversations = () => api.get("/messages/conversations");
export const getDMMessages = (userId, page = 1) => api.get(`/messages/dm/${userId}?page=${page}`);
export const sendMessage = (data) => api.post("/messages/send", data);
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);
export const markAsRead = (senderId) => api.patch(`/messages/read/${senderId}`);

// Groups
export const createGroup = (data) => api.post("/groups", data);
export const getUserGroups = () => api.get("/groups");
export const getGroupById = (id) => api.get(`/groups/${id}`);
export const getGroupMessages = (id, page = 1) => api.get(`/groups/${id}/messages?page=${page}`);
export const sendGroupMessage = (id, data) => api.post(`/groups/${id}/messages`, data);
export const updateGroup = (id, data) => api.patch(`/groups/${id}`, data);
export const addMembers = (id, data) => api.post(`/groups/${id}/members`, data);
export const removeMember = (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`);
export const leaveGroup = (id) => api.delete(`/groups/${id}/leave`);

// Notifications
export const getNotifications = () => api.get("/notifications");
export const markAllRead = () => api.patch("/notifications/read-all");
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
