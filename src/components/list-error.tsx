import {
  Action,
  ActionPanel,
  List,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";

export interface Props {
  title: string;
  hideToast?: boolean;
}
export function ListError({ title, hideToast }: Props) {
  !hideToast &&
    showToast({
      style: Toast.Style.Failure,
      title,
    });

  return (
    <List
      actions={
        <ActionPanel>
          <Action
            title="Open Preferences"
            onAction={openExtensionPreferences}
          />
        </ActionPanel>
      }
    >
      <List.EmptyView icon={{ source: "hotel.png" }} title={title} />
    </List>
  );
}
