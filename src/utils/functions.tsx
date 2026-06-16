
import React from "react";
import { Label } from "flowbite-react";
import { Company, ErrorState, IMealPeriod, Restaurant } from "../components/mealPeriods/MealPeriods";
import { DropdownWithSearch } from "./common/Filters";

export const formatTime = (timeStr: any | undefined) => {
  const [hours, minutes] = timeStr ? timeStr.split(':') : '';
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

interface Props {
  companies: Company[];
  restaurant: Restaurant[];
  formData: IMealPeriod | any;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  errors: ErrorState;
}

export const SuperAdminFields = ({ companies, restaurant, formData, handleChange, errors }: Props) => {
  return (
    <>
      <CompanyField
        companies={companies}
        selectedCompanyId={formData?.company?._id}
        handleChange={handleChange}
        error={errors.company}
      />
      <RestaurantField
        restaurants={restaurant}
        selectedRestaurantId={formData?.restaurant?._id}
        handleChange={handleChange}
        error={errors.restaurant}
      />
    </>
  );
};

interface CompanyFieldProps {
  companies: Array<{ _id: string; name: string }>;
  selectedCompanyId: string;
  showTitle?: boolean;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}


export const CompanyField = ({ companies, selectedCompanyId, showTitle = true, handleChange, error }: CompanyFieldProps | any) => {
  const handleFilter = (id: any) => {
    handleChange({ target: { name: "company", value: id } });
  };

  return (
    <div>
      {showTitle && <><Label htmlFor="company" value="Business" /><span className="text-red-500">*</span></>}
      <DropdownWithSearch
        setSelectedItem={() => { }}
        selectedItem={companies?.find((c: any) => c._id === selectedCompanyId)?.name || ''}
        items={companies}
        title="Business"
        handleFilter={handleFilter}
        fieldKey="company"
      />
      {error && <p className="mt-1 text-sm text-ERROR_HOVER">{error}</p>}
    </div>
  );
};

interface RestaurantFieldProps {
  restaurants: Array<{ _id: string; name: string }>;
  selectedRestaurantId: string;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  showTitle?: boolean;
}

export const RestaurantField = ({ restaurants, selectedRestaurantId, handleChange, error, showTitle = true, }: RestaurantFieldProps | any) => {
  const handleFilter = (id: any) => {
    handleChange({ target: { name: "restaurant", value: id } });
  };
  return (
    <div>
      {showTitle && <><Label htmlFor="restaurant" value={"Restaurant"} /><span className="text-red-500">*</span></>}
      <DropdownWithSearch
        setSelectedItem={() => { }}
        selectedItem={restaurants?.find((c: any) => c._id === selectedRestaurantId)?.name || ''}
        items={restaurants}
        title="Restaurant"
        handleFilter={handleFilter}
        fieldKey="restaurant"
      />
      {error && <p className="mt-1 text-sm text-ERROR_HOVER">{error}</p>}
    </div>
  );
};

export const createQueryParams = (data: any) => {
  const params = Object.entries(data)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as any)}`)
    .join('&');
  return params ? `?${params}` : '';
};

export const phoneNumberLength = (country: any) => {
  const dialCodeLength = country.dialCode.length;
  const countryDataLength =
    country.format && country.format.match(/\./g).length - dialCodeLength;
  const countryData: any =
    countryDataLength >= 14 ? countryDataLength - 2 : countryDataLength;
  return countryData;
};


export const parseTimeStringToDate = (timeStr: any) => {
  if (!timeStr) return null;

  const is12Hour = /AM|PM/i.test(timeStr);

  let hours = 0;
  let minutes = 0;

  if (is12Hour) {
    // "01:45 PM" format
    const [time, modifier] = timeStr.trim().split(" ");
    const [h, m] = time.split(":").map(Number);

    hours = h % 12 + (modifier.toLowerCase() === "pm" ? 12 : 0);
    minutes = m;
  } else {
    // "13:45" format
    const [h, m] = timeStr.split(":").map(Number);
    hours = h;
    minutes = m;
  }

  return hours * 60 + minutes;
}