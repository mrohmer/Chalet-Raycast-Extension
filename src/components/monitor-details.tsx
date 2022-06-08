import {Detail, getPreferenceValues, showToast, Toast,} from "@raycast/api";
import {useEffect, useState} from "react";
import {ListError} from "./list-error";
import {validatePort} from "../utils/validate-port";
import {Preferences} from "../models/preferences";
import {Websocket} from "../services/websocket";
import axios from 'axios';
import {entriesToObject} from '../utils/entries-to-object';
import {Monitor} from '../models/monitor';
import {filterObject} from '../utils/filter-object';
import {homedir} from 'os';
import Style = Toast.Style;

interface Props {
  id: string;
}

export function MonitorDetails({id: key}: Props) {
  const {port: portStr} = getPreferenceValues<Preferences>();

  const portError = validatePort(portStr);
  if (portError) {
    return <ListError title={portError}/>;
  }
  const port = parseInt(portStr);

  const [loading, setLoading] = useState(true);
  const [logError, setLogError] = useState<string | undefined>(undefined);
  const [log, setLog] = useState<string>("");
  const [config, setConfig] = useState<Monitor | undefined>(undefined);

  useEffect(() => {
    const websocket = new Websocket(`http://localhost:${port}/_/events/output`)
      .on("error", (evt) => {
        showToast({
          style: Toast.Style.Failure,
          title: String(evt.data),
        });
        setLogError(evt.data);
      })
      .on("open", () => {
        setLogError(undefined);
      })
      .on("message", (evt) => {
        setLogError(undefined);
        setLoading(false);
        try {
          const {id, output} = JSON.parse(evt.data);

          if (id !== key) {
            return;
          }

          setLoading(false);
          setLog(output.split("\n").reverse().join("\n"));
        } catch (e) {
          setLogError(String(e));
        }
      })
      .connect();
    return () => {
      websocket?.disconnect();
    };
  }, [port]);
  useEffect(() => {
    axios.get(`http://localhost:${port}/_/servers`)
      .then(response => response.data as Record<string, Monitor>)
      .then(response => {
        const server = response[key];

        if (!server) {
          return Promise.reject('server not found');
        }

        const sameEnvVars = findSameProperties(
          Object.values(response)
            .map(monitor => monitor?.env)
            .filter(env => !!env)
        );

        setConfig({
          ...server,
          env: filterObject(server.env, (key) => !sameEnvVars.includes(key) && key !== 'PATH'),
        });
      })
      .catch(err => showToast({
        style: Style.Failure,
        title: 'Could not load config',
        message: String(err),
      }))
  }, [port])

  return (
    <Detail
      isLoading={loading}
      navigationTitle={`Logs of ${key}`}
      markdown={!logError ? log : `Could not load log 😢`}
      metadata={config ? <Metadata config={config}/> : undefined}
    />
  );
}

const findSameProperties = (items: Record<string, string>[]) => Object.keys(
  items
    .reduce(
      (prev, curr) => entriesToObject(
        Object.entries(prev)
          .filter(([key, value]) => key in curr && curr[key] === value)
      )
    )
);


function Metadata({config}: Record<'config', Monitor>) {
  return <Detail.Metadata>
    <Detail.Metadata.Label title="command" text={config.command?.reverse()[0]}/>
    <Detail.Metadata.Label title="cwd" text={config.cwd?.replace(homedir(), '~')}/>

    {
      Object.keys(config.env ?? {}).length
        ? (<>
          <Detail.Metadata.Separator/>
          {
            Object.entries(config.env).map(([key, value]) =>
              <Detail.Metadata.Label key={key} title={key} text={String(value)}/>)
          }
        </>)
        : undefined
    }
  </Detail.Metadata>
}
