import React from "react";
import "./App.css";

import useInterval from "@use-it/interval";
import { RecordView } from "./components/Video";
import { Stories } from "./components/Stories";
import { LoadingSpinner } from "./components/Loading";

const KeyboardHandler = ({
  onR,
  onS
}: {
  onR: () => void;
  onS: () => void;
}) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "KeyR") {
        e.preventDefault();
        onR();
      }
      if (e.code === "KeyP") {
        e.preventDefault();
        onS();
      }
    };
    document.addEventListener("keyup", handler, false);

    return () => document.removeEventListener("keyup", handler);
  });
  return null;
};

const App: React.FC = () => {
  const [showRecordingView, setShowRecordingView] = React.useState(true);
  const [showHelp, setShowHelp] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(
    document.visibilityState === "visible"
  );

  const [freezeImage, setFreezeImage] = React.useState(null as null | Blob);

  // this is a hack to recognize the visibility change of the page
  useInterval(() => {
    if ((document.visibilityState === "visible") !== isVisible)
      setIsVisible(document.visibilityState === "visible");
  }, 200);

  const i = freezeImage
    ? { backgroundImage: `url(${URL.createObjectURL(freezeImage)})` }
    : {};

  if (!isVisible) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App" style={{overflow: 'hidden'}}>
      <KeyboardHandler
        onR={() => setShowRecordingView(true)}
        onS={() => setShowRecordingView(false)}
      />
      {showRecordingView ? (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
          <div
            style={{
              ...i,
              transform: "scaleX(-1)",
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundPosition: "center center",
              filter: "grayscale(100%)",
              zIndex: 1
            }}
          >
            <LoadingSpinner />
          </div>
          <RecordView
            onFreezeImage={setFreezeImage}
            unmountMe={() => {
              // terrible hack because recording component seems to change things™
              // setIsVisible(false);
            }}
          />
        </div>
      ) : (
        <Stories />
      )}
    </div>
  );
};

export default App;
