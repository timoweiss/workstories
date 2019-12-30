import React from "react";
import { ReactMediaRecorder } from "react-media-recorder";

// @ts-ignore
import * as fixWebmDuration from "fix-webm-duration";
import { LoadingSpinner } from "./Loading";

const constraints = {
  video: {
    aspectRatio: { exact: 0.5625 },
    width: { ideal: 1600 },
    // width: {min: 600},
    frameRate: { ideal: 60, min: 28 }
  } as MediaTrackConstraints,
  audio: {
    autoGainControl: false,
    channelCount: 2,
    echoCancellation: false,
    latency: 0,
    noiseSuppression: false,
    sampleRate: 48000,
    sampleSize: 16
  } as MediaTrackConstraints
};

const VideoRecordingPreview = ({ mediaBlobUrl }: { mediaBlobUrl: string }) => {
  return (
    <div
      className="control-help-container"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <div className="control-help">
        <p>Press "s" to save the recorded story</p>
        <p>Press "d" to discard the recorded story</p>
      </div>
      <video
        src={mediaBlobUrl}
        style={{ transform: "scaleX(-1)", width: "100%", height: "100%" }}
        autoPlay
        loop
      />
    </div>
  );
};

const VideoLivePreview = ({
  stream,
  isRecording
}: {
  stream: MediaStream | null;
  status: string;
  isRecording: boolean;
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 5,
        left: 0,
        top: 0,
        width: "100%",
        height: "100%"
      }}
    >
      {isRecording && (
        <div
          tabIndex={-1}
          style={{
            position: "absolute",
            zIndex: 999,
            left: "0",
            top: "0",
            width: "calc(100% - 8px)",
            height: "calc(100% - 8px)",
            border: "4px solid rgba(231, 76, 60,.7)"
          }}
        ></div>
      )}

      <div className={`control-help-container ${isRecording && "hide"}`}>
        <video
          ref={videoRef}
          style={{ transform: "scaleX(-1)", width: "100%", height: "100%" }}
          autoPlay
        />

        <div className="control-help">
          <p>Hold "Space" to record a story</p>
          <p>Press "p" to preview stories</p>
        </div>
      </div>
    </div>
  );
};

function stopAndRemoveTrack(
  mediaStream: MediaStream,
  onImage: (image: Blob) => void
) {
  return function(track: MediaStreamTrack) {
    // @ts-ignore
    const imageCapture = new window.ImageCapture(track);
    // @ts-ignore

    imageCapture.takePhoto().then(image => {
      onImage(image);
      track.stop();
      mediaStream.removeTrack(track);
    });
  };
}

function stopMediaStream(
  mediaStream: MediaStream | null,
  onImage: (image: Blob) => void
) {
  if (!mediaStream) {
    return;
  }

  mediaStream.getTracks().forEach(stopAndRemoveTrack(mediaStream, onImage));
}

function RecorderHandler({
  startRecording,
  stopRecording,
  isRecording,
  status
}: {
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
  status: string;
}) {
  const keyUpHandler = React.useCallback(
    e => {
      if (e.code === "Space") {
        console.log("stopRecording", status);
        stopRecording();
      }
    },
    [status, stopRecording]
  );

  const keyDownHandler = React.useCallback(
    e => {
      if (e.code === "Space" && !isRecording) {
        console.log("start rec");
        startRecording();
      }
    },
    [isRecording, startRecording]
  );

  React.useEffect(() => {
    document.addEventListener("keyup", keyUpHandler);
    document.addEventListener("keydown", keyDownHandler);

    return () => {
      document.removeEventListener("keyup", keyUpHandler);
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [keyDownHandler, keyUpHandler]);

  return null;
}

function RecordingHandler({
  mediaBlobUrl,
  onSavedOrDiscarded,
  duration
}: {
  mediaBlobUrl: string | null;
  onSavedOrDiscarded: Function;
  duration: number;
}) {
  const handler = React.useCallback(
    async (e: KeyboardEvent) => {
      if (e.code === "KeyS") {
        if (mediaBlobUrl == null) {
          console.log("nothing todo mediaBlobUrl is null");
          return;
        }

        // we "download" the video blob which the url points to, fix the duration meta info and upload it to the main process
        const res = await fetch(mediaBlobUrl);
        const blob = await res.blob();
        fixWebmDuration(blob, duration, async (fixedBlob: Blob) => {
          await fetch(`http://localhost:3399?duration=${duration}`, {
            method: "POST",
            body: fixedBlob,
            mode: "no-cors"
          });
          onSavedOrDiscarded();
        });
      }
      if (e.code === "KeyD") {
        if (mediaBlobUrl == null) {
          console.log("nothing todo mediaBlobUrl is null");
          return;
        }

        onSavedOrDiscarded();
      }
    },
    [duration, mediaBlobUrl, onSavedOrDiscarded]
  );

  React.useEffect(() => {
    document.addEventListener("keyup", handler, false);
    return () => {
      document.removeEventListener("keyup", handler);
    };
  }, [duration, handler]);
  return null;
}

export const RecordView = ({
  unmountMe,
  onFreezeImage
}: {
  unmountMe: Function;
  onFreezeImage: (image: Blob) => void;
}) => {
  const [stream, setStream] = React.useState(null as null | MediaStream);
  const [recording, setRecording] = React.useState(null as null | string);
  const [recordingStartTimestamp, setRecordingStartTimestamp] = React.useState(
    0
  );
  const [recordingStopTimestamp, setRecordingStopTimestamp] = React.useState(0);

  const [showRecordingHelp, setShowRecordingHelp] = React.useState(false);

  React.useEffect(() => {
    // disable camera on unmount
    return () =>
      stopMediaStream(stream, image => {
        onFreezeImage(image);
      });
  }, [onFreezeImage, stream]);

  return (
    <ReactMediaRecorder
      video={constraints.video}
      audio={constraints.audio}
      onStop={mediaBlobUrl => {
        setRecordingStopTimestamp(Date.now());
        console.log("onStop", mediaBlobUrl);
        setRecording(mediaBlobUrl);
      }}
      render={({
        status,
        startRecording,
        stopRecording,
        mediaBlobUrl,
        previewStream
      }) => {
        console.log({ status });
        if (status === "recording" && recordingStartTimestamp === 0) {
          console.log("setRecordingStartTimestamp");
          setRecordingStartTimestamp(Date.now());
        }
        if (stream == null && previewStream != null) {
          console.log("setting stream", previewStream);
          setStream(previewStream);
        }

        if (stream == null && previewStream == null) {
          return <LoadingSpinner />;
        }

        return (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 2
            }}
          >
            <RecorderHandler
              startRecording={startRecording}
              stopRecording={stopRecording}
              isRecording={status === "recording"}
              status={status}
            />
            {recording ? (
              <>
                <RecordingHandler
                  onSavedOrDiscarded={() => {
                    URL.revokeObjectURL(mediaBlobUrl as string);
                    setRecording(null);
                    unmountMe();
                  }}
                  mediaBlobUrl={mediaBlobUrl}
                  duration={recordingStopTimestamp - recordingStartTimestamp}
                />
                {showRecordingHelp && (
                  <div
                    onClick={() => setShowRecordingHelp(false)}
                    style={{
                      background: "rgba(0,0,0,.8)",
                      height: "100vh",
                      width: "100%",
                      position: "absolute",
                      left: 0,
                      top: 0,
                      zIndex: 999
                    }}
                  >
                    <p>Press s to save story</p>
                    <p>Press d to discard story</p>
                  </div>
                )}
                <VideoRecordingPreview mediaBlobUrl={recording} />
              </>
            ) : (
              <VideoLivePreview
                isRecording={status === "recording"}
                status={status}
                stream={previewStream}
              />
            )}
          </div>
        );
      }}
    />
  );
};
