import { SerialPort } from 'serialport'

export type ComPortInfo = {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  vendorId?: string
  productId?: string
  friendlyName?: string
}

type SerialPortListItem = Awaited<ReturnType<typeof SerialPort.list>>[number]

export async function listComPorts(): Promise<ComPortInfo[]> {
  const ports = await SerialPort.list()
  return ports.map((p) => ({
    path: p.path,
    manufacturer: p.manufacturer,
    serialNumber: p.serialNumber,
    pnpId: p.pnpId,
    vendorId: p.vendorId,
    productId: p.productId,
    friendlyName: (p as SerialPortListItem & { friendlyName?: string }).friendlyName,
  }))
}

export async function testComPort(
  _portPath: string,
  _options?: { baudRate?: number; timeoutMs?: number },
): Promise<{ success: boolean; error?: string }> {
  return { 
    success: false, 
    error: 'Direct COM port testing via Electron is disabled for architectural compliance. Use API connection testing or the dashboard.' 
  }
}

