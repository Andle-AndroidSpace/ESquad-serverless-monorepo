import React, { ChangeEvent, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Checkbox,
  DeviceLabels,
  Flex,
  FormField,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalHeader,
  PrimaryButton,
  Select,
  useMeetingManager,
} from "amazon-chime-sdk-component-library-react";
import {
  DefaultBrowserBehavior,
  MeetingSessionConfiguration,
} from "amazon-chime-sdk-js";

import { getErrorContext } from "../../providers/ErrorProvider";
import routes from "../../constants/routes";
import Card from "../../components/Card";
import Spinner from "../../components/icons/Spinner";
import DevicePermissionPrompt from "../DevicePermissionPrompt";
import RegionSelection from "./RegionSelection";
import {
  createGetAttendeeCallback,
  createMeetingAndAttendee,
} from "../../utils/api";
import { useAppState } from "../../providers/AppStateProvider";
import { MeetingMode, VideoFiltersCpuUtilization } from "../../types";
import { MeetingManagerJoinOptions } from "amazon-chime-sdk-component-library-react/lib/providers/MeetingProvider/types";
import meetingConfig from "../../meetingConfig";

const VIDEO_TRANSFORM_FILTER_OPTIONS = [
  { value: VideoFiltersCpuUtilization.Disabled, label: "Disable Video Filter" },
  {
    value: VideoFiltersCpuUtilization.CPU10Percent,
    label: "Video Filter CPU 10%",
  },
  {
    value: VideoFiltersCpuUtilization.CPU20Percent,
    label: "Video Filter CPU 20%",
  },
  {
    value: VideoFiltersCpuUtilization.CPU40Percent,
    label: "Video Filter CPU 40%",
  },
];

function fromBase64(str: string) {
  return decodeURIComponent(escape(atob(str)));
}

const MeetingForm: React.FC = () => {
  const meetingManager = useMeetingManager();
  const {
    region,
    meetingId,
    localUserName,
    meetingMode,
    enableSimulcast,
    priorityBasedPolicy,
    keepLastFrameWhenPaused,
    isWebAudioEnabled,
    videoTransformCpuUtilization,
    setJoinInfo,
    isEchoReductionEnabled,
    toggleEchoReduction,
    toggleWebAudio,
    toggleSimulcast,
    togglePriorityBasedPolicy,
    toggleKeepLastFrameWhenPaused,
    setMeetingMode,
    setMeetingId,
    setLocalUserName,
    setRegion,
    setCpuUtilization,
    skipDeviceSelection,
    toggleMeetingJoinDeviceSelection,
  } = useAppState();

  const [userEmail, setUserEmail] = useState<string>("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [meetingErr, setMeetingErr] = useState(false);
//  const [nameErr, setNameErr] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { errorMessage, updateErrorMessage } = useContext(getErrorContext());
  const navigate = useNavigate();
  const browserBehavior = new DefaultBrowserBehavior();

  useEffect(() => {
    const url = window.location.href;

    const extractValue = (key: string): string | null => {
      const match = url.match(new RegExp(`[?&]${key}=([^&]*)`));
      return match ? decodeURIComponent(match[1]).replace(/#/g, "") : null;
    };

    const teamIdParam = extractValue("teamId");
    if (teamIdParam) {
      setTeamId(teamIdParam);
      console.log("Extracted Team ID:", teamIdParam);
    }

    const studyIdParam = extractValue("studyId");
    if (studyIdParam) {
      setMeetingId(studyIdParam.toLowerCase());
      console.log("Extracted Study ID:", studyIdParam.toLowerCase());
    }

    const nameParam = extractValue("name");
    if (nameParam) {
      setLocalUserName(nameParam);
      console.log("Extracted Name:", nameParam);
    }

    // Base64로 인코딩된 userEmail 값 추출
    const userParam = extractValue("user");
    if (userParam) {
      try {
        const decodedEmail = fromBase64(userParam);
        setUserEmail(decodedEmail);
        console.log("Decoded Email:", decodedEmail);
      } catch (e) {
        console.error("이메일 디코딩 중 오류 발생:", e);
      }
    }
  }, [setMeetingId, setLocalUserName]);

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = meetingId.trim().toLocaleLowerCase();
    const attendeeName = localUserName.trim();

    if (!id) {
      setMeetingErr(true);
      return;
    }

    // if (!id || !attendeeName) {
    //   if (!attendeeName) {
    //     setNameErr(true);
    //   }

    //   if (!id) {
    //     setMeetingErr(true);
    //   }

    //   return;
    // }

    if (!userEmail || !teamId) {
      updateErrorMessage("사용자 이메일 또는 팀 ID가 누락되었습니다.");
      return;
    }

    setIsLoading(true);
    meetingManager.getAttendee = createGetAttendeeCallback(id);

    try {
      const status = "true";

      const { JoinInfo } = await createMeetingAndAttendee(
        id,
        attendeeName,
        region,
        isEchoReductionEnabled,
        userEmail,
        teamId,
        status
      );
      setJoinInfo(JoinInfo);
      const meetingSessionConfiguration = new MeetingSessionConfiguration(
        JoinInfo?.Meeting,
        JoinInfo?.Attendee
      );
      if (
        meetingConfig.postLogger &&
        meetingSessionConfiguration.meetingId &&
        meetingSessionConfiguration.credentials &&
        meetingSessionConfiguration.credentials.attendeeId
      ) {
        const existingMetadata = meetingConfig.postLogger.metadata;
        meetingConfig.postLogger.metadata = {
          ...existingMetadata,
          meetingId: meetingSessionConfiguration.meetingId,
          attendeeId: meetingSessionConfiguration.credentials.attendeeId,
        };
      }

      setRegion(JoinInfo.Meeting.MediaRegion);
      meetingSessionConfiguration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = enableSimulcast;
      if (priorityBasedPolicy) {
        meetingSessionConfiguration.videoDownlinkBandwidthPolicy = priorityBasedPolicy;
      }
      meetingSessionConfiguration.keepLastFrameWhenPaused = keepLastFrameWhenPaused;
      const options: MeetingManagerJoinOptions = {
        deviceLabels:
          meetingMode === MeetingMode.Spectator
            ? DeviceLabels.None
            : DeviceLabels.AudioAndVideo,
        enableWebAudio: isWebAudioEnabled,
        skipDeviceSelection,
      };

      await meetingManager.join(meetingSessionConfiguration, options);
      if (meetingMode === MeetingMode.Spectator) {
        await meetingManager.start();
        navigate(`${routes.MEETING}/${meetingId}`);
      } else {
        setMeetingMode(MeetingMode.Attendee);
        navigate(routes.DEVICE);
      }
    } catch (error) {
      updateErrorMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeError = (): void => {
    updateErrorMessage("");
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleJoinMeeting}>
      <Heading tag="h1" level={4} css="margin-bottom: 1rem">
        회의 참여
      </Heading>
      <FormField
        field={Input}
        label="회의 ID"
        value={meetingId}
        infoText="회의 ID에 액세스할 수 있는 모든 사용자가 참여할 수 있습니다"
        fieldProps={{
          name: "meetingId",
          placeholder: "회의 ID를 입력해주세요",
          disabled: true, // 회의 ID 변경 불가
        }}
        errorText="올바른 회의 ID를 입력해주세요"
        error={meetingErr}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => {
          setMeetingId(e.target.value);
          if (meetingErr) {
            setMeetingErr(false);
          }
        }}
      />

      {/*
      <FormField
        field={Input}
        label="닉네임"
        value={localUserName}
        fieldProps={{
          name: "name",
          placeholder: "닉네임을 입력해주세요",
          disabled: true, // 닉네임 변경 불가
        }}
        errorText="올바른 닉네임을 입력해주세요"
        error={nameErr}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => {
          setLocalUserName(e.target.value);
          if (nameErr) {
            setNameErr(false);
          }
        }}
      />
      */}

      {/*
      <FormField
        field={Input}
        label="이메일"
        value={userEmail}
        fieldProps={{
          name: "email",
          placeholder: "이메일을 입력해주세요",
          disabled: true, // 이메일 변경 불가 (URL에서 받은 값)
        }}
        errorText="올바른 이메일을 입력해주세요"
        error={!userEmail}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => {
          setUserEmail(e.target.value);
        }}
      />
      */}

      <RegionSelection setRegion={setRegion} region={region} />
      <FormField
        field={Checkbox}
        label="오디오 및 비디오 사용(시청자 모드) 참여"
        value=""
        checked={meetingMode === MeetingMode.Spectator}
        onChange={(): void => {
          if (meetingMode === MeetingMode.Spectator) {
            setMeetingMode(MeetingMode.Attendee);
          } else {
            setMeetingMode(MeetingMode.Spectator);
          }
        }}
      />
      <FormField
        field={Checkbox}
        label="웹 오디오 사용"
        value=""
        checked={isWebAudioEnabled}
        onChange={toggleWebAudio}
        infoText="음성 포커스를 사용하도록 웹 오디오 활성화"
      />
      {isWebAudioEnabled && (
        <FormField
          field={Checkbox}
          label="에코 감소 사용"
          value=""
          checked={isEchoReductionEnabled}
          onChange={toggleEchoReduction}
          infoText="에코 감소 사용(새 미팅만 해당)"
        />
      )}
      <FormField
        field={Select}
        options={VIDEO_TRANSFORM_FILTER_OPTIONS}
        onChange={(e: ChangeEvent<HTMLSelectElement>): void => {
          setCpuUtilization(e.target.value);
        }}
        value={videoTransformCpuUtilization}
        label="백그라운드 필터 CPU 사용률"
      />
      {browserBehavior.isSimulcastSupported() && (
        <FormField
          field={Checkbox}
          label="Simulcast 사용"
          value=""
          checked={enableSimulcast}
          onChange={toggleSimulcast}
        />
      )}
      {browserBehavior.supportDownlinkBandwidthEstimation() && (
        <FormField
          field={Checkbox}
          label="우선순위 기반 다운링크 정책 사용"
          value=""
          checked={priorityBasedPolicy !== undefined}
          onChange={togglePriorityBasedPolicy}
        />
      )}
      <FormField
        field={Checkbox}
        label="일시 중지 시 마지막 프레임 유지"
        value=""
        checked={keepLastFrameWhenPaused}
        onChange={toggleKeepLastFrameWhenPaused}
      />
      <FormField
        field={Checkbox}
        label="회의 참여 장치 선택 건너뛰기"
        value=""
        checked={skipDeviceSelection}
        onChange={toggleMeetingJoinDeviceSelection}
        infoText="회의에 성공적으로 참여하려면 장치를 수동으로 선택하세요"
      />
      <Flex container layout="fill-space-centered" style={{ marginTop: "2.5rem" }}>
        {isLoading ? (
          <Spinner />
        ) : (
          <PrimaryButton
            label="계속"
            onClick={handleJoinMeeting}
            style={{ backgroundColor: "#9F51E8", borderColor: "#9F51E8" }}
          />
        )}
      </Flex>
      {errorMessage && (
        <Modal size="md" onClose={closeError}>
          <ModalHeader title={`Meeting ID: ${meetingId}`} />
          <ModalBody>
            <Card
              title="회의에 참여할 수 없습니다"
              description="해당 미팅을 찾는 동안 문제가 발생했습니다. 미팅이 이미 종료되었거나 권한이 만료되었을 수 있습니다. 잠시 후 다시 시도해주세요."
              smallText={errorMessage}
            />
          </ModalBody>
        </Modal>
      )}
      <DevicePermissionPrompt />
    </form>
  );
};

export default MeetingForm;
