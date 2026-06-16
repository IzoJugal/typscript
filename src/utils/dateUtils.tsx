// export function formatUTCToTZ(
//   utcDate: string | Date | undefined | null,
// ): string {
//   if (!utcDate) return "";

//   // 1. Create a Date object from the UTC string
//   const date = new Date(utcDate);
  
//   // Check validity
//   if (isNaN(date.getTime())) return "";

//   // 2. MANUAL OFFSET CALCULATION
//   // India is UTC + 5.5 hours
//   const indiaOffsetMs = 5.5 * 60 * 60 * 1000;
  
//   // Create a new date object explicitly shifted to IST
//   const istDate = new Date(date.getTime() + indiaOffsetMs);

//   // 3. MANUAL FORMATTING
//   const day = String(istDate.getUTCDate()).padStart(2, "0");
//   const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
//   const year = istDate.getUTCFullYear();
  
//   // --- 12 Hour Logic Start ---
//   let hours = istDate.getUTCHours(); // Get 0-23
//   const ampm = hours >= 12 ? 'PM' : 'AM';
  
//   hours = hours % 12;
//   hours = hours ? hours : 12; // the hour '0' should be '12'
  
//   const hoursStr = String(hours).padStart(2, "0");
//   // --- 12 Hour Logic End ---

//   const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
//   const seconds = String(istDate.getUTCSeconds()).padStart(2, "0");

//   // Return format: "DD/MM/YYYY hh:mm:ss AM/PM"
//   return `${day}/${month}/${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
// }

export function formatUTCToTZ(
  utcDate: string | Date | undefined | null,
  timeZone?: string | null
): string {
  if (!utcDate) return "";

  // 1. Ensure the date is treated as UTC if it's a string
  let date: Date;
  if (typeof utcDate === "string") {
    // If string doesn't end in Z and doesn't have an offset, append Z to force UTC interpretation
    // Example: "2023-10-10T10:10:00" -> "2023-10-10T10:10:00Z"
    const isIsoFormat = utcDate.includes("T");
    const hasTimeZone = utcDate.endsWith("Z") || utcDate.includes("+") || (utcDate.includes("-") && utcDate.length > 10); // simplified check
    
    if (isIsoFormat && !hasTimeZone) {
        date = new Date(utcDate + "Z");
    } else {
        date = new Date(utcDate);
    }
  } else {
    date = new Date(utcDate);
  }

  // Check validity
  if (isNaN(date.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  // 2. Trim whitespace from timezone to prevent errors
  const targetTZ = timeZone ? timeZone.trim() : undefined;

  try {
    // Apply specific timezone if exists
    if (targetTZ) {
      options.timeZone = targetTZ;
    }
    const formatter = new Intl.DateTimeFormat("en-GB", options);
    return formatter.format(date).replace(",", "").toUpperCase();
  } catch (error) {
    console.warn(`Invalid timezone: '${timeZone}', falling back to local time.${error}`);
    // Fallback
    return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: undefined })
      .format(date)
      .replace(",", "")
      .toUpperCase();
  }
}