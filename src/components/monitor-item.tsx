import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { Monitor } from "../models/monitor";
import {MonitorDetails} from './monitor-details';

export interface MonitorItemProps {
  onStart: (key: string) => void;
  onStop: (key: string) => void;
  monitorKey: string;
  monitor: Monitor;
  browserUrl: string;
}
export const MonitorItem = ({
  monitorKey: key,
  monitor: { status },
  onStop,
  onStart,
  browserUrl,
}: MonitorItemProps) => (
  <List.Item
    key={key}
    title={key}
    icon={
      status !== "crashed"
        ? {
            source: Icon.Circle,
            tintColor: status === "running" ? Color.Green : Color.SecondaryText,
          }
        : { source: Icon.XmarkCircle, tintColor: Color.Red }
    }
    actions={
      <ActionPanel>
        <Action
          title={`${status !== "running" ? "Start" : "Stop"} ${maxStrLength(
            key,
            20
          )}`}
          onAction={() => (status !== "running" ? onStart(key) : onStop(key))}
        />
        <Action.Push title="Details"
                     target={<MonitorDetails id={key} />}
        />
        {status === "running" ? (
          <Action.OpenInBrowser url={browserUrl} />
        ) : undefined}
      </ActionPanel>
    }
  />
);

const maxStrLength = (str: string, length: number): string =>
  str.length <= length ? str : `${str.substr(0, length - 3)}...`;
