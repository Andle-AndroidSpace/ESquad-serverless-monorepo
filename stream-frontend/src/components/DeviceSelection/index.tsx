import React from "react";

import { StyledWrapper, StyledAudioGroup, StyledVideoGroup } from "./Styled";
import MicrophoneDevices from "./MicrophoneDevices";
import SpeakerDevices from "./SpeakerDevices";
import CameraDevices from "./CameraDevices";

const DeviceSelection = () => (
  <StyledWrapper>
    <StyledAudioGroup>
      <MicrophoneDevices />
      <SpeakerDevices />
    </StyledAudioGroup>
    <StyledVideoGroup>
      <CameraDevices />
    </StyledVideoGroup>
  </StyledWrapper>
);

export default DeviceSelection;
