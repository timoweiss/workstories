const http = require("http");
const os = require("os");
const path = require("path");
const url = require("url");

const electron = require("electron");
const uuid = require("uuid/v4");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const systemPreferences = electron.systemPreferences

const isDev = require("electron-is-dev");

const { promises: fs, createWriteStream, createReadStream } = require("fs");

const videoPath = isDev
  ? path.resolve("./dev-movies")
  : electron.app.getPath("videos");
const appDataPath = isDev
  ? path.resolve("./app-data")
  : electron.app.getPath("userData");
const videoDirectory = path.join(videoPath, "workstories");
const videoLogFile = path.join(appDataPath, "workstories.json");

const trayIconPath = path.join(__dirname, "./img/Template.png");

function createRandomVideoFilePath() {
  const id = uuid();

  return {
    path: path.join(videoDirectory, id + ".webm"),
    fileName: id + ".webm"
  };
}

async function ensureDirectory(directoryPath) {
  try {
    await fs.access(directoryPath);
    console.log("dir exists", directoryPath);
  } catch (e) {
    await fs.mkdir(directoryPath, { recursive: true });
    console.log("created dir", directoryPath);
  }
}

async function ensureFile(filename) {
  try {
    await fs.readFile(filename);
  } catch (err) {
    await fs.writeFile(filename, JSON.stringify([]));
  }
}

const s = http.createServer(async (req, res) => {
  if (req.url && req.url.endsWith("/list")) {
    if (req.url.endsWith(".json")) {
      res.setHeader("content-type", "application/json");
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log({ videoLogFile });
    const file = await fs.readFile(videoLogFile, "utf-8");
    console.log({ file });
    res.write(file);
    res.end();
    return;
  }

  const videoFilePath = createRandomVideoFilePath();
  const stream = createWriteStream(videoFilePath.path);
  req.pipe(stream);
  const durationInMs = new url.URLSearchParams(url.parse(req.url).search).get(
    "duration"
  );
  req.on("end", async () => {
    stream.end();

    res.end("bla\n");

    const file = await fs.readFile(videoLogFile, "utf-8");
    const parsed = JSON.parse(file);
    console.log({ parsed });
    parsed.push({
      url: "http://localhost:3398/" + videoFilePath.fileName,
      created: Date.now(),
      duration: durationInMs / 1000
    });
    const p = JSON.stringify(parsed);
    console.log("new p", p);
    await fs.writeFile(videoLogFile, p);
  });
  console.log("req");
});
s.listen(3399, () => console.log("l 3399"));

const s2 = http.createServer(async (req, res) => {
  console.log(req.url, req.method);

  if (req.url && req.url.endsWith(".webm")) {
    // deliver video
    res.setHeader("content-type", "video/webm");

    const stream = createReadStream(path.join(videoDirectory, req.url));
    stream.pipe(res);
  }
});
s2.listen(3398, () => console.log("l 3398"));

function onOpen(fn) {
  return electron.globalShortcut.register("CmdOrCtrl+Shift+U", fn);
}
/**
 *
 * @param {BrowserWindow} window
 */
function updateWindowPosition(window) {
  const { screen } = electron;
  const { workArea } = screen.getDisplayNearestPoint(
    screen.getCursorScreenPoint()
  );
  const windowSize = window.getSize();
  const trayCenter = workArea.width / 2;
  const horizontalPosition = trayCenter - windowSize[0] / 2;
  const verticalPosition = workArea.y + 5;
  window.center();
  // window.setPosition(horizontalPosition, verticalPosition);
}

function toggleWindow(window) {
  console.log("toggle");
  if (window == null) {
    window = createWindow();
  }
  if (window.isVisible()) {
    console.log("toggle hide");
    window.hide();
  } else {
    updateWindowPosition(window);
    window.show();
    console.log("toggle show");
  }
}

function createWindow() {
  ensureDirectory(videoDirectory);
  ensureDirectory(appDataPath);
  ensureFile(videoLogFile);
  console.log("create w");
  let mainWindow = new BrowserWindow({
    show: false,
    width: 354,
    height: 629,
    fullscreenable: false,
    titleBarStyle: "customButtonsOnHover",
    transparent: true,
    frame: false,

    webPreferences: {
      backgroundThrottling: true,
      devTools: true
    }
  });

  mainWindow.on("moved", arg => {
    console.log("moved", arg.sender.getBounds());
  });

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  mainWindow.on("closed", () => {
    console.log("on closed");
    mainWindow = null;
  });

  mainWindow.on("hide", () => {
    console.log("on closed");
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.on("blur", () => mainWindow.hide());

  const tray = new Tray(trayIconPath);

  tray.setToolTip("Create your workstory");

  tray.on("right-click", () => {
    console.log("right-click");
  });

  tray.on("click", () => toggleWindow(mainWindow));
  return { tray, window: mainWindow };
}

app.on("ready", async () => {
  const cameraGranted = await systemPreferences.askForMediaAccess('camera')
  const microphoneGranted = await systemPreferences.askForMediaAccess('microphone')
  console.log({cameraGranted, microphoneGranted})

  if(!cameraGranted || !microphoneGranted) {
    electron.dialog.showErrorBox(
      'Missing permissions',
      'This app needs to access both microphone and camera to work properly as intended'
    )
    process.exit(1)
  }

  systemPreferences.postNotification('notification', {test: 'hello'}, true)
  BrowserWindow.addDevToolsExtension(
    path.join(
      os.homedir(),
      "/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.2.1_0"
    )
  );
  const { window, tray } = createWindow();

  updateWindowPosition(window);

  // keeping the trey referenced here so that it does not get garbage collected
  onOpen(() => toggleWindow(window, tray));
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
