import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";

export const KINDS = {
  dues: { label: "Dues reminder", transactional: true },
  thanks: { label: "Thank you", transactional: true },
  marketing: { label: "Offer or greeting", transactional: false },
};

export const LANGUAGES = [
  { value: "hi", label: "Hinglish" },
  { value: "en", label: "English" },
];

export const BLANKS = [
  { key: "name", label: "Full name" },
  { key: "first_name", label: "First name" },
  { key: "due", label: "Amount due" },
  { key: "bills", label: "Bills due, e.g. 2 bills" },
  { key: "oldest_date", label: "Oldest due bill date" },
  { key: "oldest_days", label: "Days since oldest bill" },
  { key: "bill_no", label: "Latest bill number" },
  { key: "bill_total", label: "Latest bill total" },
  { key: "pay_link", label: "Pay-now link" },
  { key: "shop_name", label: "Shop name" },
  { key: "shop_phone", label: "Shop phone" },
  { key: "channel_link", label: "WhatsApp channel link" },
];

// Names read fine when left out ("Namaste ji"); any other empty blank drops its line.
const SOFT_BLANKS = new Set(["name", "first_name"]);
const STOP = { hi: "Offers band karne ke liye STOP likhein.", en: "Reply STOP to stop offers." };

export const DEFAULT_TEMPLATES = [
  {
    id: "dues_gentle",
    name: "Dues · gentle",
    kind: "dues",
    hi: `Namaste {first_name} ji 🙏
{shop_name} se ek chhota sa reminder: aapke {bills} par *{due}* baaki hai (sabse purana {oldest_date} ka).
Jab time mile, yahan se UPI se pay kar sakte hain: {pay_link}
Dhanyavaad! 😊`,
    en: `Hello {first_name} 🙏
A gentle reminder from {shop_name}: *{due}* is pending on {bills}, the oldest from {oldest_date}.
Whenever it suits you, you can pay by UPI here: {pay_link}
Thank you! 😊`,
  },
  {
    id: "dues_firm",
    name: "Dues · firm",
    kind: "dues",
    hi: `Namaste {first_name} ji,
{shop_name} ki taraf se: aapka *{due}* ({bills}) {oldest_days} din se baaki hai.
Kripya is hafte payment kar dijiye: {pay_link}
Koi sawaal ho toh {shop_phone} par call karein. Dhanyavaad 🙏`,
    en: `Hello {first_name},
This is {shop_name}. *{due}* on {bills} has been pending for {oldest_days} days.
Please clear it this week: {pay_link}
Any questions, call us on {shop_phone}. Thank you 🙏`,
  },
  {
    id: "dues_final",
    name: "Dues · final",
    kind: "dues",
    hi: `Namaste {first_name} ji,
Aapka *{due}* ka payment {oldest_date} se ({oldest_days} din) baaki hai. Hum pehle bhi yaad dila chuke hain.
Kripya 3 din ke andar payment kar dijiye: {pay_link}
Koi dikkat ho toh ek baar {shop_phone} par baat kar lijiye.
– {shop_name}`,
    en: `Hello {first_name},
*{due}* has been due since {oldest_date} ({oldest_days} days) and we have reminded you before.
Please pay within 3 days: {pay_link}
If something is wrong, please call us on {shop_phone}.
– {shop_name}`,
  },
  {
    id: "thanks",
    name: "Thank you with bill",
    kind: "thanks",
    hi: `Namaste {first_name} ji 🙏
{shop_name} se shopping karne ke liye dhanyavaad! Aapka bill *#{bill_no}*: *{bill_total}*.
Naye designs sabse pehle dekhne ke liye hamara channel follow karein: {channel_link}
Phir milenge! 😊`,
    en: `Thank you for shopping at {shop_name}, {first_name}! 🙏
Your bill *#{bill_no}* comes to *{bill_total}*.
Follow our channel to see new designs first: {channel_link}
See you again! 😊`,
  },
  {
    id: "birthday",
    name: "Birthday",
    kind: "marketing",
    hi: `Happy Birthday {first_name} ji! 🎂🎉
{shop_name} ki taraf se aapko dher saari shubhkamnayein.
Is hafte shop aaiye, aapke liye ek chhota sa birthday surprise hai 🎁
${STOP.hi}`,
    en: `Happy Birthday {first_name}! 🎂🎉
Warm wishes from all of us at {shop_name}.
Drop by this week, there is a little birthday surprise waiting for you 🎁
${STOP.en}`,
  },
  {
    id: "anniversary",
    name: "Anniversary",
    kind: "marketing",
    hi: `Happy Anniversary {first_name} ji! 💐
{shop_name} ki taraf se aap dono ko bahut bahut badhai.
Is khaas din ke liye kuch naya chahiye toh zaroor aaiye, aapke liye special offer hai ✨
${STOP.hi}`,
    en: `Happy Anniversary {first_name}! 💐
Warm wishes to you both from {shop_name}.
If you'd like something new for the occasion, do visit, there is a special offer for you ✨
${STOP.en}`,
  },
  {
    id: "winback",
    name: "We miss you",
    kind: "marketing",
    hi: `Namaste {first_name} ji 🙏
Kaafi din ho gaye aapko {shop_name} mein dekhe! Naye suits, sarees aur kurtis aa gaye hain ✨
Is hafte aaiye, aapke liye kuch special rakha hai.
Naye designs yahan dekhein: {channel_link}
${STOP.hi}`,
    en: `Hello {first_name} 🙏
It's been a while since we saw you at {shop_name}! New suits, sarees and kurtis are in ✨
Visit us this week, we have kept something special for you.
See the new designs: {channel_link}
${STOP.en}`,
  },
  {
    id: "new_arrivals",
    name: "New arrivals",
    kind: "marketing",
    hi: `Namaste {first_name} ji ✨
{shop_name} mein *naya stock* aa gaya hai: suits, sarees, kurtis aur dupattas.
Photos dekhne ke liye channel follow karein: {channel_link}
Koi design pasand aaye toh isi number par reply karein, hum aapke liye rakh denge 😊
${STOP.hi}`,
    en: `Hello {first_name} ✨
*New stock* is in at {shop_name}: suits, sarees, kurtis and dupattas.
Follow our channel for photos: {channel_link}
Like a design? Reply here and we'll keep it aside for you 😊
${STOP.en}`,
  },
  {
    id: "festival",
    name: "Festival offer",
    kind: "marketing",
    hi: `{first_name} ji, aapko aur aapke parivaar ko tyohaar ki hardik shubhkamnayein 🪔
{shop_name} mein festive collection par *special offer* chal raha hai, sirf is hafte!
Aaiye aur apni pasand chuniye. Details: {channel_link}
${STOP.hi}`,
    en: `Festive greetings to you and your family, {first_name} 🪔
There's a *special offer* on the festive collection at {shop_name}, this week only!
Come and pick your favourites. Details: {channel_link}
${STOP.en}`,
  },
];

const DEFAULT_IDS = new Set(DEFAULT_TEMPLATES.map(({ id }) => id));
export const isDefaultTemplate = (id) => DEFAULT_IDS.has(id);

/** Defaults with the shop's edits laid over them, then the shop's own templates. */
export function mergeTemplates(saved) {
  const edits = saved && typeof saved === "object" ? saved : {};
  const merged = DEFAULT_TEMPLATES.map((template) => ({ ...template, ...edits[template.id], id: template.id }));
  const custom = Object.entries(edits)
    .filter(([id, template]) => !DEFAULT_IDS.has(id) && template)
    .map(([id, template]) => ({ ...template, id }));
  return [...merged, ...custom];
}

function titleCase(text) {
  if (text !== text.toLowerCase() && text !== text.toUpperCase()) return text;
  return text.toLowerCase().replace(/(^|[\s.-])(\p{L})/gu, (_, gap, letter) => gap + letter.toUpperCase());
}

const GENERIC_NAME = /^(walk[\s-]?in|cash|customer|guest|n\/?a|unnamed|-+)$/i;

/** The name to greet: title-cased, blank for walk-ins and placeholders. */
export function greetingName(name) {
  const clean = String(name ?? "").trim().replace(/\s+/g, " ");
  return GENERIC_NAME.test(clean) ? "" : titleCase(clean);
}

/** Fills the blanks. Unknown blanks stay as typed so they show up in the preview. */
export function renderTemplate(body, vars) {
  return String(body ?? "")
    .split("\n")
    .flatMap((line) => {
      let dropLine = false;
      const filled = line.replace(/\{(\w+)\}/g, (match, key) => {
        if (!(key in vars)) return match;
        const value = vars[key];
        if (value !== "" && value != null) return String(value);
        if (!SOFT_BLANKS.has(key)) dropLine = true;
        return "";
      });
      if (dropLine) return [];
      return [filled.replace(/ {2,}/g, " ").replace(/\s+([,!.?])/g, "$1").replace(/,([!.?])/g, "$1").trim()];
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Values for every blank, from one customer in the directory. */
export function messageVars(customer, { settings, payLink = "", bill = customer?.latestBill } = {}) {
  const name = greetingName(customer?.name);
  const dueBills = customer?.dueBills ?? [];
  const oldest = dueBills[0];
  const due = customer?.due ?? 0;
  return {
    name,
    first_name: name.split(" ")[0] ?? "",
    due: due > 0 ? formatRupees(due) : "",
    bills: dueBills.length > 0 ? `${dueBills.length} bill${dueBills.length === 1 ? "" : "s"}` : "",
    oldest_date: oldest ? formatDateDDMMMYYYY(oldest.date) : "",
    oldest_days: oldest ? String(customer.oldestDays) : "",
    bill_no: bill?.id ?? "",
    bill_total: bill ? formatRupees(bill.total) : "",
    pay_link: due > 0 ? payLink : "",
    shop_name: settings?.shop_name ?? "",
    shop_phone: settings?.phone ?? "",
    channel_link: settings?.wa_channel ?? "",
  };
}

/** Gentle, firm or final by how old the oldest unpaid bill is. */
export function duesTemplateId(oldestDays, rules) {
  if (oldestDays > rules.finalAfterDays) return "dues_final";
  if (oldestDays >= rules.firmAfterDays) return "dues_firm";
  return "dues_gentle";
}

/** WhatsApp's *bold*, _italic_ and ~strike~ as React-ready segments. */
export function formatSegments(text) {
  const pattern = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  return String(text)
    .split(pattern)
    .filter(Boolean)
    .map((part) => {
      const mark = part[0];
      const wrapped = part.length > 2 && part.endsWith(mark) && "*_~".includes(mark);
      return { text: wrapped ? part.slice(1, -1) : part, style: wrapped ? mark : null };
    });
}
