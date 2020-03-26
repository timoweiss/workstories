const http = require("http");
const os = require("os");
const path = require("path");
const url = require("url");

const electron = require("electron");
const uuid = require("uuid/v4");
const log = require("electron-log");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const systemPreferences = electron.systemPreferences;

const isDev = require("electron-is-dev");

const { promises: fs, createWriteStream, createReadStream } = require("fs");
try {
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
      log.info("dir exists", directoryPath);
    } catch (e) {
      await fs.mkdir(directoryPath, { recursive: true });
      log.info("created dir", directoryPath);
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
      log.info({ videoLogFile });
      const file = await fs.readFile(videoLogFile, "utf-8");
      log.info({ file });
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
      log.info({ parsed });
      parsed.push({
        url: "http://localhost:3398/" + videoFilePath.fileName,
        created: Date.now(),
        duration: durationInMs / 1000
      });
      const p = JSON.stringify(parsed);
      log.info("new p", p);
      await fs.writeFile(videoLogFile, p);
    });
    log.info("req");
  });
  s.listen(3399, () => log.info("l 3399"));

  const s2 = http.createServer(async (req, res) => {
    log.info(req.url, req.method);

    if (req.url && req.url.endsWith(".webm")) {
      // deliver video
      res.setHeader("content-type", "video/webm");

      const stream = createReadStream(path.join(videoDirectory, req.url));
      stream.pipe(res);
    }
  });
  s2.listen(3398, () => log.info("l 3398"));

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
    log.info("toggle");
    if (window == null) {
      window = createWindow();
    }
    if (window.isVisible()) {
      log.info("toggle hide");
      window.hide();
    } else {
      updateWindowPosition(window);
      window.show();
      log.info("toggle show");
    }
  }

  function createWindow() {
    ensureDirectory(videoDirectory);
    ensureDirectory(appDataPath);
    ensureFile(videoLogFile);
    log.info("create w");
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
      , icon: path.join(__dirname, "./main/img/AppIcon.icns")
    });

    mainWindow.on("moved", arg => {
      log.silly("moved", arg.sender.getBounds());
    });

    mainWindow.loadURL(
      isDev
        ? "http://localhost:3000"
        : `file://${path.join(__dirname, "../build/index.html")}`
    );

    mainWindow.on("closed", () => {
      log.info("on closed");
      mainWindow = null;
    });

    mainWindow.on("hide", () => {
      log.info("on closed");
    });

    mainWindow.once("ready-to-show", () => mainWindow.show());

    mainWindow.on("blur", () => mainWindow.hide());

    const tray = new Tray(trayIconPath);

    tray.setToolTip("Create your workstory");

    tray.on("right-click", () => {
      log.info("right-click");
    });

    tray.on("click", () => toggleWindow(mainWindow));
    return { tray, window: mainWindow };
  }

  app.on("ready", async () => {
    log.info("Workstories started", new Date());
    const cameraGranted = await systemPreferences.askForMediaAccess("camera");
    const microphoneGranted = await systemPreferences.askForMediaAccess(
      "microphone"
    );
    log.info({ cameraGranted, microphoneGranted });

    if (!cameraGranted || !microphoneGranted) {
      electron.dialog.showErrorBox(
        "Missing permissions",
        "This app needs to access both microphone and camera to work properly as intended"
      );
      process.exit(1);
    }

    systemPreferences.postNotification("notification", { test: "hello" }, true);
    if (isDev) {
      BrowserWindow.addDevToolsExtension(
        path.join(
          os.homedir(),
          "/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.2.1_0"
        )
      );
    }

    const { window, tray } = createWindow();

    updateWindowPosition(window);

    // keeping the trey referenced here so that it does not get garbage collected
    onOpen(() => toggleWindow(window, tray));
  });

  app.on("window-all-closed", () => {
    log.info("Workstories window-all-closed", new Date());

    if (process.platform !== "darwin") {
      app.quit();
    }
  });
} catch (error) {
  log.error("global error thrown");
  log.debug(error);
}
