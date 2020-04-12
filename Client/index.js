// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain, dialog, globalShortcut } = require('electron')
const fs = require('fs')
const request = require('request')
const path = require('path')
const sha1 = require('sha1')
const zlib = require('zlib')

///License Check
try {
  var LicenseFile = fs.readFileSync('./License.key')
}
catch (err) {
  dialog.showErrorBox("License Check ", 'License.key file Not Found')
  return
}

try {
  buffer = zlib.unzipSync(LicenseFile)
}
catch (err) {
  dialog.showErrorBox("License Check ", 'License.key file is polluted')
  return
}

var License = JSON.parse(buffer.toString())
var key = License.key
delete License.key
if (key == sha1(JSON.stringify(License))) {
  var configs = License
}
else {
  dialog.showErrorBox("License Check ", 'License.key file is Not Valid')
  return
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

var mainWindow
var childWindow = null
function openChild(url, size = undefined) {
  try {
    childWindow.close()
  }
  catch{

  }
  childWindow = new BrowserWindow(
    {
      webPreferences: {
        nodeIntegration: false,
        preload: './htmldiff.js'
      },
      parent: mainWindow,
      modal: false,
      show: false
    })
  childWindow.setMenu(null)
  childWindow.removeMenu()
  childWindow.setTitle('Review ')
  childWindow.webContents.openDevTools()
  //childWindow.loadURL('data:text/html;charset=utf-8,<html>' + msg + '</html>')
  childWindow.loadURL(configs.URL + url)
  childWindow.once('ready-to-show', () => {
    if (size !== undefined) {
      childWindow.setSize(size.width, size.height)
    }
    childWindow.show()
  })

}
var SelectedDoc = []
var menuHOME = { label: 'Home', accelerator: 'CmdOrCtrl+H', click(item, focusedWindow) { mainWindow.webContents.send('Home', '') } }
var menuLogout = { label: 'LogOut', click(item, focusedWindow) { mainWindow.setMenu(null); mainWindow.loadURL(configs.URL + '') /* mainWindow.webContents.send('LogOut', ''); */ } }

var menuFilter = {
  label: 'Filter', submenu: [
    { label: 'All Item', click(item, focusedWindow) { mainWindow.webContents.send('Filter', 'All') } },
    { label: 'Requirement Only', click(item, focusedWindow) { mainWindow.webContents.send('Filter', 'Requirement Only') } },
    { label: 'Document Only', click(item, focusedWindow) { mainWindow.webContents.send('Filter', 'Document Only') } }
  ]
}
var menuExport = {
  label: 'Export', submenu: [
    { label: 'Export Docx', accelerator: 'CmdOrCtrl+D', click(item, focusedWindow) { mainWindow.webContents.send('Export', 'docx') } },
    { label: 'Export Xlsx', accelerator: 'CmdOrCtrl+X', click(item, focusedWindow) { mainWindow.webContents.send('Export', 'xlsx') } },
    { label: 'Export ROF', click(item, focusedWindow) { mainWindow.webContents.send('Export', 'rof') } }
  ]
}
var menuImport = {
  label: 'Import', submenu: [
    { label: 'Import Interface', click(item, focusedWindow) { dialog.showOpenDialog(mainWindow, options = { filters: [{ name: 'xlsx', extentions: ['xls_', 'xlsx_'] }] }, function (filenames) { if (filenames !== undefined && filenames[0] !== undefined) { Import(filenames[0],"INTERFACE") } }) } },
    { label: 'Import Template', click(item, focusedWindow) { dialog.showOpenDialog(mainWindow, options = { filters: [{ name: 'xlsx', extentions: ['xls_', 'xlsx_'] }] }, function (filenames) { if (filenames !== undefined && filenames[0] !== undefined) { Import(filenames[0],"TEMPLATE") } }) } }
  ]
}
var menuSetting = {
  label: 'Settings', submenu: [
    { label: 'Items', click(item, focusedWindow) { Menu.setApplicationMenu(Menu.buildFromTemplate([menuSetting, menuLogout])); mainWindow.loadURL(configs.URL + 'Configuration') } },
    { label: 'Users', click(item, focusedWindow) { Menu.setApplicationMenu(Menu.buildFromTemplate([menuSetting, menuLogout])); mainWindow.loadURL(configs.URL + 'Users') } },
    { label: 'Log', click(item, focusedWindow) { Menu.setApplicationMenu(Menu.buildFromTemplate([menuSetting, menuLogout])); mainWindow.loadURL(configs.URL + 'Log') } },
    { label: 'MileStone', click(item, focusedWindow) { Menu.setApplicationMenu(Menu.buildFromTemplate([menuSetting, menuLogout])); openChild('/MileStone') } }
  ]
}
var menuMode = {
  label: 'Mode', submenu: [
    { label: 'Review', accelerator: 'CmdOrCtrl+R', click(item, focusedWindow) { mainWindow.webContents.send('Mode', 'VIEW'); Menu.setApplicationMenu(Menu.buildFromTemplate([menuHOME, menuDocuments, menuMode, menuFilter, menuExport, menuLogout])) } },
    { label: 'Edit', accelerator: 'CmdOrCtrl+E', click(item, focusedWindow) { mainWindow.webContents.send('Mode', 'EDIT'); Menu.setApplicationMenu(Menu.buildFromTemplate([menuHOME, menuDocuments, menuMode, menuFilter, menuExport, menuImport, menuLogout])) } },
    { label: 'Link', accelerator: 'CmdOrCtrl+T', click(item, focusedWindow) { mainWindow.webContents.send('Mode', 'LINK'); Menu.setApplicationMenu(Menu.buildFromTemplate([menuHOME, menuDocuments, menuMode, menuExport, menuLogout])) } },
    { label: 'Search', accelerator: 'CmdOrCtrl+S', click(item, focusedWindow) { mainWindow.webContents.send('Mode', 'SEARCH'); Menu.setApplicationMenu(Menu.buildFromTemplate([menuHOME, menuDocuments, menuMode, menuExport, menuLogout])) } },
    { label: 'Review Confirm', accelerator: 'CmdOrCtrl+I', click(item, focusedWindow) { openChild("reviewconfirm?document=" + SelectedDoc[0] + "&component=" + SelectedDoc[1], { width: 950, height: 820 }) } }
  ]
}
var menuHelp = { label: 'Help', click(item, focusedWindow) { Menu.setApplicationMenu(Menu.buildFromTemplate([menuHOME, menuDocuments, menuMode, menuExport, menuLogout])); openChild('/Help') } }


var milestone
var menuDocuments = {}
var privilige = false
ipcMain.on('Login', (event, arg) => {
  milestone = arg[2]
  privilige = arg[1]
  var SRS = []
  var SDD = []
  var STD = []
  var STR = []
  for (let csci in arg[0]) {
    SRS.push({ label: arg[0][csci][0], click(item, focusedWindow) { mainWindow.webContents.send('SelectDoc', [1, Number(csci)]) } })
    SDD.push({ label: arg[0][csci][0], click(item, focusedWindow) { mainWindow.webContents.send('SelectDoc', [2, Number(csci)]) } })
    STD.push({ label: arg[0][csci][0], click(item, focusedWindow) { mainWindow.webContents.send('SelectDoc', [3, Number(csci)]) } })
    STR.push({ label: arg[0][csci][0], click(item, focusedWindow) { mainWindow.webContents.send('SelectDoc', [4, Number(csci)]) } })
  }
  menuDocuments = {
    label: 'Documents',
    submenu: [
      { label: 'SSS', click(item, focusedWindow) { mainWindow.webContents.send('SelectDoc', [0, 0]) } },
      { label: 'SRS', submenu: SRS },
      { label: 'SDD', submenu: SDD },
      { label: 'STD', submenu: STD },
      { label: 'STR', submenu: STR }
    ]
  }
  var menus = [menuDocuments, menuLogout, menuHelp]
  if (privilige === 'Manager') {
    menus = [menuDocuments, menuSetting, menuLogout, menuHelp]
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus))
})
ipcMain.on('Diff', (event, arg) => {
  console.log("Diff" + "?" + "itemid=" + arg)
  openChild("Diff" + "?" + "itemid=" + arg)
})
ipcMain.on('Review', (event, arg) => {
  console.log("review" + "?" + "itemid=" + arg)
  openChild("review" + "?" + "itemid=" + arg)
})




ipcMain.on('Alert', (event, arg) => {
  if (arg.includes('[ShutDown]')) {
    mainWindow.close()
  } else { openChild(arg) }
})
ipcMain.on('SelectDoc', (event, arg) => {
  SelectedDoc = arg
  console.log(arg)
  var menus = [menuHOME, menuDocuments, menuMode, menuFilter, menuExport, menuLogout, menuHelp]
  if (privilige === 'Manager') { menus = [menuHOME, menuDocuments, menuMode, menuFilter, menuExport, menuImport, menuSetting, menuLogout, menuHelp] }

  if (milestone !== 'current') {
    var index = menus.indexOf(menuImport)
    menus.splice(index, 1)
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus))
})

function Import(filename, type) {
  if (filename !== undefined) {
    fs.createReadStream(filename).pipe(
      request.post(configs.URL.replace('https', 'http').replace(":444", "") + 'Import/'+type+'/' + SelectedDoc[0] + '/' + SelectedDoc[1])
        .on('response', function (response) {
          mainWindow.webContents.send('SelectDoc', SelectedDoc)
        })
    )
  }
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1200,
    // frame:false,
    webPreferences: {
      nodeIntegration: true,
    },
    icon: path.join(__dirname, 'assets/icons/ico2_96.png')
  })

  mainWindow.setMenu(null)
  mainWindow.webContents.on('did-finish-load', function () {
    mainWindow.show()
  })
  // mainWindow.once('ready-to-show', () => { mainWindow.show() })

  // and load the index.html of the app.
  mainWindow.loadURL(configs.URL + '')
  mainWindow.setTitle('Requirement Manager Client')
  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
  createWindow()
  /*globalShortcut.register('CmdOrCtrl+S', () => {
    console.log('CmdOrCtrl+S is pressed')
    mainWindow.webContents.send('SelectDoc', [1, Number(csci)]) 
  })*/
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.commandLine.appendSwitch('ignore-certificate-errors', 'true')
app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }

})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
