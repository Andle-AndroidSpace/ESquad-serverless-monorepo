import React, { ReactNode, useContext, useState } from "react";

import { SIPMeetingManager } from "./SIPMeetingManager";

const SIPMeetingContext = React.createContext<SIPMeetingManager | null>(null);

type Props = {
  children: ReactNode;
};

export default function SIPMeetingProvider({ children }: Props) {
  const [sipMeeting] = useState(new SIPMeetingManager());

  return (
    <SIPMeetingContext.Provider value={sipMeeting}>
      {children}
    </SIPMeetingContext.Provider>
  );
}

export const useSIPMeetingManager = (): SIPMeetingManager => {
  const sipMeetingManager = useContext(SIPMeetingContext);

  if (!sipMeetingManager) {
    throw new Error(
      "useSIPMeetingManager must be used within SIPMeetingProvider"
    );
  }

  return sipMeetingManager;
};
