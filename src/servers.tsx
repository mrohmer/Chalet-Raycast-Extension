import { getPreferenceValues, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import EventSource from "eventsource";
import axios from "axios";
import { MonitorItem } from "./components/monitor-item";
import { Monitors } from "./models/monitor";
import { ListError } from "./components/list-error";
import { filterObject } from "./utils/filter-object";
import { validatePort } from "./utils/validate-port";
import { Preferences } from "./models/preferences";
import { Websocket } from "./services/websocket";

export default function Command() {
  const { port: portStr } = getPreferenceValues<Preferences>();

  const portError = validatePort(portStr);
  if (portError) {
    return <ListError title={portError} />;
  }
  const port = parseInt(portStr);

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
    const websocket = new Websocket(`http://localhost:${port}/_/events`)
      .on("error", (evt) => {
        showToast({
          style: Toast.Style.Failure,
          title: String(evt.data),
        });
        setError(evt.data);
      })
      .on("open", () => {
        setError(undefined);
      })
      .on("message", (evt) => {
        setError(undefined);
        setLoading(false);
        try {
          setMonitors(JSON.parse(evt.data));
        } catch (e) {
          setError(String(e));
        }
      })
      .connect();
    return () => {
      websocket?.disconnect();
    };
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
