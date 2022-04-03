import axios from "axios";

/*
 * CwMessageオブジェクト
 */
export type CwMessage = Readonly<{
  body: string;
  message_id: string;
  account: {
    account_id: string;
    name: string;
    avatar_image_url: string;
  };
  send_time: number;
  update_time: number;
}>;

/*
 * CwRoomオブジェクト
 */
export type CwRoom = Readonly<{
  room_id: number;
  name: string;
  type: string;
  role: string;
  sticky: boolean;
  unread_num: number;
  mention_num: number;
  mytask_num: number;
  message_num: number;
  file_num: number;
  task_num: number;
  icon_path: string;
  last_update_time: number;
}>;

/*
 * グループ情報を取得します。
 */
export const getGroups = async (cwKey: string): Promise<CwRoom[] | null> => {
  const res = await axios
    .get(`https://api.chatwork.com/v2/rooms`, {
      headers: {
        "X-ChatWorkToken": cwKey,
      },
    })
    .catch((err) => {
      return err.response;
    });
  if (res.status !== 200) {
    return null;
  }
  return res.data;
};

/*
 * メッセージを取得します。
 */
export const getMessage = async <T>(
  cwKey: string,
  cwRoomId: string,
  filter: (data: CwMessage[]) => T
): Promise<T | null> => {
  const res = await axios
    .get(`https://api.chatwork.com/v2/rooms/${cwRoomId}/messages`, {
      headers: {
        "X-ChatWorkToken": cwKey,
      },
      params: {
        force: 1,
      },
    })
    .catch((err) => {
      return err.response;
    });
  if (res.status !== 200) {
    return null;
  }
  return filter(res.data);
};

/*
 * 送信します。
 */
export const sendMessage = async (
  cwKey: string,
  cwRoomId: string,
  message: string,
  self_unread: boolean = true
): Promise<void> => {
  const res = await axios
    .post(
      `https://api.chatwork.com/v2/rooms/${cwRoomId}/messages`,
      {},
      {
        headers: {
          "X-ChatWorkToken": cwKey,
        },
        params: {
          body: message,
          self_unread: self_unread ? "1" : "0",
        },
      }
    )
    .catch((err) => {
      return err.response;
    });
  if (res.status !== 200) {
    console.log(res);
  }
};
