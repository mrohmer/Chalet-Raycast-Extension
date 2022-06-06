import { getPreferenceValues, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import EventSource from "eventsource";
import axios from "axios";
import { MonitorItem } from "./components/monitor-item";
import { Monitors } from "./models/monitor";
import { ListError } from "./components/list-error";
import { filterObject } from "./utils/filter-object";

interface Preferences {
  port: string;
}

export default function Command() {
  const { port: portStr } = getPreferenceValues<Preferences>();

  if (!portStr?.trim()) {
    return <ListError title="Port cannot be empty." />;
  }
  if (!/^[1-9]\d+$/.test(portStr) || isNaN(parseInt(portStr))) {
    return <ListError title="Port needs to be number." />;
  }
  const port = parseInt(portStr);
  if (port <= 0 || port > 65000) {
    return <ListError title="Port needs to be between 1 & 65000." />;
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [monitors, setMonitors] = useState<Monitors>({});
  const [filteredMonitors, setFilteredMonitors] = useState<Monitors>({});
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setFilteredMonitors(
      searchText?.trim()
        ? filterObject<Monitors, Monitors>(monitors, (key) =>
            key.includes(searchText)
          )
        : monitors
    );
  }, [searchText, monitors]);

  useEffect(() => {
    const websocket = new EventSource(`http://localhost:${port}/_/events`);

    websocket.onerror = (evt) => {
      showToast({
        style: Toast.Style.Failure,
        title: String(evt.data),
      });
      setError(evt.data);
    };

    websocket.onopen = () => {
      setError(undefined);
    };

    websocket.onmessage = (evt) => {
      setError(undefined);
      setLoading(false);
      try {
        setMonitors(JSON.parse(evt.data));
      } catch (e) {
        setError(String(e));
      }
    };

    return () => websocket?.close();
  }, [port]);

  const post = (path: string) => {
    return axios.post(`http://localhost:${port}${path}`);
  };
  const onStart = (key: string) => {
    setLoading(true);
    post(`/_/servers/${key}/start`).catch(() => {
      setLoading(false);
      return showToast({
        style: Toast.Style.Failure,
        title: `Could not start ${key}`,
      });
    });
  };
  const onStop = (key: string) => {
    setLoading(true);
    post(`/_/servers/${key}/stop`).catch(() => {
      setLoading(false);
      return showToast({
        style: Toast.Style.Failure,
        title: `Could not stop ${key}`,
      });
    });
  };

  return (
    <List
      isLoading={loading}
      enableFiltering={false}
      onSearchTextChange={setSearchText}
      navigationTitle="Search Chalet Servers"
      searchBarPlaceholder="Server..."
    >
      {error ? (
        <ListError title={"An error occured. 🤷"} hideToast={true} />
      ) : Object.keys(monitors).length ? (
        Object.entries(filteredMonitors)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([key, monitor]) => (
            <MonitorItem
              key={key}
              onStart={onStart}
              onStop={onStop}
              monitorKey={key}
              monitor={monitor}
              browserUrl={`http://localhost:${port}/${key}`}
            />
          ))
      ) : (
        !loading && (
          <List.EmptyView
            icon={{ source: "hotel.png" }}
            title={"Could not find monitors."}
          />
        )
      )}
    </List>
  );
}
