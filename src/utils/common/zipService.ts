import { toast } from "react-toastify";

export const getCityState = async (zip: string) => {
  try {
    const res = await fetch(
      `http://www.postalpincode.in/api/pincode/${zip}`
    );
    // https://api.postalpincode.in/pincode 
    const data = await res.json();

    if (
      data[0]?.Status === "Success" &&
      data[0]?.PostOffice?.length > 0
    ) {
      const postOffice = data[0].PostOffice[0];

      return {
        city: postOffice.District || "",
        state: postOffice.State || "",
        error: "",
      };
    }

    toast.error("Zip not found. Please enter manually city and state.");

    return {
      city: "",
      state: "",
      error: "",
    };
  } catch {
    toast.error("Failed to fetch city/state.");

    return {
      city: "",
      state: "",
      error: "Failed to fetch city/state.",
    };
  }
};