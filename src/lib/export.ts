export function downloadExcel(type: string, filters?: any) {
  const toast = (window as any).__toast
  const btn = document.activeElement as HTMLButtonElement
  if (btn) btn.disabled = true

  fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, filters }),
  })
    .then(res => {
      if (!res.ok) throw new Error()
      return res.blob()
    })
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    })
    .catch(() => toast?.error?.('Erreur d\'export'))
    .finally(() => { if (btn) btn.disabled = false })
}
