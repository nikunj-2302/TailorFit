import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  req,
  action,
  module,
  recordId,
  description,
  prevValues = null,
  newValues = null,
}) => {
  try {
    const user = req?.user;
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress;

    await AuditLog.create({
      user: user?._id || null,
      userName: user?.name || 'System',
      userEmail: user?.email || '',
      userRole: user?.role || '',
      action,
      module,
      recordId: recordId ? String(recordId) : '',
      description,
      prevValues,
      newValues,
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
};
