import { is } from '@electron-toolkit/utils'
import { fork } from 'child_process'
import { app, BrowserWindow, ipcMain } from 'electron'
import { getPort } from 'get-port-please'
import { startServer } from 'next/dist/server/lib/start-server'
import path, { join } from 'path'
import fs from 'fs'

const logFilePath = path.join(process.resourcesPath, 'app.log')
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' })

const logToFile = (message: string) => {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`
  console.log(logMessage)
  logStream.write(logMessage)
}

const dbPath = path.join(process.resourcesPath, 'data/database.db')
logToFile(`caminho do banco: ${dbPath}`)

process.env.DATABASE_URL = `file:${dbPath}`

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  const loadURL = async () => {
    if (is.dev) {
      mainWindow.loadURL('http://localhost:3000')
    } else {
      try {
        const port = await startNextJSServer()
        console.log('Next.js server started on port:', port)
        mainWindow.loadURL(`http://localhost:${port}`)
      } catch (error) {
        console.error('Error starting Next.js server:', error)
      }
    }
  }

  loadURL()
  return mainWindow
}

const startNextJSServer = async () => {
  try {
    const nextJSPort = await getPort({ portRange: [30_011, 50_000] })
    const webDir = join(app.getAppPath(), 'app')

    await startServer({
      dir: webDir,
      isDev: false,
      hostname: 'localhost',
      port: nextJSPort,
      customServer: true,
      allowRetry: false,
      keepAliveTimeout: 5000,
      minimalMode: true,
    })

    return nextJSPort
  } catch (error) {
    console.error('Error starting Next.js server:', error)
    throw error
  }
}

const startBackend = () => {
  // const backendPath = path.join(__dirname, '../../server/dist/main.js')
  const backendPath = join(
    process.resourcesPath,
    'app.asar/server/dist/main.js',
  )
  logToFile(`Starting backend from: ${backendPath}`)

  const backendProcess = fork(backendPath, {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  })

  logToFile(`Backend PID: ${backendProcess.pid}`)

  backendProcess.on('error', (err) => {
    console.error(`Erro ao iniciar o backend: ${err.message}`)
  })

  backendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Processo do backend finalizado com código: ${code}`)
    }
  })

  backendProcess.stdout?.on('data', (data) => {
    console.log(`Backend output: ${data}`)
  })

  backendProcess.stderr?.on('data', (data) => {
    console.error(`Backend error output: ${data}`)
  })

  setInterval(() => {
    if (backendProcess.connected) {
      logToFile('Backend process is still running')
    } else {
      logToFile('Backend process has stopped')
    }
  }, 5000)
}

app.whenReady().then(() => {
  createWindow()
  startBackend()

  ipcMain.on('ping', () => console.log('pong'))
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
