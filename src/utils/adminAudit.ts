export type AuditLogEntry = {
  id: string
  timestamp: string
  section: string
  action: string
  details?: string
}

export const getAuditLog = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem('estar_admin_audit')
    if (!raw) return []
    const data = JSON.parse(raw)
    if (Array.isArray(data)) return data
    return []
  } catch {
    return []
  }
}

export const saveAuditLog = (log: AuditLogEntry[]) => {
  try { localStorage.setItem('estar_admin_audit', JSON.stringify(log)) } catch {}
}

export const logAdminAction = (section: string, action: string, details?: any) => {
  try {
    const log = getAuditLog()
    const entry: AuditLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      section,
      action,
      details: details ? JSON.stringify(details) : undefined,
    }
    log.unshift(entry)
    saveAuditLog(log)
  } catch {
    // ignore
  }
}

export const clearAuditLog = () => {
  try { localStorage.removeItem('estar_admin_audit') } catch {}
}
