import type { ReactElement } from "react";

export interface StageResultPanelProps {
  title: string;
  rows: string[];
  sectionId: "overlay-results-section" | "overlay-rogue-section";
  listId?: "overlay-results";
  hidden?: boolean;
  children?: ReactElement;
}

export function StageResultPanel({
  title,
  rows,
  sectionId,
  listId,
  hidden,
  children,
}: StageResultPanelProps): ReactElement {
  return (
    <div id={sectionId} className={hidden ? "results-section panel-hidden" : "results-section"}>
      <p className="subtle">{title}</p>
      {children}
      {listId ? (
        <ul id={listId}>
          {rows.map((row, index) => (
            <li key={`${listId}-${index.toString()}`}>{row}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
