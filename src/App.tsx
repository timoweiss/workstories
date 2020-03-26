import React from "react";
import "./App.css";

import useInterval from "@use-it/interval";
import { RecordView } from "./components/Video";
import { StoriesView } from "./components/Stories";
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
  const [isVisible, setIsVisible] = React.useState(
    document.visibilityState === "visible"
  );

  const [freezeImage, setFreezeImage] = React.useState(null as null | Blob);

  // this is a hack to recognize the visibility change of the page
  useInterval(() => {
    if ((document.visibilityState === "visible") !== isVisible)
      setIsVisible(document.visibilityState === "visible");
  }, 200);


  if (!isVisible) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App" style={{ overflow: "hidden" }}>
      <KeyboardHandler
        onR={() => setShowRecordingView(true)}
        onS={() => setShowRecordingView(false)}
      />
      {showRecordingView ? (
        <div style={{ position: "relative", width: "100%" }}>
          <RecordView
            onFreezeImage={setFreezeImage}
            unmountMe={() => {
              // terrible hack because recording component seems to change things™
              setIsVisible(false);
            }}
            freezeImage={freezeImage}
          />
        </div>
      ) : (
        <StoriesView />
      )}
    </div>
  );
};

export default App;
