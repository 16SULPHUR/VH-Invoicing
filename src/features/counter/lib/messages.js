import { customerKey, phoneDigits } from "@/features/customers/lib/customerKey";
import { greetingName, renderTemplate } from "@/features/whatsapp/lib/templates";
import { formatRupees } from "@/utils/formatters";
import { shortDate } from "./shopTools";

// Service messages for the counter. Blank values drop their line, as in the outbox.
const TEMPLATES = {
  job_ready: {
    hi: `Namaste {first_name} ji 🙏
{shop_name} se: aapka {work} ready hai. Token *{token}*.
Baaki: *{balance}*
Jab time mile, shop se le jaiye. Dhanyavaad! 😊`,
    en: `Hello {first_name} 🙏
Your {work} is ready at {shop_name}. Token *{token}*.
Balance: *{balance}*
Collect it whenever it suits you. Thank you! 😊`,
  },
  approval_due: {
    hi: `Namaste {first_name} ji 🙏
{shop_name} se: aap jo {pieces} dekhne ke liye le gaye the (jangad *{token}*), unhe {due_date} tak wapas dena tha.
Jo pasand aaye rakh lijiye, baaki shop par de jaiye. Dhanyavaad!`,
    en: `Hello {first_name} 🙏
A reminder from {shop_name}: the {pieces} you took on approval (slip *{token}*) were due back on {due_date}.
Keep the ones you like and bring the rest to the shop. Thank you!`,
  },
  booking_ready: {
    hi: `Namaste {first_name} ji 🙏
Aapka order (booking *{token}*) {shop_name} par ready hai.
Baaki: *{balance}*
Kab aa rahe hain? Dhanyavaad! 😊`,
    en: `Hello {first_name} 🙏
Your order (booking *{token}*) is ready at {shop_name}.
Balance: *{balance}*
Let us know when you'll come by. Thank you! 😊`,
  },
};

export const piecesText = (count) => ({
  hi: count === 1 ? "1 kapda" : `${count} kapde`,
  en: count === 1 ? "1 piece" : `${count} pieces`,
});

export const WORK_NAMES = {
  fall_pico: { hi: "saree fall-pico", en: "saree fall and pico" },
  blouse: { hi: "blouse", en: "blouse" },
  alteration: { hi: "alteration", en: "alteration" },
  other: { hi: "kaam", en: "order" },
};

/** Text and log entry for one service message. */
export function serviceMessage(templateId, record, { settings, language = "hi", vars = {} }) {
  const lang = language === "en" ? "en" : "hi";
  const name = greetingName(record.customer_name);
  const localised = Object.fromEntries(
    Object.entries(vars).map(([key, value]) => [key, value && typeof value === "object" ? value[lang] : value])
  );
  const text = renderTemplate(TEMPLATES[templateId][lang], {
    first_name: name.split(" ")[0] ?? "",
    token: record.token,
    shop_name: settings?.shop_name ?? "",
    ...localised,
    balance: vars.balance > 0 ? formatRupees(vars.balance) : "",
    due_date: vars.due_date ? shortDate(vars.due_date) : "",
  });
  return {
    text,
    customer: {
      key: customerKey({ name: record.customer_name, phone: record.customer_phone }),
      phone: phoneDigits(record.customer_phone),
    },
  };
}
