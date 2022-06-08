import {Detail, getPreferenceValues, Icon, showToast, Toast,} from "@raycast/api";
import {useEffect, useState} from "react";
import {ListError} from "./list-error";
import {validatePort} from "../utils/validate-port";
import {Preferences} from "../models/preferences";
import {Websocket} from "../services/websocket";

interface Props {
  id: string;
}

export function MonitorDetails({id: key}: Props) {
  console.log('logs', key);
  const {port: portStr} = getPreferenceValues<Preferences>();

  const portError = validatePort(portStr);
  if (portError) {
    return <ListError title={portError}/>;
  }
  const port = parseInt(portStr);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [log, setLog] = useState<string>("");

  useEffect(() => {
    const websocket = new Websocket(`http://localhost:${port}/_/events/output`)
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
          const {id, output} = JSON.parse(evt.data);

          if (id !== key) {
            return;
          }

          setLoading(false);
          setLog(output.split('\n').reverse().join('\n'));
        } catch (e) {
          setError(String(e));
        }
      })
      .connect();
    return () => {
      websocket?.disconnect();
    };
  }, [port]);

  return (
    <Detail isLoading={loading}
            navigationTitle={`Logs of ${key}`}
            markdown={log}
    />
  );
}
