
export const SecurityValidator = {
  validateUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
};

export const secureAuditLog = async (
  userId: string, 
  action: string, 
  details: any = {}, 
  success: boolean = true, 
  severity: string = 'low'
) => {
  console.log('🔐 Security audit:', { userId, action, details, success, severity });
  // In a real app, this would log to a security monitoring system
};
