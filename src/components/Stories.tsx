import React from "react";

// @ts-ignore
import * as Zuck from "zuck.js";
// @ts-ignore
import "zuck.js/dist/zuck.css";
console.log({ Zuck });
const getData = async () => {
  console.log("fetching");
  const res = await fetch("http://localhost:3399/list");

  const list = await res.json();
  console.log({ list });
  return list;
};
interface IStory {
  url: string;
  duration: string;
  created: number;
}

interface IZuckStory {
  id: string;
  photo?: string;
  name: string;
  link: string;
  lastUpdated: number;
  seen?:boolean;
  items: {
    id: string;
    type: string;
    length: string;
    src: string;
  }[];
}

const groupStoriesByDay = (stories: IStory[]) => {
  const grouped = {} as { [key: number]: IStory[] };
  const oneDay = 1000 * 60 * 60 * 24;
  stories.forEach(story => {
    const d = new Date(story.created);
    const day = Math.floor(d.getTime() / oneDay) * oneDay;
    if (grouped[day] == null) {
      grouped[day] = [story];
    } else {
      grouped[day].push(story);
    }
  });
  return grouped;
};

const Stories = ({
  stories
}: {
  stories: { url: string; duration: string; created: number }[];
}) => {
  const wrapperElement = React.useRef<HTMLDivElement>(null);
  const [items, setItems] = React.useState<IZuckStory[]>([]);
  React.useEffect(() => {
    const storiesByDay = groupStoriesByDay(stories);
    const zuckStories = [];
    for (const [day, storiesOfDay] of Object.entries(storiesByDay)) {
      console.log({ day });
      zuckStories.push({
        id: String(day),
        photo: storiesOfDay[0].url,
        name: new Intl.DateTimeFormat(navigator.language).format(
          new Date(Number(day))
        ),
        link: "https://ramon.codes",
        lastUpdated: storiesOfDay[storiesOfDay.length - 1].created,
        items: storiesOfDay.map(story => {
          return {
            id: story.url,
            type: "video",
            length: story.duration,
            src: story.url
          };
        })
      });
    }
    setItems(zuckStories);
  }, [stories, stories.length]);

  React.useEffect(() => {
    if (wrapperElement.current == null) {
      return;
    }
    let s = new Zuck(wrapperElement.current, {
      skin: "FaceSnap", // container class
      avatars: false, // shows user photo instead of last story item preview
      list: true, // displays a timeline instead of carousel
      openEffect: true, // enables effect when opening story - may decrease performance
      cubeEffect: true, // enables the 3d cube effect when sliding story - may decrease performance
      autoFullScreen: true, // enables fullscreen on mobile browsers
      backButton: false, // adds a back button to close the story viewer
      backNative: false, // uses window history to enable back button on browsers/android
      previousTap: true, // use 1/3 of the screen to navigate to previous item when tap the story
      localStorage: false, // set true to save "seen" position. Element must have a id to save properly.
      reactive: true, // set true if you use frameworks like React to control the timeline (see react.sample.html)

      stories: items,

      language: {
        // if you need to translate :)
        unmute: "Touch to unmute",
        keyboardTip: "Press space to see next",
        visitLink: "Visit link",
        time: {
          ago: "ago",
          hour: "hour",
          hours: "hours",
          minute: "minute",
          minutes: "minutes",
          fromnow: "from now",
          seconds: "seconds",
          yesterday: "yesterday",
          tomorrow: "tomorrow",
          days: "days"
        }
      }
    });
    console.log(s);

    // @ts-ignore
  }, [items, stories, wrapperElement]);

  const renderItems = getItems(items);

  return (
    <div style={{ position: "relative", width: "100vw", }}>
      <div ref={wrapperElement} id="stories-react" className="stories">
        {renderItems}
      </div>
    </div>
  );
};

const getItems = (stories: IZuckStory[] ) => {
  const timelineItems = [] as any[];

  stories.forEach((story, storyId) => {
    const storyItems = [] as any[];
    story.items.forEach((storyItem: any) => {
      storyItems.push(
        <li
          key={storyItem.id}
          data-id={storyItem.id}
          data-time={storyItem.time}
          className={storyItem.seen ? "seen" : ""}
        >
          <a
            href={storyItem.src}
            data-type={storyItem.type}
            data-length={storyItem.length}
            data-link={storyItem.link}
            data-linktext={storyItem.linkText}
          >
            <video src={storyItem.preview} />
          </a>
        </li>
      );
    });

    let arrayFunc = story.seen ? "push" : "unshift";
    // @ts-ignore
    timelineItems[arrayFunc](
      <div
        className={story.seen ? "story seen" : "story"}
        key={storyId}
        data-id={storyId}
        data-last-updated={story.lastUpdated}
        data-photo={story.photo}
      >
        <a className="item-link" href={story.link}>
          <span className="item-preview">
            <video onMouseEnter={e => e.currentTarget.paused ? e.currentTarget.play() : null} autoPlay={false} muted={true} src={story.photo} />
          </span>
 
          <span
            className="info"
          >
            <strong className="name" itemProp="name">
              {story.name}
            </strong>
            <span className="time">{story.items.length} {new Intl.PluralRules("en-US").select(story.items.length) === 'one' ? 'story' : 'stories'} that day</span>
          </span>
        </a>

        <ul className="items">{storyItems}</ul>
      </div>
    );
  });

  return timelineItems;
};
export const StoriesView = () => {
  const [stories, setStories] = React.useState<
    { url: string; duration: string; created: number }[]
  >([]);
  React.useEffect(() => {
    getData().then(list => setStories(list));
  }, []);

  if (stories.length === 0) {
    return (
      <p>you haven't created any stories yet. press r to record a story</p>
    );
  }

  return (
    <div>
      <h2>Stories</h2>
      <Stories stories={stories} />
    </div>
  );
};
