import routes from '../constants/routes';

const environment = (import.meta.env?.VITE_ENVIRONMENT) || 'dev';

const isProduction = process.env.NODE_ENV === 'production';

export const BASE_URL = isProduction ? `https://api.esquad.click/${environment}/` : routes.HOME;


export type MeetingFeatures = {
  Audio: { [key: string]: string };
};

export type CreateMeetingResponse = {
  MeetingFeatures: MeetingFeatures;
  MediaRegion: string;
};

export type JoinMeetingInfo = {
  Meeting: CreateMeetingResponse;
  Attendee: string;
};

interface MeetingResponse {
  JoinInfo: JoinMeetingInfo;
}

interface GetAttendeeResponse {
  name: string;
}

export async function createMeetingAndAttendee(
  title: string,
  attendeeName: string,
  region: string,
  echoReductionCapability = false,
  userEmail: string,
  teamId: string,
  status: string
): Promise<MeetingResponse> {
  const body = {
    title: title,
    attendeeName: attendeeName,
    region: encodeURIComponent(region),
    ns_es: String(echoReductionCapability),
    userEmail: userEmail,
    teamId: teamId,
    status: status,
  };

  const res = await fetch(BASE_URL + 'stream/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(`Server error: ${data.error}`);
  }

  return data;
}


export async function getAttendee(
  title: string,
  attendeeId: string
): Promise<GetAttendeeResponse> {
  const params = {
    title: encodeURIComponent(title),
    attendeeId: encodeURIComponent(attendeeId),
  };

  const res = await fetch(
    BASE_URL + 'stream/attendee?' + new URLSearchParams(params),
    {
      method: 'GET',
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();

  return {
    name: data.Name,
  };
}


export async function endMeeting(
  title: string,
  participant: string,
  nickname: string,
): Promise<void> {
  const body = {
    title: title,
    participant: participant,
    nickname: nickname,
  };

  const res = await fetch(BASE_URL + 'stream/end', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error('Server error ending meeting');
  }
}

export const createGetAttendeeCallback = (meetingId: string) => (
  chimeAttendeeId: string
): Promise<GetAttendeeResponse> => getAttendee(meetingId, chimeAttendeeId);

