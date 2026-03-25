/**
 * 模拟 GDPR 要求的操作审计日志
 * 在实际研究原型中，这里可以扩展为将日志发送到安全的后端或本地数据库
 */
export const auditLog = (message: string) => {
  const timestamp = new Date().toISOString();
  // 在终端打印日志，方便演示
  console.log(`[GDPR AUDIT LOG] ${timestamp}: ${message}`);
};