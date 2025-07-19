import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface DashboardExportData {
  stats: any
  historyOrders: any[]
  pendingOrders: any[]
  completedOrders: any[]
  activeCustomersList: any[]
  barChartData: any[]
  lineChartData: any[]
  monthlyRevenueData: any[]
}

function toCSV(rows: any[], columns: string[]): string {
  const header = columns.join(',')
  const data = rows.map((row) =>
    columns.map((col) => JSON.stringify(row[col] ?? '')).join(','),
  )
  return [header, ...data].join('\r\n')
}

export async function exportDashboardPDFAndCSV(data: DashboardExportData) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Work Brew Café Dashboard Analytics', 14, 16)
  doc.setFontSize(12)
  doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 24)

  // Stats Table
  autoTable(doc, {
    startY: 30,
    head: [['Metric', 'Value']],
    body: [
      ['Total Sales', data.stats.totalSales],
      ['Active Customers', data.stats.activeCustomers],
      ['Pending Orders', data.stats.pendingOrders],
      ['Revenue', `₹${data.stats.revenue.toLocaleString()}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [255, 195, 0] },
  })

  // Orders Table
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Order ID', 'Customer', 'Status', 'Total', 'Date']],
    body: data.completedOrders.map((o: any) => [
      o.id,
      o.customerName,
      o.status,
      `₹${o.totalAmount?.toFixed(2) ?? '-'}`,
      o.createdAt ? new Date(o.createdAt).toLocaleString() : '-',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [255, 195, 0] },
    styles: { fontSize: 9 },
  })

  // Customers Table
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Customer', 'Orders', 'Total Spent', 'Last Order', 'Status']],
    body: data.activeCustomersList.map((c: any) => [
      c.name,
      c.orders,
      `₹${c.totalSpent?.toFixed(2) ?? '-'}`,
      c.lastOrder ? new Date(c.lastOrder).toLocaleString() : '-',
      c.status,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [255, 195, 0] },
    styles: { fontSize: 9 },
  })

  // Download PDF
  doc.save('dashboard-analytics.pdf')

  // CSV Export (Completed Orders)
  const csvColumns = [
    'id',
    'customerName',
    'status',
    'totalAmount',
    'createdAt',
  ]
  const csv = toCSV(data.completedOrders, csvColumns)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'orders-data.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
