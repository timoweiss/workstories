import React from "react";

import InstaStories from "react-insta-stories";
import { LoadingSpinner } from "./Loading";
const getData = async () => {
  console.log("fetching");
  const res = await fetch("http://localhost:3399/list");

  const list = await res.json();
  console.log({ list });
  return list;
};
export const Stories = () => {
  const [stories, setStories] = React.useState([] as { url: string }[]);
  React.useEffect(() => {
    getData().then(list => setStories(list));
  }, []);

  if (stories.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <InstaStories
      width={352}
      height={628}
      loop={true}
      key={stories.length}
      stories={stories.map(s => ({ ...s, type: "video" }))}
      storyStyles={{ overflow: "hidden" }}
loader={<LoadingSpinner />}
      onStoryStart={(...args:any[]) => {
        console.log('onStoryStart', args)
      }}
      onAllStoriesEnd={(...args:any[]) => {
        console.log('onAllStoriesEnd', args)

      }}
    />
  );
};
