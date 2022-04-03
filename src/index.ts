import dotenv from "dotenv";
import {
  CwMessage,
  getGroups,
  getMessage,
  sendMessage,
} from "./helpers/chatworkHelper";

/*
 * チャットワーク上の自分宛てに来たものを収集します。
 *
 * 1. 出力するグループの最後のメッセージを取得し、タイムスタンプを取得
 * 2. グループ一覧を取得
 *   - 上記1.のタイムスタンプよりも新しいもの
 *   - 除外グループ一覧ではないもの（コンフィグに記載）
 * 3. 上記2.のグループごとにメッセージを取得し、タイムスタンプより新しいものを精査し、Toがあればメッセージ出力
 * 4. 上記2.で対象がなければ「対象なし」のメッセージ出力
 */
(async () => {
  try {
    dotenv.config();

    const cwKey = process.env.CW_KEY ?? "";
    const outRoomId = process.env.CW_OUT_ROOM_ID ?? "";
    const exclusionRoomIds = (process.env.CW_EXCLUSION_ROOMS ?? "").split(",");
    const targetAccountId = process.env.CW_TARGET_ACCOUNT_ID ?? "";

    exclusionRoomIds.push(outRoomId);

    const lastTimestamp =
      (
        await getMessage<CwMessage | null>(
          cwKey,
          outRoomId,
          (ms: CwMessage[]) => (ms.length > 0 ? ms[ms.length - 1] : null)
        )
      )?.send_time ?? Math.floor(new Date().getTime() / 1000);

    const targetRoomIds =
      (await getGroups(cwKey))
        ?.filter(
          (g) =>
            g.last_update_time >= lastTimestamp &&
            exclusionRoomIds.indexOf(g.room_id.toString()) == -1
        )
        .map((g) => g.room_id.toString()) ?? [];

    const targetMessages: (CwMessage & { roomId: string })[] = [];
    await Promise.all(
      targetRoomIds.map(async (g) => {
        const messages = await getMessage<CwMessage[]>(
          cwKey,
          g,
          (ms: CwMessage[]) =>
            ms.filter(
              (m) =>
                m.send_time >= lastTimestamp &&
                (m.body.indexOf("[To:" + targetAccountId + "]") >= 0 ||
                  m.body.indexOf("[rp aid=" + targetAccountId) >= 0 ||
                  m.body.indexOf("[toall]") >= 0 ||
                  m.body.indexOf("各位") >= 0)
            )
        );
        messages?.map((m) => {
          targetMessages.push({
            body: m.body,
            message_id: m.message_id,
            account: m.account,
            send_time: m.send_time,
            update_time: m.update_time,
            roomId: g,
          });
        });
      })
    );

    if (targetMessages.length > 0) {
      targetMessages
        .sort((m) => m.send_time)
        .map((m) =>
          sendMessage(
            cwKey,
            outRoomId,
            `[qt][qtmeta aid=${m.account.account_id} time=${m.send_time}]${m.body}[/qt]https://www.chatwork.com/#!rid${m.roomId}-${m.message_id}`
          )
        );
    } else {
      sendMessage(cwKey, outRoomId, "対象メッセージはありませんでした", false);
    }
  } catch (error) {
    const e = error as Error;
    console.error("name:", (error as Error).name);
    console.error("message:", (error as Error).message);
    console.error("stack:", (error as Error).stack);
  }
})();
