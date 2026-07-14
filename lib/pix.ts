function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    const c = payload.charCodeAt(i);
    crc ^= c;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0x8408;
      } else {
        crc >>= 1;
      }
    }
  }
  const hex = (crc ^ 0xffff).toString(16).toUpperCase();
  return hex.padStart(4, "0");
}

function paddedId(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export type PixPayloadOptions = {
  pixKey: string;
  merchantName: string;
  merchantCity?: string;
  amount?: number;
  txid?: string;
  description?: string;
};

export function generatePixPayload(opts: PixPayloadOptions): string {
  const merchantName = opts.merchantName.trim().substring(0, 25).toUpperCase();
  const merchantCity = (opts.merchantCity ?? "CIDADE").trim().substring(0, 15).toUpperCase();
  const txid = opts.txid ?? "***";

  // GUI = BR.GOV.BCB.PIX, then PIX key
  const pixAccountInfo = `0014BR.GOV.BCB.PIX01${opts.pixKey}`;
  const merchantAccount = paddedId("26", pixAccountInfo);

  const mcc = "52040000";
  const currency = "5303986";
  const country = "5802BR";
  const merchantNameField = paddedId("59", merchantName);
  const merchantCityField = paddedId("60", merchantCity);

  // Additional data (TXID)
  const txidField = paddedId("05", txid);
  const additional = paddedId("62", txidField);

  // Build payload without CRC
  let payload = `000201${merchantAccount}${mcc}${currency}`;

  // Amount (optional)
  if (opts.amount != null && opts.amount > 0) {
    const amtStr = opts.amount.toFixed(2);
    payload += paddedId("54", amtStr);
  }

  payload += `${country}${merchantNameField}${merchantCityField}${additional}6304`;

  // CRC16
  const crc = crc16(payload);
  return payload + crc;
}
