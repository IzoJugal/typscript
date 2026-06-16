
import { Button, Checkbox, Label, Modal } from 'flowbite-react';
import React, { useRef } from 'react';
import { AiOutlineLoading } from "react-icons/ai";
import { IMealPeriod } from '../../utils/common/Interface/OrderInterface';
import { allDays, Company, ErrorState, mealPlan, Restaurant } from './MealPeriods';
import { OWNER_ROLES, SUPER_ADMIN } from '../../utils/common/constant';
import { CompanyField, RestaurantField } from '../../utils/functions';
import NewSingleDate from '../../utils/common/NewSingleDate';
import { TimeInput } from '../../utils/common/TimeInput';
import CommonInput from '../../utils/common/CommonInput';


interface MealPeriodFormProps {
    isOpen: boolean;
    onClose: () => void;
    formData: IMealPeriod | any;
    errors: ErrorState;
    companies: Company[];
    restaurant: Restaurant[];
    months: string[];
    loginRole: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
    isButtonLoading: boolean
    dateObj: {
        selectSpecialDate: {
            startDate: Date | null;
            endDate: Date | null;
        };
        selectFromDate: {
            startDate: Date | null;
            endDate: Date | null;
        };
        selectToDate: {
            startDate: Date | null;
            endDate: Date | null;
        };
        handleSpecialDate: (value: { startDate: Date | null; endDate: Date | null }) => void;
        handleFromDate: (value: { startDate: Date | null; endDate: Date | null }) => void;
        handleToDate: (value: { startDate: Date | null; endDate: Date | null }) => void;
    } | any
}

const MealPeriodFormModal: React.FC<MealPeriodFormProps> = ({
    isOpen,
    onClose,
    formData,
    errors,
    companies,
    restaurant,
    months,
    loginRole,
    handleChange,
    handleSubmit,
    isButtonLoading,
    dateObj,
}) => {
    const startTimeRef = useRef<HTMLInputElement>(null);
    const endTimeRef = useRef<HTMLInputElement>(null);
    return (
        <Modal show={isOpen} onClose={onClose} className="backdrop-blur-sm dark:bg-DARK-950">
            <Modal.Header className="dark:bg-DARK-800">Meal Period Form</Modal.Header>
            <Modal.Body className="bg-slate-50 dark:bg-DARK-900">
                <div className="space-y-6 bg-white dark:bg-DARK-800 p-4 rounded-xl">
                    {/* Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {loginRole === SUPER_ADMIN && (
                            <div className="flex flex-col">
                                <CompanyField
                                    companies={companies}
                                    selectedCompanyId={formData?.company?._id || formData?.company || ''}
                                    handleChange={handleChange}
                                    error={errors.company}
                                />
                            </div>
                        )}
                        {(loginRole === SUPER_ADMIN || OWNER_ROLES.includes(loginRole)) && (
                            <div className="flex flex-col">
                                <RestaurantField
                                    restaurants={restaurant}
                                    selectedRestaurantId={formData?.restaurant?._id || formData?.restaurant || ''}
                                    handleChange={handleChange}
                                    error={errors.restaurant}
                                />
                            </div>
                        )}
                    </div>

                    {/* Name Input Field */}
                    <div>
                        <Label htmlFor="name" value="Name" /><span className='text-red-500'>*</span>
                        <CommonInput
                            id="name"
                            name="name"
                            placeholder="Meal Period Name"
                            type="text"
                            value={formData.name || ''}
                            onChange={handleChange}
                        // className="w-full px-4 py-3 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 dark:border-none border border-DARK-300 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-BRAND-500 focus:outline-none"
                        />
                        {errors.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>}
                    </div>

                    {/* Meal Plan Section */}
                    <Label htmlFor="mealPlan" className="block text-xl font-semibold mb-4 text-DARK-700 dark:text-DARK-100">
                        Meal Plan
                    </Label>
                    <div className="flex gap-6 mb-4 justify-between">
                        {mealPlan.map((plan) => {
                            const isChecked = formData.mealPlan === plan;

                            const handleSelect = () => {
                                // const syntheticEvent = {
                                //     target: {
                                //         name: "mealPlan",
                                //         value: plan,
                                //     },
                                // } as React.ChangeEvent<HTMLInputElement>;
                                const syntheticEvent = {
                                    target: {
                                        name: "mealPlan",
                                        value: plan,
                                        type: "radio",
                                    },
                                } as React.ChangeEvent<HTMLInputElement>;

                                handleChange(syntheticEvent);
                            };

                            return (
                                <div
                                    key={plan}
                                    className={`flex items-center w-40 space-x-3 p-3 rounded-lg cursor-pointer transition-colors duration-300 ${isChecked
                                        ? "bg-BRAND-100 dark:bg-BRAND-200"
                                        : "bg-DARK-100 hover:bg-BRAND-100 dark:bg-DARK-700 dark:hover:bg-BRAND-200"
                                        }`}
                                    onClick={handleSelect}
                                >
                                    <input
                                        type="radio"
                                        id={plan}
                                        name="mealPlan"
                                        value={plan}
                                        checked={isChecked || formData.mealPlan === plan}
                                        onChange={handleChange}
                                        className="checked:!bg-BRAND-500 !ring-0"
                                    />
                                    <Label
                                        htmlFor={plan}
                                        className={` ml-2 capitalize cursor-pointer text-sm ${isChecked ? 'text-BRAND-500 dark:text-BRAND-500' : 'text-DARK-700 dark:text-DARK-100'} `}

                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {plan}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>

                    {/* Week Days Section */}
                    {formData.mealPlan === 'week' && (
                        <div className="my-5">
                            <Label htmlFor="isFullDay" className="block text-xl font-medium mb-4 text-DARK-700 dark:text-DARK-100">
                                Week Days
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                                {allDays.map((day) => {
                                    const isChecked = formData?.week?.[day] === true || formData?.week?.[day] === "true";

                                    const handleToggle = () => {
                                        const syntheticEvent = {
                                            target: {
                                                name: day,
                                                value: (!isChecked).toString(),
                                                type: 'weekDays',
                                            },
                                        } as React.ChangeEvent<HTMLInputElement>;

                                        handleChange(syntheticEvent);
                                    };

                                    return (
                                        <div
                                            key={day}
                                            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-300 cursor-pointer ${isChecked
                                                ? 'bg-BRAND-100 dark:bg-BRAND-200'
                                                : 'bg-DARK-100 hover:bg-BRAND-100 dark:bg-DARK-700 dark:hover:bg-BRAND-200'
                                                }`}
                                            onClick={handleToggle}
                                        >
                                            <Checkbox
                                                className="checked:!bg-BRAND-500 !ring-0"
                                                id={day}
                                                name={day}
                                                checked={isChecked}
                                                onChange={() => { }}
                                            />
                                            <Label
                                                htmlFor={day}
                                                className={` capitalize text-sm cursor-pointer  ${isChecked ? 'text-BRAND-500 dark:text-BRAND-500' : 'text-DARK-700 dark:text-DARK-100'} `}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {day}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                            {errors.week && (
                                <p className="mt-2 text-sm text-ERROR_HOVER dark:text-red-400">
                                    {errors.week}
                                </p>
                            )}
                        </div>
                    )}


                    {/* Full Day Checkbox */}
                    {formData.mealPlan !== 'time' && (
                        <div className="flex items-center gap-2 mb-5">
                            <Checkbox
                                className="checked:!bg-BRAND-500 !ring-0"
                                id="isFullDay"
                                name="isFullDay"
                                checked={formData?.isFullDay}
                                onChange={handleChange}
                            />
                            <Label htmlFor="isFullDay" className="cursor-pointer text-sm text-DARK-700">Full Day</Label>
                        </div>
                    )}

                    {/* Time-based Meal Plan Section */}
                    {(!formData?.isFullDay || formData.mealPlan === 'time') && (
                        <div className="grid grid-cols-2 gap-6 mb-5">
                            <div>
                                <Label htmlFor="startTime" className="block text-sm font-medium text-DARK-700 mb-2">Start Time<span className='text-red-500'>*</span></Label>
                                <TimeInput
                                    id="startTime"
                                    name="startTime"
                                    value={formData.startTime || ""}
                                    onChange={handleChange}
                                    inputRef={startTimeRef}
                                // className="w-full px-4 py-3 border border-DARK-300 rounded-xl dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 focus:ring-2 focus:ring-BRAND-500 focus:outline-none transition-all duration-300 ease-in-out"
                                />
                                {errors.startTime && <p className="mt-2 text-sm text-ERROR_HOVER">{errors.startTime}</p>}
                            </div>
                            <div>
                                <Label htmlFor="endTime" className="block text-sm font-medium text-DARK-700 mb-2">End Time<span className='text-red-500'>*</span></Label>
                                <TimeInput
                                    id="endTime"
                                    name="endTime"
                                    value={formData.endTime || ""}
                                    onChange={handleChange}
                                    inputRef={endTimeRef}
                                // className="w-full px-4 py-3 border border-DARK-300 rounded-xl dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 focus:ring-2 focus:ring-BRAND-500 focus:outline-none transition-all duration-300 ease-in-out"
                                />
                                {errors.endTime && <p className="mt-2 text-sm text-ERROR_HOVER">{errors.endTime}</p>}
                            </div>
                        </div>
                    )}

                    {/* Special Day Section */}
                    {formData.mealPlan === 'day' && (
                        <div className="mt-6">
                            <div className="mb-4">
                                <Label htmlFor="specialDayName" className="block text-sm font-medium text-DARK-700 mb-2">Special Day Name</Label>
                                <CommonInput
                                    id="specialDayName"
                                    type="text"
                                    name="specialDayName"
                                    value={formData?.day?.specialDayName}
                                    onChange={handleChange}
                                    placeholder="Enter the name of the special day (e.g., Valentine's Day)"
                                // className="w-full px-4 py-3 border border-DARK-300 rounded-md dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 focus:ring-2 focus:ring-BRAND-500 focus:outline-none transition-all duration-300 ease-in-out"
                                />
                                {errors.specialDayName && <p className="mt-2 text-sm text-ERROR_HOVER">{errors.specialDayName}</p>}
                            </div>

                            <div className="mt-4">
                                {/* <label htmlFor="specialDayDate" className="block text-sm font-medium text-DARK-700 mb-2">Special Day Date</label> */}
                                <Label htmlFor="specialDayDate" className="block text-sm font-medium text-DARK-700 mb-2">Special Day Date<span className='text-red-500'>*</span></Label>
                                <NewSingleDate
                                    value={dateObj?.selectSpecialDate}
                                    onChange={dateObj?.handleSpecialDate}
                                    label="Special Day Date"
                                />
                                {/* <Datepicker
                                    value={new Date(formData?.day?.specialDayDate)}
                                    onChange={dateObj?.handleSpecialDate}
                                /> */}
                                {errors.specialDayDate && <p className="mt-2 text-sm text-ERROR_HOVER">{errors.specialDayDate}</p>}
                            </div>
                        </div>
                    )}

                    {/* Week Selection for Week Plan */}
                    {/* {formData.mealPlan === 'week' && (
                        <div className="mt-6">
                            <div className="mb-4">
                                <Label htmlFor="weekMonth" className="block text-sm font-medium text-DARK-700 mb-2">Select Month</Label>
                                <select
                                    id="weekMonth"
                                    name="weekMonth"
                                    value={formData?.week?.weekMonth}
                                    onChange={handleChange}
                                    className="w-full px-4 border border-DARK-300 rounded-md dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 focus:ring-2 focus:ring-BRAND-500 focus:outline-none transition-all duration-300 ease-in-out"
                                >
                                    <option value="">Select a month</option>
                                    {months.map((month) => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                                {errors?.weekMonth && <p className="mt-2 text-sm text-ERROR_HOVER">{errors?.weekMonth}</p>}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="weekStartDate" className="block text-sm font-medium text-DARK-700 mb-2">Start Date</label>
                                    <NewSingleDate
                                        value={dateObj?.selectFromDate}
                                        onChange={dateObj?.handleFromDate}
                                    />
                                    {errors.weekStartDate && <p className="mt-2 text-sm text-ERROR_HOVER">{errors.weekStartDate}</p>}
                                </div>

                                <div>
                                    <label htmlFor="weekEndDate" className="block text-sm font-medium text-DARK-700 mb-2">End Date</label>
                                    <NewSingleDate
                                        value={dateObj?.selectToDate}
                                        onChange={dateObj?.handleToDate}
                                    />
                                    {errors.weekEndDate && <p className="mt-2 text-sm text-ERROR_HOVER">{errors.weekEndDate}</p>}
                                </div>
                            </div>
                        </div>
                    )} */}

                    {/* Month Selection for Month Plan */}
                    {formData.mealPlan === 'month' && (
                        <div className="mt-6">
                            <div className="mb-4">
                                <Label htmlFor="month" className="block text-sm font-medium text-DARK-700 mb-2">Select Month<span className='text-red-500'>*</span></Label>
                                <select
                                    id="month"
                                    name="month"
                                    value={formData?.month}
                                    onChange={handleChange}
                                    className={`w-full -min-w-60 placeholder:text-BRAND-400 bg-slate-50 dark:bg-DARK-700 text-DARK-600 dark:text-DARK-200 font-medium rounded-xl text-sm px-4 py-2.5 border-2 border-DARK-300 dark:border-none focus:outline-none focus:ring-0 placeholder-DARK-400 dark:placeholder-DARK-300`}
                                // className="w-full px-4 py-3 border border-DARK-300 rounded-md dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 focus:ring-2 focus:ring-BRAND-500 focus:outline-none transition-all duration-300 ease-in-out"
                                >
                                    <option value="">Select a month</option>
                                    {months.map((month) => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                                {errors?.month && <p className="mt-2 text-sm text-ERROR_HOVER">{errors?.month}</p>}
                            </div>
                        </div>
                    )}
                    {/* Active Checkbox */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            className="checked:!bg-BRAND-500 !ring-0"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                        />
                        <Label htmlFor="isActive" className='cursor-pointer'>Is Active meal period?</Label>
                    </div>
                </div>

            </Modal.Body>

            {/* Footer Buttons */}
            <Modal.Footer className="justify-end dark:bg-DARK-800">
                <Button
                    type="button"
                    onClick={() => onClose()}
                    disabled={isButtonLoading}
                    className="w-full max-w-[120px] px-2 py-1 !bg-gray-900 text-white rounded-lg font-medium shadow-sm hover:!bg-DRARK-600 focus:ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    onClick={(e: any) => handleSubmit(e)}
                    disabled={isButtonLoading}
                    isProcessing={isButtonLoading}
                    processingSpinner={<AiOutlineLoading className="h-6 w-6 animate-spin" />}
                    className="w-full max-w-[150px] px-2 py-1 !bg-BRAND-500 text-white rounded-lg font-medium shadow-sm hover:!bg-BRAND-600 focus:ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                    <span className="relative z-10">{isButtonLoading ? "Loading..." : (formData._id ? "Update" : "Submit")}</span>
                    {isButtonLoading && (
                        <span className="absolute inset-0 bg-BRAND-600 opacity-20 animate-pulse"></span>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MealPeriodFormModal;