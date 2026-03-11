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
  portPath: string,
  options?: { baudRate?: number; timeoutMs?: number },
): Promise<{ success: boolean; error?: string }> {
  const baudRate = options?.baudRate ?? 9600
  const timeoutMs = options?.timeoutMs ?? 1500

  return await new Promise((resolve) => {
    const port = new SerialPort({ path: portPath, baudRate, autoOpen: false })

    const done = (result: { success: boolean; error?: string }) => {
      try {
        if (port.isOpen) {
          port.close(() => resolve(result))
          return
        }
      } catch {
        // ignore
      }
      resolve(result)
    }

    const t = setTimeout(() => done({ success: false, error: `Timeout opening ${portPath}` }), timeoutMs)
    port.open((err) => {
      clearTimeout(t)
      if (err) return done({ success: false, error: err.message })
      return done({ success: true })
    })
  })
}

