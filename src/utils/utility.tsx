import { ModuleName, SUPER_ADMIN } from "./common/constant";
import Beep from "../assets/sound/beep.mp3";
import Ecg_beep from "../assets/sound/ecg_beep.wav";
import CartBeep from "../assets/sound/cartBeep.wav";
import { toast, ToastOptions } from "react-toastify";
import { ProjectName } from "../environment/env";
import dayjs from "dayjs";

export const pageSize = () => {
  return [10, 25, 50, 100];
}

export const checkAccess = (moduleName: string, userData: any): boolean => {
  if (!userData?.staffMember) return false;

  const { name, permissions } = userData.staffMember;

  const lowerModuleName = moduleName.toLowerCase();

  return (
    lowerModuleName === ModuleName.ALLOWED.toLowerCase() ||
    name.toLowerCase() === SUPER_ADMIN ||
    permissions?.some((perm: string) => perm.toLowerCase() === lowerModuleName)
  );
};


export const capitalized = (str: any) => {
  if (typeof str !== "string") {
    return str;
  };
  if (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const formatLabel = (str: any) => {
  if (!str) return "";

  return str
    .replace(/[_-]+/g, " ")          // replace _ and - with space
    .toLowerCase()
    .replace(/\b\w/g, (char: any) => char.toUpperCase()); // capitalize each word
};

export const formatDate = (date: any, format: string = 'DD/MM/YYYY') => {
  if (!date) return "";

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (format === 'DD-MM-YYYY') return `${day}-${month}-${year}`;

  return `${day}/${month}/${year}`;
};

export const formatTime = (time: any): string => {
  if (!time) return "-";
  return dayjs(time).format("hh:mm:ss A");
};

export const formatCurrency = (amount: number = 0, code?: string) => {
  const currencyCode = (code || "USD").toUpperCase();
  const display = currencyCode === "USD" ? "$" : currencyCode;

  return `${display} ${Number(amount || 0).toFixed(2)}`;
};

export function convertTo12HourFormat(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);

  let period = 'AM';
  let hour12 = hours;

  if (hours >= 12) {
    period = 'PM';
    if (hours > 12) {
      hour12 = hours - 12;
    }
  } else if (hours === 0) {
    hour12 = 12;
  }

  return `${hour12}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
}

export function convertTimeSlotTo12HourFormat(timeSlot: string | null) {
  if (!timeSlot) {
    return null;
  }
  const [startTime, /* endTime */] = timeSlot.split('-');
  const startFormatted = convertTo12HourFormat(startTime);
  // const endFormatted = convertTo12HourFormat(endTime);

  // return `${startFormatted} - ${endFormatted}`;
  return `${startFormatted}`;
}

export const playBeep = (action: string) => {
  let audio = new Audio(Beep);
  switch (action) {
    case 'productStatus':
      audio = new Audio(Beep);
      audio.play().catch((err) => {
        console.warn("Beep failed:", err);
      });
      break;

    case 'newOrder':
      audio = new Audio(Ecg_beep);
      audio.play().catch((err) => {
        console.warn("Beep failed:", err);
      });
      break;

    case 'addCart':
      audio = new Audio(CartBeep);
      audio.play().catch((err) => {
        console.warn("Beep failed:", err);
      });
      break;

    default:
      console.warn(`Unhandled action: ${action}`);
      break;
  }
};

export const labelLayout = (status: string | null | undefined) => {
  const normalizedStatus = status?.trim().toLowerCase() || "";
  let style = "";

  switch (normalizedStatus) {
    case "activated":
    case "ready":
    case "available":
    case "free":
    case "completed":
    case "active":
      // style = "bg-green-100 text-green-700 border border-green-200 dark:bg-green-700 dark:text-green-100 dark:border-green-500";
      style = "bg-green-100 text-green-700 border border-green-200 dark:bg-green-700/20 dark:text-green-400 dark:border-green-700/10";
      break;
    case "hold":
    case "pending":
    case "upcoming":
      // style = "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-800 dark:text-yellow-200 dark:border-yellow-700";
      style = "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-800/20 dark:text-yellow-300 dark:border-yellow-800/10";
      break;
    case "deactivated":
    case "unavailable":
    case "booked":
    case "cancelled":
    case "expired":
      // style = "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800";
      style = "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-500 dark:border-red-800/10";
      break;
    case "new":
    case "confirmed":
      style = "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-800/20 dark:text-blue-500 dark:border-blue-700/10";
      break;
    case "acknowledged":
    case "processing":
      style = "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-800/20 dark:text-indigo-500 dark:border-indigo-800/10";
      break;
    case "preparing":
      style = "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-800/20 dark:text-yellow-500 dark:border-yellow-600/10";
      break;
    case "served":
      style = "bg-lime-200 text-lime-700 border border-lime-200 dark:bg-lime-900/20 dark:text-lime-500 dark:border-lime-800/10";
      break;
    case "bar":
      // style = "bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-800 dark:text-pink-200 dark:border-pink-600";
      style = "bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-800/20 dark:text-pink-500 dark:border-pink-800/10";
      break;
    case "kitchen":
      style = "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-800/20 dark:text-purple-500 dark:border-purple-600/10";
      break;
    default:
      style = "bg-DARK-100 text-DARK-700 border border-DARK-200 dark:bg-DARK-900 dark:text-DARK-200 dark:border-DARK-600";
      break;
  }

  return (
    <span
      className={`w-28 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${style}`}
    >
      {status?.toUpperCase() ?? "-"}
    </span>
  );
};


export const detectIssuer = (number: string): string | undefined => {
  const cleaned = number.replace(/\D/g, "");

  // Visa: Starts with 4
  if (/^4/.test(cleaned)) return "Visa";

  // Mastercard: Starts with 51-55 or 2221-2720
  if (/^(5[1-5]|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[0-1][0-9]|2720)/.test(cleaned)) return "Mastercard";

  // American Express: Starts with 34 or 37
  if (/^3[47]/.test(cleaned)) return "American Express";

  // Discover: Starts with 6011, 644-649, 65, or 622126-622925
  if (/^(6011|644|645|646|647|648|649|65|6221[2-9][0-9]|622[2-8][0-9]{2}|6229[0-2][0-5])/.test(cleaned)) return "Discover";

  // Diners Club: Starts with 300-305, 36, or 38
  if (/^(30[0-5]|36|38)/.test(cleaned)) return "Diners Club";

  // JCB: Starts with 3528-3589
  if (/^35(2[8-9]|[3-8][0-9])/.test(cleaned)) return "JCB";

  // UnionPay: Starts with 62, 81
  if (/^(62|81)/.test(cleaned)) return "UnionPay";

  // Maestro: Starts with 50, 56-58, 6
  if (/^(50|5[6-8]|6)/.test(cleaned)) return "Maestro";

  // Rupay: Starts with 60, 6521, 6522
  if (/^(60|6521|6522)/.test(cleaned)) return "Rupay";

  return undefined;
};

export default detectIssuer;

export interface UpiPaymentDetails {
  upiId: string;
  name: string;
  amount: number;
  txnId?: string;
  refId?: string;
  date: Date;
}


export const generateUpiUrl = ({
  upiId,
  name,
  amount,
  txnId,
  refId,
  date
}: UpiPaymentDetails): string | null => {

  if (!upiId || !name || typeof amount !== "number" || isNaN(amount)) {
    return null;
  }


  const sanitizeUpiParam = (value: string): string =>
    value.replace(/[^a-zA-Z0-9\-_.]/g, "_"); // allows alphanum, dash, underscore, dot


  const params = new URLSearchParams({
    pa: upiId,
    pn: sanitizeUpiParam(name),
    am: amount.toFixed(2),
    cu: "INR",
  });

  if (refId) params.append("tr", sanitizeUpiParam(refId));

  // Convert provided UTC date to system's local timezone
  let createdAt = "";
  if (date) {
    try {
      const utcDate = new Date(date);
      createdAt = utcDate.toLocaleString(undefined, {
        hour12: true,
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (error) {
      console.log(" Invalid date format passed to generateUpiUrl", error);
    }
  }


  if (txnId) {
    const note = `${refId || ""} | ${createdAt}`;
    params.append("tn", sanitizeUpiParam(note));
  }


  // const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}&tr=${refId}`;
  // const qrSvgUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiUrl)}&format=svg`;

  // console.log("UPI URL",upiUrl);
  // console.log("QR URL",qrSvgUrl)

  return `upi://pay?${params.toString()}`;
};

type ToastType = 'info' | 'success' | 'warning' | 'error';
interface ToastAlertOptions extends ToastOptions {
  message?: string;
}
export const toastAlert = (
  type: ToastType = 'info',
  { message = '', position = 'top-right', autoClose = 1500, ...rest }: ToastAlertOptions
) => {
  toast[type](message, { position, autoClose, ...rest });
};

export const setTitle = (title: string) => {
  document.title = `${ProjectName} : ${title}`;
};

export const connectionPlatForm = () => {
  return [
    { _id: "quickbook", name: "Quick Books" }
  ]
}
